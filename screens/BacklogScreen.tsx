import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import { SortProperty } from '../constants/SortProperty';
import { Completion } from '../constants/Completion';
import { Game } from '../types/Game';
import { GameCopy } from '../constants/GameCopy';

import { collection, getDocs, query, where } from 'firebase/firestore/lite';
import { Firestore } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

import { HLTBInfo } from '../types/HLTBInfo';
import { Cache } from '../interfaces/Cache';
import { MetacriticInfo } from '../types/MetacriticInfo';
import SortButton from '../components/SortButton';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListItemView } from '../components/ListItemView';
import { FilterButton } from '../components/FilterButton';

const memoizee = require('memoizee');

export default function BacklogScreen({ navigation }: RootTabScreenProps<'Backlog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const getGameInformation = async (list: Array<Game>) => {
        const promises = list.map(async (game: Game) => {
            const [hltbInformation, metacriticInformation] = await Promise.all([
                getHLTBInformation(game.title),
                getMetacriticInformation(game.title)
            ]);

            return {
                ...game,
                hltbInfo: hltbInformation,
                metacriticInfo: metacriticInformation
            };
        });
        return Promise.all(promises);
    };

    const filterCharacters = (title: string): string => {
        const specialCharacters = [
            String.fromCharCode(169),
            String.fromCharCode(174),
            String.fromCharCode(8482),
            'Remastered',
            '+ A NEW POWER AWAKENS SET',
            ': Duke of Switch Edition',
            'Commander Keen in ',
            ': Bundle of Terror',
            ' — Complete Edition',
            ' - The End of YoRHa Edition'
        ];

        let filteredTitle = title;
        specialCharacters.forEach(char => {
            filteredTitle = filteredTitle.split(char).join('').trim();
        });
        return filteredTitle;
    };

    const getHLTBInformation = async (title: string): Promise<HLTBInfo | undefined> => {
        if (getHLTBInformation.cache[title]) {
            return getHLTBInformation.cache[title];
        }

        const filteredTitle = filterCharacters(title);

        const gameInformationURL = `https://game-information.vercel.app/how-long-to-beat?title=${encodeURIComponent(filteredTitle)}`;
        // const gameInformationURL = `http://localhost:3000/how-long-to-beat?title=${encodeURIComponent(filteredTitle)}`;
        const gameInformation = await fetch(gameInformationURL);

        if (!gameInformation) {
            console.error('HLTB information fetch failed');
            setIsLoading(false);
        }
        if (gameInformation.status === 403) {
            console.error('HLTB information rate limit');
            setIsLoading(false);
        }
        if (!gameInformation.ok) {
            console.error('HLTB information request failed');
            setIsLoading(false);
        }
        const response = await gameInformation.json();
        const result = (response.data as HLTBInfo[]).find((item: HLTBInfo) => (item.game_name.toLowerCase() === filteredTitle.toLowerCase() || item.game_alias.toLowerCase() === filteredTitle.toLowerCase()));

        getHLTBInformation.cache[filteredTitle] = result;
        return result;
    };

    getHLTBInformation.cache = {} as Cache;

    const getMetacriticInformation = async (title: string): Promise<MetacriticInfo> => {
        if (getMetacriticInformation.cache[title]) {
            return getMetacriticInformation.cache[title];
        }

        let filteredTitle = filterCharacters(title);

        const metacriticInformationURL = `https://game-information.vercel.app/metacritic?title=${filteredTitle.replace('+', '%2B')}&type=BACKLOG`;
        const metacriticInformation = await fetch(metacriticInformationURL);

        if (!metacriticInformation) {
            console.log('Metacritic information fetch failed');
        }
        if (metacriticInformation.status === 403) {
            console.log('Metacritic information rate limit');
        }
        if (!metacriticInformation.ok) {
            console.log('Metacritic information request failed');
        }
        const response = await metacriticInformation.json();
        let result;
        if (response && response.name !== 'TimeoutError') {
            result = response.find((item: { title: string; }) => item.title.toLowerCase() === filteredTitle.toLowerCase());
            getMetacriticInformation.cache[title] = result;
        }
        return result;
    };

    getMetacriticInformation.cache = {} as Cache;

    const getBacklogGames = async (fs: Firestore) => {
        const fullGamesList = collection(fs, 'full-games-list');
        const whereQuery = query(fullGamesList, where('completion', 'not-in', ['Beaten', 'Completed', 'Continuous', 'Dropped']));
        const fullGamesListSnapshot = await getDocs(whereQuery);
        return fullGamesListSnapshot.docs.map(doc => {
            const documentId = doc.id;
            const data = doc.data();
            return { ...data, documentId };
        });
    };

    const getBacklog = async(mounted: boolean) => {
        try {
            const backlog = await getBacklogGames(firestore);
            const sortedBacklog = sortAlphabetical(backlog);
            const backlogWithAdditionalInformation = await getGameInformation(sortedBacklog);

            if (mounted) {
                setFullBacklog(backlogWithAdditionalInformation);
                setBacklogData(getPlaying(backlogWithAdditionalInformation));
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
            const sortedList = sortFunction(backlogData);
            setBacklogData(sortedList);
        }
    }, [sortBy, sortAscending]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getBacklog(true).then(() => setRefreshing(false));
    }, []);

    const setFilteredDataAndResetSort = (filterFn: (items: Game[]) => Game[]) => {
        setBacklogData(filterFn(fullBacklog));
        resetSort();
    };

    const isAll = () => setFilteredDataAndResetSort(getAll);
    const isPhysical = () => setFilteredDataAndResetSort(getOnlyPhysical);
    const isDigital = () => setFilteredDataAndResetSort(getOnlyDigital);
    const isPlaying = () => setFilteredDataAndResetSort(getPlaying);
    const isPaused = () => setFilteredDataAndResetSort(getPaused);

    const getFilteredGames = memoizee((items: Game[], filterFn: (game: Game) => boolean) => {
        return items.filter(filterFn);
    });

    const getAll = () => fullBacklog;
    const getOnlyPhysical = (items: Game[]) => getFilteredGames(items, (game: Game) => game.gameCopy.includes(GameCopy.PHYSICAL));
    const getOnlyDigital = (items: Game[]) => getFilteredGames(items, (game: Game) => game.gameCopy.includes(GameCopy.DIGITAL));
    const getPlaying = (items: Game[]) => getFilteredGames(items, (game: Game) => game.completion === Completion.PLAYING);
    const getPaused = (items: Game[]) => getFilteredGames(items, (game: Game) => game.completion === Completion.PAUSED);

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

    const resetSort = () => {
        setSortAscending(true);
        setSortBy(SortProperty.ALPHABETICAL);
    };

    const ButtonGroup = () => {
        const buttonData = [
            { onPress: isAll, text: 'All ', numberOfItems: getAll().length },
            { onPress: isPhysical, icon: "sd-card", numberOfItems: getOnlyPhysical(fullBacklog).length },
            { onPress: isDigital, icon: "cloud-download-alt", numberOfItems: getOnlyDigital(fullBacklog).length },
            { onPress: isPlaying, icon: "gamepad", numberOfItems: getPlaying(fullBacklog).length },
            { onPress: isPaused, icon: "pause", numberOfItems: getPaused(fullBacklog).length },
        ];

        return (
            <View style={styles.buttonGroup}>
                {buttonData.map((button, index) => (
                    <FilterButton key={index} filterFunction={button.onPress} iconName={button.icon} text={button.text} numberOfItems={button.numberOfItems} />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <SortButton sortBy={sortBy} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending}/>
            <ButtonGroup/>
            { isLoading ?
                <LoadingIndicator /> :
                <ListItemView listData={backlogData} listType={'BACKLOG'} setListData={setBacklogData} refreshing={refreshing} onRefresh={onRefresh} />
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
