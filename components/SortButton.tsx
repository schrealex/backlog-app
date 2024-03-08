import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { SortProperty } from '../constants/SortProperty';

const sortPropertyMap = {
    [SortProperty.ALPHABETICAL]: { icon: 'sort-alpha-down', text: 'Sort Alphabetical' },
    [SortProperty.HLTB]: { icon: 'sort-amount-up', text: 'Sort by HLTB' },
};

function SortButton({ sortBy, sortAscending, setSortBy, setSortAscending }:
                    { sortBy: SortProperty, sortAscending: boolean, setSortBy: any, setSortAscending: any }) {
    const { icon, text } = sortPropertyMap[sortBy] || { icon: '', text: '' };
    const iconName = sortAscending
        ? (icon === 'sort-amount-up' ? `${icon}-alt` : icon)
        : (icon === 'sort-amount-up' ? icon : `${icon}-alt`);

    const sortPropertyCycle = {
        [SortProperty.ALPHABETICAL]: SortProperty.HLTB,
        [SortProperty.HLTB]: SortProperty.ALPHABETICAL,
    };

    const toggleSort = () => {
        if (sortAscending) {
            setSortAscending(false);
        } else {
            setSortBy(sortPropertyCycle[sortBy]);
            setSortAscending(true);
        }
    };

    return (
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={toggleSort}>
            <View style={styles.buttonContent}>
                {icon && <FontAwesome5 name={iconName} size={20} color="red" style={{ paddingRight: 5 }} />}
                <Text style={styles.buttonText}>{text}</Text>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
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

export default SortButton;