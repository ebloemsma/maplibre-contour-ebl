const gpwsPatterns = {
    "2000": "red_high",
    "1000": "amber_high",
    "-500": "amber_low",
    "-1000": "green_high",
    "-2000": "green_low",
}

const gpwsLevelsCfg = [
    2000,
    1000,
    -1000,
    -2000,
    -500,
]
function createGpwsLevel(refAltitude) {
    const gpwsLevels = gpwsLevelsCfg.sort((a, b) => b - a).map(rl => [rl, rl + SelectedGPWSAltitude]);

    const result = [];
    firstNegativeIncluded = false;
    for (let [rele, ele] of gpwsLevels) {
        const value = {
            level: ele,
            props: {
                gpwsLvl: rele,
                gpwsPattern: gpwsPatterns[`${rele}`]

            }
        }
        if (ele > 0) {
            result.push(value);
        } else if (!firstNegativeIncluded) {
            result.push(Object.assign(value, { level: 0 }));
            firstNegativeIncluded = true;
        }
    }
    return result;
}