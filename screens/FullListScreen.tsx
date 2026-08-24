import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { View } from '../components/Themed';
import { FontAwesome5 } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore/lite';
import { firestore } from '../firebaseConfig';
import { SortProperty } from '../constants/SortProperty';
import { GameFilter, applyGameFilter } from '../constants/GameFilter';
import { Game } from '../types/Game';
import SortButton from '../components/SortButton';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { FilterButton } from '../components/FilterButton';
import { ListItemView } from '../components/ListItemView';
import { sortAlphabetical } from '../utilities/Utilities';

const copyFilters: Array<{ filter: GameFilter, icon?: string, text?: string, icons?: string[] }> = [
    { filter: GameFilter.ALL, text: 'All ' },
    { filter: GameFilter.PHYSICAL, icon: 'sd-card' },
    { filter: GameFilter.DIGITAL, icon: 'cloud-download-alt' },
    { filter: GameFilter.BOTH, icons: ['sd-card', 'cloud-download-alt'] },
];

const completionFilters: Array<{ filter: GameFilter, icon: string }> = [
    { filter: GameFilter.CONTINUOUS, icon: 'recycle' },
    { filter: GameFilter.DROPPED, icon: 'times' },
    { filter: GameFilter.BEATEN, icon: 'fist-raised' },
    { filter: GameFilter.COMPLETED, icon: 'trophy' },
];

export default function FullListScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [fullList, setFullList] = useState<Game[]>([]);
    const [activeFilter, setActiveFilter] = useState<GameFilter>(GameFilter.ALL);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const isMountedRef = useRef(true);
    const fullListRef = useRef<Game[]>([]);

    // Afgeleide lijst: blijft automatisch in sync als een completion-status wijzigt.
    const fullListData = useMemo(
        () => sortAlphabetical(applyGameFilter(fullList, activeFilter), sortAscending),
        [fullList, activeFilter, sortAscending]
    );

    const counts = useMemo(() => {
        return [...copyFilters, ...completionFilters].reduce((accumulator, { filter }) => {
            accumulator[filter] = applyGameFilter(fullList, filter).length;
            return accumulator;
        }, {} as Record<string, number>);
    }, [fullList]);

    const setGames = useCallback((games: Game[]) => {
        fullListRef.current = games;
        setFullList(games);
    }, []);

    const updateGames = useCallback((updater: (currentGames: Game[]) => Game[]) => {
        setGames(updater(fullListRef.current));
    }, [setGames]);

    const onCompletionChange = useCallback((gameId: number, completion: string) => {
        updateGames((currentGames) => currentGames.map((game) => {
            if (game.id === gameId) {
                return { ...game, completion, isMenuOpen: false };
            }

            return game.isMenuOpen ? { ...game, isMenuOpen: false } : game;
        }));
    }, [updateGames]);

    const getAllTheGames = async (): Promise<Game[]> => {
        const fullGamesList = collection(firestore, 'full-games-list');
        const fullGamesListSnapshot = await getDocs(fullGamesList);
        return fullGamesListSnapshot.docs.map(doc => {
            const documentId = doc.id;
            const data = doc.data();
            return { ...data, documentId, isMenuOpen: false } as Game;
        });
    };

    const getFullListOfGames = useCallback(async () => {
        try {
            const allTheGames = await getAllTheGames();

            if (isMountedRef.current) {
                setGames(allTheGames);
                setIsLoading(false);
            }
        } catch (error: any) {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [setGames]);

    useEffect(() => {
        isMountedRef.current = true;
        void getFullListOfGames();

        return function cleanUp() {
            isMountedRef.current = false;
        };
    }, [getFullListOfGames]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void getFullListOfGames().finally(() => setRefreshing(false));
    }, [getFullListOfGames]);

    const selectFilter = (filter: GameFilter) => {
        setActiveFilter(filter);
        setSortBy(SortProperty.ALPHABETICAL);
        setSortAscending(true);
    };

    return (
        <View style={styles.container}>
            <SortButton sortBy={SortProperty.ALPHABETICAL} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending} />
            <View style={styles.buttonGroup}>
                {copyFilters.map(({ filter, icon, text, icons }) => (
                    icons ? (
                        <Pressable key={filter} style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, activeFilter === filter ? styles.activeButton : null]} onPress={() => selectFilter(filter)}>
                            {icons.map((iconName) => (
                                <FontAwesome5 key={iconName} name={iconName} size={20} color="red" style={{ paddingRight: 5 }} />
                            ))}
                            <Text style={styles.buttonText}>[{counts[filter] ?? 0}]</Text>
                        </Pressable>
                    ) : (
                        <FilterButton
                            key={filter}
                            filterFunction={() => selectFilter(filter)}
                            iconName={icon}
                            text={text}
                            numberOfItems={counts[filter] ?? 0}
                            isActive={activeFilter === filter}
                        />
                    )
                ))}
            </View>
            <View style={styles.buttonGroup}>
                {completionFilters.map(({ filter, icon }) => (
                    <FilterButton
                        key={filter}
                        filterFunction={() => selectFilter(filter)}
                        iconName={icon}
                        numberOfItems={counts[filter] ?? 0}
                        isActive={activeFilter === filter}
                    />
                ))}
            </View>
            { isLoading ?
                <LoadingIndicator /> :
                <ListItemView listData={fullListData} listType={'FULL_LIST'} setListData={updateGames} refreshing={refreshing} onRefresh={onRefresh} onCompletionChange={onCompletionChange} />
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
    buttonGroup: {
        display: 'flex',
        flexDirection: 'row',
    },
    button: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red',
        marginTop: 8,
        marginBottom: 4,
        marginRight: 2,
        marginLeft: 2,
        padding: 8,
    },
    activeButton: {
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
    },
    buttonText: {
        color: '#ffffff',
        display: 'flex',
    }
});
