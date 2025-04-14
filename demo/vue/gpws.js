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
    -500,
    -1000,
    -2000,
]
function createGpwsLevel(altitude, levelCfg) {

    const refAltitude = Number(altitude)

    const lowCutOutElevation = 30;

    const useCfg = gpwsPatterns
    const gpwsLevels = Object.keys(useCfg).map(k => Number(k)).sort((a, b) => b - a).map(rl => [rl, rl + refAltitude])

    // console.log("gpwslevels",gpwsLevels)

    const result = [];
    firstNegativeIncluded = false;
    for (let [rele, ele] of gpwsLevels) {
        const value = {
            contourElevation: ele,
            addProperties: {
                gpwsLvl: rele,
                gpwsPattern: useCfg[`${rele}`]

            }
        }
        if (ele > lowCutOutElevation) {
            result.push(value);
        } else if (!firstNegativeIncluded) {
            result.push(Object.assign(value, { contourElevation: lowCutOutElevation }));
            firstNegativeIncluded = true;
        }
    }
    return result;
}


function GetOptionsGpwsLevels (altitude) {

    const gpwsLevels = createGpwsLevel(altitude);
    //console.log("createGpwsLevel", gpwsLevels.map(e => [e.level, e.addProperties.gpwsPattern]))
    
    
    return gpwsLevels;
}




const gpwsMapOptions = {
    layers: [
        {
            id: 'gpwsPattern',
            type: 'fill',
            source: 'contourSourceFeet',
            'source-layer': 'contours',
            //filter: ['<', ['get', 'elev'], 3400],
            paint: {
                // 'fill-pattern': ['get', 'gpwsPattern'],
                // 'fill-pattern': ['match', ['get', 'delta'], +2000, "red_high", +1000, "amber_high",  -500, "amber_low", -1000, "green_high", -2000, "green_low", ""],
                // 'fill-opacity': 0.2,
                // 'fill-pattern': 'amber_low'
            },
            layout: {
                visibility: "none",
            },
            metadata: {
                usercontrol: {
                    radiogroup: "gpws"
                }
            }
        },

        {
            id: 'gpwsColor',
            type: 'fill',
            source: 'contourSourceFeet',
            'source-layer': 'contours',
            paint: {
                'fill-color': ['match', ['get', 'gpwsLvl'], +2000, "#f00", +1000, "#f5b642", -500, "#f5e342", -1000, "#09ff00", -2000, "#99fa96", "#000"],
                // 'fill-color': ['match', ['get', 'delta'], -500, "#f5e342", "#0f0"],
                // 'fill-color': ['match', ['get', 'ele'], 0, "#00f", "#0f0"],
                'fill-opacity': 0.3,
            }, 
            layout: {
                visibility: "none",
            },
            metadata: {
                usercontrol: {
                    radiogroup: "gpws"
                }
            }
        },

        
    ]
}