import * as React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Text, View } from './Themed';
import { Game } from '../types/Game';
import { Completion } from '../constants/Completion';

const TRACKED_COMPLETION_STATUSES: string[] = [Completion.PLAYING, Completion.PAUSED, Completion.BEATEN, Completion.COMPLETED];

const formatLastPlayed = (lastPlayedUtc: number): string => (
    new Date(lastPlayedUtc * 1000).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
);

export function ExophaseElement({ item }: { item: Game }) {
    const { exophaseInfo, completion } = item;

    if (!exophaseInfo || !TRACKED_COMPLETION_STATUSES.includes(completion)) {
        return null;
    }

    const { playtimeHours, playtimeMinutes, lastPlayedUtc } = exophaseInfo;
    if (!playtimeHours && !playtimeMinutes) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.playtime}>
                <View style={styles.playtimeIcon}>
                    <FontAwesome5 name="clock" size={20} color="red" />
                    <FontAwesome5 name="gamepad" size={16} color="red" style={styles.playtimeIconBadge} />
                </View>
                <Text style={styles.playtimeTimeText}>{playtimeHours}h {playtimeMinutes}m</Text>
            </View>
            { lastPlayedUtc > 0 &&
                <View style={styles.playtime}>
                    <FontAwesome5 name="calendar-alt" size={18} color="red" />
                    <Text style={styles.playtimeText}>{formatLastPlayed(lastPlayedUtc)}</Text>
                </View>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    playtime: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        marginRight: 2,
        marginTop: 2,
    },
    playtimeText: {
        marginLeft: 4,
    },
    playtimeTimeText: {
        marginLeft: 10,
    },
    playtimeIcon: {
        width: 34,
        height: 34,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playtimeIconBadge: {
        position: 'absolute',
        right: -8,
        bottom: -8,
    },
});
