import * as React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { MultiplayerInfo } from '../types/MultiplayerInfo';

/**
 * Toont of een game samen te spelen is. Couch co-op krijgt voorrang, want dat is
 * de sterkste eigenschap: het bank-icoon impliceert al dat er co-op is.
 * Zonder multiplayerInfo tonen we niets, omdat "onbekend" iets anders is dan
 * "niet ondersteund".
 */
export function CoopElement({ multiplayerInfo }: { multiplayerInfo?: MultiplayerInfo }) {
    if (!multiplayerInfo) {
        return null;
    }

    const { hasLocalCoop, hasOnlineCoop } = multiplayerInfo;

    if (!hasLocalCoop && !hasOnlineCoop) {
        return null;
    }

    return (
        <View style={styles.coop}>
            <FontAwesome5
                name={hasLocalCoop ? 'couch' : 'users'}
                size={18}
                color="red"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    coop: {
        marginLeft: 10,
    },
});

