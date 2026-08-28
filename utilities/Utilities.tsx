const filterCharacters = (title: string): string => {
    const specialCharacters = [
        String.fromCharCode(169), // copyrightSign
        String.fromCharCode(174), // registeredSign
        String.fromCharCode(8482), // trademarkSymbol
        'Remastered',
        '+ A NEW POWER AWAKENS SET',
        ': Duke of Switch Edition',
        'Commander Keen in ',
        ': Bundle of Terror',
        ': Legacy',
        ' — Complete Edition',
    ];

    let filteredTitle = title;
    specialCharacters.forEach(char => {
        filteredTitle = filteredTitle.split(char).join('').trim();
    });

    return filteredTitle;
}

const sortAlphabetical = (list: any, sortAscending: boolean) => {
    return [...list].sort((a: any, b: any) => (sortAscending ? 1 : -1) * a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
};

const sortByHLTB = (list: any, sortAscending: boolean) => {
    return [...list].sort((a: any, b: any) => {
        const aMain = a.hltbInfo?.comp_main;
        const bMain = b.hltbInfo?.comp_main;
        if (aMain && bMain) {
            return sortAscending ? aMain - bMain : bMain - aMain;
        }
        return aMain ? -1 : 1;
    });
};

const HLTB_IMAGE_BASE_URL = 'https://howlongtobeat.com/games/';

const getGameImageUri = (image?: string, alternativeImage?: string) => {
    if (image) {
        return image;
    }

    return alternativeImage ? `${HLTB_IMAGE_BASE_URL}${alternativeImage}` : '';
};

const getImagePrefetchUris = (games: any[], limit = 12) => {
    return [...new Set(games
        .map((game) => getGameImageUri(game.image, game.hltbInfo?.game_image))
        .filter(Boolean))]
        .slice(0, limit) as string[];
};

/**
 * Voegt aanvullende (trage) game-informatie toe aan een bestaande lijst zonder de lijst te vervangen.
 * Behoudt object-identiteit van ongewijzigde items zodat React.memo re-renders kan overslaan.
 * `completion`, `isMenuOpen` en `isPinned` van de bestaande lijst blijven leidend: die kunnen door
 * de gebruiker gewijzigd zijn terwijl de trage verrijking nog onderweg was.
 */
const PRESERVED_KEYS = ['completion', 'isMenuOpen', 'isPinned'];

const mergeGameInformation = <T extends { id: number }>(base: T[], additional: T[]): { games: T[], hasChanges: boolean } => {
    if (!base?.length) {
        return { games: additional ?? [], hasChanges: Boolean(additional?.length) };
    }

    if (!additional?.length) {
        return { games: base, hasChanges: false };
    }

    const additionalById = new Map<number, T>(additional.map((game) => [game.id, game]));
    let hasChanges = false;

    const merged = base.map((game) => {
        const extraInformation: any = additionalById.get(game.id);
        if (!extraInformation) {
            return game;
        }

        additionalById.delete(game.id);

        const currentGame: any = game;
        const newKeys = Object.keys(extraInformation).filter((key) => !PRESERVED_KEYS.includes(key));
        const isAlreadyUpToDate = newKeys.every((key) => currentGame[key] === extraInformation[key]);

        if (isAlreadyUpToDate) {
            return game;
        }

        hasChanges = true;
        const mergedGame: any = { ...currentGame };
        newKeys.forEach((key) => {
            mergedGame[key] = extraInformation[key];
        });

        return mergedGame as T;
    });

    if (additionalById.size) {
        hasChanges = true;
        merged.push(...additionalById.values());
    }

    return { games: hasChanges ? merged : base, hasChanges };
};

const countPinnedGames = <T extends { isPinned?: boolean }>(games: T[]): number => {
    return games.reduce((total, game) => (game.isPinned ? total + 1 : total), 0);
};

/**
 * Zet gepinde games bovenaan met behoud van de bestaande (gesorteerde) volgorde.
 * Zonder gepinde games wordt dezelfde array-referentie teruggegeven, zodat
 * onnodige re-renders uitblijven.
 */
const sortPinnedFirst = <T extends { isPinned?: boolean }>(games: T[]): T[] => {
    const pinnedGames = games.filter((game) => game.isPinned);
    if (!pinnedGames.length || pinnedGames.length === games.length) {
        return games;
    }

    return [...pinnedGames, ...games.filter((game) => !game.isPinned)];
};

/**
 * Zet de pin-status van één game om, met respect voor het maximum.
 * Bij het overschrijden van het maximum blijft de lijst ongewijzigd en wordt
 * `limitReached` teruggegeven zodat de UI daarop kan reageren.
 */
const togglePinnedGame = <T extends { id: number, isPinned?: boolean }>(games: T[], gameId: number, maxPinnedGames: number): {
    games: T[],
    isPinned: boolean,
    hasChanges: boolean,
    limitReached: boolean,
} => {
    const targetGame = games.find((game) => game.id === gameId);
    if (!targetGame) {
        return { games, isPinned: false, hasChanges: false, limitReached: false };
    }

    const nextIsPinned = !targetGame.isPinned;

    if (nextIsPinned && countPinnedGames(games) >= maxPinnedGames) {
        return { games, isPinned: Boolean(targetGame.isPinned), hasChanges: false, limitReached: true };
    }

    return {
        games: games.map((game) => (game.id === gameId ? { ...game, isPinned: nextIsPinned } : game)),
        isPinned: nextIsPinned,
        hasChanges: true,
        limitReached: false,
    };
};

export { filterCharacters, sortAlphabetical, sortByHLTB, getGameImageUri, getImagePrefetchUris, mergeGameInformation, countPinnedGames, sortPinnedFirst, togglePinnedGame }
