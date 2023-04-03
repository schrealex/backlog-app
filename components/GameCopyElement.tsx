import * as React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { GameCopy } from '../constants/GameCopy';

export function GameCopyElement({ gameCopyType }: { gameCopyType: Array<string> }) {
    return (
        <View style={styles.gameCopy}>
            {gameCopyType.includes(GameCopy.PHYSICAL) && gameCopyType.includes(GameCopy.DIGITAL) ?
                <View style={styles.gameCopyBoth}>
                    <FontAwesome5 name="compact-disc" size={20} color="red" />
                    <FontAwesome5 name="hdd" size={20} color="red" />
                </View>
                : gameCopyType.includes(GameCopy.PHYSICAL) ?
                    <FontAwesome5 name="compact-disc" size={20} color="red" /> :
                    <FontAwesome5 name="hdd" size={20} color="red" />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    gameCopy: {
        marginLeft: 14,
    },
    gameCopyBoth: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 55,
    }
});
