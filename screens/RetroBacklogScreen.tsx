import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import { collection, getDocs } from 'firebase/firestore/lite';
import { Firestore } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

import { SortProperty } from '../constants/SortProperty';
import { GameFilter, applyGameFilter } from '../constants/GameFilter';
import { Game } from '../types/Game';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListItemView } from '../components/ListItemView';
import { getHLTBInformation } from '../services/InformationService';
import ButtonGroup from '../components/ButtonGroup';
import SortButton from '../components/SortButton';
import { sortAlphabetical, sortByHLTB } from '../utilities/Utilities';

const sortFunctions = {
    [SortProperty.ALPHABETICAL]: sortAlphabetical,
    [SortProperty.HLTB]: sortByHLTB,
};

export default function RetroBacklogScreen({}: RootTabScreenProps<'RetroBacklog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [activeFilter, setActiveFilter] = useState<GameFilter>(GameFilter.ALL);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const isMountedRef = useRef(true);
    const backlogRef = useRef<Game[]>([]);

    const backlogData = useMemo(() => {
        const filteredGames = applyGameFilter(fullBacklog, activeFilter);
        const sortFunction = sortFunctions[sortBy];
        return sortFunction ? sortFunction(filteredGames, sortAscending) : filteredGames;
    }, [fullBacklog, activeFilter, sortBy, sortAscending]);

    const setGames = useCallback((games: Game[]) => {
        backlogRef.current = games;
        setFullBacklog(games);
    }, []);

    const updateGames = useCallback((updater: (currentGames: Game[]) => Game[]) => {
        setGames(updater(backlogRef.current));
    }, [setGames]);

    const onCompletionChange = useCallback((gameId: number, completion: string) => {
        updateGames((currentGames) => currentGames.map((game) => {
            if (game.id === gameId) {
                return { ...game, completion, isMenuOpen: false };
            }

            return game.isMenuOpen ? { ...game, isMenuOpen: false } : game;
        }));
    }, [updateGames]);

    const getRetroBacklogGames = async (fs: Firestore): Promise<Game[]> => {
        const fullGamesList  = collection(fs, 'retro-backlog');
        const fullGamesListSnapshot = await getDocs(fullGamesList);
        return fullGamesListSnapshot.docs.map(doc => {
            const documentId = doc.id;
            const data = doc.data();
            return { ...data, documentId, isMenuOpen: false } as Game;
        });
    };

    const getRetroBacklog = useCallback(async () => {
        try {
            const retroBacklog = await getRetroBacklogGames(firestore);

            await Promise.all(retroBacklog.map(async (game: Game) => {
                game.hltbInfo = await getHLTBInformation(game.title);
            }));

            if (isMountedRef.current) {
                setGames(retroBacklog);
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
        void getRetroBacklog();

        return () => {
            isMountedRef.current = false;
        };
    }, [getRetroBacklog]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void getRetroBacklog().finally(() => setRefreshing(false));
    }, [getRetroBacklog]);

    return (
        <View style={styles.container}>
            <SortButton sortBy={sortBy} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending}/>
            <ButtonGroup items={fullBacklog} activeFilter={activeFilter} setActiveFilter={setActiveFilter} setSortAscending={setSortAscending} setSortBy={setSortBy} />
            { isLoading ?
                <LoadingIndicator /> :
                <ListItemView listData={backlogData} listType={'RETRO_BACKLOG'} setListData={updateGames} refreshing={refreshing} onRefresh={onRefresh} onCompletionChange={onCompletionChange} />
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
