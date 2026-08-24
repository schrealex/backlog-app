import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text } from 'react-native';
import { View } from '../components/Themed';
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import ListItem from '../components/ListItem';
import { FontAwesome5 } from '@expo/vector-icons';
import { Firestore } from 'firebase/firestore';
import {collection, getDocs, query, where} from 'firebase/firestore/lite';
import { firestore } from '../firebaseConfig';
import { SortProperty } from '../constants/SortProperty';
import { GameFilter, applyGameFilter } from '../constants/GameFilter';
import { Completion } from '../constants/Completion';
import { Game } from '../types/Game';
import { getImagePrefetchUris, sortAlphabetical } from '../utilities/Utilities';
import { Image } from 'expo-image';

function ButtonContent({ sortBy, sortAscending }: any) {
    return (
        <View style={styles.buttonContent}>
            {sortBy === SortProperty.ALPHABETICAL && sortAscending ?
                <FontAwesome5 name="sort-alpha-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.ALPHABETICAL && !sortAscending ?
                <FontAwesome5 name="sort-alpha-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            <Text
                style={styles.buttonText}>{sortBy === SortProperty.ALPHABETICAL ? 'Sort Alphabetical' : ''}</Text>
        </View>
    );
}

export default function FinishedListScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [fullList, setFullList] = useState<Game[]>([]);
    const [activeFilter, setActiveFilter] = useState<GameFilter>(GameFilter.ALL);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const isMountedRef = React.useRef(true);
    const fullListRef = React.useRef<Game[]>([]);
    const prefetchedUrisRef = React.useRef<Set<string>>(new Set());

    // Dit scherm toont alleen afgeronde games; wijzigt de status naar iets anders,
    // dan verdwijnt het item automatisch uit de afgeleide lijst.
    const fullListData = React.useMemo(() => {
        const finishedGames = fullList.filter((game) => game.completion === Completion.BEATEN || game.completion === Completion.COMPLETED);
        return sortAlphabetical(applyGameFilter(finishedGames, activeFilter), sortAscending);
    }, [fullList, activeFilter, sortAscending]);

    const counts = React.useMemo(() => {
        const finishedGames = fullList.filter((game) => game.completion === Completion.BEATEN || game.completion === Completion.COMPLETED);
        return [GameFilter.ALL, GameFilter.PHYSICAL, GameFilter.DIGITAL, GameFilter.BOTH, GameFilter.BEATEN, GameFilter.COMPLETED]
            .reduce((accumulator, filter) => {
                accumulator[filter] = applyGameFilter(finishedGames, filter).length;
                return accumulator;
            }, {} as Record<string, number>);
    }, [fullList]);

    const getAllTheGames = async (fs: Firestore): Promise<Game[]> => {
        const fullGamesList = collection(fs, 'full-games-list');
        const whereQuery = query(fullGamesList, where('completion', 'in', ['Beaten', 'Completed']));
        const fullGamesListSnapshot = await getDocs(whereQuery);
        return fullGamesListSnapshot.docs.map(doc => {
            const documentId = doc.id;
            const data = doc.data();
            return { ...data, documentId, isMenuOpen: false } as Game;
        });
    };

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

    const getFullListOfGames = useCallback(async () => {
        try {
            const allTheGames = await getAllTheGames(firestore);

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

    const selectFilter = (filter: GameFilter) => {
        setActiveFilter(filter);
        setSortBy(SortProperty.ALPHABETICAL);
    };

    const toggleSort = () => {
        const sortingAscending = !(sortBy === SortProperty.ALPHABETICAL && sortAscending);
        setSortBy(SortProperty.ALPHABETICAL);
        setSortAscending(sortingAscending);
    };

    const onClick = useCallback((clickedItemId: number): void => {
        updateGames((currentGames) => currentGames.map((item: Game) => {
            if (item.id === clickedItemId) {
                return { ...item, isMenuOpen: !item.isMenuOpen };
            }

            return item.isMenuOpen ? { ...item, isMenuOpen: false } : item;
        }));
    }, [updateGames]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void getFullListOfGames().finally(() => setRefreshing(false));
    }, [getFullListOfGames]);

    useEffect(() => {
        const imageUris = getImagePrefetchUris(fullListData)
            .filter((uri) => !prefetchedUrisRef.current.has(uri));

        if (!imageUris.length) {
            return;
        }

        imageUris.forEach((uri) => prefetchedUrisRef.current.add(uri));
        void Image.prefetch(imageUris);
    }, [fullListData]);

    const renderItem = useCallback(({ item }: { item: Game }) => (
        <ListItem item={item} type={'FULL_LIST'} isOpen={item.isMenuOpen} onClick={onClick} onCompletionChange={onCompletionChange} />
    ), [onClick, onCompletionChange]);

    return (
        <View style={styles.container}>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, styles.largeButton]} onPress={toggleSort}>
                    <ButtonContent sortBy={sortBy} sortAscending={sortAscending} />
                </Pressable>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, activeFilter === GameFilter.ALL ? styles.activeButton : null]} onPress={() => selectFilter(GameFilter.ALL)}>
                    <Text style={styles.buttonText}>All [{counts[GameFilter.ALL] ?? 0}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, activeFilter === GameFilter.PHYSICAL ? styles.activeButton : null]} onPress={() => selectFilter(GameFilter.PHYSICAL)}>
                    <FontAwesome5 name="sd-card" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{counts[GameFilter.PHYSICAL] ?? 0}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, activeFilter === GameFilter.DIGITAL ? styles.activeButton : null]} onPress={() => selectFilter(GameFilter.DIGITAL)}>
                    <FontAwesome5 name="cloud-download-alt" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{counts[GameFilter.DIGITAL] ?? 0}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, activeFilter === GameFilter.BOTH ? styles.activeButton : null]} onPress={() => selectFilter(GameFilter.BOTH)}>
                    <FontAwesome5 name="sd-card" size={20} color="red" style={{ paddingRight: 5 }} />
                    <FontAwesome5 name="cloud-download-alt" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{counts[GameFilter.BOTH] ?? 0}]</Text>
                </Pressable>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, activeFilter === GameFilter.BEATEN ? styles.activeButton : null]} onPress={() => selectFilter(GameFilter.BEATEN)}>
                    <FontAwesome5 name="fist-raised" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{counts[GameFilter.BEATEN] ?? 0}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, activeFilter === GameFilter.COMPLETED ? styles.activeButton : null]} onPress={() => selectFilter(GameFilter.COMPLETED)}>
                    <FontAwesome5 name="trophy" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{counts[GameFilter.COMPLETED] ?? 0}]</Text>
                </Pressable>
            </View>
            {isLoading ?
                <ActivityIndicator style={styles.loadingSpinner} size="large" color="#fff" /> :
                <FlatList
                    removeClippedSubviews
                    data={fullListData}
                    initialNumToRender={6}
                    maxToRenderPerBatch={6}
                    updateCellsBatchingPeriod={50}
                    windowSize={5}
                    keyExtractor={(item => item.id.toString())}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                    }
                    renderItem={renderItem}
                />}
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
    loadingSpinner: {
        height: 250,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        fontSize: 16,
        width: 'auto',
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
        width: 75,
    },
    largeButton: {
        width: 150,
    },
    buttonContent: {
        display: 'flex',
        flexDirection: 'row'
    },
    buttonText: {
        color: '#ffffff',
        display: 'flex',
    },
    activeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    }
});
