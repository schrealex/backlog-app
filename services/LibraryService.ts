import { QueryConstraint, collection, getDocs, query } from 'firebase/firestore/lite';
import { firestore } from '../firebaseConfig';
import { Game } from '../types/Game';

const GAMES_COLLECTION = 'games';
const LIBRARY_ENTRIES_COLLECTION = 'libraryEntries';

// De catalogus is klein genoeg (persoonlijke backlog) om in één keer volledig
// op te halen en client-side te joinen op gameId, i.p.v. per entry een read te doen.
const getGamesCatalogById = async (): Promise<Map<number, Partial<Game>>> => {
    const snapshot = await getDocs(collection(firestore, GAMES_COLLECTION));
    const catalogById = new Map<number, Partial<Game>>();
    snapshot.docs.forEach((gameDoc) => catalogById.set(Number(gameDoc.id), gameDoc.data() as Partial<Game>));
    return catalogById;
};

// Haalt libraryEntries op die aan de gegeven constraints voldoen en joint ze met
// hun games-catalogusdocument, zodat het resultaat dezelfde vorm heeft als de
// oude, samengevoegde Firestore-documenten.
const getLibraryEntries = async (...constraints: QueryConstraint[]): Promise<Game[]> => {
    const entriesQuery = query(collection(firestore, LIBRARY_ENTRIES_COLLECTION), ...constraints);
    const [entriesSnapshot, catalogById] = await Promise.all([
        getDocs(entriesQuery),
        getGamesCatalogById(),
    ]);

    return entriesSnapshot.docs.map((entryDoc) => {
        const entry = entryDoc.data() as Partial<Game> & { gameId: number };
        const catalog = catalogById.get(Number(entry.gameId)) ?? {};
        return {
            ...catalog,
            ...entry,
            documentId: entryDoc.id,
            isMenuOpen: false,
        } as Game;
    });
};

export { getLibraryEntries, LIBRARY_ENTRIES_COLLECTION };
