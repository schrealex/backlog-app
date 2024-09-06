import * as React from 'react';
import { StyleSheet, TouchableHighlight } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore/lite';
import { firestore } from '../firebaseConfig';
import { Text } from './Themed';
import { useState } from 'react';

export function CompletionStatusesMenuItem({ type, item, completionStatus, onClick }: { type: string, item: any, completionStatus: string, onClick: any }) {

    const [ isPressed, setIsPressed ] = useState(false);


    const changeStatus = (status: string): void => {
        item.completion = status;

        void updateFirebaseDocumentWithStatus(status);
        onClick();
    };

    const updateFirebaseDocumentWithStatus = async (status: string) => {
        const path = (type === 'BACKLOG' || type === 'FULL_LIST') ? 'full-games-list' : type === 'RETRO_BACKLOG' ? 'retro-backlog' : '';
        const documentReference = doc(firestore, path, item.documentId);
        updateDoc(documentReference, {
            completion: status
        })
        .then()
        .catch(error => {
            console.error({ call: 'updateFirebaseDocumentWithStatus', error, timestamp: new Date().toISOString() });
        });
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
