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

const loadBacklogFromStorage = async (screenType: BacklogScreenType): Promise<Game[] | null> => {
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

const saveBacklogToStorage = async (screenType: BacklogScreenType, items: Game[]): Promise<void> => {
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

export { loadBacklogFromStorage, saveBacklogToStorage };


