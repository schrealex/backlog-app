import { filterCharacters } from '../utilities/Utilities';
import { ExophaseInfo } from '../types/ExophaseInfo';
import { EXOPHASE_API_BASE_URL, EXOPHASE_PLAYER_ID } from '../constants/Constants';

type ExophaseGame = {
    meta?: { title?: string };
    playtimeUnits?: { hours?: number, minutes?: number };
    percent?: number;
    lastplayed_utc?: number;
}

// Voorkomt dat één app-open meer dan dit aantal pagina's ophaalt als de API
// onverwacht geen lege pagina teruggeeft.
const MAX_PAGES = 50;

let cachedExophaseGames: ExophaseGame[] | undefined;
let inFlightFetch: Promise<ExophaseGame[]> | undefined;

const fetchAllExophaseGamePages = async (): Promise<ExophaseGame[]> => {
    const allGames: ExophaseGame[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
        const url = `${EXOPHASE_API_BASE_URL}player/${EXOPHASE_PLAYER_ID}/games?page=${page}&environment=&sort=1&showHidden=0`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error({ call: 'fetchAllExophaseGamePages', page, status: response.status, timestamp: new Date().toISOString() });
                break;
            }

            // Exophase staat achter Cloudflare; zonder geldige browsersessie kan een
            // JS-challenge ("Just a moment...") terugkomen met status 200 maar HTML
            // i.p.v. JSON. Dat expliciet signaleren scheelt uitzoeken bij een lege sync.
            const contentType = response.headers.get('content-type') ?? '';
            if (!contentType.includes('application/json')) {
                console.error({ call: 'fetchAllExophaseGamePages', page, message: 'Non-JSON response, likely a Cloudflare challenge blocking the request', contentType, timestamp: new Date().toISOString() });
                break;
            }

            const data = await response.json();
            if (!data?.success || !data.games?.length) {
                break;
            }

            allGames.push(...data.games);
        } catch (error) {
            console.error({ call: 'fetchAllExophaseGamePages', page, error, timestamp: new Date().toISOString() });
            break;
        }
    }

    return allGames;
};

// Eén keer per app-sessie alle games van de speler ophalen; de matching gebeurt
// daarna lokaal per titel i.p.v. per game een aparte call te doen.
const fetchExophaseGames = (): Promise<ExophaseGame[]> => {
    if (cachedExophaseGames) {
        return Promise.resolve(cachedExophaseGames);
    }

    if (!inFlightFetch) {
        inFlightFetch = fetchAllExophaseGamePages()
            .then((games) => {
                cachedExophaseGames = games;
                return games;
            })
            .finally(() => {
                inFlightFetch = undefined;
            });
    }

    return inFlightFetch;
};

const normalizeTitle = (title: string): string => filterCharacters(title).toLowerCase().trim();

const findMatchingExophaseGame = (title: string, exophaseGames: ExophaseGame[]): ExophaseGame | undefined => {
    const normalizedTitle = normalizeTitle(title);

    return exophaseGames.find((game) => normalizeTitle(game.meta?.title ?? '') === normalizedTitle)
        ?? exophaseGames.find((game) => normalizeTitle(game.meta?.title ?? '').includes(normalizedTitle));
};

const toExophaseInfo = (exophaseGame: ExophaseGame): ExophaseInfo => ({
    playtimeHours: exophaseGame.playtimeUnits?.hours ?? 0,
    playtimeMinutes: exophaseGame.playtimeUnits?.minutes ?? 0,
    completionPercent: exophaseGame.percent ?? 0,
    lastPlayedUtc: exophaseGame.lastplayed_utc ?? 0,
});

const getExophaseInformation = async (title: string): Promise<ExophaseInfo | undefined> => {
    const exophaseGames = await fetchExophaseGames();
    const match = findMatchingExophaseGame(title, exophaseGames);
    return match ? toExophaseInfo(match) : undefined;
};

export { getExophaseInformation };
