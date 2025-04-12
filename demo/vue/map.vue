<template>
    <div class="map-wrap">
        <button @click="map.setLayerVisibility('hills')">hills</button>
        <button @click="enablePolygons()">polygons</button>
        <button @click="enableGpws()">gpws</button>
        <button @click="enableLines()">lines</button>
        <button @click="map.forceRerender()">update</button>
        <div class="slidecontainer">
            <input type="range" @change="updateSlider" min="0" max="3000" value="{{ setAlt.value }}" class="slider" id="altSlider" style="width: 300px">
        </div>
        <div id="map" class="map" ref="mapContainer"></div>
    </div>
</template>


<script setup>

import { shallowRef, onMounted, onUnmounted, markRaw } from 'vue';

const mapContainer = shallowRef(null);
const map = shallowRef(null);

    onMounted(() => {
        map.value = markRaw(new CountourMao());
        map.value.on("click", () => {
            const center = map.value.getCenter();
            const zoom = map.value.getZoom();
            console.log("click", center, zoom)
        })

        map.value.showTileBoundaries = true;
    })    
    onUnmounted(() => {
        map.value?.remove();
    })


    function enablePolygons(){
        demSource.GetOptions = GetOptionsOne
        map.value.setLayerVisibility("contours",true)
        map.value.setLayerVisibility("gpwsColors",true)
        setPolygons.value = true
        map.value.forceRerender()
    }

    function enableGpws(){

        const gpws = createGpwsLevel(setAlt.value)
        console.log( gpws )

        demSource.GetOptions = GetOptionsGpwsLevels
        map.value.setLayerVisibility("contours",false)
        map.value.setLayerVisibility("gpwsColors",true)
        setPolygons.value = true
        map.value.forceRerender()
    }

    function enableLines(){
        demSource.GetOptions = GetOptionsOne
        map.value.setLayerVisibility("contours",true)
        map.value.setLayerVisibility("gpwsColors",false)
        setPolygons.value = false
        map.value.forceRerender()
        
    }

    function updateSlider( $e ){
        console.log($e.target.value)
        setAlt.value= $e.target.value
        map.value.forceRerender()
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