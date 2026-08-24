import * as React from 'react';
import { Image } from 'expo-image';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import ListItem from './ListItem';
import { Game } from '../types/Game';
import { getImagePrefetchUris } from '../utilities/Utilities';

export function ListItemView({ listData, setListData, listType, refreshing, onRefresh, onCompletionChange }: { listData: any, setListData: any, listType: string, refreshing: boolean, onRefresh: any, onCompletionChange?: (gameId: number, completion: string) => void }) {

    const prefetchedUrisRef = React.useRef<Set<string>>(new Set());

    React.useEffect(() => {
        // Alleen de eerste zichtbare afbeeldingen prefetchen, en nooit dezelfde twee keer.
        const imageUris = getImagePrefetchUris(listData)
            .filter((uri) => !prefetchedUrisRef.current.has(uri));

        if (!imageUris.length) {
            return;
        }

        imageUris.forEach((uri) => prefetchedUrisRef.current.add(uri));
        void Image.prefetch(imageUris);
    }, [listData]);

    const onClick = React.useCallback((clickedItemId: number): void => {
        setListData((currentList: Game[]) => currentList.map((item: Game) => {
            if (item.id === clickedItemId) {
                return { ...item, isMenuOpen: !item.isMenuOpen };
            }

            if (item.isMenuOpen) {
                return { ...item, isMenuOpen: false };
            }

            return item;
        }));
    }, [setListData]);

    const renderItem = React.useCallback(({ item }: { item: Game }) => (
        <ListItem item={item} type={listType} isOpen={item.isMenuOpen} onClick={onClick} onCompletionChange={onCompletionChange} />
    ), [listType, onClick, onCompletionChange]);

    const keyExtractor = React.useCallback((item: Game) => item.id.toString(), []);

    const refreshControl = React.useMemo(() => (
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    ), [refreshing, onRefresh]);

    return (
        <FlatList
            removeClippedSubviews
            data={listData}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            keyExtractor={keyExtractor}
            refreshControl={refreshControl}
            style={styles.list}
            contentContainerStyle={styles.listScrollContent}
            renderItem={renderItem}
        />
    );
}

const styles = StyleSheet.create({
    list: {
        width: '100%',
        paddingBottom: 100,
    },
    listScrollContent: {
        display: 'flex',
        alignItems: 'center',
    },
});
