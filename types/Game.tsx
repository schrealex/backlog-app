import { HLTBInfo } from './HLTBInfo';
import { MetacriticInfo } from './MetacriticInfo';

export type Game = {
    isMenuOpen: boolean;
    completion: string,
    gameCopy: string[],
    id: number;
    image: string;
    title: string;
    year?: number;
    playState?: string;
    hltbInfo?: HLTBInfo;
    metacriticInfo?: MetacriticInfo;
}
