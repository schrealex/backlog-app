import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import { Game } from '../types/Game';
import { CompletionStatusesMenuItem } from './CompletionStatusesMenuItem';
import { completion } from '../constants/FULL_GAMES_LIST';

export function CompletionStatusesMenu({ type, item, toggleMenu }: { type: string, item: Game, toggleMenu: any }) {
    return (
        <View style={styles.completionStatusesMenu}>
            <Text style={styles.completionStatusesMenuTitle}>Change completion status</Text>
            {item.completion !== completion.NOT_STARTED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={completion.NOT_STARTED} /> : null}
            {item.completion !== completion.UNFINISHED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={completion.UNFINISHED} /> : null}
            {item.completion !== completion.PAUSED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={completion.PAUSED} /> : null}
            {item.completion !== completion.DROPPED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={completion.DROPPED} /> : null}
            {item.completion !== completion.BEATEN ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={completion.BEATEN} /> : null}
            {item.completion !== completion.COMPLETED ?
                <CompletionStatusesMenuItem type={type} item={item} toggleMenu={toggleMenu} completionStatus={completion.COMPLETED} /> : null}
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
