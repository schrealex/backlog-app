import * as React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import ListItem from './ListItem';
import { Game } from '../types/Game';

export function ListItemView({ listData, setListData, listType, refreshing, onRefresh }: { listData: any, setListData: any, listType: string, refreshing: boolean, onRefresh: any }) {

    const onClick = (clickedItemId: number): void => {
        const updatedList = listData.map((item: Game) => ({ ...item, isMenuOpen: item.id === clickedItemId ? !item.isMenuOpen : false }));
        setListData(updatedList);
    }

    return (
        <FlatList
            removeClippedSubviews
            data={listData}
            initialNumToRender={8}
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
