/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { FontAwesome5 } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { ColorSchemeName } from 'react-native';

import Colors from '../constants/Colors';
import ModalScreen from '../screens/ModalScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import FullListScreen from '../screens/FullListScreen';
import { RootStackParamList, RootTabParamList } from '../types';
import LinkingConfiguration from './LinkingConfiguration';
import FinishedListScreen from "../screens/FinishedListScreen";
import RandomSuggestionScreen from '../screens/RandomSuggestionScreen';
import BaseBacklogScreen from '../screens/BaseBacklogScreen';

export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
    return (
        <NavigationContainer
            linking={LinkingConfiguration}
            theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <RootNavigator />
        </NavigationContainer>
    );
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
            <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen name="Modal" component={ModalScreen} />
            </Stack.Group>
        </Stack.Navigator>
    );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createBottomTabNavigator<RootTabParamList>();
const BacklogScreen = (props: any) => <BaseBacklogScreen {...props} screenType="Backlog" />;
const RetroBacklogScreen = (props: any) => <BaseBacklogScreen {...props} screenType="RetroBacklog" />;

function BottomTabNavigator() {
    return (
        <BottomTab.Navigator
            initialRouteName="Backlog"
            screenOptions={{
                tabBarActiveTintColor: Colors['dark'].tint,
                tabBarStyle: [{ height: 66, paddingTop: 4, paddingBottom: 10 }]
            }}>
            <BottomTab.Screen
                name="Backlog"
                component={BacklogScreen}
                options={{
                    title: 'Backlog',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="clipboard-check" color={color} size={25} />,
                }}
            />
            <BottomTab.Screen
                name="FullList"
                component={FullListScreen}
                options={{
                    title: 'Full list',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="list" color={color} size={25} />,
                }}
            />
            <BottomTab.Screen
                name="Finished"
                component={FinishedListScreen}
                options={{
                    title: 'Finished',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="flag-checkered" color={color} size={25} />,
                }}
            />
            <BottomTab.Screen
                name="RetroBacklog"
                component={RetroBacklogScreen}
                options={{
                    title: 'Retro Backlog',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="history" color={color} size={25} />,
                }}
            />
            <BottomTab.Screen
                name="RandomSuggestion"
                component={RandomSuggestionScreen}
                options={{
                    title: 'Backlog suggestion',
                    tabBarIcon: ({ color }) => <FontAwesome5 name="random" color={color} size={25} />,
                }}
            />
        </BottomTab.Navigator>
    );
}
