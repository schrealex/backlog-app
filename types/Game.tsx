import { HLTBInfo } from './HLTBInfo';
import { MetacriticInfo } from './MetacriticInfo';
import { MultiplayerInfo } from './MultiplayerInfo';

export type Game = {
    isMenuOpen: boolean;
    completion: string,
    gameCopy: string[],
    documentId?: string;
    isPinned?: boolean;
    id: number;
    image: string;
    title: string;
    year?: number;
    playState?: string;
    hltbInfo?: HLTBInfo;
    metacriticInfo?: MetacriticInfo;
    multiplayerInfo?: MultiplayerInfo;
}
