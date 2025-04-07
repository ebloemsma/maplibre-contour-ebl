

const maptiler = {
    layers: [
        {
            "id": "background",
            "type": "background",
            "layout": {
              "visibility": "visible"
            },
            "paint": {
              "background-color": "#fff"
            }
          },
        {
            "id": "landuse_residential",
            "type": "fill",
            "source": "openmaptiles",
            "source-layer": "landuse",
            "maxzoom": 24,
            "layout": {
                "visibility": "visible"
            },
            "paint": {
                "fill-color": "rgba(136, 136, 136,0.3)"
            },
            "metadata": {

            },
            "filter": [
                "all",
                [
                    "in",
                    "class",
                    "residential",
                    "suburbs",
                    "neighbourhood"
                ]
            ]
        },
        {
            "id": "waterway_river",
            "type": "line",
            "source": "openmaptiles",
            "source-layer": "waterway",
            "layout": {
              "line-cap": "round",
              "visibility": "visible"
            },
            "paint": {
              "line-color": "#a0c8f0",
              "line-width": {
                "base": 1.2,
                "stops": [
                  [11, 0.5],
                  [20, 6]
                ]
              }
            },
            "metadata": {
      
            },
            "filter": [
              "all",
              [
                "==",
                "class",
                "river"
              ],
              [
                "!=",
                "brunnel",
                "tunnel"
              ],
              [
                "!=",
                "intermittent",
                1]
            ]
          },
          {
            "id": "water",
            "type": "fill",
            "source": "openmaptiles",
            "source-layer": "water",
            "layout": {
              "visibility": "visible"
            },
            "paint": {
              "fill-color": "rgba(134, 204, 250, 1)"
            },
            "metadata": {
      
            },
            "filter": [
              "all",
              [
                "!=",
                "intermittent",
                1],
              [
                "!=",
                "brunnel",
                "tunnel"
              ]
            ]
          },
          {
            "id": "aeroway_fill",
            "type": "fill",
            "source": "openmaptiles",
            "source-layer": "aeroway",
            //"minzoom": 5,
            "layout": {
              "visibility": "visible"
            },
            "paint": {
              "fill-color": "rgb(187, 187, 187)",
              "fill-opacity": 1
            },
            "metadata": {
      
            },
            "filter": [
              "==",
              "$type",
              "Polygon"
            ]
          },
          {
            "id": "aeroway_runway",
            "type": "line",
            "source": "openmaptiles",
            "source-layer": "aeroway",
            "minzoom": 5,
            "layout": {
              "visibility": "visible"
            },
            "paint": {
              "line-color": "#888",
              "line-width": {
                "base": 4,
                "stops": [
                  [11, 3],
                  [20, 16]
                ]
              }
            },
            "metadata": {
      
            },
            "filter": [
              "all",
              [
                "==",
                "$type",
                "LineString"
              ],
              [
                "==",
                "class",
                "runway"
              ]
            ]
          },
          {
            "id": "aeroway_taxiway",
            "type": "line",
            "source": "openmaptiles",
            "source-layer": "aeroway",
            "minzoom": 8,
            "layout": {
              "visibility": "visible"
            },
            "paint": {
              "line-color": "#aaa",
              "line-width": {
                "base": 3,
                "stops": [
                  [11, 3],
                  [20, 6]
                ]
              }
            },
            "metadata": {
      
            },
            "filter": [
              "all",
              [
                "==",
                "$type",
                "LineString"
              ],
              [
                "==",
                "class",
                "taxiway"
              ]
            ]
          },

    ]
}
