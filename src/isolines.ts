/*
Adapted from d3-contour https://github.com/d3/d3-contour

Copyright 2012-2023 Mike Bostock

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.
*/


import * as ispolygons from './isopolygons';

import type { HeightTile } from "./height-tile";
import type { IndividualContourTileOptions, IsolineOptions } from './types';

class Fragment {
  start: number;
  end: number;
  points: number[];

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
    this.points = [];
    this.append = this.append.bind(this);
    this.prepend = this.prepend.bind(this);
  }

  append(x: number, y: number) {
    this.points.push(Math.round(x), Math.round(y));
  }

  prepend(x: number, y: number) {
    this.points.splice(0, 0, Math.round(x), Math.round(y));
  }

  lineString() {
    return this.toArray();
  }

  isEmpty() {
    return this.points.length < 2;
  }

  appendFragment(other: Fragment) {
    this.points.push(...other.points);
    this.end = other.end;
  }

  toArray() {
    return this.points;
  }
}

const CASES: [number, number][][][] = [
  [],
  [
    [
      [1, 2],
      [0, 1],
    ],
  ],
  [
    [
      [2, 1],
      [1, 2],
    ],
  ],
  [
    [
      [2, 1],
      [0, 1],
    ],
  ],
  [
    [
      [1, 0],
      [2, 1],
    ],
  ],
  [
    [
      [1, 2],
      [0, 1],
    ],
    [
      [1, 0],
      [2, 1],
    ],
  ],
  [
    [
      [1, 0],
      [1, 2],
    ],
  ],
  [
    [
      [1, 0],
      [0, 1],
    ],
  ],
  [
    [
      [0, 1],
      [1, 0],
    ],
  ],
  [
    [
      [1, 2],
      [1, 0],
    ],
  ],
  [
    [
      [0, 1],
      [1, 0],
    ],
    [
      [2, 1],
      [1, 2],
    ],
  ],
  [
    [
      [2, 1],
      [1, 0],
    ],
  ],
  [
    [
      [0, 1],
      [2, 1],
    ],
  ],
  [
    [
      [1, 2],
      [2, 1],
    ],
  ],
  [
    [
      [0, 1],
      [1, 2],
    ],
  ],
  [],
];

function index(width: number, x: number, y: number, point: [number, number]) {
  x = x * 2 + point[0];
  y = y * 2 + point[1];
  return x + y * (width + 1) * 2;
}

function ratio(a: number, b: number, c: number) {
  return (b - a) / (c - a);
}


/**
 * Generates contour lines from a HeightTile
 *
 * @param interval Vertical distance between contours
 * @param tile The input height tile, where values represent the height at the top-left of each pixel
 * @param extent Vector tile extent (default 4096)
 * @param buffer How many pixels into each neighboring tile to include in a tile
 * @returns an object where keys are the elevation, and values are a list of `[x1, y1, x2, y2, ...]`
 * contour lines in tile coordinates
 */
