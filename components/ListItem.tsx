import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Text, View } from './Themed';
import { Game } from '../types/Game';
import { HLTBInfo } from '../types/HLTBInfo';
import { completion, gameCopy } from '../constants/FULL_GAMES_LIST';

function CompletionElement({ completionStatus }: { completionStatus: string }) {
    return (
        <View style={styles.completion}>
            {completionStatus === completion.COMPLETED ? <FontAwesome5 name="trophy" size={20} color="red" /> : null}
            {completionStatus === completion.BEATEN ? <FontAwesome5 name="fist-raised" size={20} color="red" /> : null}
            {completionStatus == completion.UNFINISHED ? <FontAwesome5 name="gamepad" size={20} color="red" /> : null}
            {completionStatus === completion.PAUSED ? <FontAwesome5 name="pause" size={20} color="red" /> : null}
            {completionStatus === completion.NOT_STARTED ? <FontAwesome5 name="stop" size={20} color="red" /> : null}
            {completionStatus === completion.DROPPED ? <FontAwesome5 name="times" size={20} color="red" /> : null}
            {completionStatus === completion.CONTINUOUS ? <FontAwesome5 name="recycle" size={20} color="red" /> : null}
        </View>
    );
}

function GameCopyElement({ gameCopyType }: { gameCopyType: Array<string> }) {
    return (
        <View style={styles.gameCopy}>
            {gameCopyType.includes(gameCopy.PHYSICAL) && gameCopyType.includes(gameCopy.DIGITAL) ?
                <View style={styles.gameCopyBoth}>
                    <FontAwesome5 name="compact-disc" size={20} color="red" />
                    <FontAwesome5 name="hdd" size={20} color="red" />
                </View>
                : gameCopyType.includes(gameCopy.PHYSICAL) ?
                    <FontAwesome5 name="compact-disc" size={20} color="red" /> :
                    <FontAwesome5 name="hdd" size={20} color="red" />
            }
        </View>
    );
}

