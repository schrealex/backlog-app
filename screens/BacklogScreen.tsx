import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, Text, View as ReactNativeView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import { Game } from '../types/Game';
import { completion, FULL_GAMES_LIST, gameCopy } from '../constants/FULL_GAMES_LIST';

import { addDoc, collection, getDocs, query, where } from 'firebase/firestore/lite';
import { Firestore } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import ListItem from '../components/ListItem';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

const sortProperty = {
    ALPHABETICAL: 'Alphabetical',
    HLTB: 'Hltb'
};

function ButtonContent({ sortBy, sortAscending }: any) {
    return (
        <View style={styles.buttonContent}>
            {sortBy === sortProperty.ALPHABETICAL && sortAscending ?
                <FontAwesome5 name="sort-alpha-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === sortProperty.ALPHABETICAL && !sortAscending ?
                <FontAwesome5 name="sort-alpha-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === sortProperty.HLTB && !sortAscending ?
                <FontAwesome5 name="sort-amount-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === sortProperty.HLTB && sortAscending ?
                <FontAwesome5 name="sort-amount-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            <Text
                style={styles.buttonText}>{sortBy === sortProperty.ALPHABETICAL ? 'Sort Alphabetical' : sortBy === sortProperty.HLTB ? 'Sort by HLTB' : ''}</Text>
        </View>
    );
}

const SwipeableRow = ({ item }: { item: any }) => {


    const AnimatedView = Animated.createAnimatedComponent(ReactNativeView);

    const renderLeftActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [0, 1],
            extrapolate: 'clamp',
        });
        return (
            <RectButton style={styles.leftAction} onPress={close}>
                {/* Change it to some icons */}
                <AnimatedView style={[styles.actionIcon, { transform: [{ scale }] }]} />
            </RectButton>
        );
    };
    const renderRightActions = (
        _progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const scale = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });
        return (
            <RectButton style={styles.rightAction} onPress={close}>
                {/* Change it to some icons */}
                <AnimatedView style={[styles.actionIcon, { transform: [{ scale }] }]} />
            </RectButton>
        );
    };

    let swipeableRow: Swipeable;

    const updateRef = (ref: Swipeable) => {
        swipeableRow = ref;
    };
    const close = () => {
        swipeableRow?.close();
    };

    return (
        <Swipeable
            ref={updateRef}
            friction={2}
            leftThreshold={80}
            enableTrackpadTwoFingerGesture
            rightThreshold={40}
            renderLeftActions={renderLeftActions}
            renderRightActions={renderRightActions}>
            <ListItem item={item} type={'BACKLOG'} />
        </Swipeable>
    );

};

export default function BacklogScreen({ navigation }: RootTabScreenProps<'Backlog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(sortProperty.ALPHABETICAL);

    useEffect(() => {
        let mounted = true;

        async function getGames(fs: Firestore) {
            const fullGamesList = collection(fs, 'full-games-list');
            const whereQuery = query(fullGamesList, where('completion', 'not-in', ['Beaten', 'Completed', 'Continuous', 'Dropped']));
            const fullGamesListSnapshot = await getDocs(whereQuery);
            return fullGamesListSnapshot.docs.map(doc => doc.data());
        }


        async function updateWishList(fs: any) {
            // const wishlist = collection(fs, 'wish-list-games');
            const fullGamesList = collection(fs, 'full-games-list');
            await FULL_GAMES_LIST.forEach(game => {
                addDoc(fullGamesList, game).then(r => {
                    console.log({ r });
                }).catch(error => {
                    console.log(error);
                });
            });
        }

        // updateWishList(firestore).then(result => {
        //     console.log({ result });
        // }).catch(error => {
        //     console.log(error);
        // });

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
        if (sortBy === sortProperty.ALPHABETICAL) {
            sortAlphabetical();
        } else if (sortBy === sortProperty.HLTB) {
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
        return fullBacklog.filter((game: any) => game.gameCopy.includes(gameCopy.PHYSICAL));
    };

    const getOnlyDigital = () => {
        return fullBacklog.filter((game: any) => game.gameCopy.includes(gameCopy.DIGITAL));
    };

    const getPlaying = () => {
        return fullBacklog.filter((game: any) => game.completion === completion.UNFINISHED);
    };

    const getPaused = () => {
        return fullBacklog.filter((game: any) => game.completion === completion.PAUSED);
    };

    const toggleSort = () => {
        if (sortBy === sortProperty.ALPHABETICAL && sortAscending) {
            setSortBy(sortProperty.ALPHABETICAL);
            setSortAscending(false);
        } else if (sortBy === sortProperty.ALPHABETICAL && !sortAscending) {
            setSortBy(sortProperty.HLTB);
            setSortAscending(true);
        } else if (sortBy === sortProperty.HLTB && sortAscending) {
            setSortBy(sortProperty.HLTB);
            setSortAscending(false);
        } else if (sortBy === sortProperty.HLTB && !sortAscending) {
            setSortBy(sortProperty.ALPHABETICAL);
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
                    data={backlogData}
                    keyExtractor={(item => item.id.toString())}
                    style={styles.list}
                    renderItem={({ item }) => (
                        <SwipeableRow item={item} />
                    )}
                />}
        </View>
    );
}

const styles = StyleSheet.create({
    leftAction: {
        flex: 1,
        backgroundColor: '#388e3c',
        justifyContent: 'flex-end',
        alignItems: 'center',
        flexDirection: 'row-reverse',
    },
    actionIcon: {
        width: 30,
        marginHorizontal: 10,
        backgroundColor: 'plum',
        height: 20,
    },
    rightAction: {
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: '#dd2c00',
        flex: 1,
        justifyContent: 'flex-end',
    },
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
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
