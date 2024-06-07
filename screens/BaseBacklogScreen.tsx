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

export default function BaseBacklogScreen({ screenType }: RootTabScreenProps<'Backlog' | 'RetroBacklog'> & { screenType: 'Backlog' | 'RetroBacklog' }) {

    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const LOCAL_INFORMATION_BASE_URL = 'http://192.168.2.11:3000/';

    const getBacklog = async(mounted: boolean) => {
        try {
            const backlogWithAdditionalInformation = await getFulLBackLogWithInformation();
            if (mounted) {
                setFullBacklog(backlogWithAdditionalInformation);


                const playingGames = backlogWithAdditionalInformation.filter((game: any) => game.completion === 'Playing');

                setBacklogData(screenType === 'Backlog' ? playingGames : backlogWithAdditionalInformation);
                setIsLoading(false);
            }
        } catch (error: any) {
            if (mounted) {
                setIsLoading(false);
            }
        }
    }

    const getFulLBackLogWithInformation = async () => {
        try {
            const url = `${LOCAL_INFORMATION_BASE_URL}game-information`;
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`game-information request failed`);
                return;
            }
            return await response.json();
        } catch (error) {
            console.log({ error });
            return [];
        }
    };

    const sortAlphabetical = (list: any) => {
        return [...list].sort((a: any, b: any) => (sortAscending ? 1 : -1) * a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    };

    const sortByHLTB = (list: any) => {
        return [...list].sort((a: any, b: any) => {
            const aMain = a.hltbInfo?.comp_main;
            const bMain = b.hltbInfo?.comp_main;
            if (aMain && bMain) {
                return sortAscending ? aMain - bMain : bMain - aMain;
            }
            if (aMain || bMain) {
                return aMain ? -1 : 1;
            }
            return 0;
        });
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getBacklog(true).then(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        let mounted = true;
        if (mounted) {
            void getBacklog(mounted);
        }

        return function cleanUp() {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const sortFunctions = {
            [SortProperty.ALPHABETICAL]: sortAlphabetical,
            [SortProperty.HLTB]: sortByHLTB,
        };

        const sortFunction = sortFunctions[sortBy];
        if (sortFunction) {
            const sortedList: any[] = sortFunction(backlogData);
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