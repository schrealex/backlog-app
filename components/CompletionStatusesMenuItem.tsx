import * as React from 'react';
import { StyleSheet, TouchableHighlight } from 'react-native';
import { Text } from './Themed';
import { useState } from 'react';
import { updateGameFields } from '../services/GameUpdateService';

export function CompletionStatusesMenuItem({ type, item, completionStatus, onClick, onCompletionChange }: { type: string, item: any, completionStatus: string, onClick: any, onCompletionChange?: (gameId: number, completion: string) => void }) {

    const [ isPressed, setIsPressed ] = useState(false);


    const changeStatus = (status: string): void => {
        void updateGameFields(type, item.documentId, { completion: status });

        if (onCompletionChange) {
            // De lijst wordt via de state bijgewerkt; dat sluit ook het menu.
            onCompletionChange(item.id, status);
            return;
        }

        item.completion = status;
        onClick();
    };

    const touchProperties = {
        activeOpacity: 1,
        underlayColor: 'rgba(0, 0, 0, 0)',
        style: isPressed ? styles.completionStatusesMenuItemPress : styles.completionStatusesMenuItem,
        onHideUnderlay: () => setIsPressed(false),
        onShowUnderlay: () => setIsPressed(true),
        onPress: () => changeStatus(completionStatus),
    };

    return (
        <TouchableHighlight {...touchProperties}>
            <Text style={styles.completionStatusesMenuItemText}>{completionStatus}</Text>
        </TouchableHighlight>
    );
}

const styles = StyleSheet.create({
    completionStatusesMenuItem: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        margin: 4,
        fontSize: 15,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    completionStatusesMenuItemPress: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        margin: 3,
        fontSize: 15,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 1,
        borderColor: 'red',
    },
    completionStatusesMenuItemText: {
        fontSize: 15,
        fontWeight: 'bold',
    }
});
