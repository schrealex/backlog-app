import { countPinnedGames, sortPinnedFirst, togglePinnedGame } from '../Utilities';

const buildGames = () => ([
    { id: 1, title: 'Alpha' },
    { id: 2, title: 'Bravo', isPinned: true },
    { id: 3, title: 'Charlie' },
    { id: 4, title: 'Delta', isPinned: true },
]);

describe('pinned games', () => {
    describe('countPinnedGames', () => {
        it('counts only pinned games', () => {
            expect(countPinnedGames(buildGames())).toBe(2);
            expect(countPinnedGames([])).toBe(0);
        });
    });

    describe('sortPinnedFirst', () => {
        it('moves pinned games to the top and keeps the existing order', () => {
            const result = sortPinnedFirst(buildGames());

            expect(result.map((game) => game.title)).toEqual(['Bravo', 'Delta', 'Alpha', 'Charlie']);
        });

        it('returns the same reference when nothing is pinned', () => {
            const games = [{ id: 1, title: 'Alpha' }, { id: 2, title: 'Bravo' }];

            expect(sortPinnedFirst(games)).toBe(games);
        });

        it('returns the same reference when everything is pinned', () => {
            const games = [{ id: 1, isPinned: true }, { id: 2, isPinned: true }];

            expect(sortPinnedFirst(games)).toBe(games);
        });
    });

    describe('togglePinnedGame', () => {
        it('pins an unpinned game', () => {
            const { games, isPinned, hasChanges, limitReached } = togglePinnedGame(buildGames(), 1, 5);

            expect(isPinned).toBe(true);
            expect(hasChanges).toBe(true);
            expect(limitReached).toBe(false);
            expect(games.find((game) => game.id === 1).isPinned).toBe(true);
        });

        it('unpins a pinned game', () => {
            const { games, isPinned } = togglePinnedGame(buildGames(), 2, 5);

            expect(isPinned).toBe(false);
            expect(games.find((game) => game.id === 2).isPinned).toBe(false);
        });

        it('refuses to pin beyond the maximum', () => {
            const games = [
                { id: 1, isPinned: true },
                { id: 2, isPinned: true },
                { id: 3 },
            ];

            const result = togglePinnedGame(games, 3, 2);

            expect(result.limitReached).toBe(true);
            expect(result.hasChanges).toBe(false);
            expect(result.games).toBe(games);
        });

        it('still allows unpinning when the maximum is reached', () => {
            const games = [{ id: 1, isPinned: true }, { id: 2, isPinned: true }];

            const result = togglePinnedGame(games, 1, 2);

            expect(result.limitReached).toBe(false);
            expect(result.isPinned).toBe(false);
            expect(result.games.find((game) => game.id === 1).isPinned).toBe(false);
        });

        it('does nothing for an unknown game', () => {
            const games = buildGames();

            const result = togglePinnedGame(games, 999, 5);

            expect(result.hasChanges).toBe(false);
            expect(result.games).toBe(games);
        });

        it('leaves the other games untouched', () => {
            const games = buildGames();

            const result = togglePinnedGame(games, 1, 5);

            expect(result.games[1]).toBe(games[1]);
            expect(result.games[2]).toBe(games[2]);
        });
    });
});

