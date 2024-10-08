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
import { GameCopy } from '../constants/GameCopy';
import { Completion } from '../constants/Completion';
import { Game } from '../types/Game';
import { sortAlphabetical } from '../utilities/Utilities';

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
    const [fullList, setFullList]: Array<any> = useState([]);
    const [fullListData, setFullListData]: Array<any> = useState([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const getAllTheGames = async (fs: Firestore) => {
        const fullGamesList = collection(fs, 'full-games-list');
        const whereQuery = query(fullGamesList, where('completion', 'in', ['Beaten', 'Completed']));
        const fullGamesListSnapshot = await getDocs(whereQuery);
        return fullGamesListSnapshot.docs.map(doc => {
            const documentId = doc.id;
            const data = doc.data();
            return { ...data, documentId };
        });
    };

    const sortGamesAlphabetical = (games: any) => {
        return games.sort((a: any, b: any) => {
            return sortAscending ? a.title.toLowerCase().localeCompare(b.title.toLowerCase()) :
                b.title.toLowerCase().localeCompare(a.title.toLowerCase());
        });
    };

    async function getFullListOfGames(mounted: boolean) {
        try {
            const allTheGames = await getAllTheGames(firestore);
            const sortedGamesList = sortGamesAlphabetical(allTheGames);

            if (mounted) {
                setFullList(sortedGamesList);
                setFullListData(sortedGamesList);
                setIsLoading(false);
            }

        } catch (error: any) {
            if (mounted) {
                setIsLoading(false);
            }
        }
    }

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            void getFullListOfGames(mounted);
        }

        return function cleanUp() {
            mounted = false;
        };
    }, []);

    const filterList = (filterFunction: () => any[]) => {
        setFullListData(filterFunction());
    };

    const isAll = () => filterList(getAll);
    const isPhysical = () => filterList(getOnlyPhysical);
    const isDigital = () => filterList(getOnlyDigital);
    const isBoth = () => filterList(getBoth);
    const isBeaten = () => filterList(getBeaten);
    const isCompleted = () => filterList(getCompleted);

    const getAll = () => fullList;
    const getOnlyPhysical = () => fullList.filter((game: any) => game.gameCopy.includes(GameCopy.PHYSICAL));
    const getOnlyDigital = () => fullList.filter((game: any) => game.gameCopy.includes(GameCopy.DIGITAL));
    const getBoth = () => fullList.filter((game: any) => game.gameCopy.includes(GameCopy.PHYSICAL) && game.gameCopy.includes(GameCopy.DIGITAL));
    const getBeaten = () => fullList.filter((game: any) => game.completion === Completion.BEATEN);
    const getCompleted = () => fullList.filter((game: any) => game.completion === Completion.COMPLETED);

    const toggleSort = () => {
        const sortingAscending = !(sortBy === SortProperty.ALPHABETICAL && sortAscending);
        setSortBy(SortProperty.ALPHABETICAL);
        setSortAscending(sortingAscending);
        const sortedGamesList = sortAlphabetical(fullListData, sortingAscending);
        setFullListData(sortedGamesList);
    };

    const onClick = (clickedItemId: number): void => {
        const updatedList = fullList.map((item: Game) => {
            if (item.id === clickedItemId) {
                return { ...item, isMenuOpen: !item.isMenuOpen };
            } else {
                return { ...item, isMenuOpen: false };
            }
        });
        setFullListData(updatedList);
    }

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getFullListOfGames(true).then(() => setRefreshing(false));
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, styles.largeButton]} onPress={toggleSort}>
                    <ButtonContent sortBy={sortBy} sortAscending={sortAscending} />
                </Pressable>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isAll}>
                    <Text style={styles.buttonText}>All [{getAll().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isPhysical}>
                    <FontAwesome5 name="sd-card" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{getOnlyPhysical().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isDigital}>
                    <FontAwesome5 name="cloud-download-alt" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getOnlyDigital().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isBoth}>
                    <FontAwesome5 name="sd-card" size={20} color="red" style={{ paddingRight: 5 }} /><FontAwesome5 name="cloud-download-alt" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getBoth().length}]</Text>
                </Pressable>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isBeaten}>
                    <FontAwesome5 name="fist-raised" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getBeaten().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isCompleted}>
                    <FontAwesome5 name="trophy" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getCompleted().length}]</Text>
                </Pressable>
            </View>
            {isLoading ?
                <ActivityIndicator style={styles.loadingSpinner} size="large" color="#fff" /> :
                <FlatList
                    data={fullListData}
                    keyExtractor={(item => item.id.toString())}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                    }
                    renderItem={({ item }) => (
                        <ListItem item={item} type={'FULL_LIST'} isOpen={item.isMenuOpen} onClick={() => onClick(item.id)}  />
                    )}
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
        width: 'min-content',
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
    }
});
