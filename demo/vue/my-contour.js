const TILESERVER_AWS = "https://elevation-tiles-prod.s3.amazonaws.com/terrarium"
const TILESERVER_LOCAL_SEATTLE = "http://localhost:3900/services/seattle-z10-mz/tiles/"

function getLocalTileServerUrl(setname, port) {
  return `http://localhost:${port || 3900}/services/${setname}/tiles/`
}

const demTileServerBaseUrl = getLocalTileServerUrl("seattle-mz") // TILESERVER_AWS

const demSource = new mlcontour.DemSource({
  url: demTileServerBaseUrl + "/{z}/{x}/{y}.png",
  //url: "http://localhost:8080/services/seattle-mz/tiles/{z}/{x}/{y}.png", 
  encoding: "terrarium",
  maxzoom: 12,
  minzoom: 5,
  worker: true, // offload isoline computation to a web worker to reduce jank
  cacheSize: 100, // number of most-recent tiles to cache
  timeoutMs: 10_000,
});
demSource.setupMaplibre(maplibregl);


const defaultThresholdCfg = {
  // zoom: [minor, major]
  11: [200, 1000],
  12: [100, 500],
  14: [50, 200],
  15: [20, 100],
}

const myCountour = {
  sources: {
    dem: {
      type: "raster-dem",
      encoding: "terrarium",
      tiles: [demSource.sharedDemProtocolUrl], // share cached DEM tiles with contour layer
      maxzoom: 14,
      tileSize: 256,
    },
    contourSourceFeet: {
      type: 'vector',
      tiles: [
        demSource.contourProtocolUrl({
          // meters to feet
          multiplier: 3.28084,
          overzoom: 1,
          //maxFetchZoom: 10,
          thresholds: defaultThresholdCfg,
          
          elevationKey: 'ele',
          intervalKey: 'level',
          contourLayer: 'contours',
          extent: 4096,
          buffer: 1,
        })
      ],
      maxzoom: 13,
      minzoom: 4
    }
  },
  layers: [
    {
      id: "hills",
      type: "hillshade",
      source: "dem",
      paint: {
        "hillshade-exaggeration": 1,
      },
      layout: {
        visibility: "visible",
      }
    },
    {
      id: "contours",
      type: "line",
      source: "contourSourceFeet",
      "source-layer": "contours",
      paint: {
        "line-color": "rgba(255, 36, 0, 100%)",
        "line-width": ["match", ["get", "level"], 1, 3, 3],
      },
      layout: {
        "line-join": "round",
      },
    },
    {
      id: "contour-labels",
      type: "symbol",
      source: "contourSourceFeet",
      "source-layer": "contours",
      //filter: [">", ["get", "level"], 0],
      layout: {
        "symbol-placement": "line",
        "text-size": 10,
        "text-field": ["concat", ["number-format", ["get", "ele"], {}], "'"],
        "text-font": ["Noto Sans Bold"],
      },
      paint: {
        "text-halo-color": "white",
        "text-halo-width": 1,
      },
    }
  ]
}