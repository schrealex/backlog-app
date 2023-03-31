import * as React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { completion } from '../constants/FULL_GAMES_LIST';

export function CompletionElement({ completionStatus }: { completionStatus: string }) {
    return (
        <View style={styles.completion}>
            {completionStatus === completion.COMPLETED ? <FontAwesome5 name="trophy" size={20} color="red" /> : null}
            {completionStatus === completion.BEATEN ? <FontAwesome5 name="fist-raised" size={20} color="red" /> : null}
            {completionStatus == completion.UNFINISHED ? <FontAwesome5 name="gamepad" size={20} color="red" /> : null}
            {completionStatus === completion.PAUSED ? <FontAwesome5 name="pause" size={20} color="red" /> : null}
            {completionStatus === completion.NOT_STARTED ? <FontAwesome5 name="stop" size={20} color="red" /> : null}
            {completionStatus === completion.DROPPED ? <FontAwesome5 name="times" size={20} color="red" /> : null}
            {completionStatus === completion.CONTINUOUS ? <FontAwesome5 name="recycle" size={20} color="red" /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    completion: {
        marginRight: 14,
    }
});
