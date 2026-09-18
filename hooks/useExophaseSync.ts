import { useEffect } from 'react';
import { where } from 'firebase/firestore/lite';
import { Completion } from '../constants/Completion';
import { getLibraryEntries } from '../services/LibraryService';
import { updateGameFields } from '../services/GameUpdateService';
import { getExophaseInformation } from '../services/ExophaseService';
import { ExophaseInfo } from '../types/ExophaseInfo';

// Alleen games die je daadwerkelijk (nog) speelt of uitgespeeld hebt tonen een
// speeltijd; voor de rest heeft de Exophase-koppeling geen toegevoegde waarde.
const TRACKED_COMPLETION_STATUSES = [Completion.PLAYING, Completion.PAUSED, Completion.BEATEN, Completion.COMPLETED];

const hasChangedInfo = (current: ExophaseInfo | undefined, next: ExophaseInfo): boolean => (
    !current
    || current.playtimeHours !== next.playtimeHours
    || current.playtimeMinutes !== next.playtimeMinutes
    || current.completionPercent !== next.completionPercent
    || current.lastPlayedUtc !== next.lastPlayedUtc
);

// Synchroniseert bij het openen van de app eenmalig de Exophase-speeltijd naar de
// libraryEntries van games die nu Playing/Paused/Beaten/Completed zijn. Draait op
// de achtergrond en blokkeert de UI niet; schermen lezen de bijgewerkte waarde bij
// hun eigen (volgende) Firestore-fetch.
export default function useExophaseSync() {
    useEffect(() => {
        let isCancelled = false;

        const syncExophasePlaytime = async () => {
            try {
                const entries = await getLibraryEntries(where('completion', 'in', TRACKED_COMPLETION_STATUSES));

                await Promise.all(entries.map(async (entry) => {
                    if (isCancelled) {
                        return;
                    }

                    const exophaseInfo = await getExophaseInformation(entry.title);
                    if (!exophaseInfo || isCancelled || !hasChangedInfo(entry.exophaseInfo, exophaseInfo)) {
                        return;
                    }

                    await updateGameFields(entry.documentId, { exophaseInfo });
                }));
            } catch (error) {
                console.error({ call: 'useExophaseSync', error, timestamp: new Date().toISOString() });
            }
        };

        void syncExophasePlaytime();

        return () => {
            isCancelled = true;
        };
    }, []);
}
