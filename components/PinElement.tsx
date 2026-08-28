import * as React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import {
    GAME_IMAGE_HEIGHT,
    GAME_IMAGE_PADDING_HORIZONTAL,
    LIST_ITEM_PADDING,
    PIN_ICON_PADDING,
    PIN_ICON_SIZE,
    PIN_IMAGE_GAP,
} from '../constants/Constants';

/**
 * Ster om een game bovenaan de backlog te pinnen.
 * Blijft aantikbaar wanneer het maximum bereikt is, zodat de gebruiker
 * feedback krijgt in plaats van een knop die niets doet.
 */
export function PinElement({ isPinned, isLimitReached, onPress }: {
    isPinned: boolean,
    isLimitReached: boolean,
    onPress: () => void,
}) {
    const isDimmed = !isPinned && isLimitReached;

    return (
        <Pressable
            style={({ pressed }) => [styles.pinButton, { opacity: pressed ? 0.4 : isDimmed ? 0.35 : 1 }]}
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={isPinned ? 'Unpin game' : 'Pin game to top'}
        >
            <FontAwesome5
                name="star"
                solid={isPinned}
                size={PIN_ICON_SIZE}
                color={isPinned ? 'gold' : '#ffffff'}
            />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pinButton: {
        position: 'absolute',
        // Beperk de knop tot de hoogte van de game-afbeelding (die direct onder de
        // padding van het lijstitem begint) en centreer de ster daarbinnen.
        top: LIST_ITEM_PADDING,
        height: GAME_IMAGE_HEIGHT,
        // De linkerrand van de afbeelding ligt op GAME_IMAGE_PADDING_HORIZONTAL;
        // trek de knopbreedte en de gewenste tussenruimte daarvan af.
        left: GAME_IMAGE_PADDING_HORIZONTAL - PIN_IMAGE_GAP - (PIN_ICON_SIZE + 2 * PIN_ICON_PADDING),
        justifyContent: 'center',
        alignItems: 'flex-start',
        zIndex: 20,
        paddingHorizontal: PIN_ICON_PADDING,
    },
});