export default function generateIsolines(
  isoOptions: IndividualContourTileOptions,
  tile: HeightTile,
  extent: number = 4096,
  buffer: number = 1,
  x?, y?, z?
): { [ele: number]: number[][] } {
  // if (!interval) {
  //   return {};
  // }
  const multiplier = extent / (tile.width - 1);
  
  let tld: number, trd: number, bld: number, brd: number;
  let r: number, c: number;
  const segments: { [ele: string]: number[][] } = {};
  const fragmentByStartByLevel: Map<number, Map<number, Fragment>> = new Map();
  const fragmentByEndByLevel: Map<number, Map<number, Fragment>> = new Map();


  //set-DBG 
  // const dbg = Number(`${( x==11, y==21) ? "1" : "0"}`);
  const dbg: string = `${0}`;

  const minXY = multiplier * (0 - 1);
  const maxXY = 4096 + Math.abs(minXY);
  const fullTile: ispolygons.TileInformation = new ispolygons.TileInformation(z, x, y, tile);
  fullTile.minXY = minXY;
  fullTile.maxXY = maxXY;

  if (dbg == "1") console.log(`genIsolines: ${z}/${x}/${y} `)


  function interpolate(
    point: [number, number],
    threshold: number,
    accept: (x: number, y: number) => void,
  ) {
    if (point[0] === 0) {
      // left
      accept(
        multiplier * (c - 1),
        multiplier * (r - ratio(bld, threshold, tld)),
      );
    } else if (point[0] === 2) {
      // right
      accept(multiplier * c, multiplier * (r - ratio(brd, threshold, trd)));
    } else if (point[1] === 0) {
      // top
      accept(
        multiplier * (c - ratio(trd, threshold, tld)),
        multiplier * (r - 1),
      );
    } else {
      // bottom
      accept(multiplier * (c - ratio(brd, threshold, bld)), multiplier * r);
    }
  }

  function createLevelsSet(min, max, levelSet) {
    return levelSet.filter(l => l >= min && l <= max);
  }

  function createLevelsInterval(min, max, interval, filterCb?: Function) {
    const start = Math.ceil(min / interval) * interval;
    const end = Math.floor(max / interval) * interval;

    const _levels: number[] = [];
    for (let threshold = start; threshold <= end; threshold += interval) {
      if (filterCb && !filterCb(threshold)) continue;
      _levels.push(threshold)
    }
    return _levels;
  }

  // Most marching-squares implementations (d3-contour, gdal-contour) make one pass through the matrix per threshold.
  // This implementation makes a single pass through the matrix, building up all of the contour lines at the
  // same time to improve performance.
  for (r = 1 - buffer; r < tile.height + buffer; r++) {
    trd = tile.get(0, r - 1);
    brd = tile.get(0, r);
    let minR = Math.min(trd, brd);
    let maxR = Math.max(trd, brd);
    for (c = 1 - buffer; c < tile.width + buffer; c++) {
      tld = trd;
      bld = brd;
      trd = tile.get(c, r - 1);
      brd = tile.get(c, r);
      const minL = minR;
      const maxL = maxR;
      minR = Math.min(trd, brd);
      maxR = Math.max(trd, brd);
      if (isNaN(tld) || isNaN(trd) || isNaN(brd) || isNaN(bld)) {
        continue;
      }

      const min = Math.min(minL, minR);
      const max = Math.max(maxL, maxR);
      // const start = Math.ceil(min / interval) * interval;
      // const end = Math.floor(max / interval) * interval;

      //ISOPOLY: set tile ma x and min elevation
      const maxElev = Math.max(tld, trd, bld, brd)
      const minElev = Math.min(tld, trd, bld, brd)
      fullTile.max = Math.max(fullTile.max || 0, maxElev);
      fullTile.min = Math.min(fullTile.min || Number.MAX_SAFE_INTEGER, minElev);
      //fullTile.setMin(minElev)
      //convertTileIsolinesToPolygonsfullTile.setMin(minElev)

      let isoLevels: number[] | undefined = undefined;
      if (isoOptions.levels) {
        isoLevels = createLevelsSet(min, max, isoOptions.levels)
      } else if (isoOptions.contours) {
        const levels = isoOptions.contours.map(contourDef => contourDef.contourElevation)
        isoLevels = createLevelsSet(min, max, levels)
      } else if (isoOptions.intervals) {
        const intervals = isoOptions.intervals;
        isoLevels = createLevelsInterval(min, max, intervals[0])
      } else {
        throw new Error("no levels, interval set");
      }

      if (!isoLevels) throw new Error("levels is undefined")

      if (isoOptions.min != null) isoLevels = isoLevels.filter(l => l >= (isoOptions.min ?? -Infinity))

      for (let threshold of isoLevels) {

        const tl = tld > threshold;
        const tr = trd > threshold;
        const bl = bld > threshold;
        const br = brd > threshold;
        for (const segment of CASES[
          (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0)
        ]) {
          let fragmentByStart = fragmentByStartByLevel.get(threshold);
          if (!fragmentByStart)
            fragmentByStartByLevel.set(
              threshold,
              (fragmentByStart = new Map()),
            );
          let fragmentByEnd = fragmentByEndByLevel.get(threshold);
          if (!fragmentByEnd)
            fragmentByEndByLevel.set(threshold, (fragmentByEnd = new Map()));
          const start = segment[0];
          const end = segment[1];
          const startIndex = index(tile.width, c, r, start);
          const endIndex = index(tile.width, c, r, end);
          let f, g;

          if ((f = fragmentByEnd.get(startIndex))) {
            fragmentByEnd.delete(startIndex);
            if ((g = fragmentByStart.get(endIndex))) {
              fragmentByStart.delete(endIndex);
              if (f === g) {
                // closing a ring
                interpolate(end, threshold, f.append);
                if (!f.isEmpty()) {
                  let list = segments[threshold];
                  if (!list) {
                    segments[threshold] = list = [];
                  }
                  list.push(f.lineString());
                }
              } else {
                // connecting 2 segments
                f.appendFragment(g);
                fragmentByEnd.set((f.end = g.end), f);
              }
            } else {
              // adding to the end of f
              interpolate(end, threshold, f.append);
              fragmentByEnd.set((f.end = endIndex), f);
            }
          } else if ((f = fragmentByStart.get(endIndex))) {
            fragmentByStart.delete(endIndex);
            // extending the start of f
            interpolate(start, threshold, f.prepend);
            fragmentByStart.set((f.start = startIndex), f);
          } else {
            // starting a new fragment
            const newFrag = new Fragment(startIndex, endIndex);
            interpolate(start, threshold, newFrag.append);
            interpolate(end, threshold, newFrag.append);
            fragmentByStart.set(startIndex, newFrag);
            fragmentByEnd.set(endIndex, newFrag);
          }
        }
      }
    }
  }

  for (const [level, fragmentByStart] of fragmentByStartByLevel.entries()) {
    let list: number[][] | null = null;
    for (const value of fragmentByStart.values()) {
      if (!value.isEmpty()) {
        if (list == null) {
          list = segments[level] || (segments[level] = []);
        }
        list.push(value.lineString());
      }
    }
  }

  if (dbg == "1") console.log(fullTile.toString())

  if (isoOptions.polygons) {

    if (!isoOptions.contours) {
      throw new Error("polygons only possible with countours or levels defined")
    }

    // generate iso-polygons from isolines 
    // only works with contours or levels set not with intervals   
    try {
      const isoPolygonsMap: ispolygons.ElevationLinesMap = {};

      for (const [elevationLevel, elevationIsoLines] of Object.entries(segments)) {
        const polys = ispolygons.convertTileIsolinesToPolygons(elevationLevel, elevationIsoLines, fullTile);
        if (polys.length > 0) isoPolygonsMap[elevationLevel] = polys;
      }
      if (dbg == "1") console.log("isoPolygonsMap", isoPolygonsMap);

      // generate full tile polys
      let levels;
      if (isoOptions.levels) {
        levels = isoOptions.levels
      } else if (isoOptions.contours) {
        levels = isoOptions.contours.map(contourDef => contourDef.contourElevation)
      } else {
        throw new Error("no levels, contours set");
      }

      const fullTilePolys = ispolygons.generateFullTileIsoPolygons(fullTile, levels, minXY, maxXY, x, y, z)
      if (Object.keys(fullTilePolys).length) {
        // console.log("fullTilePolys",fullTilePolys );
        if (dbg == "1") console.log(`- fullTilePolys`, fullTilePolys)
      }
      const mergedPolys = mergeElevationMaps(isoPolygonsMap, fullTilePolys)

      if (dbg == "1") console.log("- mergedPolys:", mergedPolys);
      return mergedPolys;

    } catch (e) {
      console.log(e);
    }
  } else {

    const isos = {};
    for (const [elevationLevel, elevationIsoLines] of Object.entries(segments)) {
      // const levelIsoLines = segments[elevationLevel]
      const lineIndex = new ispolygons.LineIndex(elevationIsoLines, minXY, maxXY);
      if (dbg == "1") console.log("lineIndex", elevationLevel, lineIndex.debugIndex())
      //if (polys.length > 0)
      isos[elevationLevel] = lineIndex.toArrayAllInner(l => !l.isTiny);
    }
    return isos
  }

  return segments;
}

/**
 * 
 * @param map1 merges an ElevLineMap onto another. changes the map1 object
 * @param map2 
 */
function mergeElevationMaps(map1: ispolygons.ElevationLinesMap, map2: ispolygons.ElevationLinesMap) {
  const merged = {};

  const lowCutout = 0

  for (const [lvlStr, lines] of Object.entries(map1)) {
    const lvl = Number(lvlStr)
    if (lowCutout != undefined && lvl < lowCutout) continue;
    if (!merged[lvl])
      merged[lvl] = [];
    //console.log("merged--",{...merged})
    merged[lvl].push(...lines);
  }
  //console.log("entries",Object.entries(map2))
  for (const [lvlStr, lines] of Object.entries(map2)) {
    // console.log("lvl,merged",lvl,{...merged})
    const lvl = Number(lvlStr)
    if (lowCutout != undefined && lvl < 0) continue;
    if (!merged[lvl])
      merged[lvl] = [];
    //console.log("merged--",{...merged})
    merged[lvl].push(...lines);
  }
  return merged;

}
