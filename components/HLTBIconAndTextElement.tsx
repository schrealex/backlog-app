import * as React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Text, View } from './Themed';

export function HLTBIconAndTextElement({ time, icon }: { time: number, icon: string }) {
    const getPlayTimeInHoursAndMinutes = (gameTime: number) => {
        const gameTimeInHours = gameTime / 3600;
        const roundedToSingleDecimal = Math.round(gameTimeInHours * 10) / 10;
        const roundedToHalfOrWholeNumbers = Math.round(roundedToSingleDecimal / 0.5) * 0.5;
        return roundedToHalfOrWholeNumbers.toString();
    };

    return (
        <View style={styles.timeToBeat}>
            <FontAwesome5 name={icon} size={14} color="gold" style={{ backgroundColor: 'rgba(243,197,0,0.34)', borderRadius: 50, padding: 5 }}/>
            <Text style={styles.timeToBeatText}>{ getPlayTimeInHoursAndMinutes(time) } hours</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    timeToBeat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        marginRight: 2,
    },
    timeToBeatText: {
        marginLeft: 4,
    },
});
