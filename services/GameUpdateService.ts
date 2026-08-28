import { doc, updateDoc } from 'firebase/firestore/lite';
import { firestore } from '../firebaseConfig';

/**
 * De lijsttypes uit de UI wijzen naar verschillende Firestore-collecties.
 * De backlog is een selectie uit 'full-games-list' en wordt dus daar bijgewerkt.
 */
const collectionPathByListType: Record<string, string> = {
    BACKLOG: 'full-games-list',
    FULL_LIST: 'full-games-list',
    RETRO_BACKLOG: 'retro-backlog',
};

const getCollectionPathForListType = (listType: string): string | undefined => collectionPathByListType[listType];

/**
 * Werkt losse velden van een game bij. Geeft `false` terug wanneer de update niet
 * uitgevoerd kon worden, zodat de UI kan besluiten de wijziging terug te draaien.
 */
const updateGameFields = async (listType: string, documentId: string | undefined, fields: Record<string, unknown>): Promise<boolean> => {
    const path = getCollectionPathForListType(listType);

    if (!path || !documentId) {
        console.error({
            call: 'updateGameFields',
            message: 'Missing collection path or documentId',
            listType,
            path,
            documentId,
            fields,
            timestamp: new Date().toISOString(),
        });
        return false;
    }

    try {
        await updateDoc(doc(firestore, path, documentId), fields);
        return true;
    } catch (error) {
        console.error({ call: 'updateGameFields', error, listType, documentId, fields, timestamp: new Date().toISOString() });
        return false;
    }
};

export { getCollectionPathForListType, updateGameFields };

