import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import { collection, getDocs } from 'firebase/firestore/lite';
import { Firestore } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

import { SortProperty } from '../constants/SortProperty';
import { Game } from '../types/Game';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListItemView } from '../components/ListItemView';
import { getHLTBInformation } from '../services/InformationService';
import ButtonGroup from '../components/ButtonGroup';
import SortButton from '../components/SortButton';
import { sortAlphabetical, sortByHLTB } from '../utilities/Utilities';

export default function RetroBacklogScreen({}: RootTabScreenProps<'RetroBacklog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const getRetroBacklogGames = async (fs: Firestore) => {
        const fullGamesList  = collection(fs, 'retro-backlog');
        const fullGamesListSnapshot = await getDocs(fullGamesList);
        return fullGamesListSnapshot.docs.map(doc => {
            const documentId = doc.id;
            const data = doc.data();
            return { ...data, documentId };
        });
    };

    const getRetroBacklog = async(mounted: boolean) => {
        try {
            const retroBacklog = await getRetroBacklogGames(firestore);
            const sortedRetroBacklog = sortAlphabetical(retroBacklog, true);

            await Promise.all(sortedRetroBacklog.map(async (game: Game) => {
                game.hltbInfo = await getHLTBInformation(game.title);
            }));

            if (mounted) {
                setFullBacklog(sortedRetroBacklog);
                setBacklogData(sortedRetroBacklog);
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
        void getRetroBacklog(mounted);

        return () => {
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
            const sortedList: any[] = sortFunction(backlogData, sortAscending);
            setBacklogData(sortedList);
        }
    }, [sortBy, sortAscending]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getRetroBacklog(true).then(() => setRefreshing(false));
    }, []);



    return (
        <View style={styles.container}>
            <SortButton sortBy={sortBy} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending}/>
            <ButtonGroup items={fullBacklog} setBacklogData={setBacklogData} setSortAscending={setSortAscending} setSortBy={setSortBy}  />
            { isLoading ?
                <LoadingIndicator /> :
                <ListItemView listData={backlogData} listType={'RETRO_BACKLOG'} setListData={setBacklogData} refreshing={refreshing} onRefresh={onRefresh} />
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
