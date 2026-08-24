import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import { Game } from '../types/Game';
import { CompletionStatusesMenuItem } from './CompletionStatusesMenuItem';
import { Completion } from '../constants/Completion';

export function CompletionStatusesMenu({ type, item, onClick, onCompletionChange }: { type: string, item: Game, onClick: any, onCompletionChange?: (gameId: number, completion: string) => void }) {
    const completionStatuses = [
        Completion.NOT_STARTED,
        Completion.PLAYING,
        Completion.PAUSED,
        Completion.DROPPED,
        Completion.BEATEN,
        Completion.COMPLETED,
    ];

    return (
        <View style={styles.completionStatusesMenu}>
            <Text style={styles.completionStatusesMenuTitle}>Change completion status</Text>
            {completionStatuses
                .filter((completionStatus) => item.completion !== completionStatus)
                .map((completionStatus) => (
                    <CompletionStatusesMenuItem
                        key={completionStatus}
                        type={type}
                        item={item}
                        onClick={onClick}
                        onCompletionChange={onCompletionChange}
                        completionStatus={completionStatus}
                    />
                ))}
        </View>
    );
}

const styles = StyleSheet.create({
    completionStatusesMenu: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    completionStatusesMenuTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        padding: 6,
        borderBottomWidth: 2,
        borderStyle: 'solid',
        borderColor: '#ffffff',
    }
});
