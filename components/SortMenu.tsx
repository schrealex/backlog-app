import * as React from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { SortProperty } from '../constants/SortProperty';

type SortPropertyMeta = { icon: string, label: string };

// Iconen die de sorteersleutel beschrijven; de richting wordt bewust apart getoond,
// zodat "waarop" en "welke kant op" niet in één icoon samengeperst worden.
const sortPropertyMeta: Record<SortProperty, SortPropertyMeta> = {
    [SortProperty.ALPHABETICAL]: { icon: 'font', label: 'Alphabetical' },
    [SortProperty.HLTB]: { icon: 'hourglass-half', label: 'HLTB' },
};

const DEFAULT_SORT_PROPERTIES = [SortProperty.ALPHABETICAL, SortProperty.HLTB];

export function SortMenu({ sortBy, sortAscending, setSortBy, setSortAscending, sortProperties = DEFAULT_SORT_PROPERTIES }: {
    sortBy: SortProperty,
    sortAscending: boolean,
    setSortBy: (sortProperty: SortProperty) => void,
    setSortAscending: (ascending: boolean) => void,
    sortProperties?: SortProperty[],
}) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const activeMeta = sortPropertyMeta[sortBy] ?? sortPropertyMeta[SortProperty.ALPHABETICAL];
    const hasMultipleOptions = sortProperties.length > 1;

    const openMenu = React.useCallback(() => setIsMenuOpen(true), []);
    const closeMenu = React.useCallback(() => setIsMenuOpen(false), []);

    const selectSortProperty = React.useCallback((sortProperty: SortProperty) => {
        setSortBy(sortProperty);
        setIsMenuOpen(false);
    }, [setSortBy]);

    const toggleDirection = React.useCallback(() => {
        setSortAscending(!sortAscending);
    }, [setSortAscending, sortAscending]);

    // 'A-Z' zegt bij een alfabetische sortering meer dan een kale pijl.
    const directionLabel = sortBy === SortProperty.ALPHABETICAL
        ? (sortAscending ? 'A-Z' : 'Z-A')
        : (sortAscending ? 'Short' : 'Long');

    return (
        <View style={styles.container}>
            <Pressable
                style={({ pressed }) => [styles.trigger, { opacity: pressed ? 0.4 : 1 }]}
                onPress={openMenu}
                disabled={!hasMultipleOptions}
                accessibilityRole="button"
                accessibilityLabel={`Sort by ${activeMeta.label}`}
            >
                <FontAwesome5 name={activeMeta.icon} size={18} color="red" style={styles.triggerIcon} />
                <Text style={styles.triggerText}>{activeMeta.label}</Text>
                {hasMultipleOptions ? (
                    <FontAwesome5 name="caret-down" size={18} color="red" style={styles.caret} />
                ) : null}
            </Pressable>

            <Pressable
                style={({ pressed }) => [styles.directionButton, { opacity: pressed ? 0.4 : 1 }]}
                onPress={toggleDirection}
                accessibilityRole="button"
                accessibilityLabel={sortAscending ? 'Sort descending' : 'Sort ascending'}
            >
                <FontAwesome5
                    name={sortAscending ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color="red"
                    style={styles.triggerIcon}
                />
                <Text style={styles.triggerText}>{directionLabel}</Text>
            </Pressable>

            <Modal visible={isMenuOpen} transparent animationType="fade" onRequestClose={closeMenu}>
                {/* Tik naast het menu sluit het; de binnenste Pressable vangt tikken op het menu zelf op. */}
                <Pressable style={styles.backdrop} onPress={closeMenu}>
                    <Pressable style={styles.menu} onPress={() => undefined}>
                        <Text style={styles.menuTitle}>Sort by</Text>
                        {sortProperties.map((sortProperty) => {
                            const { icon, label } = sortPropertyMeta[sortProperty];
                            const isActive = sortProperty === sortBy;

                            return (
                                <Pressable
                                    key={sortProperty}
                                    style={({ pressed }) => [
                                        styles.menuItem,
                                        isActive ? styles.menuItemActive : null,
                                        { opacity: pressed ? 0.4 : 1 },
                                    ]}
                                    onPress={() => selectSortProperty(sortProperty)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isActive }}
                                >
                                    <FontAwesome5
                                        name={icon}
                                        size={18}
                                        color={isActive ? 'black' : 'red'}
                                        style={styles.menuItemIcon}
                                    />
                                    <Text style={styles.menuItemText}>{label}</Text>
                                    {isActive ? <FontAwesome5 name="check" size={16} color="black" /> : null}
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red',
        marginTop: 8,
        marginBottom: 4,
        marginHorizontal: 2,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    directionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red',
        marginTop: 8,
        marginBottom: 4,
        marginHorizontal: 2,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    triggerIcon: {
        paddingRight: 6,
    },
    caret: {
        paddingLeft: 8,
    },
    triggerText: {
        color: '#ffffff',
    },
    backdrop: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    menu: {
        minWidth: 220,
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red',
        backgroundColor: '#000000',
        paddingVertical: 8,
    },
    menuTitle: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
        paddingHorizontal: 12,
        paddingBottom: 8,
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
        width: 24,
    },
    menuItemText: {
        color: '#ffffff',
        flex: 1,
    },
});

export default SortMenu;

