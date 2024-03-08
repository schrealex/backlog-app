import * as React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text, View } from './Themed';
import { GameCopyElement } from './GameCopyElement';
import { CompletionElement } from './CompletionElement';
import { CompletionStatusesMenu } from './CompletionStatusesMenu';
import { HLTBElement } from './HLTBElement';
import { GameImageAndMetacritic } from './GameImageAndMetacritic';
import { Game } from '../types/Game';

const ListItem = React.memo(({ item, type, isOpen, onClick }: { item: Game, type: string, isOpen: any, onClick: () => void }) => {
    return (
        <Pressable onPress={onClick}>
            <View style={styles.item}>
                {isOpen ? <View style={styles.menu}><CompletionStatusesMenu type={type} item={item} onClick={onClick} /></View> : null}
                <GameImageAndMetacritic image={item.image} alternativeImage={item.hltbInfo?.game_image} metacriticInfo={item.metacriticInfo} />
                <View style={styles.line}>
                    <View style={styles.inline}>
                        <CompletionElement completionStatus={item.completion} />
                        <Text style={styles.title}>{item.title}</Text>
                        <GameCopyElement gameCopyType={item.gameCopy} />
                    </View>
                    { type === 'BACKLOG' || type === 'RETRO_BACKLOG' ? <HLTBElement item={item} /> : null }
                </View>
            </View>
        </Pressable>
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
        zIndex: 10000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
});
