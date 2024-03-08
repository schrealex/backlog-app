import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

export function FilterButton({ filterFunction, iconName, text, numberOfItems }: { filterFunction: any, iconName?: any, text?: any, numberOfItems: number }) {
    return (
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.4 : 1 }, styles.button]} onPress={filterFunction}>
            {iconName && <FontAwesome5 name={iconName} size={20} color="red" style={{ paddingRight: 5 }} />}
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
    buttonText: {
        color: '#ffffff',
        display: 'flex',
    }
});
