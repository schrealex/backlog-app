import * as React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { Completion } from '../constants/Completion';

export function CompletionElement({ completionStatus }: { completionStatus: string }) {
    return (
        <View style={styles.completion}>
            {completionStatus === Completion.COMPLETED ? <FontAwesome5 name="trophy" size={20} color="red" /> : null}
            {completionStatus === Completion.BEATEN ? <FontAwesome5 name="fist-raised" size={20} color="red" /> : null}
            {completionStatus == Completion.PLAYING ? <FontAwesome5 name="gamepad" size={20} color="red" /> : null}
            {completionStatus === Completion.PAUSED ? <FontAwesome5 name="pause" size={20} color="red" /> : null}
            {completionStatus === Completion.NOT_STARTED ? <FontAwesome5 name="stop" size={20} color="red" /> : null}
            {completionStatus === Completion.DROPPED ? <FontAwesome5 name="times" size={20} color="red" /> : null}
            {completionStatus === Completion.CONTINUOUS ? <FontAwesome5 name="recycle" size={20} color="red" /> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    completion: {
        marginRight: 14,
    }
});
