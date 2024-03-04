import * as React from 'react';
import { StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { View } from './Themed';
import { HLTBIconAndTextElement } from './HLTBIconAndTextElement';
import { Game } from '../types/Game';

export function HLTBElement({ item }: { item: Game }) {
    return (
        <View style={styles.timeToBeatContainer}>
            { item.hltbInfo && (item.hltbInfo.comp_main > 0 || item.hltbInfo.comp_plus > 0) ?
                <View style={styles.timeToBeatElement}>
                    <FontAwesome5 name="clock" size={20} color="gold" style={{ backgroundColor: 'rgba(243,197,0,0.34)', borderRadius: 50, padding: 8 }}/>
                    <View style={styles.timeToBeatWrapper}>
                        <HLTBIconAndTextElement time={item.hltbInfo.comp_main > 0 ? item.hltbInfo.comp_main : item.hltbInfo.comp_plus} icon={"flag-checkered"}></HLTBIconAndTextElement>
                        { item.hltbInfo.comp_100 > 0 ? <HLTBIconAndTextElement time={item.hltbInfo.comp_100} icon={"trophy"}></HLTBIconAndTextElement> : null }
                    </View>
                </View>
                :
                null
            }
        </View>
    );
}

const styles = StyleSheet.create({
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
});
