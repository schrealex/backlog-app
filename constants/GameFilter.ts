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
}

const hasCopy = (game: Game, copy: GameCopy): boolean => Boolean(game.gameCopy?.includes(copy));

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
};

/**
 * Past een filter toe op een lijst games. Doordat schermen de filter-sleutel bewaren
 * (en niet het gefilterde resultaat) blijft de zichtbare lijst automatisch in sync
 * wanneer een game van completion-status wijzigt.
 */
export const applyGameFilter = (games: Game[], filter: GameFilter): Game[] => {
    if (filter === GameFilter.ALL) {
        return games;
    }

    return games.filter(filterPredicates[filter]);
};

