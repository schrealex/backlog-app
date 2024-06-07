import * as React from 'react';
import { Image, StyleSheet } from 'react-native';
import { View } from './Themed';
import { MetacriticInfo } from '../types/MetacriticInfo';
import { MetacriticElement } from './MetacriticElement';

export function GameImageAndMetacritic({ image, alternativeImage, metacriticInfo }: { image: string, alternativeImage: string | undefined, metacriticInfo: MetacriticInfo | undefined }) {

    const imageUri = image || (alternativeImage ? 'https://howlongtobeat.com/games/' + alternativeImage : null);

    return (
        <View style={styles.imageContainer}>
            {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
            { metacriticInfo ? <MetacriticElement metacriticInfo={metacriticInfo} /> : null }
        </View>
    );
}

const styles = StyleSheet.create({
    imageContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingLeft: 39,
        paddingRight: 39,
    },
    image: {
        width: 272,
        height: 153,
        resizeMode: 'contain',
    }
});