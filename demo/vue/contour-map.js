




const sources = Object.assign({}, maptiler.sources, myCountour.sources)
const layers = [...maptiler.layers, ...myCountour.layers, ...terrainLayers.layers]

const greenLandState = { lng: 6.06, lat: 58.86, zoom: 11.4 };

const seattleState = { lng: -122.1, lat: 47.90, zoom: 11 };

const initialState = seattleState

class CountourMao extends maplibregl.Map {
    constructor() {
        const options = {
            showTileBoundaries: true,
            container: 'map',
            //style: 'https://api.maptiler.com/maps/streets/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL',
            center: [initialState.lng, initialState.lat],
            zoom: initialState.zoom,
            style: {
                version: 8,
                glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
                sources,
                layers,
            },
        };
        super(options)
    }
    test() {
        console.log("test")
    }



    setLayerVisibility(name, setVisible = "toggle") {
        let visValue = this.getLayoutProperty(name, "visibility")
        console.log(visValue)

        if (visValue === null) return;

        if (visValue === "visible") visValue = true;
        if (visValue === "none") visValue = false;


        if (setVisible == "toggle") visValue = !visValue;
        else  visValue = setVisible;

        if (visValue === true) visValue = "visible";
        if (visValue === false) visValue = "none";

        this.setLayoutProperty(name, "visibility", visValue)
    }

    forceRerender() {
        if ( this.style.sourceCaches['contourSourceFeet'] ){
            this.style.sourceCaches['contourSourceFeet'].clearTiles()
            this.style.sourceCaches['contourSourceFeet'].update(this.transform)
        }
    }

}
