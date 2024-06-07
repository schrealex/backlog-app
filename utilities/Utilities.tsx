function filterCharacters(title: string): string {
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

export { filterCharacters }