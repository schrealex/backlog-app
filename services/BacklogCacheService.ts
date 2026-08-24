import AsyncStorage from '@react-native-async-storage/async-storage';
import { Game } from '../types/Game';

type BacklogScreenType = 'Backlog' | 'RetroBacklog';

type PersistedBacklog = {
    savedAt: number;
    items: Game[];
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
let storageUnavailable = false;
let hasLoggedStorageWarning = false;

const isNativeModuleMissingError = (error: unknown): boolean => {
    return error instanceof Error && error.message.includes('Native module is null');
};

const markStorageUnavailable = (error: unknown) => {
    storageUnavailable = true;
    if (!hasLoggedStorageWarning) {
        hasLoggedStorageWarning = true;
        console.warn({
            call: 'BacklogCacheService',
            message: 'AsyncStorage is unavailable in this runtime. Persistent cache has been disabled.',
            error,
            timestamp: new Date().toISOString(),
        });
    }
};

const getStorageKey = (screenType: BacklogScreenType): string => `backlog-cache:${screenType}`;

// Voorkomt dubbele AsyncStorage-reads wanneer meerdere schermen (of de warm-up) tegelijk lezen.
const pendingLoads = new Map<BacklogScreenType, Promise<Game[] | null>>();
const memoryCache = new Map<BacklogScreenType, Game[] | null>();

const readBacklogFromStorage = async (screenType: BacklogScreenType): Promise<Game[] | null> => {
    if (storageUnavailable) {
        return null;
    }

    try {
        const rawValue = await AsyncStorage.getItem(getStorageKey(screenType));
        if (!rawValue) {
            return null;
        }

        const parsedValue = JSON.parse(rawValue) as PersistedBacklog;
        if (!parsedValue?.savedAt || !Array.isArray(parsedValue.items)) {
            await AsyncStorage.removeItem(getStorageKey(screenType));
            return null;
        }

        if (Date.now() - parsedValue.savedAt > CACHE_TTL_MS) {
            await AsyncStorage.removeItem(getStorageKey(screenType));
            return null;
        }

        return parsedValue.items;
    } catch (error) {
        if (isNativeModuleMissingError(error)) {
            markStorageUnavailable(error);
            return null;
        }

        console.error({ call: 'loadBacklogFromStorage', error, screenType, timestamp: new Date().toISOString() });
        return null;
    }
};

const loadBacklogFromStorage = (screenType: BacklogScreenType): Promise<Game[] | null> => {
    if (memoryCache.has(screenType)) {
        return Promise.resolve(memoryCache.get(screenType) ?? null);
    }

    const pendingLoad = pendingLoads.get(screenType);
    if (pendingLoad) {
        return pendingLoad;
    }

    const load = readBacklogFromStorage(screenType)
        .then((items) => {
            memoryCache.set(screenType, items);
            return items;
        })
        .finally(() => {
            pendingLoads.delete(screenType);
        });

    pendingLoads.set(screenType, load);
    return load;
};

/**
 * Start het inlezen van de gecachte backlogs al tijdens de app-startup,
 * zodat het eerste scherm direct data kan tonen.
 */
const warmUpBacklogCache = (): void => {
    (['Backlog', 'RetroBacklog'] as BacklogScreenType[]).forEach((screenType) => {
        void loadBacklogFromStorage(screenType).catch(() => undefined);
    });
};

const saveBacklogToStorage = async (screenType: BacklogScreenType, items: Game[]): Promise<void> => {
    memoryCache.set(screenType, items);

    if (storageUnavailable) {
        return;
    }

    try {
        const payload: PersistedBacklog = {
            savedAt: Date.now(),
            items,
        };

        await AsyncStorage.setItem(getStorageKey(screenType), JSON.stringify(payload));
    } catch (error) {
        if (isNativeModuleMissingError(error)) {
            markStorageUnavailable(error);
            return;
        }

        console.error({ call: 'saveBacklogToStorage', error, screenType, timestamp: new Date().toISOString() });
    }
};

export { loadBacklogFromStorage, saveBacklogToStorage, warmUpBacklogCache };


