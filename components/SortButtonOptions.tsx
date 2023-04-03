import * as React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { SortProperty } from '../constants/SortProperty';

export default function SortButtonOptions({ sortBy, sortAscending }: any) {
    return (
        <View style={styles.buttonContent}>
            {sortBy === SortProperty.ALPHABETICAL && sortAscending ?
                <FontAwesome5 name="sort-alpha-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.ALPHABETICAL && !sortAscending ?
                <FontAwesome5 name="sort-alpha-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.HLTB && !sortAscending ?
                <FontAwesome5 name="sort-amount-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.HLTB && sortAscending ?
                <FontAwesome5 name="sort-amount-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.METACRITIC && !sortAscending ?
                <FontAwesome5 name="sort-numeric-down-alt" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            {sortBy === SortProperty.METACRITIC && sortAscending ?
                <FontAwesome5 name="sort-numeric-down" size={20} color="red" style={{ paddingRight: 5 }} /> : null}
            <Text
                style={styles.buttonText}>{sortBy === SortProperty.ALPHABETICAL ? 'Sort Alphabetical'
                : sortBy === SortProperty.HLTB ? 'Sort by HLTB'
                    : sortBy === SortProperty.METACRITIC ? 'Sort by Metacritic' : ''}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    buttonContent: {
        display: 'flex',
        flexDirection: 'row'
    },
    buttonText: {
        color: '#ffffff',
        display: 'flex',
    }
});
