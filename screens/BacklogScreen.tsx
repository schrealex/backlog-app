import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import ListItem from '../components/ListItem';
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

import * as memoizee from 'memoizee';


export default function BacklogScreen({ navigation }: RootTabScreenProps<'Backlog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);

    useEffect(() => {
        let mounted = true;

        async function getGames(fs: Firestore) {
            const fullGamesList = collection(fs, 'full-games-list');
            const whereQuery = query(fullGamesList, where('completion', 'not-in', ['Beaten', 'Completed', 'Continuous', 'Dropped']));
            const fullGamesListSnapshot = await getDocs(whereQuery);
            return fullGamesListSnapshot.docs.map(doc => {
                const documentId = doc.id;
                const data = doc.data();
                return { ...data, documentId };
            });
        }


        async function getFullList() {

            getGames(firestore).then(result => {
                const backlog: Array<any> = result.sort((a: any, b: any) => {
                    return sortAscending ? a.title.toLowerCase().localeCompare(b.title.toLowerCase()) :
                        b.title.toLowerCase().localeCompare(a.title.toLowerCase());
                });
                setFullBacklog(backlog);
                setBacklogData(backlog);
                setIsLoading(false);
            });
        }

        if (mounted) {
            getFullList();
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
        setBacklogData(getAll());
        resetSort();
    };

    const isPhysical = () => {
        setBacklogData(getOnlyPhysical());
        resetSort();
    };

    const isDigital = () => {
        setBacklogData(getOnlyDigital());
        resetSort();
    };

    const isPlaying = () => {
        setBacklogData(getPlaying());
        resetSort();
    };

    const isPaused = () => {
        setBacklogData(getPaused());
        resetSort();
    };

    const getAll = memoizee(() => {
        return fullBacklog;
    });

    const getOnlyPhysical = memoizee(() => {
        return fullBacklog.filter((game: any) => game.gameCopy.includes(GameCopy.PHYSICAL));
    });

    const getOnlyDigital = memoizee(() => {
        return fullBacklog.filter((game: any) => game.gameCopy.includes(GameCopy.DIGITAL));
    });

    const getPlaying = memoizee(() => {
        return fullBacklog.filter((game: any) => game.completion === Completion.UNFINISHED);
    }, []);

    const getPaused = memoizee(() => {
        return fullBacklog.filter((game: any) => game.completion === Completion.PAUSED);
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

    const sortByMetacritic = () => {
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

    return (
        <View style={styles.container}>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, styles.largeButton]} onPress={toggleSort}>
                    <SortButtonOptions sortBy={sortBy} sortAscending={sortAscending} />
                </Pressable>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isAll}>
                    <Text style={styles.buttonText}>All [{getAll().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isPhysical}>
                    <FontAwesome5 name="compact-disc" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>[{getOnlyPhysical().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isDigital}>
                    <FontAwesome5 name="hdd" size={20} color="red" style={{ paddingRight: 5 }} /><Text
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
                <ActivityIndicator size="large" color="#fff" /> :
                <FlatList
                    removeClippedSubviews
                    data={backlogData}
                    initialNumToRender={8}
                    keyExtractor={(item => item.id.toString())}
                    style={styles.list}
                    contentContainerStyle={styles.listScrollContent}
                    renderItem={({ item }) => (
                        <ListItem item={item} type={'BACKLOG'} />
                    )}
                />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
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
