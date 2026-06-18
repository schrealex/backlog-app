import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { collection, getDocs } from 'firebase/firestore/lite';
import { View } from '../components/Themed';
import { Game } from '../types/Game';
import { RootTabScreenProps } from '../types';
import { SortProperty } from '../constants/SortProperty';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ListItemView } from '../components/ListItemView';
import ButtonGroup from '../components/ButtonGroup';
import SortButton from '../components/SortButton';
import { GAME_INFORMATION_BASE_URL } from '../constants/Constants';
import { sortAlphabetical, sortByHLTB } from '../utilities/Utilities';
import { firestore } from '../firebaseConfig';
import { loadBacklogFromStorage, saveBacklogToStorage } from '../services/BacklogCacheService';

const backlogCache: Partial<Record<'Backlog' | 'RetroBacklog', Game[]>> = {};

const collectionNameByScreenType: Record<'Backlog' | 'RetroBacklog', 'backlog' | 'retro-backlog'> = {
    Backlog: 'backlog',
    RetroBacklog: 'retro-backlog',
};

export default function BaseBacklogScreen({ screenType }: RootTabScreenProps<'Backlog' | 'RetroBacklog'> & { screenType: 'Backlog' | 'RetroBacklog' }) {

    const [isLoading, setIsLoading] = useState(true);
    const [backlogData, setBacklogData] = useState<Game[]>([]);
    const [fullBacklog, setFullBacklog] = useState<Game[]>([]);
    const [sortAscending, setSortAscending] = useState(true);
    const [sortBy, setSortBy] = useState(SortProperty.ALPHABETICAL);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const normalizeBacklogDataForScreen = (games: Game[]) => {
        if (screenType === 'Backlog') {
            return games.filter((game: Game) => game.completion === 'Playing');
        }

        return games;
    };

    const setScreenData = (games: Game[], shouldPersist = true) => {
        setFullBacklog(games);
        setBacklogData(normalizeBacklogDataForScreen(games));
        setIsLoading(false);

        if (shouldPersist) {
            void saveBacklogToStorage(screenType, games);
        }
    };

    const getBacklogCoreData = async (): Promise<Game[]> => {
        const backlogCollection = collection(firestore, collectionNameByScreenType[screenType]);
        const snapshot = await getDocs(backlogCollection);

        return snapshot.docs.map((doc) => {
            const data = doc.data() as Partial<Game>;
            return {
                ...data,
                isMenuOpen: false,
            } as Game;
        });
    };

    const getBacklog = async (waitForHydration = false) => {
        setError(null);

        const fullBacklogPromise = getFullBacklogWithInformation()
            .then((backlogWithAdditionalInformation: Game[]) => {
                backlogCache[screenType] = backlogWithAdditionalInformation;
                setScreenData(backlogWithAdditionalInformation);
                setError(null);
            })
            .catch(() => {
                if (!backlogCache[screenType]?.length) {
                    setError('An error occurred while fetching the backlog');
                    setIsLoading(false);
                }
            });

        try {
            const coreBacklog = await getBacklogCoreData();
            if (coreBacklog.length) {
                backlogCache[screenType] = coreBacklog;
                setScreenData(coreBacklog);

                if (!waitForHydration) {
                    return;
                }
            }
        } catch (error) {
            console.error({ call: 'getBacklogCoreData', error, screenType, timestamp: new Date().toISOString() });
        }

        await fullBacklogPromise;
    };

    const getFullBacklogWithInformation = async () => {
        const url = `${GAME_INFORMATION_BASE_URL}game-information?type=${screenType}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error({ call: 'getFullBacklogWithInformation response not OK', response, error, url, timestamp: new Date().toISOString() });
                throw new Error('Response returned with was not ok.');
            }
            return await response.json();
        } catch (error) {
            console.error({ call: 'getFullBacklogWithInformation', error, url, timestamp: new Date().toISOString() });
            throw new Error('An error occurred while fetching the backlog.');
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getBacklog(false).then(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        let mounted = true;

        const cachedBacklog = backlogCache[screenType];
        if (cachedBacklog?.length) {
            setScreenData(cachedBacklog, false);
        } else {
            void loadBacklogFromStorage(screenType).then((storedBacklog) => {
                if (!mounted || !storedBacklog?.length) {
                    return;
                }

                backlogCache[screenType] = storedBacklog;
                setScreenData(storedBacklog, false);
            });
        }

        void getBacklog(false);

        return () => {
            mounted = false;
        };
    }, [screenType]);

    useEffect(() => {
        const sortFunctions = {
            [SortProperty.ALPHABETICAL]: sortAlphabetical,
            [SortProperty.HLTB]: sortByHLTB,
        };

        const sortFunction = sortFunctions[sortBy];
        if (sortFunction) {
            const sortedList: any[] = sortFunction(backlogData, sortAscending);
            setBacklogData(sortedList);
        }
    }, [sortBy, sortAscending]);

    return (
        <View style={styles.container}>
            <SortButton sortBy={sortBy} sortAscending={sortAscending} setSortBy={setSortBy} setSortAscending={setSortAscending}/>
            <ButtonGroup items={fullBacklog} setBacklogData={setBacklogData} setSortAscending={setSortAscending} setSortBy={setSortBy} />
            { isLoading ? <LoadingIndicator /> :
                error ? <Text style={styles.error}>{error}</Text> :
                <ListItemView listData={backlogData} listType={screenType.toUpperCase()} setListData={setBacklogData} refreshing={refreshing} onRefresh={onRefresh} />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flex: 1,
    },
    error: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: 'red',
        padding: 10,
        marginTop: 20,
    },
    buttonGroup: {
        display: 'flex',
        flexDirection: 'row',
    },
});