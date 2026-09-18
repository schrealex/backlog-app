import { Cache } from '../interfaces/Cache';
import { filterCharacters } from '../utilities/Utilities';
import { HLTBInfo } from '../types/HLTBInfo';
import { MetacriticInfo } from '../types/MetacriticInfo';
import { GAME_INFORMATION_BASE_URL } from '../constants/Constants';

const fetchInformation = async (title: string, endpoint: string, extraParams: Record<string, string> = {}) => {
    const filteredTitle = filterCharacters(title);
    const params = new URLSearchParams({ title: filteredTitle, ...extraParams });
    const url = `${GAME_INFORMATION_BASE_URL}${endpoint}?${params.toString()}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`${endpoint} information request failed`);
            return;
        }
        return await response.json();
    } catch (error) {
        console.error({ endpoint, error });
        return;
    }
};

const getHLTBInformation = async (title: string, gameId?: number): Promise<HLTBInfo | undefined> => {
    if (getHLTBInformation.cache[title]) {
        return getHLTBInformation.cache[title];
    }

    const filteredTitle = filterCharacters(title);
    // gameId laat de backend de permanente cache op het games-document gebruiken
    // i.p.v. elke keer een trage live lookup te doen.
    const response = await fetchInformation(filteredTitle, 'how-long-to-beat', gameId ? { gameId: String(gameId) } : {});

    let result: HLTBInfo | undefined;
    if (response && response.name !== 'TimeoutError') {
        result = (response.data as HLTBInfo[])
        .find((item: HLTBInfo) => (
            item.game_name.toLowerCase() === filteredTitle.toLowerCase() ||
            item.game_alias.toLowerCase().includes(filteredTitle.toLowerCase())
        ));
        getHLTBInformation.cache[filteredTitle] = result;
    }
    return result;
};

getHLTBInformation.cache = {} as Cache;

const getMetacriticInformation = async (title: string): Promise<MetacriticInfo> => {
    if (getMetacriticInformation.cache[title]) {
        return getMetacriticInformation.cache[title];
    }

    const filteredTitle = filterCharacters(title);
    const response = await fetchInformation(filteredTitle, 'metacritic');

    let result;
    if (response && response.name !== 'TimeoutError') {
        result = response.find((item: { title: string; }) => item.title.toLowerCase() === filteredTitle.toLowerCase());
        getMetacriticInformation.cache[title] = result;
    }
    return result;
};

getMetacriticInformation.cache = {} as Cache;

export { getHLTBInformation, getMetacriticInformation }