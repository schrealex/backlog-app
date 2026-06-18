import * as React from 'react';
import { StyleSheet } from 'react-native';
import { View } from './Themed';
import { FilterButton } from './FilterButton';
import { Game } from '../types/Game';
import { GameCopy } from '../constants/GameCopy';
import { Completion } from '../constants/Completion';
import { SortProperty } from '../constants/SortProperty';

const ButtonGroup = ({ items, setBacklogData, setSortAscending, setSortBy } : { items: any, setBacklogData: any, setSortAscending: any, setSortBy: any }) => {

    const setFilteredDataAndResetSort = (filterFunction: () => Game[]) => {
        setBacklogData(filterFunction());
        resetSort();
    };

    const isAll = () => setFilteredDataAndResetSort(getAll);
    const isPhysical = () => setFilteredDataAndResetSort(getOnlyPhysical);
    const isDigital = () => setFilteredDataAndResetSort(getOnlyDigital);
    const isPlaying = () => setFilteredDataAndResetSort(getPlaying);
    const isPaused = () => setFilteredDataAndResetSort(getPaused);

    const filteredGroups = React.useMemo(() => {
        const sourceItems = items as Game[];
        return {
            all: sourceItems,
            onlyPhysical: sourceItems.filter((game: Game) => game.gameCopy.includes(GameCopy.PHYSICAL)),
            onlyDigital: sourceItems.filter((game: Game) => game.gameCopy.includes(GameCopy.DIGITAL)),
            playing: sourceItems.filter((game: Game) => game.completion === Completion.PLAYING),
            paused: sourceItems.filter((game: Game) => game.completion === Completion.PAUSED),
        };
    }, [items]);

    const getAll = () => filteredGroups.all;
    const getOnlyPhysical = () => filteredGroups.onlyPhysical;
    const getOnlyDigital = () => filteredGroups.onlyDigital;
    const getPlaying = () => filteredGroups.playing;
    const getPaused = () => filteredGroups.paused;

    const resetSort = () => {
        setSortAscending(true);
        setSortBy(SortProperty.ALPHABETICAL);
    };

    const buttonData = [
        { onPress: isAll, text: 'All ', numberOfItems: getAll()?.length },
        { onPress: isPhysical, icon: "sd-card", numberOfItems: getOnlyPhysical()?.length },
        { onPress: isDigital, icon: "cloud-download-alt", numberOfItems: getOnlyDigital()?.length },
        { onPress: isPlaying, icon: "gamepad", numberOfItems: getPlaying()?.length },
        { onPress: isPaused, icon: "pause", numberOfItems: getPaused()?.length },
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