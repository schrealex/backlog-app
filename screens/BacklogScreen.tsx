import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import ListItem from '../components/ListItem';
import { View } from '../components/Themed';
import { RootTabScreenProps } from '../types';
import { Game } from '../types/Game';
import { completion, FULL_GAMES_LIST, gameCopy } from '../constants/FULL_GAMES_LIST';

const sortProperty = {
    ALPHABETICAL: 'Alphabetical',
    HLTB: 'Hltb'
};

function ButtonContent({ sortBy, sortAscending }) {
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

export default function BacklogScreen({ navigation }: RootTabScreenProps<'Backlog'>) {
    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(sortProperty.ALPHABETICAL);

    useEffect(() => {
        let mounted = true;

        async function getFullList() {
            const backlog: Array<Game> = FULL_GAMES_LIST.filter((game: Game) => !(
                game.completion === completion.BEATEN ||
                game.completion === completion.COMPLETED ||
                game.completion === completion.DROPPED ||
                game.completion === completion.CONTINUOUS
            ));
            setFullBacklog(backlog);
            setBacklogData(backlog);
            setIsLoading(false);
        }

        if (mounted) {
            getFullList();
        }

        return function cleanUp() {
            mounted = false;
        };
    }, []);

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
            sortAlphabetical();
        } else if (sortBy === sortProperty.ALPHABETICAL && !sortAscending) {
            setSortBy(sortProperty.HLTB);
            setSortAscending(true);
            sortByHLTB();
        } else if (sortBy === sortProperty.HLTB && sortAscending) {
            setSortBy(sortProperty.HLTB);
            setSortAscending(false);
            sortByHLTB();
        } else if (sortBy === sortProperty.HLTB && !sortAscending) {
            setSortBy(sortProperty.ALPHABETICAL);
            setSortAscending(true);
            sortAlphabetical();
        }
    };

    const sortAlphabetical = () => {

        const sortedList = [...backlogData].sort((a: any, b: any) => {
            return sortAscending ? b.title.toLowerCase().localeCompare(a.title.toLowerCase()) :
                a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        setBacklogData(sortedList);
    };

    const sortByHLTB = () => {
        const sortedList = [...backlogData].sort((a: any, b: any) => {
            if (a.hltbInfo && b.hltbInfo) {
                if (a.hltbInfo.comp_main && b.hltbInfo.comp_main) {
                    return !sortAscending ? a.hltbInfo.comp_main - b.hltbInfo.comp_main :
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
                    <ButtonContent sortBy={sortBy} sortAscending={sortAscending}></ButtonContent>
                </Pressable>
            </View>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isAll}>
                    <Text style={styles.buttonText}>All [{getAll().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isPhysical}>
                    {/*<Pressable onPress={isPhysical} style={styles.button}>*/}
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
                {/*<Button*/}
                {/*    icon={*/}
                {/*        <FontAwesomeIcon icon={faStopIcon} color={'red'} size={20} style={{ paddingRight: 5 }} />*/}
                {/*    }*/}
                {/*    title={getNotStarted().length}*/}
                {/*    onPress={isNotStarted}*/}
                {/*    buttonStyle={styles.button}*/}
                {/*/>*/}
                {/*<Button*/}
                {/*    icon={*/}
                {/*        <FontAwesomeIcon icon={faRepeatAltIcon} color={'red'} size={20} style={{ paddingRight: 5 }} />*/}
                {/*    }*/}
                {/*    title={getContinuous().length}*/}
                {/*    onPress={isContinuous}*/}
                {/*    buttonStyle={styles.button}*/}
                {/*/>*/}
            </View>
            {isLoading ?
                <ActivityIndicator size="large" color="#fff" /> :
                <FlatList
                    data={backlogData}
                    keyExtractor={(item => item.id.toString())}
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
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        fontSize: 16,
        width: 'min-content',
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
