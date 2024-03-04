import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from '../components/Themed';
import ListItem from '../components/ListItem';
import { Cache } from '../interfaces/Cache';
import { Game } from '../types/Game';

export default function RandomSuggestionScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [randomSuggestion, setRandomSuggestion]: Array<any> = useState([]);

    useEffect(() => {
        let mounted = true;

        if (mounted) {
            void getRandomBacklogSuggestion();
        }

        return function cleanUp() {
            mounted = false;
        };
    }, []);

    const getRandomBacklogSuggestion = async (): Promise<void> => {
        if (getRandomBacklogSuggestion.cache['random']) {
            return getRandomBacklogSuggestion.cache['random'];
        }

        const randomBacklogSuggestionURL = `https://game-information.vercel.app/random`;
        const randomSuggestion = await fetch(randomBacklogSuggestionURL);

        if (!randomSuggestion) {
            console.error('Random backlog suggestion fetch failed');
            setIsLoading(false);
        }
        const result = await randomSuggestion.json() as Game;

        getRandomBacklogSuggestion.cache['random'] = result;

        setRandomSuggestion(result);
        setIsLoading(false);

    };

    getRandomBacklogSuggestion.cache = {} as Cache;

    const onClick = (item: Game): void => {
        console.log({ item });
        const randomItemWithMenu = { ...item, isMenuOpen: !item.isMenuOpen };
        setRandomSuggestion(randomItemWithMenu);
    }

    return (
        <View style={styles.container}>
            <View style={styles.buttonGroup}>
                <Pressable style={styles.button} onPress={getRandomBacklogSuggestion}>
                    <FontAwesome5 name="random" size={20} color="red" style={{ paddingRight: 5 }} />
                    <Text style={styles.buttonText}>Backlog suggestion</Text>
                </Pressable>
            </View>

            {isLoading ?
                <ActivityIndicator style={styles.loadingSpinner} size="large" color="#fff" /> :
                <View style={styles.list}>
                    <ListItem item={randomSuggestion} type={'BACKLOG'} isOpen={randomSuggestion.isMenuOpen} onClick={() => onClick(randomSuggestion)} />
                </View>
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
    loadingSpinner: {
        height: 250,
    },
    list: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
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
        width: 180,
    },
    buttonText: {
        color: '#ffffff',
        display: 'flex',
    }
});
