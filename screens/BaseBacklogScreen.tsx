import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../components/Themed';
import { Game } from '../types/Game';
import { RootTabScreenProps } from '../types';
import { SortProperty } from '../constants/SortProperty';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListItemView } from '../components/ListItemView';
import ButtonGroup from '../components/ButtonGroup';
import SortButton from '../components/SortButton';
import { GAME_INFORMATION_BASE_URL } from '../constants/Constants';
import { sortAlphabetical, sortByHLTB } from '../utilities/Utilities';

export default function BaseBacklogScreen({ screenType }: RootTabScreenProps<'Backlog' | 'RetroBacklog'> & { screenType: 'Backlog' | 'RetroBacklog' }) {

    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const getBacklog = async() => {
        try {
            const backlogWithAdditionalInformation = await getFullBacklogWithInformation();
            setFullBacklog(backlogWithAdditionalInformation);

            const playingGames = backlogWithAdditionalInformation.filter((game: any) => game.completion === 'Playing');

            setBacklogData(screenType === 'Backlog' ? playingGames : backlogWithAdditionalInformation);
            setIsLoading(false);
        } catch (error: any) {
            setIsLoading(false);
        }
    }

    const getFullBacklogWithInformation = async () => {
        const url = `${GAME_INFORMATION_BASE_URL}game-information?type=${screenType}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Full backlog with information fetch failed`);
                return [];
            }
            return await response.json();
        } catch (error) {
            console.error({ call: 'getFullBacklogWithInformation', error, url, timestamp: new Date().toISOString() });
            return [];
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getBacklog().then(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        void getBacklog();
    }, []);

    useEffect(() => {
        const sortFunctions = {
            [SortProperty.ALPHABETICAL]: sortAlphabetical,
            [SortProperty.HLTB]: sortByHLTB,
        };

        const sortFunction = sortFunctions[sortBy];
        if (sortFunction) {
            const sortedList: any[] = sortFunction(backlogData, sortAscending);
            setBacklogData(sortedList);
        }
    }, [sortBy, sortAscending]);

    return (
        <View style={styles.container}>
            <SortButton sortBy={sortBy} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending}/>
            <ButtonGroup items={fullBacklog} setBacklogData={setBacklogData} setSortAscending={setSortAscending} setSortBy={setSortBy} />
            { isLoading ?
                <LoadingIndicator /> :
                <ListItemView listData={backlogData} listType={screenType.toUpperCase()} setListData={setBacklogData} refreshing={refreshing} onRefresh={onRefresh} />
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
});