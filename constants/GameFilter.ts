import { Completion } from './Completion';
import { GameCopy } from './GameCopy';
import { Game } from '../types/Game';

export enum GameFilter {
    ALL = 'ALL',
    PHYSICAL = 'PHYSICAL',
    DIGITAL = 'DIGITAL',
    BOTH = 'BOTH',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    CONTINUOUS = 'CONTINUOUS',
    DROPPED = 'DROPPED',
    BEATEN = 'BEATEN',
    COMPLETED = 'COMPLETED',
    FINISHED = 'FINISHED',
    COUCH_COOP = 'COUCH_COOP',
    COOP = 'COOP',
}

const hasCopy = (game: Game, copy: GameCopy): boolean => Boolean(game.gameCopy?.includes(copy));

/**
 * Couch co-op: samen spelen op één apparaat. Dit vereist expliciete data, want
 * HowLongToBeat maakt geen onderscheid tussen lokale en online co-op.
 */
export const supportsCouchCoop = (game: Game): boolean => {
    const multiplayerInfo = game.multiplayerInfo;

    if (!multiplayerInfo) {
        return false;
    }

    return Boolean(
        multiplayerInfo.hasLocalCoop ||
        multiplayerInfo.hasSplitScreen ||
        (multiplayerInfo.maxLocalPlayers ?? 0) > 1
    );
};

/**
 * Co-op in bredere zin (lokaal of online). Zonder multiplayerInfo vallen we terug
 * op HowLongToBeat: comp_lvl_co geeft aan dat er co-op speeltijden bekend zijn.
 */
export const supportsCoop = (game: Game): boolean => (
    supportsCouchCoop(game) ||
    Boolean(game.multiplayerInfo?.hasOnlineCoop) ||
    game.hltbInfo?.comp_lvl_co === 1
);

const filterPredicates: Record<GameFilter, (game: Game) => boolean> = {
    [GameFilter.ALL]: () => true,
    [GameFilter.PHYSICAL]: (game) => hasCopy(game, GameCopy.PHYSICAL),
    [GameFilter.DIGITAL]: (game) => hasCopy(game, GameCopy.DIGITAL),
    [GameFilter.BOTH]: (game) => hasCopy(game, GameCopy.PHYSICAL) && hasCopy(game, GameCopy.DIGITAL),
    [GameFilter.PLAYING]: (game) => game.completion === Completion.PLAYING,
    [GameFilter.PAUSED]: (game) => game.completion === Completion.PAUSED,
    [GameFilter.CONTINUOUS]: (game) => game.completion === Completion.CONTINUOUS,
    [GameFilter.DROPPED]: (game) => game.completion === Completion.DROPPED,
    [GameFilter.BEATEN]: (game) => game.completion === Completion.BEATEN,
    [GameFilter.COMPLETED]: (game) => game.completion === Completion.COMPLETED,
    // Alles wat je hebt uitgespeeld, ongeacht of je ook alles hebt verzameld.
    [GameFilter.FINISHED]: (game) => game.completion === Completion.BEATEN || game.completion === Completion.COMPLETED,
    [GameFilter.COUCH_COOP]: supportsCouchCoop,
    [GameFilter.COOP]: supportsCoop,
};

/**
 * Filters zijn opgedeeld in groepen die elkaar niet uitsluiten: je kunt tegelijk
 * op bezit, status én samen spelen filteren. Binnen één groep is er hooguit
 * één actief filter.
 */
export type FilterGroup = 'copy' | 'completion' | 'multiplayer';

export type ActiveFilters = Partial<Record<FilterGroup, GameFilter>>;

export const filterGroups: Record<FilterGroup, GameFilter[]> = {
    copy: [GameFilter.PHYSICAL, GameFilter.DIGITAL, GameFilter.BOTH],
    completion: [GameFilter.CONTINUOUS, GameFilter.DROPPED, GameFilter.BEATEN, GameFilter.COMPLETED, GameFilter.FINISHED],
    multiplayer: [GameFilter.COUCH_COOP, GameFilter.COOP],
};

// Icoon en label per filter, gedeeld door de knoppen, het menu en de chips.
export const filterMetadata: Record<GameFilter, { icon?: string, icons?: string[], label: string }> = {
    [GameFilter.ALL]: { label: 'All' },
    [GameFilter.PHYSICAL]: { icon: 'sd-card', label: 'Physical' },
    [GameFilter.DIGITAL]: { icon: 'cloud-download-alt', label: 'Digital' },
    [GameFilter.BOTH]: { icons: ['sd-card', 'cloud-download-alt'], label: 'Physical + digital' },
    [GameFilter.PLAYING]: { icon: 'gamepad', label: 'Playing' },
    [GameFilter.PAUSED]: { icon: 'pause', label: 'Paused' },
    [GameFilter.CONTINUOUS]: { icon: 'recycle', label: 'Continuous' },
    [GameFilter.DROPPED]: { icon: 'times', label: 'Dropped' },
    [GameFilter.BEATEN]: { icon: 'fist-raised', label: 'Beaten' },
    [GameFilter.COMPLETED]: { icon: 'trophy', label: 'Completed' },
    [GameFilter.FINISHED]: { icon: 'flag-checkered', label: 'Finished (beaten + completed)' },
    [GameFilter.COUCH_COOP]: { icon: 'couch', label: 'Couch co-op' },
    [GameFilter.COOP]: { icon: 'users', label: 'Co-op' },
};

/**
 * Combineert de actieve filters uit meerdere groepen. Een lege selectie levert
 * de volledige lijst op. Doordat schermen de filter-sleutels bewaren (en niet het
 * gefilterde resultaat) blijft de zichtbare lijst automatisch in sync wanneer een
 * game van completion-status wijzigt.
 */
export const applyGameFilters = (games: Game[], filters: ActiveFilters): Game[] => (
    (Object.values(filters).filter(Boolean) as GameFilter[])
        .reduce((result, filter) => result.filter(filterPredicates[filter]), games)
);

