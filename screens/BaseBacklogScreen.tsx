import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { collection, getDocs, query, where } from 'firebase/firestore/lite';
import { View } from '../components/Themed';
import { Game } from '../types/Game';
import { RootTabScreenProps } from '../types';
import { SortProperty } from '../constants/SortProperty';
import { Completion } from '../constants/Completion';
import { GameFilter, applyGameFilter } from '../constants/GameFilter';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListItemView } from '../components/ListItemView';
import ButtonGroup from '../components/ButtonGroup';
import SortButton from '../components/SortButton';
import { GAME_INFORMATION_BASE_URL } from '../constants/Constants';
import { mergeGameInformation, sortAlphabetical, sortByHLTB } from '../utilities/Utilities';
import { firestore } from '../firebaseConfig';
import { loadBacklogFromStorage, saveBacklogToStorage } from '../services/BacklogCacheService';

type BacklogScreenType = 'Backlog' | 'RetroBacklog';

const backlogCache: Partial<Record<BacklogScreenType, Game[]>> = {};

// De 'backlog'-collectie bestaat niet meer; de backlog is de niet-afgeronde selectie
// uit 'full-games-list'. Dit levert dezelfde set als het (trage) game-information endpoint.
const collectionConfigByScreenType: Record<BacklogScreenType, { name: string, completionStatuses?: string[] }> = {
    Backlog: {
        name: 'full-games-list',
        completionStatuses: [Completion.NOT_STARTED, Completion.PLAYING, Completion.PAUSED],
    },
    RetroBacklog: {
        name: 'retro-backlog',
    },
};

const defaultFilterByScreenType: Record<BacklogScreenType, GameFilter> = {
    Backlog: GameFilter.PLAYING,
    RetroBacklog: GameFilter.ALL,
};

const sortFunctions = {
    [SortProperty.ALPHABETICAL]: sortAlphabetical,
    [SortProperty.HLTB]: sortByHLTB,
};

const ENRICHMENT_TIMEOUT_MS = 25000;

export default function BaseBacklogScreen({ screenType }: RootTabScreenProps<'Backlog' | 'RetroBacklog'> & { screenType: BacklogScreenType }) {

    const [isLoading, setIsLoading] = useState(true);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [activeFilter, setActiveFilter] = useState<GameFilter>(defaultFilterByScreenType[screenType]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMountedRef = useRef(true);
    const hasNetworkDataRef = useRef(false);
    const latestBacklogRef = useRef<Game[]>([]);

    // De zichtbare lijst is afgeleide state: filter + sortering worden altijd opnieuw
    // toegepast wanneer de onderliggende games wijzigen (bijv. na een statuswijziging).
    const backlogData = useMemo(() => {
        const filteredGames = applyGameFilter(fullBacklog, activeFilter);
        const sortFunction = sortFunctions[sortBy];
        return sortFunction ? sortFunction(filteredGames, sortAscending) : filteredGames;
    }, [fullBacklog, activeFilter, sortBy, sortAscending]);

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

    const getBacklogCoreData = useCallback(async (): Promise<Game[]> => {
        const { name, completionStatuses } = collectionConfigByScreenType[screenType];
        const backlogCollection = collection(firestore, name);
        const backlogQuery = completionStatuses
            ? query(backlogCollection, where('completion', 'in', completionStatuses))
            : backlogCollection;
        const snapshot = await getDocs(backlogQuery);

        return snapshot.docs.map((doc) => {
            const data = doc.data() as Partial<Game>;
            return {
                ...data,
                documentId: doc.id,
                isMenuOpen: false,
            } as Game;
        });
    }, [screenType]);

    const getFullBacklogWithInformation = useCallback(async (): Promise<Game[]> => {
        const url = `${GAME_INFORMATION_BASE_URL}game-information?type=${screenType}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ENRICHMENT_TIMEOUT_MS);

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                console.error({ call: 'getFullBacklogWithInformation response not OK', status: response.status, url, timestamp: new Date().toISOString() });
                throw new Error('Response returned with not OK.');
            }
            return await response.json();
        } catch (fetchError) {
            console.error({ call: 'getFullBacklogWithInformation', error: fetchError, url, timestamp: new Date().toISOString() });
            throw new Error('An error occurred while fetching the backlog.');
        } finally {
            clearTimeout(timeoutId);
        }
    }, [screenType]);

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
            <SortButton sortBy={sortBy} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending}/>
            <ButtonGroup items={fullBacklog} activeFilter={activeFilter} setActiveFilter={setActiveFilter} setSortAscending={setSortAscending} setSortBy={setSortBy} />
            { isLoading ? <LoadingIndicator /> :
                error ? <Text style={styles.error}>{error}</Text> :
                <ListItemView listData={backlogData} listType={screenType.toUpperCase()} setListData={updateBacklogItems} refreshing={refreshing} onRefresh={onRefresh} onCompletionChange={onCompletionChange} />
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