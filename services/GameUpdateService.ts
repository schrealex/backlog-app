import { doc, updateDoc } from 'firebase/firestore/lite';
import { firestore } from '../firebaseConfig';
import { LIBRARY_ENTRIES_COLLECTION } from './LibraryService';

/**
 * Werkt losse velden van een libraryEntry bij. Geeft `false` terug wanneer de
 * update niet uitgevoerd kon worden, zodat de UI kan besluiten de wijziging
 * terug te draaien.
 */
const updateGameFields = async (documentId: string | undefined, fields: Record<string, unknown>): Promise<boolean> => {
    if (!documentId) {
        console.error({
            call: 'updateGameFields',
            message: 'Missing documentId',
            fields,
            timestamp: new Date().toISOString(),
        });
        return false;
    }

    try {
        await updateDoc(doc(firestore, LIBRARY_ENTRIES_COLLECTION, documentId), fields);
        return true;
    } catch (error) {
        console.error({ call: 'updateGameFields', error, documentId, fields, timestamp: new Date().toISOString() });
        return false;
    }
};

export { updateGameFields };

