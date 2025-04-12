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
function createGpwsLevel(refAltitude, levelCfg) {

    const useCfg = (levelCfg || gpwsPatterns)
    const gpwsLevels = Object.keys(useCfg).map(k => Number(k)).sort((a, b) => b - a).map(rl => [rl, rl + refAltitude])

    //console.log(gpwsLevels)

    const result = [];
    firstNegativeIncluded = false;
    for (let [rele, ele] of gpwsLevels) {
        const value = {
            level: ele,
            props: {
                gpwsLvl: rele,
                gpwsPattern: useCfg[`${rele}`]

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

let SelectedGPWSAltitude = 0;

const simpleLevels = [
    0,
]

const setPolygons = Vue.ref(false)
const setAlt = Vue.ref(0)

function GetOptionsOne(){

    const setAltitude = setAlt.value

    const config = {
        levels: [setAltitude],
        levelDef: [
            {
                level: setAltitude,
            }
        ],
        //intervals : [100], //levels[0]
        polygons: setPolygons.value,
        deltaReference: setAltitude, //400,
    }

    return config;
}

function GetOptionsGpwsLevels (tileCoords) {

    const gpwsAltitude = setAlt.value

    const gpwsLevels = createGpwsLevel(gpwsAltitude);
    //console.log("createGpwsLevel", gpwsLevels.map(e => [e.level, e.props.gpwsPattern]))

    const config = {
        levels: gpwsLevels.map(e => e.level), //[ -300, 0,100, 400],
        levelDef: gpwsLevels,
        //intervals : [100], //levels[0]
        polygons: true,
        deltaReference: gpwsAltitude, //400,
    }

    return config;
}

demSource.GetOptions = GetOptionsOne


const terrainLayers = {
    layers: [
        {
            id: 'gpwsPattern',
            type: 'fill',
            source: 'contourSourceFeet',
            'source-layer': 'contours',
            //filter: ['<', ['get', 'elev'], 3400],
            paint: {
                'fill-pattern': ['get', 'gpwsPattern'],
                // 'fill-pattern': ['match', ['get', 'delta'], +2000, "red_high", +1000, "amber_high",  -500, "amber_low", -1000, "green_high", -2000, "green_low", ""],
                'fill-opacity': 0.2,
                // 'fill-pattern': 'amber_low'
            },
            layout: {
                visibility: "none",
            }
        },

        {
            id: 'gpwsColors',
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
            }
        },
    ]
}