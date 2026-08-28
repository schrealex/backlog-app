import * as React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { ActiveFilters, FilterGroup, GameFilter, filterMetadata } from '../constants/GameFilter';

export type FilterMenuGroup = {
    group: FilterGroup,
    title: string,
    filters: GameFilter[],
};

/**
 * Filtermenu voor de minder gebruikte filtergroepen. De actieve keuzes blijven
 * zichtbaar als chips, zodat je zonder het menu te openen ziet waarop je filtert.
 */
export function FilterMenu({ groups, activeFilters, onChange, onClearAll, getCount }: {
    groups: FilterMenuGroup[],
    activeFilters: ActiveFilters,
    onChange: (group: FilterGroup, filter?: GameFilter) => void,
    onClearAll: () => void,
    getCount: (group: FilterGroup, filter: GameFilter) => number,
}) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const activeChips = groups
        .map(({ group }) => ({ group, filter: activeFilters[group] }))
        .filter((chip): chip is { group: FilterGroup, filter: GameFilter } => Boolean(chip.filter));

    const openMenu = React.useCallback(() => setIsMenuOpen(true), []);
    const closeMenu = React.useCallback(() => setIsMenuOpen(false), []);

    // Nogmaals op het actieve filter tikken wist het; dat scheelt een aparte knop per rij.
    const toggleFilter = React.useCallback((group: FilterGroup, filter: GameFilter) => {
        onChange(group, activeFilters[group] === filter ? undefined : filter);
    }, [activeFilters, onChange]);

    return (
        <View style={styles.container}>
            <View style={styles.triggerRow}>
                <Pressable
                    style={({ pressed }) => [styles.trigger, { opacity: pressed ? 0.4 : 1 }]}
                    onPress={openMenu}
                    accessibilityRole="button"
                    accessibilityLabel="Open filters"
                >
                    <FontAwesome5 name="filter" size={16} color="red" style={styles.triggerIcon} />
                    <Text style={styles.triggerText}>Filters</Text>
                    {activeChips.length ? <Text style={styles.badge}>[{activeChips.length}]</Text> : null}
                </Pressable>

                {activeChips.map(({ group, filter }) => {
                    const { icon, label } = filterMetadata[filter];

                    return (
                        <Pressable
                            key={group}
                            style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.4 : 1 }]}
                            onPress={() => onChange(group, undefined)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove filter ${label}`}
                        >
                            {icon ? <FontAwesome5 name={icon} size={14} color="black" style={styles.chipIcon} /> : null}
                            <Text style={styles.chipText}>{label}</Text>
                            <FontAwesome5 name="times" size={14} color="black" style={styles.chipClose} />
                        </Pressable>
                    );
                })}
            </View>

            <Modal visible={isMenuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
                <Pressable style={styles.backdrop} onPress={closeMenu}>
                    <Pressable style={styles.menu} onPress={() => undefined}>
                        {groups.map(({ group, title, filters }) => (
                            <View key={group} style={styles.section}>
                                <Text style={styles.sectionTitle}>{title}</Text>
                                {filters.map((filter) => {
                                    const { icon, label } = filterMetadata[filter];
                                    const isActive = activeFilters[group] === filter;
                                    const count = getCount(group, filter);

                                    return (
                                        <Pressable
                                            key={filter}
                                            style={({ pressed }) => [
                                                styles.menuItem,
                                                isActive ? styles.menuItemActive : null,
                                                { opacity: pressed ? 0.4 : 1 },
                                            ]}
                                            onPress={() => toggleFilter(group, filter)}
                                            accessibilityRole="button"
                                            accessibilityState={{ selected: isActive }}
                                        >
                                            {icon ? (
                                                <FontAwesome5
                                                    name={icon}
                                                    size={18}
                                                    color={isActive ? 'black' : 'red'}
                                                    style={styles.menuItemIcon}
                                                />
                                            ) : null}
                                            <Text style={styles.menuItemText}>{label}</Text>
                                            <Text style={styles.menuItemCount}>[{count}]</Text>
                                        </Pressable>
                                    );
                                })}
                            </View>
                        ))}

                        <Pressable
                            style={({ pressed }) => [styles.clearButton, { opacity: pressed ? 0.4 : 1 }]}
                            onPress={onClearAll}
                            accessibilityRole="button"
                        >
                            <Text style={styles.clearButtonText}>Clear all filters</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    triggerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red',
        marginVertical: 4,
        marginHorizontal: 2,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    triggerIcon: {
        paddingRight: 6,
    },
    triggerText: {
        color: '#ffffff',
    },
    badge: {
        color: '#ffffff',
        paddingLeft: 4,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'red',
        marginVertical: 4,
        marginHorizontal: 2,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    chipIcon: {
        paddingRight: 6,
    },
    chipText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    chipClose: {
        paddingLeft: 8,
    },
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    menu: {
        minWidth: 260,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red',
        backgroundColor: '#000000',
        paddingVertical: 8,
    },
    section: {
        paddingBottom: 8,
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    sectionTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    menuItemActive: {
        backgroundColor: 'red',
    },
    menuItemIcon: {
        width: 26,
    },
    menuItemText: {
        color: '#ffffff',
        flex: 1,
    },
    menuItemCount: {
        color: '#ffffff',
        paddingLeft: 8,
    },
    clearButton: {
        borderTopWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red',
        paddingVertical: 12,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#ffffff',
    },
});

export default FilterMenu;

