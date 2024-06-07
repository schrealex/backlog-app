import * as React from 'react';
import { StyleSheet } from 'react-native';
import { View } from './Themed';
import { FilterButton } from './FilterButton';
import { Game } from '../types/Game';
import { GameCopy } from '../constants/GameCopy';
import { Completion } from '../constants/Completion';
import { SortProperty } from '../constants/SortProperty';

const memoizee = require('memoizee');

const ButtonGroup = ({ items, setBacklogData, setSortAscending, setSortBy } : { items: any, setBacklogData: any, setSortAscending: any, setSortBy: any }) => {

    const setFilteredDataAndResetSort = (filterFunction: (items: Game[]) => Game[]) => {
        setBacklogData(filterFunction(items));
        resetSort();
    };

    const isAll = () => setFilteredDataAndResetSort(getAll);
    const isPhysical = () => setFilteredDataAndResetSort(getOnlyPhysical);
    const isDigital = () => setFilteredDataAndResetSort(getOnlyDigital);
    const isPlaying = () => setFilteredDataAndResetSort(getPlaying);
    const isPaused = () => setFilteredDataAndResetSort(getPaused);

    const getFilteredGames = memoizee((items: Game[], filterFn: (game: Game) => boolean) => {
        return items.filter(filterFn);
    });

    const getAll = () => items;
    const getOnlyPhysical = (items: Game[]) => getFilteredGames(items, (game: Game) => game.gameCopy.includes(GameCopy.PHYSICAL));
    const getOnlyDigital = (items: Game[]) => getFilteredGames(items, (game: Game) => game.gameCopy.includes(GameCopy.DIGITAL));
    const getPlaying = (items: Game[]) => getFilteredGames(items, (game: Game) => game.completion === Completion.PLAYING);
    const getPaused = (items: Game[]) => getFilteredGames(items, (game: Game) => game.completion === Completion.PAUSED);

    const resetSort = () => {
        setSortAscending(true);
        setSortBy(SortProperty.ALPHABETICAL);
    };

    const buttonData = [
        { onPress: isAll, text: 'All ', numberOfItems: getAll().length },
        { onPress: isPhysical, icon: "sd-card", numberOfItems: getOnlyPhysical(items).length },
        { onPress: isDigital, icon: "cloud-download-alt", numberOfItems: getOnlyDigital(items).length },
        { onPress: isPlaying, icon: "gamepad", numberOfItems: getPlaying(items).length },
        { onPress: isPaused, icon: "pause", numberOfItems: getPaused(items).length },
    ];

    return (
        <View style={styles.buttonGroup}>
            {buttonData.map((button, index) => (
                <FilterButton key={index} filterFunction={button.onPress} iconName={button.icon} text={button.text} numberOfItems={button.numberOfItems} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    buttonGroup: {
        display: 'flex',
        flexDirection: 'row',
    },
});

export default ButtonGroup;