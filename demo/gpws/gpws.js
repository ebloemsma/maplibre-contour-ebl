const TILESERVER_AWS = "https://elevation-tiles-prod.s3.amazonaws.com/terrarium"
const TILESERVER_LOCAL_SEATTLE = "http://localhost:3900/services/seattle-z10-mz/tiles/"

function getLocalTileServerUrl( setname, port ){
    return `http://localhost:${port||3900}/services/${setname}/tiles/`
}

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



/**
* Iterates over all integer (x, y) points inside a polygon.
* 
* @param {number[]} coords - Flat array of polygon coordinates [x1, y1, x2, y2, ...].
* @param {function} callback - Called for each point inside the polygon: (x, y).
*/
function iteratePointsInsidePolygon(coords, callback) {
  if (!Array.isArray(coords) || coords.length < 6 || coords.length % 2 !== 0) {
    throw new Error("Invalid coordinate array: must contain pairs of x, y values.");
  }

  // Step 1: Compute bounding box
  let minX = coords[0], maxX = coords[0];
  let minY = coords[1], maxY = coords[1];

  for (let i = 2; i < coords.length; i += 2) {
    const x = coords[i];
    const y = coords[i + 1];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  // Step 2: Iterate over integer grid points within bounding box
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
      if (isPointInPolygon(x + 0.5, y + 0.5, coords)) {
        callback(x, y);
      }
    }
  }
}

/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 * 
 * @param {number} x 
 * @param {number} y 
 * @param {number[]} polygon - Flat array of polygon coordinates [x1, y1, x2, y2, ...].
 * @returns {boolean}
 */
function isPointInPolygon(x, y, polygon) {
  let inside = false;
  const numPoints = polygon.length / 2;

  for (let i = 0, j = numPoints - 1; i < numPoints; j = i++) {
    const xi = polygon[i * 2], yi = polygon[i * 2 + 1];
    const xj = polygon[j * 2], yj = polygon[j * 2 + 1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}


function findTileEdgeMinMax(tile) {
  let edgeMin = -Infinity;
  let edgeMax = Infinity

  for (let col = 0; col < tile.width; col++) {
    const top = tile.get(0, col);
    const botom = tile.get(tile.height - 1, col);
    edgeMin = Math.max(edgeMin, top, botom)
    edgeMax = Math.min(edgeMax, top, botom)
  }

  for (let row = 0; row < tile.height; row++) {
    const left = tile.get(row, 0);
    const right = tile.get(row, tile.width - 1);
    edgeMin = Math.max(edgeMin, left, right)
    edgeMax = Math.min(edgeMax, left, right)
  }
}