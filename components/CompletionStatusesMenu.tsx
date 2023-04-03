import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import { Game } from '../types/Game';
import { CompletionStatusesMenuItem } from './CompletionStatusesMenuItem';
import { Completion } from '../constants/Completion';

export function CompletionStatusesMenu({ type, item, toggleMenu }: { type: string, item: Game, toggleMenu: any }) {
    return (
        <View style={styles.completionStatusesMenu}>
            <Text style={styles.completionStatusesMenuTitle}>Change completion status</Text>
            {item.completion !== Completion.NOT_STARTED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={Completion.NOT_STARTED} /> : null}
            {item.completion !== Completion.UNFINISHED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={Completion.UNFINISHED} /> : null}
            {item.completion !== Completion.PAUSED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={Completion.PAUSED} /> : null}
            {item.completion !== Completion.DROPPED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={Completion.DROPPED} /> : null}
            {item.completion !== Completion.BEATEN ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={Completion.BEATEN} /> : null}
            {item.completion !== Completion.COMPLETED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={Completion.COMPLETED} /> : null}
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
        fontSize: 18,
        fontWeight: 'bold',
        padding: 6,
        borderBottomWidth: 2,
        borderStyle: 'solid',
        borderColor: '#ffffff',
    }
});
