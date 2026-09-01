import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { View } from '../components/Themed';
import { FontAwesome5 } from '@expo/vector-icons';
import { where } from 'firebase/firestore/lite';
import { getLibraryEntries } from '../services/LibraryService';
import { SortProperty } from '../constants/SortProperty';
import { ActiveFilters, FilterGroup, GameFilter, applyGameFilters, filterGroups, filterMetadata } from '../constants/GameFilter';
import { Game } from '../types/Game';
import SortMenu from '../components/SortMenu';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { FilterButton } from '../components/FilterButton';
import FilterMenu, { FilterMenuGroup } from '../components/FilterMenu';
import { ListItemView } from '../components/ListItemView';
import { sortAlphabetical } from '../utilities/Utilities';

// Bezit gebruik je het vaakst en blijft daarom als knoppenrij zichtbaar.
const copyFilters = filterGroups.copy;

// Status en samen spelen zitten achter het filtermenu; dat scheelt twee rijen knoppen.
const menuGroups: FilterMenuGroup[] = [
    { group: 'completion', title: 'Status', filters: filterGroups.completion },
    { group: 'multiplayer', title: 'Samen spelen', filters: filterGroups.multiplayer },
];

export default function FullListScreen() {
    const [isLoading, setIsLoading] = useState(true);
    const [fullList, setFullList] = useState<Game[]>([]);
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);

    const isMountedRef = useRef(true);
    const fullListRef = useRef<Game[]>([]);

    // Afgeleide lijst: blijft automatisch in sync als een completion-status wijzigt.
    const fullListData = useMemo(
        () => sortAlphabetical(applyGameFilters(fullList, activeFilters), sortAscending),
        [fullList, activeFilters, sortAscending]
    );

    /**
     * Tellingen zijn contextueel: ze laten zien hoeveel games je overhoudt als je
     * dit filter toevoegt aan je huidige selectie. Zonder dat kun je jezelf in een
     * lege lijst klikken.
     */
    const getCount = useCallback((group: FilterGroup, filter: GameFilter) => (
        applyGameFilters(fullList, { ...activeFilters, [group]: filter }).length
    ), [fullList, activeFilters]);

    const setFilter = useCallback((group: FilterGroup, filter?: GameFilter) => {
        setActiveFilters((currentFilters) => {
            const nextFilters = { ...currentFilters };

            if (filter) {
                nextFilters[group] = filter;
            } else {
                delete nextFilters[group];
            }

            return nextFilters;
        });
    }, []);

    const clearAllFilters = useCallback(() => setActiveFilters({}), []);

    const setGames = useCallback((games: Game[]) => {
        fullListRef.current = games;
        setFullList(games);
    }, []);

    const updateGames = useCallback((updater: (currentGames: Game[]) => Game[]) => {
        setGames(updater(fullListRef.current));
    }, [setGames]);

    const onCompletionChange = useCallback((gameId: number, completion: string) => {
        updateGames((currentGames) => currentGames.map((game) => {
            if (game.id === gameId) {
                return { ...game, completion, isMenuOpen: false };
            }

            return game.isMenuOpen ? { ...game, isMenuOpen: false } : game;
        }));
    }, [updateGames]);

    const getAllTheGames = async (): Promise<Game[]> => getLibraryEntries(where('list', '==', 'BACKLOG'));

    const getFullListOfGames = useCallback(async () => {
        try {
            const allTheGames = await getAllTheGames();

            if (isMountedRef.current) {
                setGames(allTheGames);
                setIsLoading(false);
            }
        } catch (error: any) {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [setGames]);

    useEffect(() => {
        isMountedRef.current = true;
        void getFullListOfGames();

        return function cleanUp() {
            isMountedRef.current = false;
        };
    }, [getFullListOfGames]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        void getFullListOfGames().finally(() => setRefreshing(false));
    }, [getFullListOfGames]);

    const selectCopyFilter = (filter?: GameFilter) => setFilter('copy', filter);

    return (
        <View style={styles.container}>
            {/* Dit scherm sorteert alleen alfabetisch, dus tonen we geen keuzemenu. */}
            <SortMenu
                sortBy={SortProperty.ALPHABETICAL}
                sortAscending={sortAscending}
                setSortBy={setSortBy}
                setSortAscending={setSortAscending}
                sortProperties={[SortProperty.ALPHABETICAL]}
            />
            <View style={styles.buttonGroup}>
                <FilterButton
                    filterFunction={() => selectCopyFilter(undefined)}
                    text={filterMetadata[GameFilter.ALL].label + ' '}
                    numberOfItems={applyGameFilters(fullList, { ...activeFilters, copy: undefined }).length}
                    isActive={!activeFilters.copy}
                />
                {copyFilters.map((filter) => {
                    const { icon, icons } = filterMetadata[filter];
                    const isActive = activeFilters.copy === filter;
                    // Nogmaals tikken op het actieve filter wist het.
                    const onPress = () => selectCopyFilter(isActive ? undefined : filter);

                    return icons ? (
                        <Pressable key={filter} style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, isActive ? styles.activeButton : null]} onPress={onPress}>
                            {icons.map((iconName) => (
                                <FontAwesome5 key={iconName} name={iconName} size={20} color={isActive ? 'black' : 'red'} style={{ paddingRight: 5 }} />
                            ))}
                            <Text style={styles.buttonText}>[{getCount('copy', filter)}]</Text>
                        </Pressable>
                    ) : (
                        <FilterButton
                            key={filter}
                            filterFunction={onPress}
                            iconName={icon}
                            numberOfItems={getCount('copy', filter)}
                            isActive={isActive}
                        />
                    );
                })}
            </View>
            <FilterMenu
                groups={menuGroups}
                activeFilters={activeFilters}
                onChange={setFilter}
                onClearAll={clearAllFilters}
                getCount={getCount}
            />
            { isLoading ?
                <LoadingIndicator /> :
                <ListItemView listData={fullListData} listType={'FULL_LIST'} setListData={updateGames} refreshing={refreshing} onRefresh={onRefresh} onCompletionChange={onCompletionChange} />
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
    },
    activeButton: {
        backgroundColor: 'red',
    },
    buttonText: {
        color: '#ffffff',
        display: 'flex',
    }
});
