import * as React from 'react';
import { StyleSheet } from 'react-native';
import { View } from './Themed';
import { FilterButton } from './FilterButton';
import { Game } from '../types/Game';
import { GameFilter, applyGameFilter } from '../constants/GameFilter';
import { SortProperty } from '../constants/SortProperty';

const buttonDefinitions: Array<{ filter: GameFilter, icon?: string, text?: string }> = [
    { filter: GameFilter.ALL, text: 'All ' },
    { filter: GameFilter.PHYSICAL, icon: 'sd-card' },
    { filter: GameFilter.DIGITAL, icon: 'cloud-download-alt' },
    { filter: GameFilter.PLAYING, icon: 'gamepad' },
    { filter: GameFilter.PAUSED, icon: 'pause' },
];

const ButtonGroup = ({ items, activeFilter, setActiveFilter, setSortAscending, setSortBy } : { items: Game[], activeFilter: GameFilter, setActiveFilter: (filter: GameFilter) => void, setSortAscending: any, setSortBy: any }) => {

    const counts = React.useMemo(() => {
        const sourceItems = (items ?? []) as Game[];
        return buttonDefinitions.reduce((accumulator, { filter }) => {
            accumulator[filter] = applyGameFilter(sourceItems, filter).length;
            return accumulator;
        }, {} as Record<string, number>);
    }, [items]);

    const selectFilter = (filter: GameFilter) => {
        setActiveFilter(filter);
        setSortAscending(true);
        setSortBy(SortProperty.ALPHABETICAL);
    };

    return (
        <View style={styles.buttonGroup}>
            {buttonDefinitions.map(({ filter, icon, text }) => (
                <FilterButton
                    key={filter}
                    filterFunction={() => selectFilter(filter)}
                    iconName={icon}
                    text={text}
                    numberOfItems={counts[filter] ?? 0}
                    isActive={activeFilter === filter}
                />
            ))}
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