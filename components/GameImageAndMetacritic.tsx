import * as React from 'react';
import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { View } from './Themed';
import { MetacriticInfo } from '../types/MetacriticInfo';
import { MetacriticElement } from './MetacriticElement';
import { getGameImageUri } from '../utilities/Utilities';
import { GAME_IMAGE_HEIGHT, GAME_IMAGE_PADDING_HORIZONTAL, GAME_IMAGE_WIDTH } from '../constants/Constants';

export function GameImageAndMetacritic({ image, alternativeImage, metacriticInfo }: Readonly<{
    image: string, alternativeImage: string | undefined, metacriticInfo: MetacriticInfo | undefined
}>) {
    const imageUri = getGameImageUri(image, alternativeImage);

    return (
        <View style={styles.imageContainer}>
            {imageUri ? (
                <Image
                    source={{ uri: imageUri, cacheKey: imageUri }}
                    style={styles.image}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    transition={120}
                />
            ) : null}
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
        paddingLeft: GAME_IMAGE_PADDING_HORIZONTAL,
        paddingRight: GAME_IMAGE_PADDING_HORIZONTAL,
    },
    image: {
        width: GAME_IMAGE_WIDTH,
        height: GAME_IMAGE_HEIGHT,
    }
});