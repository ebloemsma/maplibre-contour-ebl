<template>
    <div class="map-wrap">
        
        <button @click="map.forceRerender()">update</button>
        mode:<select v-model="demOptionsMode">
            <option>gpws</option>
            <option>line</option>
        </select>


        <div>
            <input type="checkbox" id="demOptionsPolygons" v-model="demOptionsPolygons" />
            <label for="demOptionsPolygons">dem-polygon</label>
        </div>

        <div v-for="radioGroup in Object.keys( userControlLayers ?? {})" style="border: 1px solid gray">
            <div v-if="radioGroup">{{ radioGroup || "--" }}
                <template v-for="layer in userControlLayers[radioGroup]">            
                    <input type="radio" :id="layer.id" :value="layer.id" v-model="layerVisibleGroup[radioGroup]" />
                    <label :for="layer.id">{{layer.id}}</label>
                </template>
                <input type="radio" id="off" :value="false" v-model="layerVisibleGroup[radioGroup]" />
                <label for="off">off</label>
            </div>
        </div>

        <div style="border: 1px solid gray">
           <template v-for="layer in userControlLayers['']" >
                <input type="checkbox" :id="layer.id" :value="layer.id" v-model="layerVisibleSingle" />
                <label :for="layer.id">{{layer.id}}</label>
           </template>   
        </div>

    
        

        <div class="slidecontainer">
            <input type="range" v-model="demOptionsAltitude" min="0" max="3000" class="slider"
                id="altSlider" style="width: 300px">
            <span id="setAlt">{{ demOptionsAltitude }}</span>
        </div>
        <div id="map" class="map" ref="mapContainer"></div>
    </div>
</template>


<script setup>

import { shallowRef, onMounted, onUnmounted, markRaw, ref, watch, reactive } from 'vue';

const layersControlGroups = ref({})
const userControlLayers = ref({})
const layerVisibleSingle = ref([])
const layerVisibleGroup = reactive({})


const demOptionsAltitude = ref(1289);
const demOptionsPolygons = ref(true)
const demOptionsMode = ref("line")





watch( [ layerVisibleGroup, layerVisibleSingle],()=>{
    // console.log("layerControl",layerVisibleGroup,layerVisibleSingle.value)
    const layersSelected = [ ...Object.values(layerVisibleGroup), ...layerVisibleSingle.value ] 
    // console.log("layersSelected",layersSelected)
    map.value.userControlUpdateLayerVisbility( layersSelected )

})

watch( [demOptionsMode,demOptionsPolygons,demOptionsAltitude],()=>{
    // console.log("demOptions",demOptionsMode.value,demOptionsPolygons.value,demOptionsAltitude.value)
    map.value.forceRerender()
})

const mapContainer = shallowRef(null);
const map = shallowRef(null);

onMounted(() => {
    map.value = markRaw(new CountourMap());
    map.value.on("click", (e) => {
        // console.log(map.value)
        const meter2Feet = 3.28084;
        const elevationMeters = map.value.terrain.getElevationForLngLatZoom(maplibregl.LngLat.convert([e.lngLat.lng, e.lngLat.lat]), map.value.transform.tileZoom)
        const elevationFeet = elevationMeters * meter2Feet
        const zoom = map.value.getZoom()
        console.log(e.lngLat, { zoom, elevationMeters, elevationFeet })
    })
    map.value.on( "load",()=>{
        map.value.showTileBoundaries = true;

        userControlLayers.value = map.value.userControlGetLayersByRadioGroup(  )
        console.log("userControlLayers",userControlLayers.value )
        // console.log("userControlLayers keys", Object.keys(userControlLayers.value) )
        

        // sync visibilities
        const visSingle = userControlLayers.value[""].filter( l => l.layout.visibility === "visible" ).map( l=>l.id)
        // console.log("lvisSingle",lvisSingle )
        layerVisibleSingle.value = visSingle


        const groups = Object.keys(userControlLayers.value)
        let visGroup = {}
        groups.filter(g=>g!=="").forEach( groupname=> {
            const glayers = userControlLayers.value[groupname]
            // visGroup[groupname] = glayers.find( l => l.layout.visibility === "visible" ).id
            // console.log(glayers) 
        })
        Object.assign(layerVisibleGroup,visGroup)
        

        

        //enableGpws();
        layersControlGroups.value = map.value.userControlGetRadioGroups()
        console.log("layersControlGroups", layersControlGroups.value )
        
    })


    
    
})
onUnmounted(() => {
    map.value?.remove();
})



demSource.GetOptions = (tile) => {
    const alt = Number(demOptionsAltitude.value)
    // console.log("GetOptions", tile, demOptionsMode.value, alt, demOptionsPolygons.value)
    
    let contours = null;

    if (demOptionsMode.value == "gpws") contours = GetOptionsGpwsLevels(alt )
    else contours = GetOptionsOne(alt, demOptionsPolygons.value)
    
    const config = {
        contours,
        polygons: demOptionsPolygons.value,
        deltaBaseAltitude: alt, 
    }

    //console.log("GetOptions", config)
    return config;
}


</script>


<style scoped>
@import 'https://unpkg.com/maplibre-gl@^5.3.0/dist/maplibre-gl.css';

.map-wrap {
    position: relative;
    width: 100%;
    height: calc(100vh - 77px);
    /* calculate height of the screen minus the heading */
}

.map {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 1px solid red;
}

.watermark {
    position: absolute;
    left: 10px;
    bottom: 10px;
    z-index: 999;
}
</style>