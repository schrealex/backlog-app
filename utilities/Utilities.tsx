const filterCharacters = (title: string): string => {
    const specialCharacters = [
        String.fromCharCode(169), // copyrightSign
        String.fromCharCode(174), // registeredSign
        String.fromCharCode(8482), // trademarkSymbol
        'Remastered',
        '+ A NEW POWER AWAKENS SET',
        ': Duke of Switch Edition',
        'Commander Keen in ',
        ': Bundle of Terror',
        ': Legacy',
        ' — Complete Edition',
    ];

    let filteredTitle = title;
    specialCharacters.forEach(char => {
        filteredTitle = filteredTitle.split(char).join('').trim();
    });

    return filteredTitle;
}

const sortAlphabetical = (list: any, sortAscending: boolean) => {
    return [...list].sort((a: any, b: any) => (sortAscending ? 1 : -1) * a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
};

const sortByHLTB = (list: any, sortAscending: boolean) => {
    return [...list].sort((a: any, b: any) => {
        const aMain = a.hltbInfo?.comp_main;
        const bMain = b.hltbInfo?.comp_main;
        if (aMain && bMain) {
            return sortAscending ? aMain - bMain : bMain - aMain;
        }
        return aMain ? -1 : 1;
    });
};

export { filterCharacters, sortAlphabetical, sortByHLTB }