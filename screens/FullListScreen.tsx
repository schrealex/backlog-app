import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { View } from '../components/Themed';
import { FontAwesome5 } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore/lite';
import { firestore } from '../firebaseConfig';
import { SortProperty } from '../constants/SortProperty';
import { GameCopy } from '../constants/GameCopy';
import { Completion } from '../constants/Completion';
import { Game } from '../types/Game';
import SortButton from '../components/SortButton';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { FilterButton } from '../components/FilterButton';
import { ListItemView } from '../components/ListItemView';
import { sortAlphabetical } from '../utilities/Utilities';

export default function FullListScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [fullList, setFullList]: Array<any> = useState([]);
    const [fullListData, setFullListData]: Array<any> = useState([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const getAllTheGames = async () => {
        const fullGamesList = collection(firestore, 'full-games-list');
        const fullGamesListSnapshot = await getDocs(fullGamesList);
        return fullGamesListSnapshot.docs.map(doc => {
            const documentId = doc.id;
            const data = doc.data();
            return { ...data, documentId };
        });
    };

    const getFullListOfGames = async (mounted: boolean) => {
        try {
            const allTheGames = await getAllTheGames();
            const sortedGamesList = sortAlphabetical(allTheGames, true);

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

    useEffect(() => {
        const sortedList = sortAlphabetical(fullListData, sortAscending);
        setFullListData(sortedList);
    }, [sortBy, sortAscending]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getFullListOfGames(true).then(() => setRefreshing(false));
    }, []);

    const setFullListDataWithFilter = (filterFn: () => Game[]) => {
        setFullListData(filterFn());
    };

    const isAll = () => setFullListDataWithFilter(getAll);
    const isPhysical = () => setFullListDataWithFilter(getOnlyPhysical);
    const isDigital = () => setFullListDataWithFilter(getOnlyDigital);
    const isBoth = () => setFullListDataWithFilter(getBoth);
    const isContinuous = () => setFullListDataWithFilter(getContinuous);
    const isDropped = () => setFullListDataWithFilter(getDropped);
    const isBeaten = () => setFullListDataWithFilter(getBeaten);
    const isCompleted = () => setFullListDataWithFilter(getCompleted);

    const getFilteredGames = (filterFn: (game: Game) => boolean) => {
        return fullList.filter(filterFn);
    };

    const getAll = () => fullList;
    const getOnlyPhysical = () => getFilteredGames(game => game.gameCopy.includes(GameCopy.PHYSICAL));
    const getOnlyDigital = () => getFilteredGames(game => game.gameCopy.includes(GameCopy.DIGITAL));
    const getBoth = () => getFilteredGames(game => game.gameCopy.includes(GameCopy.PHYSICAL) && game.gameCopy.includes(GameCopy.DIGITAL));
    const getContinuous = () => getFilteredGames(game => game.completion === Completion.CONTINUOUS);
    const getDropped = () => getFilteredGames(game => game.completion === Completion.DROPPED);
    const getBeaten = () => getFilteredGames(game => game.completion === Completion.BEATEN);
    const getCompleted = () => getFilteredGames(game => game.completion === Completion.COMPLETED);

    return (
        <View style={styles.container}>
            <SortButton sortBy={SortProperty.ALPHABETICAL} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending} />
            <View style={styles.buttonGroup}>
                <FilterButton filterFunction={isAll} text={'All '} numberOfItems={getAll().length} />
                <FilterButton filterFunction={isPhysical} iconName="sd-card" numberOfItems={getOnlyPhysical().length} />
                <FilterButton filterFunction={isDigital} iconName="cloud-download-alt" numberOfItems={getOnlyDigital().length} />
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isBoth}>
                    <FontAwesome5 name="sd-card" size={20} color="red" style={{ paddingRight: 5 }} />
                    <FontAwesome5 name="cloud-download-alt" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{getBoth().length}]</Text>
                </Pressable>
            </View>
            <View style={styles.buttonGroup}>
                <FilterButton filterFunction={isContinuous} iconName="recycle" numberOfItems={getContinuous().length} />
                <FilterButton filterFunction={isDropped} iconName="times" numberOfItems={getDropped().length} />
                <FilterButton filterFunction={isBeaten} iconName="fist-raised" numberOfItems={getBeaten().length} />
                <FilterButton filterFunction={isCompleted} iconName="trophy" numberOfItems={getCompleted().length} />
            </View>
            { isLoading ?
                <LoadingIndicator /> :
                <ListItemView listData={fullListData} listType={'FULL_LIST'} setListData={setFullListData} refreshing={refreshing} onRefresh={onRefresh} />
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
    buttonText: {
        color: '#ffffff',
        display: 'flex',
    }
});
