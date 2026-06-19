import * as React from 'react';
import { Image } from 'expo-image';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import ListItem from './ListItem';
import { Game } from '../types/Game';
import { getImagePrefetchUris } from '../utilities/Utilities';

export function ListItemView({ listData, setListData, listType, refreshing, onRefresh }: { listData: any, setListData: any, listType: string, refreshing: boolean, onRefresh: any }) {

    React.useEffect(() => {
        const imageUris = getImagePrefetchUris(listData);
        if (!imageUris.length) {
            return;
        }

        void Image.prefetch(imageUris);
    }, [listData]);

    const onClick = (clickedItemId: number): void => {
        const updatedList = listData.map((item: Game) => {
            if (item.id === clickedItemId) {
                return { ...item, isMenuOpen: !item.isMenuOpen };
            }

            if (item.isMenuOpen) {
                return { ...item, isMenuOpen: false };
            }

            return item;
        });
        setListData(updatedList);
    }

    return (
        <FlatList
            removeClippedSubviews
            data={listData}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            windowSize={6}
            keyExtractor={(item => item.id.toString())}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
            }
            style={styles.list}
            contentContainerStyle={styles.listScrollContent}
            renderItem={({ item }) => (
                <ListItem item={item} type={listType} isOpen={item.isMenuOpen} onClick={() => onClick(item.id)} />
            )}
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
