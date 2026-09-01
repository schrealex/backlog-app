import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { where } from 'firebase/firestore/lite';
import { View } from '../components/Themed';
import { Game } from '../types/Game';
import { RootTabScreenProps } from '../types';
import { SortProperty } from '../constants/SortProperty';
import { Completion } from '../constants/Completion';
import { GameFilter, ActiveFilters, FilterGroup, applyGameFilters } from '../constants/GameFilter';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListItemView } from '../components/ListItemView';
import ButtonGroup from '../components/ButtonGroup';
import SortMenu from '../components/SortMenu';
import { GAME_INFORMATION_BASE_URL, MAX_PINNED_GAMES } from '../constants/Constants';
import { countPinnedGames, mergeGameInformation, sortAlphabetical, sortByHLTB, sortPinnedFirst, togglePinnedGame } from '../utilities/Utilities';
import { loadBacklogFromStorage, saveBacklogToStorage } from '../services/BacklogCacheService';
import { updateGameFields } from '../services/GameUpdateService';
import { getLibraryEntries } from '../services/LibraryService';

type BacklogScreenType = 'Backlog' | 'RetroBacklog';

const backlogCache: Partial<Record<BacklogScreenType, Game[]>> = {};

// Alleen de Backlog-lijst filtert op actieve completion-statussen; de retro-backlog
// toont altijd alle games in die lijst.
const completionStatusesByScreenType: Partial<Record<BacklogScreenType, string[]>> = {
    Backlog: [Completion.NOT_STARTED, Completion.PLAYING, Completion.PAUSED],
};

const defaultFilterByScreenType: Record<BacklogScreenType, ActiveFilters> = {
    Backlog: { completion: GameFilter.PLAYING },
    RetroBacklog: {},
};

// `screenType.toUpperCase()` leverde 'RETROBACKLOG' op, waardoor de retro-tab
// geen HLTB-info toonde en statuswijzigingen niet naar Firestore geschreven werden.
const listTypeByScreenType: Record<BacklogScreenType, string> = {
    Backlog: 'BACKLOG',
    RetroBacklog: 'RETRO_BACKLOG',
};

const sortFunctions = {
    [SortProperty.ALPHABETICAL]: sortAlphabetical,
    [SortProperty.HLTB]: sortByHLTB,
};

