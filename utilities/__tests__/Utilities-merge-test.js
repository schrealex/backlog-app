import { mergeGameInformation } from '../Utilities';

const buildCoreGame = (overrides = {}) => ({
    id: 1,
    title: 'Hollow Knight',
    completion: 'Playing',
    image: 'https://example.test/hollow-knight.jpg',
    gameCopy: ['Digital'],
    documentId: 'doc-1',
    isMenuOpen: false,
    ...overrides,
});

const buildEnrichedGame = (overrides = {}) => ({
    id: 1,
    title: 'Hollow Knight',
    completion: 'Not started',
    image: 'https://example.test/hollow-knight.jpg',
    gameCopy: ['Digital'],
    documentId: 'doc-1',
    hltbInfo: { game_id: 26286, comp_main: 93600 },
    ...overrides,
});

describe('mergeGameInformation', () => {
    it('adds hltbInfo to games that do not have it yet', () => {
        const { games, hasChanges } = mergeGameInformation([buildCoreGame()], [buildEnrichedGame()]);

        expect(hasChanges).toBe(true);
        expect(games[0].hltbInfo).toEqual({ game_id: 26286, comp_main: 93600 });
    });

    it('keeps the local completion, pin and menu state', () => {
        const core = buildCoreGame({ completion: 'Playing', isPinned: true, isMenuOpen: true });
        const enriched = buildEnrichedGame({ completion: 'Not started', isPinned: false, isMenuOpen: false });

        const { games } = mergeGameInformation([core], [enriched]);

        expect(games[0].completion).toBe('Playing');
        expect(games[0].isPinned).toBe(true);
        expect(games[0].isMenuOpen).toBe(true);
        expect(games[0].hltbInfo).toBeDefined();
    });

    it('reports no changes when the enrichment adds nothing new', () => {
        const hltbInfo = { game_id: 26286, comp_main: 93600 };
        const gameCopy = ['Digital'];
        const core = buildCoreGame({ hltbInfo, gameCopy });
        const enriched = buildEnrichedGame({ hltbInfo, gameCopy });

        const { games, hasChanges } = mergeGameInformation([core], [enriched]);

        expect(hasChanges).toBe(false);
        expect(games[0]).toBe(core);
    });

    it('uses the enrichment as-is when there is no local data yet', () => {
        const enriched = [buildEnrichedGame()];

        const { games, hasChanges } = mergeGameInformation([], enriched);

        expect(hasChanges).toBe(true);
        expect(games).toBe(enriched);
    });

    it('appends games that only exist in the enrichment', () => {
        const { games, hasChanges } = mergeGameInformation(
            [buildCoreGame()],
            [buildEnrichedGame(), buildEnrichedGame({ id: 2, title: 'Celeste', documentId: 'doc-2' })]
        );

        expect(hasChanges).toBe(true);
        expect(games).toHaveLength(2);
        expect(games[1].title).toBe('Celeste');
    });

    it('leaves untouched games referentially equal so memoized rows do not re-render', () => {
        const untouched = buildCoreGame({ id: 2, title: 'Celeste', documentId: 'doc-2' });

        const { games } = mergeGameInformation([buildCoreGame(), untouched], [buildEnrichedGame()]);

        expect(games[1]).toBe(untouched);
        expect(games[0]).not.toBe(untouched);
    });
});

