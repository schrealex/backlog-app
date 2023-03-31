import * as React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore/lite';
import { firestore } from '../firebaseConfig';
import { Text } from './Themed';

export function CompletionStatusesMenuItem({
                                               type,
                                               item,
                                               completionStatus,
                                               toggleMenu
                                           }: { type: string, item: any, completionStatus: string, toggleMenu: any }) {

    const changeStatus = (status: string): void => {
        item.completion = status;

        updateFirebaseDocumentWithStatus(status);
        toggleMenu();
    };

    const updateFirebaseDocumentWithStatus = async (status: string) => {
        const path = type === 'BACKLOG' ? 'full-games-list' : type === 'RETRO_BACKLOG' ? 'retro-backlog' : '';
        const documentReference = doc(firestore, path, item.documentId);
        updateDoc(documentReference, {
            completion: status
        })
            .then()
            .catch(error => {
                console.log(error);
            });
    };

    return (
        <Pressable style={styles.completionStatusesMenuItem} onPress={() => changeStatus(completionStatus)}>
            <Text style={styles.completionStatusesMenuItemText}>{completionStatus}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    completionStatusesMenuItem: {
        margin: 8,
        fontSize: 15,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0, 0, 0, 0)',
    },
    completionStatusesMenuItemText: {
        fontSize: 17,
        fontWeight: 'bold',
    }
});
