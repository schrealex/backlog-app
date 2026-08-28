import * as React from 'react';
import { StyleSheet } from 'react-native';
import { View } from './Themed';
import { FilterButton } from './FilterButton';
import { Game } from '../types/Game';
import { ActiveFilters, FilterGroup, GameFilter, applyGameFilters, filterMetadata } from '../constants/GameFilter';

// Bezit en status zijn losse groepen, dus 'Physical' en 'Playing' zijn combineerbaar.
const groupedFilters: Array<{ group: FilterGroup, filter: GameFilter }> = [
    { group: 'copy', filter: GameFilter.PHYSICAL },
    { group: 'copy', filter: GameFilter.DIGITAL },
    { group: 'completion', filter: GameFilter.PLAYING },
    { group: 'completion', filter: GameFilter.PAUSED },
];

const ButtonGroup = ({ items, activeFilters, setFilter, clearAllFilters }: {
    items: Game[],
    activeFilters: ActiveFilters,
    setFilter: (group: FilterGroup, filter?: GameFilter) => void,
    clearAllFilters: () => void,
}) => {

    const sourceItems = React.useMemo(() => (items ?? []) as Game[], [items]);

    // Contextuele telling: hoeveel games hou je over als je dit filter toevoegt?
    const getCount = React.useCallback((group: FilterGroup, filter: GameFilter) => (
        applyGameFilters(sourceItems, { ...activeFilters, [group]: filter }).length
    ), [sourceItems, activeFilters]);

    const hasActiveFilters = Object.keys(activeFilters).length > 0;

    return (
        <View style={styles.buttonGroup}>
            <FilterButton
                filterFunction={clearAllFilters}
                text={filterMetadata[GameFilter.ALL].label + ' '}
                numberOfItems={sourceItems.length}
                isActive={!hasActiveFilters}
            />
            {groupedFilters.map(({ group, filter }) => {
                const isActive = activeFilters[group] === filter;

                return (
                    <FilterButton
                        key={filter}
                        // Nogmaals tikken op het actieve filter wist het.
                        filterFunction={() => setFilter(group, isActive ? undefined : filter)}
                        iconName={filterMetadata[filter].icon}
                        numberOfItems={getCount(group, filter)}
                        isActive={isActive}
                    />
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    buttonGroup: {
        display: 'flex',
        flexDirection: 'row',
    },
});

export default ButtonGroup;