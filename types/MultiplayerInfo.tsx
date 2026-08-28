/**
 * Multiplayer-informatie per game. Alle velden zijn optioneel omdat de bron
 * (IGDB via de game-information API, of handmatig in Firestore) niet voor elke
 * game volledige data heeft. Zo blijft een ontbrekend veld "onbekend" in plaats
 * van "niet ondersteund".
 */
export type MultiplayerInfo = {
    // Samen spelen op één apparaat (couch co-op).
    hasLocalCoop?: boolean;
    hasSplitScreen?: boolean;
    maxLocalPlayers?: number;
    // Samen spelen via internet.
    hasOnlineCoop?: boolean;
    maxOnlinePlayers?: number;
}

