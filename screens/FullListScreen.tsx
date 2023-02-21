import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { View } from '../components/Themed';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { completion, FULL_GAMES_LIST, gameCopy } from '../constants/FULL_GAMES_LIST';
import ListItem from '../components/ListItem';
import { FontAwesome5 } from '@expo/vector-icons';

const sortProperty = {
    ALPHABETICAL: 'Alphabetical'
};

function ButtonContent({ sortBy, sortAscending }: any) {
    return (
        <View style={styles.buttonContent}>
            {sortBy === sortProperty.ALPHABETICAL && sortAscending ?
                <FontAwesome5 name="sort-alpha-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === sortProperty.ALPHABETICAL && !sortAscending ?
                <FontAwesome5 name="sort-alpha-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            <Text
                style={styles.buttonText}>{sortBy === sortProperty.ALPHABETICAL ? 'Sort Alphabetical' : ''}</Text>
        </View>
    );
}

export default function FullListScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [fullList, setFullList]: Array<any> = useState([]);
    const [fullListData, setFullListData]: Array<any> = useState([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(sortProperty.ALPHABETICAL);

    useEffect(() => {
        let mounted = true;

        async function getFullList() {
            setFullList(FULL_GAMES_LIST);
            setFullListData(FULL_GAMES_LIST);
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
        setFullListData(getAll());
    };

    const isPhysical = () => {
        setFullListData(getOnlyPhysical());
    };

    const isDigital = () => {
        setFullListData(getOnlyDigital());
    };

    const isDropped = () => {
        setFullListData(getDropped());
    };

    const isBeaten = () => {
        setFullListData(getBeaten());
    };

    const isCompleted = () => {
        setFullListData(getCompleted());
    };

    const getAll = () => {
        return fullList;
    };

    const getOnlyPhysical = () => {
        return fullList.filter((game: any) => game.gameCopy.includes(gameCopy.PHYSICAL));
    };

    const getOnlyDigital = () => {
        return fullList.filter((game: any) => game.gameCopy.includes(gameCopy.DIGITAL));
    };

    const getDropped = () => {
        return fullList.filter((game: any) => game.completion === completion.DROPPED);
    };

    const getBeaten = () => {
        return fullList.filter((game: any) => game.completion === completion.BEATEN);
    };

    const getCompleted = () => {
        return fullList.filter((game: any) => game.completion === completion.COMPLETED);
    };

    const toggleSort = () => {
        if (sortBy === sortProperty.ALPHABETICAL && sortAscending) {
            setSortBy(sortProperty.ALPHABETICAL);
            setSortAscending(false);
            sortAlphabetical();
        } else if (sortBy === sortProperty.ALPHABETICAL && !sortAscending) {
            setSortBy(sortProperty.ALPHABETICAL);
            setSortAscending(true);
            sortAlphabetical();
        }
    };

    const sortAlphabetical = () => {

        const sortedList = [...fullListData].sort((a: any, b: any) => {
            return sortAscending ? b.title.toLowerCase().localeCompare(a.title.toLowerCase()) :
                a.title.toLowerCase().localeCompare(b.title.toLowerCase());
        });
        setFullListData(sortedList);
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
            </View>
            <View style={styles.buttonGroup}>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isDropped}>
                    <FontAwesome5 name="times" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getDropped().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isBeaten}>
                    <FontAwesome5 name="fist-raised" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getBeaten().length}]</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={isCompleted}>
                    <FontAwesome5 name="trophy" size={20} color="red" style={{ paddingRight: 5 }} /><Text
                    style={styles.buttonText}>[{getCompleted().length}]</Text>
                </Pressable>
            </View>
            {isLoading ?
                <ActivityIndicator size="large" color="#fff" /> :
                <FlatList
                    data={fullListData}
                    keyExtractor={(item => item.id.toString())}
                    renderItem={({ item }) => (
                        <ListItem item={item} type={'FULL_LIST'} />
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
        width: 75,
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
