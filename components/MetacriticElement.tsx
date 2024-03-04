import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from './Themed';
import { MetacriticInfo } from '../types/MetacriticInfo';

export function MetacriticElement({ metacriticInfo }: { metacriticInfo: MetacriticInfo }) {

    const getMetacriticScoreColor = (score: number): { backgroundColor: string } => {
        if (score >= 75) {
            return { backgroundColor: '#6c3' };
        } else if (score >= 40) {
            return { backgroundColor: '#fc3' };
        } else if (score < 40) {
            return { backgroundColor: '#f00' };
        } else {
            return { backgroundColor: '#cccccc' };
        }
    };

    return (
        <Text style={[styles.metacritic, getMetacriticScoreColor(Number(metacriticInfo.metacriticScore))]}>
            { metacriticInfo.metacriticScore }
        </Text>
    );
}

const styles = StyleSheet.create({
    metacritic: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        marginLeft: 5,
        fontSize: 17,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'rgb(102, 163, 41)',
        height: 34,
        width: 34,
        lineHeight: 34,
        borderRadius: 6,
    }
});
