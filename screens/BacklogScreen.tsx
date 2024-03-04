import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import SortButtonOptions from '../components/SortButtonOptions';
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
import ListItem from '../components/ListItem';

const memoizee = require('memoizee');

export default function BacklogScreen({ navigation }: RootTabScreenProps<'Backlog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);

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
        filteredTitle = filteredTitle.split(' — Complete Edition').join('').trim();
        filteredTitle = filteredTitle.split(' - The End of YoRHa Edition').join('').trim();
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

    const sortBacklogAlphabetical = (backlog: any) => {
        return backlog.sort((a: any, b: any) => {
            return sortAscending ? a.title.toLowerCase().localeCompare(b.title.toLowerCase()) :
                b.title.toLowerCase().localeCompare(a.title.toLowerCase());
        });
    };

    useEffect(() => {
        let mounted = true;

        async function getBacklog() {
            try {
                const backlog = await getBacklogGames(firestore);
                const sortedBacklog = sortBacklogAlphabetical(backlog);
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

        if (mounted) {
            void getBacklog();
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
        } else if (sortBy === SortProperty.METACRITIC) {
            sortByMetacritic();
        }
    }, [sortBy, sortAscending]);

    const isAll = () => {
        setBacklogData(getAll(fullBacklog));
        resetSort();
    };

    const isPhysical = () => {
        setBacklogData(getOnlyPhysical(fullBacklog));
        resetSort();
    };

    const isDigital = () => {
        setBacklogData(getOnlyDigital(fullBacklog));
        resetSort();
    };

    const isPlaying = () => {
        setBacklogData(getPlaying(fullBacklog));
        resetSort();
    };

    const isPaused = () => {
        setBacklogData(getPaused(fullBacklog));
        resetSort();
    };

    const getAll = memoizee(() => {
        return fullBacklog;
    });

    const getOnlyPhysical = memoizee((items: Game[]) => {
        return items.filter((game: any) => game.gameCopy.includes(GameCopy.PHYSICAL));
    });

    const getOnlyDigital = memoizee((items: Game[]) => {
        return items.filter((game: any) => game.gameCopy.includes(GameCopy.DIGITAL));
    });

    const getPlaying = memoizee((items: Game[]) => {
        return items.filter((game: any) => game.completion === Completion.PLAYING);
    }, []);

    const getPaused = memoizee((items: Game[]) => {
        return items.filter((game: any) => game.completion === Completion.PAUSED);
    });

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
            setSortBy(SortProperty.METACRITIC);
            setSortAscending(true);
        } else if (sortBy === SortProperty.METACRITIC && sortAscending) {
            setSortBy(SortProperty.METACRITIC);
            setSortAscending(false);
        } else if (sortBy === SortProperty.METACRITIC && !sortAscending) {
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

    const sortByMetacritic = (): void => {
        const sortedList = [...backlogData].sort((a: any, b: any) => {
            if (a.metacriticInfo && b.metacriticInfo) {
                if (a.metacriticInfo.metacriticScore && b.metacriticInfo.metacriticScore) {
                    return sortAscending ? a.metacriticInfo.metacriticScore - b.metacriticInfo.metacriticScore :
                        b.metacriticInfo.metacriticScore - a.metacriticInfo.metacriticScore;
                }
                return (a.metacriticInfo.metacriticScore && !b.metacriticInfo.metacriticScore) ? -1 : (!a.metacriticInfo.metacriticScore && b.metacritic.metacriticScore) ? 1 : 0;
            }
            return (a.metacriticInfo && !b.metacriticInfo) ? -1 : (!a.metacriticInfo && b.metacriticInfo) ? 1 : 0;
        });
        setBacklogData(sortedList);
    };

    const resetSort = () => {
        setSortAscending(true);
        setSortBy(SortProperty.ALPHABETICAL);
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
                    <SortButtonOptions sortBy={sortBy} sortAscending={sortAscending} />
                </Pressable>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isAll}>
                    <Text style={styles.buttonText}>All [{getAll(fullBacklog).length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isPhysical}>
                    <FontAwesome5 name="sd-card" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{getOnlyPhysical(fullBacklog).length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isDigital}>
                    <FontAwesome5 name="cloud-download-alt" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getOnlyDigital(fullBacklog).length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isPlaying}>
                    <FontAwesome5 name="gamepad" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getPlaying(fullBacklog).length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isPaused}>
                    <FontAwesome5 name="pause" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getPaused(fullBacklog).length}]</Text>
                </Pressable>
            </View>
            {isLoading ?
                <ActivityIndicator style={styles.loadingSpinner} size="large" color="#fff" /> :
                <FlatList
                    removeClippedSubviews
                    data={backlogData}
                    initialNumToRender={8}
                    keyExtractor={(item => item.id.toString())}
                    style={styles.list}
                    contentContainerStyle={styles.listScrollContent}
                    renderItem={({ item }) => (
                        <ListItem item={item} type={'BACKLOG'} isOpen={item.isMenuOpen} onClick={() => onClick(item.id)} />
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
        width: '100%',
        paddingBottom: 100,
    },
    listScrollContent: {
        display: 'flex',
        alignItems: 'center',
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
