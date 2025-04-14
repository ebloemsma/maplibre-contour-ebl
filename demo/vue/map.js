


const useMaptiler = false;

const sources = Object.assign({}, (useMaptiler)?maptiler.sources:{}, myCountour.sources)
const layers = [...(useMaptiler)?maptiler.layers:[], ...myCountour.layers, ...gpwsMapOptions.layers]

const greenLandState = { lng: 6.06, lat: 58.86, zoom: 11.4 };

const seattleState = { lng: -122.1, lat: 47.90, zoom: 11 };

const initTile11_329_713 = { lng: -122.087, lat: 47.807, zoom: 11 };
const initTile11_328_713 = { lng: -122.236, lat: 47.803, zoom: 11 };

const initialState = initTile11_328_713

class CountourMap extends maplibregl.Map {
    constructor() {
        const options = {
            hash: true,
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
                terrain: {
                    source: 'dem',
                    exaggeration: 1
                },
            },
            
        };
        super(options)
    }
    test() {
        console.log("test")
    }



    setLayerVisibility(name, setVisible = "toggle") {
        let visValue = this.getLayoutProperty(name, "visibility")
        // console.log(visValue)

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

    userControlUpdateLayerVisbility( layersSelected ){
        // console.log("updateLayers", this.getStyle().layers )

        for ( const layer of this.getStyle().layers ) {
            
            if( layer.metadata?.usercontrol ){
                const isUserSelected = layersSelected.includes( layer.id )
                // console.log("layerUserControl",layer.id,isUserSelected)
                this.setLayerVisibility( layer.id, isUserSelected )
            }
        }
    }

    userControlGetRadioGroups(){
        const groups = this.getStyle().layers.map( l => l.metadata?.usercontrol?.radiogroup ).filter((value, index, self) => self.indexOf(value) === index)
        return groups;
    }


    /**
     * gets all layers with usercontrol, with options to filter
     * @param {*} options 
     * @returns 
     */
    userControlGetLayers( options = null){
        const { radiogroup = undefined } = options || {};

        function filterLayers ( layer ) {
            if(!layer.metadata?.usercontrol) return false;
            const control = layer.metadata?.usercontrol;
            
            // (negative) filter radiogroup if set in filter and in md, or not set
            if( !( control?.radiogroup===radiogroup || ( !control?.radiogroup && !radiogroup ) ) ) return false;
            
            return true;
        }

        const layers = this.getStyle().layers.filter( filterLayers );

        // console.log("userControlGetLayers",{ options,layers,radiogroup })

        return layers;

    }

    userControlGetLayersByRadioGroup(){
        const result={};
        for ( const radiogroup of this.userControlGetRadioGroups() ){
            const layers = this.userControlGetLayers( {radiogroup} )
            const key = (radiogroup)?radiogroup: "";
            result[key] = layers
        }
        return result;
    }
}