// De verrijking draait volledig op de achtergrond en blokkeert de UI niet, dus mag hij
// lang duren. Een koude respons kost ~45s; met een krappe timeout werd die afgebroken
// en verscheen de HLTB-data pas na een handmatige refresh.
const ENRICHMENT_TIMEOUT_MS = 90000;
const ENRICHMENT_RETRY_ATTEMPTS = 1;
const ENRICHMENT_RETRY_DELAY_MS = 2000;

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export default function BaseBacklogScreen({ screenType }: RootTabScreenProps<'Backlog' | 'RetroBacklog'> & { screenType: BacklogScreenType }) {

    const [isLoading, setIsLoading] = useState(true);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>(defaultFilterByScreenType[screenType]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMountedRef = useRef(true);
    const hasNetworkDataRef = useRef(false);
    const latestBacklogRef = useRef<Game[]>([]);

    // Pinnen hoort bij de ongefilterde weergave van de backlog: daar bepaal je zelf
    // welke games bovenaan moeten blijven staan.
    const isPinningEnabled = screenType === 'Backlog' && Object.keys(activeFilters).length === 0;

    // De zichtbare lijst is afgeleide state: filter + sortering worden altijd opnieuw
    // toegepast wanneer de onderliggende games wijzigen (bijv. na een statuswijziging).
    const backlogData = useMemo(() => {
        const filteredGames = applyGameFilters(fullBacklog, activeFilters);
        const sortFunction = sortFunctions[sortBy];
        const sortedGames = sortFunction ? sortFunction(filteredGames, sortAscending) : filteredGames;

        return isPinningEnabled ? sortPinnedFirst(sortedGames) : sortedGames;
    }, [fullBacklog, activeFilters, sortBy, sortAscending, isPinningEnabled]);

    const setFilter = useCallback((group: FilterGroup, filter?: GameFilter) => {
        setActiveFilters((currentFilters) => {
            const nextFilters = { ...currentFilters };

            if (filter) {
                nextFilters[group] = filter;
            } else {
                delete nextFilters[group];
            }

            return nextFilters;
        });
    }, []);

    const clearAllFilters = useCallback(() => setActiveFilters({}), []);

    const isPinLimitReached = useMemo(
        () => countPinnedGames(fullBacklog) >= MAX_PINNED_GAMES,
        [fullBacklog]
    );

    const setScreenData = useCallback((games: Game[], shouldPersist = true) => {
        if (!isMountedRef.current) {
            return;
        }

        latestBacklogRef.current = games;
        backlogCache[screenType] = games;

        setFullBacklog(games);
        setIsLoading(false);

        if (shouldPersist) {
            void saveBacklogToStorage(screenType, games);
        }
    }, [screenType]);

    const updateBacklogItems = useCallback((updater: (currentGames: Game[]) => Game[], shouldPersist = false) => {
        setScreenData(updater(latestBacklogRef.current), shouldPersist);
    }, [setScreenData]);

    const onCompletionChange = useCallback((gameId: number, completion: string) => {
        updateBacklogItems((currentGames) => currentGames.map((game) => {
            if (game.id === gameId) {
                return { ...game, completion, isMenuOpen: false };
            }

            return game.isMenuOpen ? { ...game, isMenuOpen: false } : game;
        }), true);
    }, [updateBacklogItems]);

    const onTogglePin = useCallback((gameId: number) => {
        const { games, isPinned, hasChanges, limitReached } = togglePinnedGame(
            latestBacklogRef.current,
            gameId,
            MAX_PINNED_GAMES
        );

        if (limitReached) {
            Alert.alert(
                `Maximum of ${MAX_PINNED_GAMES} pinned games`,
                `You can pin up to ${MAX_PINNED_GAMES} games to the top. Unpin one first.`
            );
            return;
        }

        if (!hasChanges) {
            return;
        }

        const changedGame = games.find((game) => game.id === gameId);
        setScreenData(games, true);

        void updateGameFields(changedGame?.documentId, { isPinned }).then((isUpdated) => {
            if (isUpdated || !isMountedRef.current) {
                return;
            }

            // Firestore-update mislukt: lokale wijziging terugdraaien.
            const revertedGames = latestBacklogRef.current.map((game) => (
                game.id === gameId ? { ...game, isPinned: !isPinned } : game
            ));
            setScreenData(revertedGames, true);
        });
    }, [screenType, setScreenData]);

    const getBacklogCoreData = useCallback(async (): Promise<Game[]> => {
        const list = listTypeByScreenType[screenType];
        const completionStatuses = completionStatusesByScreenType[screenType];
        const constraints = [where('list', '==', list)];

        if (completionStatuses) {
            constraints.push(where('completion', 'in', completionStatuses));
        }

        return getLibraryEntries(...constraints);
    }, [screenType]);

    const fetchBacklogWithInformation = useCallback(async (): Promise<Game[]> => {
        const url = `${GAME_INFORMATION_BASE_URL}game-information?type=${screenType}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ENRICHMENT_TIMEOUT_MS);

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                console.error({ call: 'fetchBacklogWithInformation response not OK', status: response.status, url, timestamp: new Date().toISOString() });
                throw new Error('Response returned with not OK.');
            }
            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }, [screenType]);

    const getFullBacklogWithInformation = useCallback(async (): Promise<Game[]> => {
        let lastError: unknown;

        for (let attempt = 0; attempt <= ENRICHMENT_RETRY_ATTEMPTS; attempt += 1) {
            if (attempt > 0) {
                // Een mislukte eerste poging heeft de server meestal al opgewarmd,
                // waardoor een tweede poging vrijwel altijd snel slaagt.
                await delay(ENRICHMENT_RETRY_DELAY_MS);

                if (!isMountedRef.current) {
                    throw new Error('Screen is no longer mounted.');
                }
            }

            try {
                return await fetchBacklogWithInformation();
            } catch (fetchError) {
                lastError = fetchError;
                console.error({ call: 'getFullBacklogWithInformation', attempt, error: fetchError, screenType, timestamp: new Date().toISOString() });
            }
        }

        throw lastError instanceof Error ? lastError : new Error('An error occurred while fetching the backlog.');
    }, [fetchBacklogWithInformation, screenType]);

    const getBacklog = useCallback(async () => {
        setError(null);

        // Achtergrondhydratie: deze trage call mag de eerste render nooit blokkeren.
        const hydrationPromise = getFullBacklogWithInformation()
            .then((enrichedBacklog: Game[]) => {
                if (!isMountedRef.current || !enrichedBacklog?.length) {
                    return;
                }

                hasNetworkDataRef.current = true;
                const { games, hasChanges } = mergeGameInformation(latestBacklogRef.current, enrichedBacklog);
                if (hasChanges) {
                    setScreenData(games);
                }
                setError(null);
            })
            .catch(() => {
                if (isMountedRef.current && !latestBacklogRef.current.length) {
                    setError('An error occurred while fetching the backlog');
                    setIsLoading(false);
                }
            });

        try {
            const coreBacklog = await getBacklogCoreData();
            if (coreBacklog.length) {
                hasNetworkDataRef.current = true;
                const { games } = mergeGameInformation(coreBacklog, latestBacklogRef.current);
                setScreenData(games);
            }
        } catch (coreError) {
            console.error({ call: 'getBacklogCoreData', error: coreError, screenType, timestamp: new Date().toISOString() });
        } finally {
            if (isMountedRef.current && latestBacklogRef.current.length) {
                setIsLoading(false);
            }
        }

        return hydrationPromise;
    }, [getBacklogCoreData, getFullBacklogWithInformation, screenType, setScreenData]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void getBacklog().finally(() => {
            if (isMountedRef.current) {
                setRefreshing(false);
            }
        });
    }, [getBacklog]);

    useEffect(() => {
        isMountedRef.current = true;
        hasNetworkDataRef.current = false;
        latestBacklogRef.current = [];

        const cachedBacklog = backlogCache[screenType];
        if (cachedBacklog?.length) {
            setScreenData(cachedBacklog, false);
        } else {
            void loadBacklogFromStorage(screenType).then((storedBacklog) => {
                // Verse netwerkdata nooit overschrijven met stale storage-data.
                if (!isMountedRef.current || hasNetworkDataRef.current || !storedBacklog?.length) {
                    return;
                }

                setScreenData(storedBacklog, false);
            });
        }

        void getBacklog();

        return () => {
            isMountedRef.current = false;
        };
    }, [getBacklog, screenType, setScreenData]);

    return (
        <View style={styles.container}>
            <SortMenu sortBy={sortBy} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending}/>
            <ButtonGroup items={fullBacklog} activeFilters={activeFilters} setFilter={setFilter} clearAllFilters={clearAllFilters} />
            { isLoading ? <LoadingIndicator /> :
                error ? <Text style={styles.error}>{error}</Text> :
                <ListItemView
                    listData={backlogData}
                    listType={listTypeByScreenType[screenType]}
                    setListData={updateBacklogItems}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    onCompletionChange={onCompletionChange}
                    onTogglePin={isPinningEnabled ? onTogglePin : undefined}
                    isPinLimitReached={isPinLimitReached}
                />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flex: 1,
    },
    error: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: 'red',
        padding: 10,
        marginTop: 20,
    },
    buttonGroup: {
        display: 'flex',
        flexDirection: 'row',
    },
});