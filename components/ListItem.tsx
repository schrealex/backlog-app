import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Text, View } from './Themed';
import { Game } from '../types/Game';
import { HLTBInfo } from '../types/HLTBInfo';
import { completion } from '../constants/FULL_GAMES_LIST';

export default function ListItem({ item, type }: { item: Game, type: string }) {

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function loadHLTBInformation() {
            item.hltbInfo = await getHLTBInformation(item.title, item.year);
            setIsLoading(false);
        }

        if (mounted) {
            if (type === 'BACKLOG') {
                loadHLTBInformation();
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


    const getPlayTimeInHoursAndMinutes = (gameTime) => {
        const gameTimeInHours = gameTime / 3600;
        const roundedToSingleDecimal = Math.round(gameTimeInHours * 10) / 10;
        const roundedToHalfOrWholeNumbers = Math.round(roundedToSingleDecimal / 0.5) * 0.5;
        return roundedToHalfOrWholeNumbers.toString();
    };

    return (<View>
            {
                isLoading ? <ActivityIndicator style={styles.loading} size="large" color="#fff" /> :
                    <View style={styles.item}>
                        <Image source={{ uri: item.image, }} style={{ width: 272, height: 153, resizeMode: 'contain' }} />
                        <View style={type === 'BACKLOG' ? styles.line : styles.inline}>
                            {type === 'FULL-LIST' ?
                                <View style={styles.completion}>
                                    {item.completion === completion.COMPLETED ? <FontAwesome5 name="trophy" size={20} color="red" /> : null}
                                    {item.completion === completion.BEATEN ? <FontAwesome5 name="fist-raised" size={20} color="red" /> : null}
                                    {item.completion === completion.DROPPED ? <FontAwesome5 name="times" size={20} color="red" /> : null}
                                </View> : null
                            }
                            <Text>{item.title}</Text>
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
    line: {
        flexDirection: 'column',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        marginTop: 8,
    },
    inline: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        width: '80%',
        marginTop: 8,
    },
    title: {
        fontSize: 20,
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
