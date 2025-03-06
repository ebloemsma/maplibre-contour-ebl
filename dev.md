# maplibre-contour

maplibre-contour is a plugin to render contour lines in [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js) from `raster-dem` sources that powers the terrain mode for [onthegomap.com](https://onthegomap.com).

![Topographic map of Mount Washington](demo.png)

[Live example](https://onthegomap.github.io/maplibre-contour) | [Code](./index.html)

## changes
- update "canvas" dependency due to windows build problems


## npm prepare
```
# upgrade canvas to avoid errors on windows
npm remove canvas
npm install canvas@next
npm install
```

## build
- perform in vscode terminal
