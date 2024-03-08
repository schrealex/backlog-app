import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { View } from '../components/Themed';
import { RootTabScreenProps } from '../types';

import { collection, getDocs } from 'firebase/firestore/lite';
import { Firestore } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

import { SortProperty } from '../constants/SortProperty';
import { GameCopy } from '../constants/GameCopy';
import { Completion } from '../constants/Completion';
import { Game } from '../types/Game';
import { HLTBInfo } from '../types/HLTBInfo';
import { Cache } from '../interfaces/Cache';
import SortButton from '../components/SortButton';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListItemView } from '../components/ListItemView';
import { FilterButton } from '../components/FilterButton';

const memoizee = require('memoizee');

export default function RetroBacklogScreen({ navigation }: RootTabScreenProps<'RetroBacklog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const getRetroBacklogGames = async (fs: Firestore) => {
        const fullGamesList = collection(fs, 'retro-backlog');
        const fullGamesListSnapshot = await getDocs(fullGamesList);
        return fullGamesListSnapshot.docs.map(doc => {
            const documentId = doc.id;
            const data = doc.data();
            return { ...data, documentId };
        });
    };

    const filterCharacters = (title: string): string => {
        const specialCharacters = [
            String.fromCharCode(169), // copyrightSign
            String.fromCharCode(174), // registeredSign
            String.fromCharCode(8482), // trademarkSymbol
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

        const gameInformationURL = `https://game-information.vercel.app/how-long-to-beat?title=${filteredTitle}`;
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
        const result = (response.data as HLTBInfo[]).find((item: HLTBInfo) => (item.game_name === filteredTitle || item.game_alias === filteredTitle));

        getHLTBInformation.cache[filteredTitle] = result;
        return result;
    };

    getHLTBInformation.cache = {} as Cache;

    const getRetroBacklog = async(mounted: boolean) => {
        try {
            const retroBacklog = await getRetroBacklogGames(firestore);
            const sortedRetroBacklog = sortAlphabetical(retroBacklog);

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
        if (mounted) {
            void getRetroBacklog(mounted);
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

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getRetroBacklog(true).then(() => setRefreshing(false));
    }, []);

    const setFilteredDataAndResetSort = (filterFunction: (items: Game[]) => Game[]) => {
        setBacklogData(filterFunction(fullBacklog));
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
