/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

import { RootStackParamList } from '../types';

const linking: LinkingOptions<RootStackParamList> = {
    prefixes: [Linking.createURL('/')],
    config: {
        screens: {
            Root: {
                screens: {
                    Backlog: {
                        screens: {
                            BacklogScreen: 'Backlog',
                        },
                    },
                    Finished: {
                        screens: {
                            FullListScreen: 'Finished',
                        },
                    },
                    FullList: {
                        screens: {
                            FullListScreen: 'Full list',
                        },
                    },
                    RetroBacklog: {
                        screens: {
                            RetroBacklogScreen: 'Retro backlog',
                        },
                    },
                    RandomSuggestion: {
                        screens: {
                            RandomSuggestionScreen: 'Random backlog suggestion',
                        },
                    },
                },
            },
            Modal: 'modal',
            NotFound: '*',
        },
    },
};

export default linking;