export default function ListItem({ item, type }: { item: Game, type: string }) {

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadHLTBInformation() {
            item.hltbInfo = await getHLTBInformation(item.title, item.year);
            setIsLoading(false);
        }

        async function loadMetacriticInformation() {
            item.metacriticInfo = await getMetacriticInformation(item.title);
            setIsLoading(false);
        }

        if (mounted) {
            if (type === 'BACKLOG') {
                loadHLTBInformation();
                if (item.title !== 'DOOM II: Hell on Earth'
                    && item.title !== 'Double Dragon 4'
                    && item.title !== 'GRIS'
                    && item.title !== 'NieR:Automata - The End of YoRHa Edition'
                    && item.title !== 'NINJA GAIDEN: Master Collection'
                    && item.title !== 'Mario + Rabbids Sparks of Hope'
                ) {
                    loadMetacriticInformation();
                }
            } else {
                setIsLoading(false);
            }
        }

        return function cleanUp() {
            mounted = false;
        };
    }, []);

    const getHLTBInformation = async (title: string, year?: number): Promise<HLTBInfo> => {
        let filteredTitle = filterCharacters(title);

        const gameInformationURL = `https://game-information.vercel.app/how-long-to-beat?title=${filteredTitle.replace('+', '%2B')}${year ? `&year=${year}` : ''}`;
        const gameInformation = await fetch(gameInformationURL);

        if (!gameInformation) {
            console.log('HLTB information fetch failed');
        }
        if (gameInformation.status === 403) {
            console.log('HLTB information rate limit');
        }
        if (!gameInformation.ok) {
            console.log('HLTB information request failed');
        }
        const response = await gameInformation.json();
        let foundGame;
        foundGame = response.data.find((item: HLTBInfo) => findGameInAliases(item, filteredTitle));
        if (!foundGame) {
            foundGame = response.data.find((item: HLTBInfo) => findGameTitle(item, filteredTitle));
        }
        return foundGame;
    };

    const getMetacriticInformation = async (title: string): Promise<any> => {
        let filteredTitle = filterCharacters(title);

        const metacriticInformationURL = `https://game-information.vercel.app/metacritic?title=${filteredTitle.replace('+', '%2B')}`;
        const metacriticInformation = await fetch(metacriticInformationURL);

        if (!metacriticInformation) {
            console.log('Metacritic information fetch failed');
        }
        if (metacriticInformation.status === 403) {
            console.log('Metacritic information rate limit');
        }
        if (!metacriticInformation.ok) {
            console.log('Metacritic information request failed');
        }
        const response = await metacriticInformation.json();
        if (response) {
            return response.find((item: { title: string; }) => item.title.toLowerCase() === filteredTitle.toLowerCase());
        }
        return '';
    };

    const findGameTitle = (item: HLTBInfo, filteredTitle: string) => {
        return item.game_name.toLowerCase() === filteredTitle.toLowerCase();
    };

    const findGameInAliases = (item: HLTBInfo, filteredTitle: string) => {
        return item.game_alias.split(', ').map(alias => alias.toLowerCase()).find(alias => alias === filteredTitle.toLowerCase());
    };

    const filterCharacters = (title: string): string => {
        const copyrightSign = String.fromCharCode(169);
        const registeredSign = String.fromCharCode(174);
        const trademarkSymbol = String.fromCharCode(8482);

        let filteredTitle = title.split(copyrightSign).join('');
        filteredTitle = filteredTitle.split(registeredSign).join('');
        filteredTitle = filteredTitle.split(trademarkSymbol).join('');
        filteredTitle = filteredTitle.split('Remastered').join('').trim();
        filteredTitle = filteredTitle.split('+ A NEW POWER AWAKENS SET').join('').trim();
        filteredTitle = filteredTitle.split(': Duke of Switch Edition').join('').trim();
        filteredTitle = filteredTitle.split('Commander Keen in ').join('').trim();
        filteredTitle = filteredTitle.split(': Bundle of Terror').join('').trim();
        return filteredTitle;
    };


    const getPlayTimeInHoursAndMinutes = (gameTime: number) => {
        const gameTimeInHours = gameTime / 3600;
        const roundedToSingleDecimal = Math.round(gameTimeInHours * 10) / 10;
        const roundedToHalfOrWholeNumbers = Math.round(roundedToSingleDecimal / 0.5) * 0.5;
        return roundedToHalfOrWholeNumbers.toString();
    };

    const getMetacriticScoreColor = (score: number) => {
        if (score >= 75) {
            return { backgroundColor: '#6c3' };
        } else if (score >= 40) {
            return { backgroundColor: '#fc3' };
        } else if (score >= 75) {
            return { backgroundColor: '#f00' };
        }
    };

    return (<View>
            {
                isLoading ? <ActivityIndicator style={styles.loading} size="large" color="#fff" /> :
                    <View style={styles.item}>
                        <View style={styles.imageContainer}>
                            {item.image ?
                                <Image source={{ uri: item.image, }} style={{ width: 272, height: 153, resizeMode: 'contain' }} /> :
                                (item.hltbInfo ?
                                    <Image source={{ uri: 'https://howlongtobeat.com/games/' + item.hltbInfo.game_image, }}
                                           style={{ width: 272, height: 153, resizeMode: 'contain' }} /> : null)

                            }
                            {item.metacriticInfo ? <Text style={[styles.metacritic,
                                getMetacriticScoreColor(Number(item.metacriticInfo.metacriticScore))]}>{item.metacriticInfo.metacriticScore}</Text> : null}
                        </View>
                        <View style={styles.line}>
                            <View style={styles.inline}>
                                <CompletionElement completionStatus={item.completion} />
                                <Text style={styles.title}>{item.title}</Text>
                                <GameCopyElement gameCopyType={item.gameCopy} />
                            </View>
                            {type === 'BACKLOG' ? (<View>
                                {
                                    item.hltbInfo && (item.hltbInfo.comp_main > 0 || item.hltbInfo.comp_plus > 0) ? (
                                        <View style={styles.timeToBeatContainer}>
                                            <FontAwesome5 name="clock" size={20} color="gold"
                                                          style={{ backgroundColor: 'rgba(243,197,0,0.34)', borderRadius: 50, padding: 8 }} />
                                            <View style={styles.timeToBeatWrapper}>
                                                <View style={styles.timeToBeat}>
                                                    <FontAwesome5 name="flag-checkered" size={14} color="gold"
                                                                  style={{ backgroundColor: 'rgba(243,197,0,0.34)', borderRadius: 50, padding: 5 }} />
                                                    <Text style={styles.timeToBeatText}>
                                                        {
                                                            getPlayTimeInHoursAndMinutes(item.hltbInfo.comp_main > 0 ? item.hltbInfo.comp_main : item.hltbInfo.comp_plus)
                                                        } hours
                                                    </Text>
                                                </View>
                                                {item.hltbInfo.comp_100 > 0 ?
                                                    <View style={styles.timeToBeat}>
                                                        <FontAwesome5 name="trophy" size={14} color="gold"
                                                                      style={{
                                                                          backgroundColor: 'rgba(243,197,0,0.34)',
                                                                          borderRadius: 50,
                                                                          padding: 5
                                                                      }} />
                                                        <Text style={styles.timeToBeatText}>
                                                            {getPlayTimeInHoursAndMinutes(item.hltbInfo.comp_100)} hours
                                                        </Text>
                                                    </View>
                                                    : null}
                                            </View>
                                        </View>
                                    ) : null
                                }</View>) : null
                            }
                        </View>
                    </View>
            }
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        height: 233,
    },
    item: {
        padding: 10,
        fontSize: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingLeft: 39,
        paddingRight: 39,
    },
    metacritic: {
        display: 'flex',
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        marginLeft: 5,
        fontSize: 17,
        fontWeight: 'bold',
        backgroundColor: 'rgb(102, 163, 41)',
        height: '2em',
        width: '2em',
        lineHeight: 34,
        borderRadius: 6,
    },
    line: {
        flexDirection: 'column',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    inline: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',

    },
    completion: {
        marginRight: 5,
    },
    timeToBeatContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: 12,
        paddingTop: 4,
        marginLeft: 4,
    },
    timeToBeatWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeToBeat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        marginRight: 2,
    },
    timeToBeatText: {
        marginLeft: 4,
    },
    gameCopy: {
        marginLeft: 5,
    },
    gameCopyBoth: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 55,
    },
});
