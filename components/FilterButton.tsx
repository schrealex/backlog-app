import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export function FilterButton({ filterFunction, iconName, text, numberOfItems, isActive }: { filterFunction: any, iconName?: any, text?: any, numberOfItems: number, isActive?: boolean }) {
    return (
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button, isActive ? styles.activeButton : null]} onPress={filterFunction}>
            {iconName && (
                <FontAwesome5
                    name={iconName}
                    size={20}
                    // Bij een actieve (volledig rode) knop is een zwart icoon beter leesbaar.
                    color={isActive ? 'black' : 'red'}
                    style={{ paddingRight: 5 }}
                />
            )}
            <Text style={styles.buttonText}>{text}[{numberOfItems}]</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: 'red',
        marginTop: 8,
        marginBottom: 4,
        marginRight: 2,
        marginLeft: 2,
        padding: 8,
    },
    activeButton: {
        backgroundColor: 'red',
    },
    buttonText: {
        color: '#ffffff',
        display: 'flex',
    }
});
