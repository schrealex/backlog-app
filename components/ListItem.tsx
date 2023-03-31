import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Text, View } from './Themed';
import { Game } from '../types/Game';
import { HLTBInfo } from '../types/HLTBInfo';
import { GameCopyElement } from './GameCopyElement';
import { CompletionElement } from './CompletionElement';
import { CompletionStatusesMenu } from './CompletionStatusesMenu';
import { MetacriticInfo } from '../types/MetacriticInfo';

interface Cache {
    [key: string]: any;
}

const ListItem = React.memo(({ item, type }: { item: Game, type: string }) => {

    const [isLoading, setIsLoading] = useState(true);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

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

    const filteredTitle = useMemo(() => filterCharacters(item.title), [item.title]);

    useEffect(() => {
        let mounted = true;

        async function loadInformation() {
            const [retrievedHLTBInfo, retrievedMetacriticInfo] = await Promise.all([getHLTBInformation(), getMetacriticInformation()]);
            if (mounted) {
                item.hltbInfo = retrievedHLTBInfo;
                item.metacriticInfo = retrievedMetacriticInfo;
                setIsLoading(false);
            }
        }

        if (mounted) {
            if (type === 'BACKLOG' || type === 'RETRO_BACKLOG') {
                loadInformation();
            } else {
                setIsLoading(false);
            }
        }

        return function cleanUp() {
            mounted = false;
        };
    }, []);

    const getHLTBInformation = async (): Promise<HLTBInfo> => {
        if (getHLTBInformation.cache[filteredTitle]) {
            return getHLTBInformation.cache[filteredTitle];
        }

        const gameInformationURL = `https://game-information.vercel.app/how-long-to-beat?title=${filteredTitle.replace('+', '%2B')}${item.year ? `&year=${item.year}` : ''}`;
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
        getHLTBInformation.cache[filteredTitle] = foundGame;
        return foundGame;
    };

    getHLTBInformation.cache = {} as Cache;

    const getMetacriticInformation = async (): Promise<MetacriticInfo> => {
        if (getMetacriticInformation.cache[filteredTitle]) {
            return getMetacriticInformation.cache[filteredTitle];
        }

        const metacriticInformationURL = `https://game-information.vercel.app/metacritic?title=${filteredTitle.replace('+', '%2B')}&type=${type}`;
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
        let result;
        if (response && response.name !== 'TimeoutError') {
            result = response.find((item: { title: string; }) => item.title.toLowerCase() === filteredTitle.toLowerCase());
            getMetacriticInformation.cache[filteredTitle] = result;
        }
        return result;
    };

    getMetacriticInformation.cache = {} as Cache;

    const findGameTitle = (item: HLTBInfo, filteredTitle: string) => {
        return item.game_name.toLowerCase() === filteredTitle.toLowerCase();
    };

    const findGameInAliases = (item: HLTBInfo, filteredTitle: string) => {
        return item.game_alias.split(', ').map(alias => alias.toLowerCase()).find(alias => alias === filteredTitle.toLowerCase());
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
        } else {
            return { backgroundColor: '#cccccc' };
        }
    };

    const toggleMenu = () => {
        setIsMenuVisible(!isMenuVisible);
    };

    return (<View>
            {
                isLoading ? <ActivityIndicator style={styles.loading} size="large" color="#fff" /> :
                    <Pressable onPress={toggleMenu}>
                        <View style={styles.item}>
                            {isMenuVisible ?
                                <View style={styles.menu}><CompletionStatusesMenu type={type} item={item} toggleMenu={toggleMenu} /></View> : null}
                            <View style={styles.imageContainer}>
                                {item.image ?
                                    <Image source={{ uri: item.image, }} style={{ width: 272, height: 153, resizeMode: 'contain' }} /> :
                                    (item.hltbInfo ?
                                        <Image source={{ uri: 'https://howlongtobeat.com/games/' + item.hltbInfo.game_image, }}
                                               style={{ width: 272, height: 153, resizeMode: 'contain' }} /> : null)

                                }
                                {item.metacriticInfo ? <Text style={[styles.metacritic,
                                        getMetacriticScoreColor(Number(item.metacriticInfo.metacriticScore))]}>{item.metacriticInfo.metacriticScore}</Text> :
                                    <Text>{item.metacriticInfo}</Text>}
                            </View>
                            <View style={styles.line}>
                                <View style={styles.inline}>
                                    <CompletionElement completionStatus={item.completion} />
                                    <Text style={styles.title}>{item.title}</Text>
                                    <GameCopyElement gameCopyType={item.gameCopy} />
                                </View>
                                {type === 'BACKLOG' || type === 'RETRO_BACKLOG' ? (<View style={styles.timeToBeatContainer}>
                                    {
                                        item.hltbInfo && (item.hltbInfo.comp_main > 0 || item.hltbInfo.comp_plus > 0) ? (
                                            <View style={styles.timeToBeatElement}>
                                                <FontAwesome5 name="clock" size={20} color="gold"
                                                              style={{ backgroundColor: 'rgba(243,197,0,0.34)', borderRadius: 50, padding: 8 }} />
                                                <View style={styles.timeToBeatWrapper}>
                                                    <View style={styles.timeToBeat}>
                                                        <FontAwesome5 name="flag-checkered" size={14} color="gold"
                                                                      style={{
                                                                          backgroundColor: 'rgba(243,197,0,0.34)',
                                                                          borderRadius: 50,
                                                                          padding: 5
                                                                      }} />
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
                                        ) : <Text>GEEN HLTB</Text>
                                    }</View>) : null
                                }
                            </View>
                        </View>
                    </Pressable>
            }
        </View>
    );
});
export default ListItem;

const styles = StyleSheet.create({
    loading: {
        height: 233,
        width: 350,
    },
    item: {
        width: 350,
        padding: 10,
        fontSize: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menu: {
        display: 'flex',
        justifyContent: 'space-around',
        position: 'absolute',
        right: 0,
        top: 0,
        width: '70%',
        height: '100%',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
        alignItems: 'center',
        position: 'absolute',
        top: 0,
        right: 0,
        marginLeft: 5,
        fontSize: 17,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'rgb(102, 163, 41)',
        height: 34,
        width: 34,
        lineHeight: 34,
        borderRadius: 6,
    },
    line: {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        marginBottom: 4,
    },
    inline: {
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        maxWidth: 272,

    },
    timeToBeatContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        fontSize: 12,
        paddingTop: 4,
        marginLeft: 4,
    },
    timeToBeatElement: {
        display: 'flex',
        flexDirection: 'row',
        marginLeft: -20,
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
    }
});
