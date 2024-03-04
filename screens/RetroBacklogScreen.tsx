import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import ListItem from '../components/ListItem';
import { View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import { Game } from '../types/Game';

import { collection, getDocs } from 'firebase/firestore/lite';
import { Firestore } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { SortProperty } from '../constants/SortProperty';
import { GameCopy } from '../constants/GameCopy';
import { Completion } from '../constants/Completion';
import { HLTBInfo } from '../types/HLTBInfo';
import { Cache } from '../interfaces/Cache';

function ButtonContent({ sortBy, sortAscending }: any) {
    return (
        <View style={styles.buttonContent}>
            {sortBy === SortProperty.ALPHABETICAL && sortAscending ?
                <FontAwesome5 name="sort-alpha-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.ALPHABETICAL && !sortAscending ?
                <FontAwesome5 name="sort-alpha-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.HLTB && !sortAscending ?
                <FontAwesome5 name="sort-amount-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.HLTB && sortAscending ?
                <FontAwesome5 name="sort-amount-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            <Text
                style={styles.buttonText}>{sortBy === SortProperty.ALPHABETICAL ? 'Sort Alphabetical' : sortBy === SortProperty.HLTB ? 'Sort by HLTB' : ''}</Text>
        </View>
    );
}

export default function RetroBacklogScreen({ navigation }: RootTabScreenProps<'RetroBacklog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);

    const getRetroBacklogGames = async (fs: Firestore) => {
        const fullGamesList = collection(fs, 'retro-backlog');
        const fullGamesListSnapshot = await getDocs(fullGamesList);
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

    const filterCharacters = (title: string): string => {
        const copyrightSign = String.fromCharCode(169);
        const registeredSign = String.fromCharCode(174);
        const trademarkSymbol = String.fromCharCode(8482);

        let filteredTitle = title.split(copyrightSign).join('');
        filteredTitle = filteredTitle.split(registeredSign).join('');
        filteredTitle = filteredTitle.split(trademarkSymbol).join('');
        filteredTitle = filteredTitle.split('Remastered').join('').trim();
        filteredTitle = filteredTitle.split('+ A NEW POWER AWAKENS SET').join('').trim();
        filteredTitle = filteredTitle.split(': Duke of Switch Edition').join('').trim();
        filteredTitle = filteredTitle.split('Commander Keen in ').join('').trim();
        filteredTitle = filteredTitle.split(': Bundle of Terror').join('').trim();
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

    useEffect(() => {
        let mounted = true;

        async function getRetroBacklog() {

            const retroBacklog = await getRetroBacklogGames(firestore);
            const sortedRetroBacklog = sortGamesAlphabetical(retroBacklog);

            await Promise.all(sortedRetroBacklog.map(async (game: Game) => {
                game.hltbInfo = await getHLTBInformation(game.title);
            }));

            if (mounted) {
                setFullBacklog(sortedRetroBacklog);
                setBacklogData(sortedRetroBacklog);
                setIsLoading(false);
            }
        }

        if (mounted) {
            void getRetroBacklog();
        }

        return function cleanUp() {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (sortBy === SortProperty.ALPHABETICAL) {
            sortAlphabetical();
        } else if (sortBy === SortProperty.HLTB) {
            sortByHLTB();
        }
    }, [sortBy, sortAscending]);

    const isAll = () => {
        setBacklogData(getAll());
    };

    const isPhysical = () => {
        setBacklogData(getOnlyPhysical());
    };

    const isDigital = () => {
        setBacklogData(getOnlyDigital());
    };

    const isPlaying = () => {
        setBacklogData(getPlaying());
    };

    const isPaused = () => {
        setBacklogData(getPaused());
    };

    const getAll = () => {
        return fullBacklog;
    };

    const getOnlyPhysical = () => {
        return fullBacklog.filter((game: any) => game.gameCopy.includes(GameCopy.PHYSICAL));
    };

    const getOnlyDigital = () => {
        return fullBacklog.filter((game: any) => game.gameCopy.includes(GameCopy.DIGITAL));
    };

    const getPlaying = () => {
        return fullBacklog.filter((game: any) => game.completion === Completion.PLAYING);
    };

    const getPaused = () => {
        return fullBacklog.filter((game: any) => game.completion === Completion.PAUSED);
    };

    const toggleSort = () => {
        if (sortBy === SortProperty.ALPHABETICAL && sortAscending) {
            setSortBy(SortProperty.ALPHABETICAL);
            setSortAscending(false);
        } else if (sortBy === SortProperty.ALPHABETICAL && !sortAscending) {
            setSortBy(SortProperty.HLTB);
            setSortAscending(true);
        } else if (sortBy === SortProperty.HLTB && sortAscending) {
            setSortBy(SortProperty.HLTB);
            setSortAscending(false);
        } else if (sortBy === SortProperty.HLTB && !sortAscending) {
            setSortBy(SortProperty.ALPHABETICAL);
            setSortAscending(true);
        }
    };

    const sortAlphabetical = () => {
        const sortedList = [...backlogData].sort((a: any, b: any) => {
            return sortAscending ? a.title.toLowerCase().localeCompare(b.title.toLowerCase()) :
                b.title.toLowerCase().localeCompare(a.title.toLowerCase());
        });
        setBacklogData(sortedList);
    };

    const sortByHLTB = () => {
        const sortedList = [...backlogData].sort((a: any, b: any) => {
            if (a.hltbInfo && b.hltbInfo) {
                if (a.hltbInfo.comp_main && b.hltbInfo.comp_main) {
                    return sortAscending ? a.hltbInfo.comp_main - b.hltbInfo.comp_main :
                        b.hltbInfo.comp_main - a.hltbInfo.comp_main;
                }
                return (a.hltbInfo.comp_main && !b.hltbInfo.comp_main) ? -1 : (!a.hltbInfo.comp_main && b.hltbInfo.comp_main) ? 1 : 0;
            }
            return (a.hltbInfo && !b.hltbInfo) ? -1 : (!a.hltbInfo && b.hltbInfo) ? 1 : 0;
        });
        setBacklogData(sortedList);
    };

    const onClick = (clickedItemId: number): void => {
        const updatedList = backlogData.map((item: Game) => {

            if (item.id === clickedItemId) {
                return { ...item, isMenuOpen: !item.isMenuOpen };
            } else {
                return { ...item, isMenuOpen: false };
            }
        });
        setBacklogData(updatedList);
    }

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
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isPlaying}>
                    <FontAwesome5 name="gamepad" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getPlaying().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isPaused}>
                    <FontAwesome5 name="pause" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getPaused().length}]</Text>
                </Pressable>
            </View>
            {isLoading ?
                <ActivityIndicator style={styles.loadingSpinner} size="large" color="#fff" /> :
                <FlatList
                    data={backlogData}
                    keyExtractor={(item => item.id.toString())}
                    style={styles.list}
                    renderItem={({ item }) => (
                        <ListItem item={item} type={'RETRO_BACKLOG'} isOpen={item.isMenuOpen} onClick={() => onClick(item.id)} />
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
    list: {
        paddingBottom: 100,
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
        width: 70,
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
