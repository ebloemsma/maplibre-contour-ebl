import { classifyRings } from "@mapbox/vector-tile";
import type { HeightTile } from "./height-tile";

export class TileInformation {

    setTile(tile: HeightTile) {

        const { edgeMin, edgeMax } = findTileEdgeMinMax(tile)
        this.edgeMin = Math.round(edgeMin)
        this.edgeMax = Math.round(edgeMax)
    }

    edgeMax?: number;
    edgeMin?: number;

    max?: number;
    min?: number;
    x?: number;
    y?: number;
    z?: number;
    minXY?: number;
    maxXY?: number;
    minElev?: number;
    maxElev?: number;
    constructor(z, x, y, tile?) {
        this.z = z;
        this.y = y;
        this.x = x;
        if (tile) this.setTile(tile)
    }

    /**
     * checks tile against this coordinates
     * if coordinate is null this coordinate is not checked
     * 
     * @param z 
     * @param x 
     * @param y 
     * @returns 
     */
    isTile(z, x, y) {

        const isZ = (z !== null) ? this.z == z : true;
        const isY = (y !== null) ? this.y == y : true;
        const isX = (x !== null) ? this.x == x : true;
        return (isZ && isX && isY)

    }

    toString() {
        return `Tile: ${this.z}/${this.x}/${this.y}, min/max: ${Math.round(this.min || 0)}/${Math.round(this.max || 0)}  edgemin/max: ${this.edgeMin}/${this.edgeMax}` //min/maxXY: ${this.minXY},${this.maxXY} `
    }

    coordString() {
        return `Tile: ${this.z}/${this.x}/${this.y}`
    }

}

// 1 = x, 2=y;
type LinePoint = {
    x: number;
    y: number;
}

type SearchDirection = "first" | "before" | "after";

type LineEndingDirection = "start" | "end";

type EdgeLineIndex = {
    s: TiledLine[];
    e: TiledLine[];
}


type EdgeId = 1 | 2 | 4 | 8;

class TileEdgeLineIndex {
    1: EdgeLineIndex;
    2: EdgeLineIndex;
    4: EdgeLineIndex;
    8: EdgeLineIndex;

    static __createFromLines(lines, minXY, maxXY) {
        const lineObjects = lines.map(l => {
            return new TiledLine(l, minXY, maxXY);
        });
        return TileEdgeLineIndex.__createFromTileLines(lineObjects, minXY, maxXY)
    }
    static __createFromTileLines(lineObjectsAll, minXY, maxXY) {
        // const lineObjects = lines.map(l => {
        //     return new TiledLine(l, minXY, maxXY);
        // });
        // console.log( inner )

        const lineObjects = lineObjectsAll.filter(l => (!l.isClosed && !l.isTiny))

        const topStart = lineObjects.filter(lo => lo.brd.start == 1).sort((a, b) => {
            return (a.start.x - b.start.x);
        });
        const rightStart = lineObjects.filter(lo => lo.brd.start == 2).sort((a, b) => {
            return (a.start.y - b.start.y);
        });
        // x von groß zu klein
        const bottomStart = lineObjects.filter(lo => lo.brd.start == 4).sort((a, b) => {
            return (b.start.x - a.start.x);
        });
        //von oben nach unten
        const leftStart = lineObjects.filter(lo => lo.brd.start == 8).sort((a, b) => {
            return (b.start.y - a.start.y);
        });
        //------
        const topEnd = lineObjects.filter(lo => lo.brd.end == 1).sort((a, b) => {
            return (a.end.x - b.end.x);
        });
        const rightEnd = lineObjects.filter(lo => lo.brd.end == 2).sort((a, b) => {
            return (a.end.y - b.end.y);
        });
        // x von groß zu klein
        const bottomEnd = lineObjects.filter(lo => lo.brd.end == 4).sort((a, b) => {
            return (b.end.x - a.end.x);
        });
        //von oben nach unten
        const leftEnd = lineObjects.filter(lo => lo.brd.end == 8).sort((a, b) => {
            return (b.end.y - a.end.y);
        });

        const index = new TileEdgeLineIndex();

        const data = {
            1: {
                s: topStart,
                e: topEnd,
            },
            2: {
                s: rightStart,
                e: rightEnd,
            },
            4: {
                s: bottomStart,
                e: bottomEnd,
            },
            8: {
                s: leftStart,
                e: leftEnd,
            }
        } as TileEdgeLineIndex;

        return Object.assign(index, data)
    }

    removeLine(line: TiledLine) {
        if (!line) return;
        for (const [edge, node] of Object.entries(this)) {
            //console.log( edge, node)
            node.s = node.s.filter(l => l !== line)
            node.e = node.e.filter(l => l !== line)
        }
    }
}

function findBorder(x, y, minXY, maxXY) {
    let left = x == minXY;
    let top = y == minXY;
    let right = x == maxXY;
    let bottom = y == maxXY;

    let code = (top ? 1 : 0 | (right ? 2 : 0) | (bottom ? 4 : 0) | (left ? 8 : 0));

    // hack to fix corner points
    if (code == 6) code = 2;
    if (code == 12) code = 4;
    if (code == 3) code = 1;
    if (code == 9) code = 8;


    return code;
}

function hashArray(arr) {
    if (!Array.isArray(arr) || !arr.every(Number.isFinite)) {
        throw new Error("Input must be an array of numbers");
    }

    let hash = 0x811c9dc5; // FNV-1a 32-bit offset basis
    const prime = 0x01000193; // FNV prime

    for (let num of arr) {
        let bytes = new DataView(new ArrayBuffer(4));
        bytes.setFloat32(0, num);

        for (let i = 0; i < 4; i++) {
            hash ^= bytes.getUint8(i);
            hash = (hash * prime) >>> 0; // Ensure 32-bit unsigned integer overflow
        }
    }

    return hash.toString(16); // Return hash as hex string
}


function getLineLast(line) {
    return { x: line[line.length - 2], y: line[line.length - 1] }
}
function getLineFirst(line) {
    return { x: line[0], y: line[1] }
}

function getLineBBox(line) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const numPoints = line.length / 2;
    for (let i = 0; i < numPoints; i++) {
        const x1 = line[2 * i];
        const y1 = line[2 * i + 1];

        maxX = Math.max(maxX, x1);
        maxY = Math.max(maxY, y1);
        minX = Math.min(minX, x1);
        minY = Math.min(minY, y1);
    }

    return {
        minX,
        minY,
        maxX,
        maxY
    }

}

function getLineBorderCode(line: LineDefinition, minXY, maxXY) {

    if (!line) throw new Error("empty line")

    const l = line.length;
    let sx = line[0];
    let sy = line[0 + 1];

    let ex = line[l - 2];
    let ey = line[l - 1];

    const start = findBorder(sx, sy, minXY, maxXY);
    const end = findBorder(ex, ey, minXY, maxXY);
    let code = start + end;
    return { start, end, code: [start, end] };
}



export function generateFullTileIsoPolygons(fullTile: TileInformation, levels, minXY, maxXY, x, y, z) {

    // console.log("ADD FULL:",fullTile,gpwslevels)


    if (fullTile.min == undefined) return [];

    const fullTilePolygons: ElevationLinesMap = {};

    for (const lvl of levels) {

        if (fullTile.min >= lvl) {
            const polygon = LineIndex.getFullTilePolygon(minXY, maxXY);
            //console.log(`ADD full layer tile ${z},${x},${y}: ${lvl}` , line)
            if (!fullTilePolygons[lvl]) fullTilePolygons[lvl] = [];
            fullTilePolygons[lvl].push(polygon)
        }
    }

    // if( Object.keys(fullTilePolygons).length ) {
    //     // console.log("fullTilePolys",fullTilePolys );
    //     console.log(`generateFullTileIsoPolygons`, fullTile.toString(), fullTilePolygons )
    // }

    return fullTilePolygons;
}

export function findTileEdgeMinMax(tile) {

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
    return { edgeMin, edgeMax }
}

type PolygonInfo = {
    length?: number;
    winding?: "cw" | "ccw";
    area?: number;

}

export function analyzePolygon(coords) {
    if (coords.length < 6) {
        throw new Error("A polygon must have at least 3 points (6 coordinates).");
    }
    if (coords.length % 2 !== 0) {
        throw new Error("Coordinate list must have an even number of values (x, y pairs).");
    }

    // Check if the polygon is closed
    const firstX = coords[0];
    const firstY = coords[1];
    const lastX = coords[coords.length - 2];
    const lastY = coords[coords.length - 1];

    if (firstX !== lastX || firstY !== lastY) {
        throw new Error("Polygon must be closed (first and last points must match).");
    }

    // https://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order

    let area = 0;
    let perimeter = 0;
    const numPoints = coords.length / 2;

    for (let i = 0; i < numPoints; i++) {
        const x1 = coords[2 * i];
        const y1 = coords[2 * i + 1];
        const x2 = coords[(2 * ((i + 1) % numPoints))];
        const y2 = coords[(2 * ((i + 1) % numPoints)) + 1];

        // Shoelace formula component
        area += (x1 * y2 - x2 * y1);

        // Distance between consecutive points
        const dx = x2 - x1;
        const dy = y2 - y1;
        perimeter += Math.hypot(dx, dy);
    }

    const signedArea = area / 2;
    const absoluteArea = Math.abs(signedArea);
    const winding = signedArea < 0 ? 'ccw' : 'cw';

    return {
        //isTiny,
        signedArea,
        area: absoluteArea,
        length: perimeter,
        winding
    } as PolygonInfo;
}

type LineDefinition = number[];

type LineArray = LineDefinition[];

type Elevation = number;

// holds lines[] indexed at elevation
export type ElevationLinesMap = Record<Elevation, LineArray>

class TiledLine {

    done: boolean;
    line?: LineDefinition;
    minXY?: number;
    maxXY?: number;
    start: any;
    end: any;
    brd: any;

    bbox?: { minX: number, maxX: number, minY: number, maxY: number }

    length?: number;
    winding?: "cw" | "ccw";
    area?: number;
    info?: any;

    constructor(line, minXY, maxXY) {
        this.done = false
        if (line) {
            this.line = [...this.fixLineEnds(line)]
            this.update(minXY, maxXY)
            this.minXY = minXY;
            this.maxXY = maxXY;
        }


    }

    /**
     * 
     * @param value 
     * @returns 
     */
    fixInvalidLineEnd(value) {
        //return value;

        if (value == 0) return -32;
        if (value == 4096) return 4128;
        return value
    }

    /**
     * fixes line ends for tiles for which neighbours are not available and so no overlap data.
     * they do not end at 4128/-32 but at 0,4096.
     * 
     * @param line 
     * @returns 
     */
    fixLineEnds(line) {
        const l = line.length;
        let sx = line[0];
        let sy = line[0 + 1];
        let ex = line[l - 2];
        let ey = line[l - 1];

        line[0] = this.fixInvalidLineEnd(line[0])
        line[0 + 1] = this.fixInvalidLineEnd(line[0 + 1])
        line[l - 2] = this.fixInvalidLineEnd(line[l - 2])
        line[l - 1] = this.fixInvalidLineEnd(line[l - 1])

        return line;
    }

    update(minXY, maxXY) {
        if (!this.line) throw new Error("empty this.line")

        const l = this.line

        const border = getLineBorderCode(l, minXY, maxXY);
        this.start = getLineFirst(l)
        this.end = getLineLast(l)
        this.brd = border

        // cw : inner lower
        // ccw: inner is higher

        this.bbox = getLineBBox(l)

        if (this.isClosed) {
            const polyInfo = analyzePolygon(this.line)
            this.info = polyInfo;
            //this.isTiny = polyInfo.isTiny
            this.length = polyInfo.length
            this.winding = polyInfo.winding
            this.area = polyInfo.area
        }
    }

    clone() {
        const line = new TiledLine(this.line, this.minXY, this.maxXY);
        return line
    }

    get hash() {
        return hashArray(this.line);
    }

    get isTiny() {
        return (this.area != undefined) ? this.area < 50 * 50 : null;
    }

    get isClosed() {
        if (!this.line) throw new Error("empty this.line")

        const sx = this.line[0]
        const sy = this.line[1]

        const ex = this.line[this.line.length - 2]
        const ey = this.line[this.line.length - 1]

        return (sx == ex && sy == ey);
    }

    isCongruent(line) {
        if (!line) return false;
        return (
            this.hash == line.hash
        )
    }
    isSame(line) {
        return (line === this)
    }

    isIdentical(line) {
        return JSON.stringify(this) === JSON.stringify(line)
    }

    appendLine(appendLine, minXY, maxXY) {
        if (!this.line) throw new Error("empty this.line")

        this.line.push(...appendLine.line)
        this.update(minXY, maxXY)
    }

    /**
     * corners must be in counter Clockwise sorting
     * 
     */
    appendCornersAtEnd(corners: number[], minXY, maxXY) {
        if (!this.line) throw new Error("empty this.line")

        this.line.push(...corners)

        // add start to close ring
        this.update(minXY, maxXY)
    }

    closeLineStartEnd(minXY, maxXY) {
        if (!this.line) throw new Error("empty this.line")

        this.line.push(this.line[0])
        this.line.push(this.line[1])
        this.update(minXY, maxXY)
    }

    toString() {
        return this.toString2()

        const l = this;
        if (l.isClosed) {
            return `#${l.hash} closed - tiny:${l.isTiny} area:${l.area} `
        }

        return `#${l.hash} edges: ${l.brd.start}-${l.brd.end} [${l.start.x},${l.start.y}] - [${l.end.x},${l.end.y}] len:${l.line?.length} `;
    };

    toString2(tileLineIndex?) {
        const l = this;
        const winding = (l.winding) ? l.winding : "";
        const innerHighLow = (l.winding == "cw") ? "low" : (l.winding == "ccw" ? "high" : "");
        const closed = (l.isClosed) ? `closed:${winding}/${innerHighLow},` : "";
        const tiny = (l.isTiny) ? "tiny," : "";
        const length = (l.line) ? "l:" + l.line.length + "," : "";
        const area = (l.isClosed) ? `area:${l.info.area},` : "";

        const bbox = (l.bbox) ? `bbx: [${l.bbox.minX},${l.bbox.minY} - ${l.bbox.maxX},${l.bbox.maxY}],` : "";


        let selfClosable = (tileLineIndex?.lineIsSelfClosable(l)) ? "selfClosable" : "";
        if (l.isClosed) {
            return `#${l.hash} ${closed} ${length} ${area} ${bbox} ${tiny}`;
        }
        return `#${l.hash} ${length} edges: ${l.brd.start}-${l.brd.end} [${l.start.x},${l.start.y}--${l.end.x},${l.end.y}] ${selfClosable} ${bbox}`;
    }

} // class TileLine

const EDGES: EdgeId[] = [1, 2, 4, 8]



export class LineIndex {
    getRingHolesTiny() {
        return this.inner.filter(l => l.winding == "cw").filter(l => l.isTiny);
    }

    getHoleCandidates() {
        return this.inner.filter(l => l.winding == "cw").filter(l => !l.isTiny)
    }

    getRingPeaksTiny() {
        return this.inner.filter(l => l.winding == "ccw").filter(l => l.isTiny);
    }
    getRingPeaks() {
        return this.inner.filter(l => l.winding == "ccw").filter(l => !l.isTiny);
    }

    lineIndex: TileEdgeLineIndex;
    origIndex: TileEdgeLineIndex;
    //finalPool: TiledLine[] = [];
    filtered: TiledLine[] = [];
    inner: TiledLine[] = [];

    constructor(lines, minXY, maxXY) {
        this.lineIndex = this.createLineEdgeIndexFromLines(lines, minXY, maxXY);
        this.origIndex = this.createLineEdgeIndexFromLines(lines, minXY, maxXY);
        //this.finalPool = [];

        const lineObjects = lines.map(l => {
            return new TiledLine(l, minXY, maxXY);
        });


        this.filtered = lineObjects.filter(l => (!l.isClosed && !l.isTiny))
        this.inner = lineObjects.filter(lo => lo.brd.start == 0 || lo.brd.end == 0);
    }

    getFirst() {
        const edges = Object.keys(this.lineIndex)
        for (let c of edges) {
            let lines = this.lineIndex[c];

            //let lines = this.get(c);
            if (!lines || !lines.s) continue;
            let line = lines.s[0] || null;
            if (!line) continue;


            // console.log("FIRST" + c, line)
            return line;
        }
        return null;
    }

    // getIterationList() {
    //     return [...this.lineIndex, ...rightStart, ...bottomStart, ...leftStart]
    // }

    lineIndexFlatList(indexDb: TileEdgeLineIndex) {
        const rem: TiledLine[] = [];
        for (const [edge, node] of Object.entries(indexDb)) {
            //console.log( edge, node)
            rem.push(...node.s)
        }
        return Array.from(new Set(rem));
    }

    getRemainingEdges() {
        return this.lineIndexFlatList(this.lineIndex)
    }
    getRemainingAll() {
        return [...this.getRemainingEdges(), ...this.inner]
    }

    get all() {
        return this.getRemainingAll();
    }

    get remainEdgeCount() {
        return this.getRemainingEdges().length;
    }

    createLineEdgeIndexFromLines(lines, minXY, maxXY) {
        const lineObjects = lines.map(l => {
            return new TiledLine(l, minXY, maxXY);
        });
        return this.createLineEdgeIndex(lineObjects, minXY, maxXY)
    }
    createLineEdgeIndex(lineObjectsAll, minXY, maxXY) {
        // const lineObjects = lines.map(l => {
        //     return new TiledLine(l, minXY, maxXY);
        // });
        // console.log( inner )

        const lineObjects = lineObjectsAll.filter(l => (!l.isClosed && !l.isTiny))

        const topStart = lineObjects.filter(lo => lo.brd.start == 1).sort((a, b) => {
            return (a.start.x - b.start.x)
        })

        const rightStart = lineObjects.filter(lo => lo.brd.start == 2).sort((a, b) => {
            return (a.start.y - b.start.y)
        })

        // x von groß zu klein
        const bottomStart = lineObjects.filter(lo => lo.brd.start == 4).sort((a, b) => {
            return (b.start.x - a.start.x)
        })

        //von oben nach unten
        const leftStart = lineObjects.filter(lo => lo.brd.start == 8).sort((a, b) => {
            return (b.start.y - a.start.y)
        })

        //------
        const topEnd = lineObjects.filter(lo => lo.brd.end == 1).sort((a, b) => {
            return (a.end.x - b.end.x)
        })

        const rightEnd = lineObjects.filter(lo => lo.brd.end == 2).sort((a, b) => {
            return (a.end.y - b.end.y)
        })

        // x von groß zu klein
        const bottomEnd = lineObjects.filter(lo => lo.brd.end == 4).sort((a, b) => {
            return (b.end.x - a.end.x)
        })

        //von oben nach unten
        const leftEnd = lineObjects.filter(lo => lo.brd.end == 8).sort((a, b) => {
            return (b.end.y - a.end.y)
        })



        const indexData = {

            1: {
                s: topStart,
                e: topEnd,
            },

            2: {
                s: rightStart,
                e: rightEnd,
            },

            4: {
                s: bottomStart,
                e: bottomEnd,
            },

            8: {
                s: leftStart,
                e: leftEnd,
            }
        }

        return Object.assign(new TileEdgeLineIndex(), indexData)
    }


    findNext(line) {

        const point = line.end;
        const edge = line.brd.end;
        return this.findNext2(point, edge, "start");
    }



    static findOnEdge(lineIndex: TileEdgeLineIndex, edge: EdgeId, startOrEnd: LineEndingDirection, mode: SearchDirection, point?: LinePoint) {

        let lineCandiates = LineIndex.getEdgeLisFromIndex(lineIndex, edge, startOrEnd);

        if (!lineCandiates) return undefined;

        if (!point && mode != "first") throw new Error("point is missing for mode: " + mode)
        // console.log("findOnEdge",edge,startOrEnd,mode,point)

        if (mode == "after") {
            if (!point) throw new Error("point is missing for mode: " + mode)
            if (edge == 1) return lineCandiates.find(l => l[startOrEnd].x > point.x);
            if (edge == 2) return lineCandiates.find(l => l[startOrEnd].y > point.y);
            if (edge == 4) return lineCandiates.find(l => l[startOrEnd].x < point.x);
            if (edge == 8) return lineCandiates.find(l => l[startOrEnd].y < point.y);
            throw new Error("findOnEdge: invalid edge " + edge)
        }
        else if (mode == "before") {
            if (!point) throw new Error("point is missing for mode: " + mode)
            if (edge == 1) return lineCandiates.find(l => l[startOrEnd].x < point.x);
            if (edge == 2) return lineCandiates.find(l => l[startOrEnd].y < point.y);
            if (edge == 4) return lineCandiates.find(l => l[startOrEnd].x > point.x);
            if (edge == 8) return lineCandiates.find(l => l[startOrEnd].y > point.y);
            throw new Error("findOnEdge: invalid edge " + edge)
        } else if (mode == "first") {
            return lineCandiates[0]
        } else {
            throw new Error("findOnEdge: invalid mode " + mode)
        }


    }

    findNext2(point, pointEdge, startOrEnd) {
        return LineIndex.findNextEdgeLine(this.lineIndex, point, pointEdge, startOrEnd);
    }


    /**
     * find next line startin/ending on tile edge in clockwise direction after a given edge-point
     *  
     * @param lineIndex index to search
     * @param point start point  
     * @param pointEdge edge the start point is on (where to start)
     * @param startOrEnd start|end: selector of line-ending to search for 
     * @returns 
     */
    static findNextEdgeLine(lineIndex: TileEdgeLineIndex, point: LinePoint, pointEdge: EdgeId, startOrEnd: LineEndingDirection) {
        let found: TiledLine | undefined;
        // direction clockwise
        // start at edge of point
        let startIndex = EDGES.indexOf(pointEdge)
        for (let i = 0; i <= 4; i++) {
            const index = (startIndex + i) % EDGES.length;
            const edge = EDGES[index]

            if (i == 0) {
                //on own edge - look after
                found = LineIndex.findOnEdge(lineIndex, edge, startOrEnd, "after", point)
            } else if (i == 4) {
                //on own edge - look before
                found = LineIndex.findOnEdge(lineIndex, edge, startOrEnd, "before", point)
            } else {
                //
                found = LineIndex.findOnEdge(lineIndex, edge, startOrEnd, "first")
            }

            // console.log("--=",i,edge,pointEdge)

            if (found) break;
        }
        // console.log("findNextDB end:", found)
        return found;
    }


    static getEdgeLisFromIndex(db: TileEdgeLineIndex, edge: EdgeId, startOrEnd: LineEndingDirection) {

        const list = db[edge]

        if (!list) throw new Error("edgeIndex is null for edge: " + edge)

        if (!startOrEnd) throw new Error("start or end missing"); //return list;
        if (startOrEnd == "start") return list.s;
        if (startOrEnd == "end") return list.e;
        throw new Error("get: invalid startOrEnd: " + startOrEnd);
    }

    get(edge: EdgeId, startOrEnd?: LineEndingDirection) {
        const list = this.lineIndex[edge]
        if (!startOrEnd) return list;
        if (startOrEnd == "start") return list.s;
        if (startOrEnd == "end") return list.e;
        throw new Error("get: invalid startOrEnd: " + startOrEnd);
    }



    // addToFinal(line: TiledLine) {
    //     this.finalPool.push(line)
    //     // console.log( "FINAL add:",line ) 
    // }

    debugIndexOrig() {
        return this.debugIndexDB(this.origIndex)
    }

    debugIndex() {
        return this.debugIndexDB(this.lineIndex)
    }

    debugIndexDB(lineIndex: TileEdgeLineIndex) {
        const debug: any = {
            all: [],
            inner: [],
        }



        const lineToString = (l: TiledLine) => {
            return l.toString2()

            const winding = (l.winding) ? l.winding : "";

            const innerHighLow = (l.winding == "cw") ? "low" : (l.winding == "ccw" ? "high" : "");

            const closed = (l.isClosed) ? `closed:${winding}/${innerHighLow},` : "";
            const tiny = (l.isTiny) ? "tiny," : "";


            let selfClosable = (this.lineIsSelfClosable(l)) ? "selfClosable" : "";

            if (l.isClosed) {
                return `#${l.hash} ${closed} ${tiny} area:${l.area} `
            }


            return `#${l.hash} edges: ${l.brd.start}-${l.brd.end} [${l.start.x},${l.start.y} - ${l.end.x},${l.end.y} ${selfClosable}]`
        }

        for (const [edge, node] of Object.entries(lineIndex)) {
            //console.log( edge, node)
            debug[edge] = {}
            debug[edge].s = node.s.map(l => lineToString(l))
            debug[edge].e = node.e.map(l => lineToString(l))
        }

        for (const line of this.lineIndexFlatList(lineIndex)) {
            debug.all.push(lineToString(line))
        }
        for (const line of this.inner) {
            debug.inner.push(lineToString(line));
        }
        return debug;
    }

    removeFromSearch(line: TiledLine | TiledLine[]) {

        if (Array.isArray(line)) {
            line.forEach(l => this.removeFromSearch(l))
            return;
        }

        //  console.log( "REMOVE:",line )

        this.lineIndex.removeLine(line)
        this.inner = this.inner.filter(l => l !== line)

        // for (const [edge, node] of Object.entries(this.lineIndex)) {
        //     //console.log( edge, node)
        //     node.s = node.s.filter(l => l !== line)
        //     node.e = node.e.filter(l => l !== line)
        // }

    }

    /** check if line is closable with itself by adding tile corners, 
     * so that no other lines ar found along the tile edges  
     **/
    lineIsSelfClosable(line) {
        //throw new Error("Disabled lineIsClosable")
        if (!line) return false;

        const point = line.start;
        const edge = line.brd.start;

        // no edge found so line is closed
        if (line.isClosed) return false;
        if (!edge) return false;

        let nextLine = LineIndex.findNextEdgeLine(this.origIndex, point, edge, "end");

        const isSame = (line.isIdentical(nextLine))
        // let nextLine = this.findNextStartEnd(line )
        // console.log("lineIsSelfClosable? ",isSame, line,nextLine)
        return isSame
    }

    /**
     * create a closed polygon for the full tile
     */
    static getFullTilePolygon(minXY?: number, maxXY?: number) {

        if (minXY == undefined) throw new Error("minXY invalid: " + minXY)
        if (maxXY == undefined) throw new Error("maxXY invalid: " + maxXY)

        const corners = LineIndex.getTileCornersCounterClockWiseCount(1, 4, minXY, maxXY);
        //Close polygon
        corners.push(corners[0])
        corners.push(corners[1])
        return corners;
    }

    static getTileCornersCounterClockWiseCount(edgeStart: EdgeId, count: number, minXY: number, maxXY: number) {
        if (!EDGES.includes(edgeStart)) throw new Error("getTileCornersClockWise: invalid edgeStart " + edgeStart)
        if (count < 0 || count > 4) throw new Error("getTileCornersClockWise: invalid count " + count)

        const dbg = false;

        const corners: number[] = [];

        const wrapIndex = (value) => {
            const start = 0;
            const end = 4;
            let range = end - start;
            return ((value - start) % range + range) % range + start;
        }

        let startIndex = EDGES.indexOf(edgeStart)
        let endIndex = EDGES[wrapIndex(startIndex - count)]

        if (dbg) console.log("tileCornerCCW start,cnt,end:", edgeStart, count, endIndex)

        for (let i = 0; i < count; i++) {
            const index = wrapIndex(startIndex - i);
            const edgeLoop = EDGES[index]
            // console.log( "tileConerCCW-loop:",i,index,edgeLoop )
            if (edgeLoop == 1) corners.push(minXY, minXY)
            if (edgeLoop == 2) corners.push(maxXY, minXY)
            if (edgeLoop == 4) corners.push(maxXY, maxXY)
            if (edgeLoop == 8) corners.push(minXY, maxXY)
        }
        return corners;
    }
    getTileCornersCounterClockWise(edgeStart, edgeEnd, minXY, maxXY) {

        // if ( !EDGES.includes(edgeStart) || !EDGES.includes(edgeEnd) ) throw new Error("getEdgePointsClockWise: invalid edgevalue " +edgeEnd+" " +edgeStart)
        if (!EDGES.includes(edgeStart)) throw new Error("getTileCornersClockWise: invalid edgeStart " + edgeStart)
        if (!EDGES.includes(edgeEnd)) throw new Error("getTileCornersClockWise: invalid edgeEnd " + edgeEnd)

        const dbg = false;

        const corners: number[] = [];

        let startIndex = EDGES.indexOf(edgeStart)

        if (dbg) console.log("tileCornerCCW:", edgeStart, edgeEnd)

        const wrapIndex = (value) => {
            const start = 0;
            const end = 4;
            let range = end - start;
            return ((value - start) % range + range) % range + start;
        }

        let edgeLoop = edgeStart
        for (let i = 0; edgeLoop != edgeEnd && i > -20; i--) {
            const index = wrapIndex(startIndex + i);
            const edgeLoop = EDGES[index]
            if (edgeLoop == edgeEnd) break;

            // console.log( "tileConerCCW-loop:",i,index,edgeLoop )
            if (edgeLoop == 1) corners.push(minXY, minXY)
            if (edgeLoop == 2) corners.push(maxXY, minXY)
            if (edgeLoop == 4) corners.push(maxXY, maxXY)
            if (edgeLoop == 8) corners.push(minXY, maxXY)
        }
        return corners;

    }

    /**
     * returns corners to connect line2 start after line1 end
     * @param line1 
     * @param line2 
     * @param minXY 
     * @param maxXY 
     * @returns 
     */
    getTileCornersCounterClockWiseBetweenLines(line1, line2, minXY, maxXY) {
        const sameEdge = this.lineFollowsCounterClockwiseOnSameEdge(line1, line2);

        if (sameEdge) {
            //console.log(`corner sameEdge`)
            return LineIndex.getTileCornersCounterClockWiseCount(line1.brd.end, 4, minXY, maxXY);
        }
        return this.getTileCornersCounterClockWise(line1.brd.end, line2.brd.start, minXY, maxXY);
    }


    /**
     * check if line2 starts on same edge as line1 ends in counterclockwise direction 
     * 
     * @param {*} line1 
     * @param {*} line2 
     * @returns 
     */
    lineFollowsCounterClockwiseOnSameEdge(line1, line2) {
        if (line1.brd.end != line2.brd.start)
            return false; //throw new Error("isEndBeforeStartSameEdge: not on same edge");

        const end = line1.end;
        const start = line2.start;

        //console.log(`isEndBefStartSame l1,l2 `,line1.clone(),line2.clone() )
        //console.log(`isEndBefStartSame: `,end, start )

        const edge = line1.brd.end;
        if (edge == 1)
            return (end.x < start.x && end.y == start.y);
        else if (edge == 2)
            return (end.y < start.y && end.x == start.x);
        else if (edge == 4)
            return (end.x > start.x && end.y == start.y);
        else if (edge == 8)
            return (end.y > start.y && end.x == start.x);
        throw new Error("isEndBeforeStartSameEdge error");
    }

    /**
     * checks if the end point is on the same edge but before (counterclockwise) from start
     * 
     * @param {*} line 
     * @returns 
     */
    isEndBeforeStartSameEdge(line) {
        if (line.brd.end != line.brd.start) return false;//throw new Error("isEndBeforeStartSameEdge: not on same edge");
        const end = line.end;
        const start = line.start;
        const edge = line.brd.start;
        if (edge == 1) return (end.x < start.x && end.y == start.y)
        else if (edge == 2) return (end.y < start.y && end.x == start.x)
        else if (edge == 4) return (end.x > start.x && end.y == start.y)
        else if (edge == 8) return (end.y > start.y && end.x == start.x)
        throw new Error("isEndBeforeStartSameEdge error")
    }

    countCornersBetweenEdgesBackwards(edgeFrom, edgeTo) {
        let startIndex = EDGES.indexOf(edgeFrom)
        let count = -1
        let edge = edgeFrom

        const wrapNumber = (value, start, end) => {
            let range = end - start;
            return ((value - start) % range + range) % range + start;
        }

        for (; edge != edgeTo;) {
            count--;
            const index = wrapNumber(count, 0, 4);
            console.log(index, count)
            edge = EDGES[index]
        }
        // console.log("cornerCountBw:", edgeFrom,edgeTo, count)
        return Math.abs(count);
    }

    countCornersBetweenEdges(edgeFrom, edgeTo) {
        let startIndex = EDGES.indexOf(edgeFrom)
        let count = -1
        let edge = edgeFrom

        while (edge != edgeTo && count < 4) {
            count++;
            const index = (startIndex + count) % 4;
            edge = EDGES[index]
            console.log("--##", edge, index, count)
        }
        // console.log("CLOSE Line count:", edgeFrom,edgeTo,count)
        return count;
    }

    closeLine(line, minXY, maxXY) {

        const dbg = false

        const startEdge = line.brd.start
        const endEdge = line.brd.end
        let count = 0

        if (dbg) console.log("CLOSE line start->end: ", startEdge, endEdge)

        const endBeforeOnSame = this.isEndBeforeStartSameEdge(line)
        if (endBeforeOnSame) {
            if (dbg) console.log("- end is on same edge before, corner count: 4")
            count = 4
        } else {
            // get required edge count from start to end
            let edge = startEdge
            let startIndex = EDGES.indexOf(startEdge)
            count = 0;
            for (; edge != endEdge;) {
                count++
                const index = (startIndex + count) % 4;
                edge = EDGES[index]
            }
            if (dbg) console.log("- corner count: ", count)
        }

        const corners = LineIndex.getTileCornersCounterClockWiseCount(endEdge, count, minXY, maxXY)
        if (dbg) console.log("-corners: ", corners)

        // add corners reverse to the end
        //const lineClone = line.clone();        
        line.appendCornersAtEnd(corners, minXY, maxXY)
        line.closeLineStartEnd(minXY, maxXY)

        if (dbg) console.log("NOW CLSD ", line)

        // add the start point at end
        return line;
    }


    createConcatedLine(lineIn: TiledLine, buffer, minXY: number, maxXY: number) {
        const dbg: string = `${0}`;

        const bufferRev = [...buffer].reverse()
        const line = lineIn.clone();

        if (dbg == "1") console.log("appendLinesToClone", bufferRev)

        for (const buffLine of bufferRev) {
            // buffLine is appended 

            // buffline start will always be before
            //const lineEndEdge = line.brd.end
            //const corners = this.getTileCornersCounterClockWise(lineEndEdge, buffLine.brd.start, minXY, maxXY)

            const corners = this.getTileCornersCounterClockWiseBetweenLines(line, buffLine, minXY, maxXY);

            if (dbg == "1") {
                console.log("appendLinesToClone - add corners: ", corners)
            }

            // insert corners if req
            line.appendCornersAtEnd(corners, minXY, maxXY)

            if (dbg == "1") console.log("appendLinesToClone - add line: ", buffLine)
            line.appendLine(buffLine, minXY, maxXY)

        }

        this.closeLine(line, minXY, maxXY)

        return line;
    }

    checkAndClosableLine(line, minXY, maxXY) {
        throw new Error("Disabled checkAndClosableLine")
        var lineIsSelfClosable = this.lineIsSelfClosable(line);
        if (!lineIsSelfClosable) return false;

        //console.log("CLOSABLE: " , line )
        // close lin                        
        const lineClone = this.closeLine(line, minXY, maxXY)
        //this.addToFinal( lineClone )
        this.removeFromSearch(line)
        return true
    }

    toArrayAllInner(lineFilter) {

        const useFilter = (lineFilter) ? lineFilter : () => true;

        return [...this.all.filter(useFilter).map(tl => tl.line), ...this.inner.filter(useFilter).map(tl => tl.line),]
    }

} // class LineINdex

/**
 * 
 * @param lvl 
 * @param lines 
 * @param minXY 
 * @param maxXY 
 * @returns 
 */
export function convertTileIsolinesToPolygons(lvl, linesIn: LineArray, tileInfo: TileInformation) {
    // SET-DBG convertTileIsolinesToPolygons 
    const dbg = Number(`${0}`);
    // const dbg = Number(`${tileInfo.isTile(null, 11, 21) ? "1" : "0"}`);

    // filter out lines that are not valid, too small
    const lines = linesIn.filter(l => l.length > 6);

    if (!lines || lines.length < 1) {
        // no valid lines available

        // handles special cases - where full tile is required
        const tileMinAboveLevel = tileInfo.min || -Infinity > lvl
        const invalidLines = linesIn.filter(l => l.length <= 6);
        const onlyInvalidLines = invalidLines.length == linesIn.length
        if (dbg >= 0) console.log(`Tile ${tileInfo.coordString()} lvl:${lvl} w/o lines, tileMin-above-level:${tileMinAboveLevel} onlyInvalidLines:${onlyInvalidLines} tile.min:${tileInfo.min}`);

        // case 1) Tile min elevation is above level
        const case1 = tileMinAboveLevel
        // case 2) tile min elevation is not above but lower but only invalid lines available (enclosing eht lower terrain)
        const case2 = !tileMinAboveLevel && onlyInvalidLines
        if (case1 || case2) {
            const fullTile = LineIndex.getFullTilePolygon(tileInfo.minXY, tileInfo.maxXY);
            return [fullTile]
        }

        return [];
    }

    const newLines: LineArray = [];
    const concatedPolygonsArray: TiledLine[] = [];

    if (dbg >= 1) console.log(`convertIsoToPolys START - Tile: ${tileInfo.coordString()} `)

    const minXY = tileInfo.minXY;
    const maxXY = tileInfo.maxXY;
    if (minXY == undefined || maxXY == undefined) throw new Error(`min/maxXY is missing min:${minXY} max:${maxXY}`);

    const lineIndex = new LineIndex(lines, minXY, maxXY)
    //const innerHighPolygons = lineIndex.inner.filter(l => l.winding == "ccw");
    //const innerLowPolygonsCW = lineIndex.inner.filter(l => l.winding == "cw");


    // console.log( "INDEX",lineIndex.debugIndex() ) 
    // console.log( "INDEX Orig",lineIndex.debugIndexOrig() ) 

    if (dbg >= 1) console.log(`- lvl: ${lvl}, lines:`, lineIndex.debugIndexOrig())

    // iterate over all edge-lines in the tile.
    // not all lines will end up here because they me be appended to other lines and removed from the list
    const totalEdgeLineCount = lineIndex.getRemainingEdges().length;
    const firstline = lineIndex.getFirst();
    let i = -1;
    let currentEdgeLine = firstline;
    while (currentEdgeLine) {
        i++;
        // stop if first line is reached again
        if ((i > 1 && firstline == currentEdgeLine) || i > 50) {
            currentEdgeLine = null;
            if (dbg >= 2) console.log(`close line(${i} END - reached first again`)
            break;
        };

        if (i > totalEdgeLineCount) {
            currentEdgeLine = null;
            if (dbg >= 2) console.log(`close line(${i} END - line count reached`)
            break;
        };

        if (dbg >= 2) console.log(`close Line (${i}) START`, currentEdgeLine)

        let linesToAppend: TiledLine[] = [];
        let currentAppendCandidateLine = currentEdgeLine

        // look for all other edge-lines in clockwise direction if they may be concat to currentLines
        for (let appendLoopCount = 0; appendLoopCount < totalEdgeLineCount; appendLoopCount++) {

            //if (appendLoopCount == initLineCount-1) {
            //console.log("WARN: appendLoop has reached init line count");
            //}

            try {
                //the next line which end is on the edge can be appended
                let nextAppendCandidate = lineIndex.findNext2(currentAppendCandidateLine.start, currentAppendCandidateLine.brd.start, "end")

                if (!nextAppendCandidate) {
                    console.log("ERROR: during appendLoop, next line is empty, count:" + appendLoopCount, { currentEdgeLine, currentAppendCandidateLine })
                    break;
                }

                const nextIsSame = currentEdgeLine.isIdentical(nextAppendCandidate)
                if (nextIsSame) {
                    if (dbg >= 2) console.log(`close line(${i} END self reached, append-count: ${linesToAppend.length}`)
                    break;
                }


                if (nextAppendCandidate) {
                    if (dbg >= 2) console.log(`close line(${i} - append line:`, nextAppendCandidate)
                    linesToAppend.push(nextAppendCandidate)
                }
                currentAppendCandidateLine = nextAppendCandidate
            } catch (error) {
                console.error("currentAppendCandidateLine", currentAppendCandidateLine)
                console.error(error)
            }



        }

        const concatedLine = lineIndex.createConcatedLine(currentEdgeLine, linesToAppend, minXY, maxXY)
        concatedPolygonsArray.push(concatedLine)
        //lineIndex.addToFinal(concatedLine)

        lineIndex.removeFromSearch(currentEdgeLine)
        linesToAppend.forEach(l => lineIndex.removeFromSearch(l))

        currentEdgeLine = lineIndex.getFirst();
    }
    if (dbg >= 1) console.log("- concatedPolygons: ", lineArrayToStrings(concatedPolygonsArray))

    if (dbg >= 1) console.log("- lineIndex (should have noe egde lines): ", lineIndex.debugIndex())


    // handle inner self-closed lines (rings/polygons) that never touched edges
    // depending on winding they denote higher or lower terrain
    // ccw: denotes higher terrain - can just be added as polygons
    // cw: denotes lower terrain so they are holes inside other polygons that already exist. that may be 
    //     polygons created by appending ot maybe a fulltile polygon

    // all polygons that may contain inner holes
    const highPolys = [...concatedPolygonsArray, ...lineIndex.getRingPeaks()]

    // process concated polygons and possible holes
    highPolys.forEach(concatPoly => {
        // console.log(l.line)
        if (!concatPoly.line) return;

        // find any holes (inner polys with low terrain inside)
        const currentHoleCandidates = lineIndex.getHoleCandidates();
        if (dbg >= 1 && currentHoleCandidates.length > 0) console.log(`- find holes(inner-low):${currentHoleCandidates.length} in high-poly:`, concatPoly.toString2(), currentHoleCandidates)

        const foundHoles: TiledLine[] = [];
        currentHoleCandidates.forEach(inner => {
            // if (inner.isTiny) {
            //     if (dbg >= 1) console.log(`  - skip hole (tiny): ${inner.toString2()}`)
            //     return;
            // }
            const isInseide = isPolygonInsideFlat(inner.line, concatPoly.line)
            if (isInseide) {
                foundHoles.push(inner)
                if (dbg >= 1) console.log(`  - found hole: ${inner.toString2()}`)
            }
        })
        if (dbg >= 1) console.log(` - finalize poly, holes: ${foundHoles.length}`)
        newLines.push(concatPoly.line, ...foundHoles.map(l => l.line).filter(l => l != undefined));

        lineIndex.removeFromSearch(foundHoles);
        lineIndex.removeFromSearch(concatPoly)

        // const removed = arrayRemoveObjects(holeCandidates, ...foundHoles)
        // if (dbg >= 2) console.log("removed hole candidates:" + removed )
    })


    const fullTileCCW = [-32, -32, -32, 4128, 4128, 4128, 4128, -32, -32, -32]
    const fullTileCW = [-32, -32, 4128, -32, 4128, 4128, -32, 4128, -32, -32]



    // these should be empty now
    const remainingTops = lineIndex.getRingPeaks()

    // handle remaining holes (not conatined in any high polygon). they are contained in a fulltile polygon that will be created
    const fullTileHoles = lineIndex.getHoleCandidates();
    try {
        if (fullTileHoles.length > 0) {

            // holes inside other polygons on this level
            if (dbg >= 1) console.log("uncontained holes (for full-tile): ", lineArrayToStrings(fullTileHoles))

            // check preconditions
            if (remainingTops.length > 0) throw new Error(`uncontained holes(${fullTileHoles.length}) + unhandled tops(${remainingTops.length}), not handled `)

            // these cases are not handled correctly, must be holes in other polygons
            //if (lineIndex.finalPool.length > 0) throw new Error(`innerPolys LOW (${innerLowPolygonsCW.length}) + non-inner/final polys ((${lineIndex.finalPool.length})) `)
            if (lineIndex.remainEdgeCount > 0) throw new Error(`innerPolys LOW (${fullTileHoles.length}) +  remainEdgeCount: ${lineIndex.remainEdgeCount}`)

            // add as holes to full tile poly
            if (dbg >= 1) console.log(` add fullTileCCW (high) + holes:${fullTileHoles.length} `, { fullTileCCW })

            newLines.push(fullTileCCW, ...fullTileHoles.map(l => l.line) as LineDefinition[]);
            lineIndex.removeFromSearch(fullTileHoles)

        }

    } catch (e) {
        console.log("ERROR innerPoly LOW handling, tile:" + tileInfo.coordString())
        console.log(e)
        console.log({ tops: lineArrayToStrings(remainingTops), holes: lineArrayToStrings(fullTileHoles) });
        console.log("----------------- ")
    }


    const remainingInnerRingsHigh = lineIndex.getRingPeaks();
    // add remaining TOP-rings (that have not been added before)
    if (remainingInnerRingsHigh.length > 0) {
        if (dbg >= 1)
            console.log("remainingInnerRingsHigh: ", lineArrayToStrings(remainingInnerRingsHigh));
        remainingInnerRingsHigh.forEach(l => {
            if (l.line)
                newLines.push(l.line);
            lineIndex.removeFromSearch(l)
        });
        //lineIndex.inner = lineIndex.inner.filter(l => l.winding !== "ccw");
    }

    // remove tiny peaks (ignored)
    lineIndex.removeFromSearch(lineIndex.getRingPeaksTiny())


    // handles very special case for fullTile
    // 
    // conditions:
    // - tile min elevation is lower than this level (regular full tile condition not met)
    // - there are tiny holes that have been ignored
    // - no polygons have been created 
    // 
    const remainingTinyHoles = lineIndex.getRingHolesTiny();

    const noPolysCreated = newLines.length == 0;
    const tileMinLowerThanLevel = tileInfo.min || Infinity < lvl;
    if (noPolysCreated && tileMinLowerThanLevel && remainingTinyHoles) {
        if (dbg >= 1)
            console.log("fullTile special case: tileMinLowerThanLevel && noPolysCreated && remainingTinyHoles");
        const fullTile = LineIndex.getFullTilePolygon(tileInfo.minXY, tileInfo.maxXY);
        newLines.push(fullTile);
    }

    // no only tiny rings (tops, holes) should exist if at all
    lineIndex.removeFromSearch(remainingTinyHoles)

    // no lines should remain
    if (dbg >= 1)
        console.log("- lineIndex (should be empty): ", lineIndex.debugIndex());

    const rem = lineIndex.getRemainingAll();
    if (rem.length) {
        console.log("## WARN: remaing lines, tile: " + tileInfo.coordString(), rem.length)
        console.error(lineIndex.debugIndex())
        console.error(tileInfo.toString())
        throw new Error("lineIndex at end not empty: " + tileInfo.coordString());
    }
    

    
    if (dbg >= 1) console.log("END -- createIsoPolys ------", lineIndex)
    return newLines;
}

function testPolyContainsInner(poly, innerPolys) {
    console.log("- testPolyInner:", poly.toString2())
    innerPolys.forEach(inner => {
        const isInseide = isPolygonInsideFlat(inner.line, poly.line)
        console.log(`  - ${isInseide} <- ${inner.toString2()}`)
    })
}

function pointInPolygonFlat(px, py, polygon) {
    let inside = false;
    const len = polygon.length;

    for (let i = 0, j = len - 2; i < len; j = i, i += 2) {
        const xi = polygon[i], yi = polygon[i + 1];
        const xj = polygon[j], yj = polygon[j + 1];

        const intersect = ((yi > py) !== (yj > py)) &&
            (px < (xj - xi) * (py - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
    }

    return inside;
}

function isPolygonInsideFlat(innerFlat, outerFlat) {
    for (let i = 0; i < innerFlat.length; i += 2) {
        const x = innerFlat[i];
        const y = innerFlat[i + 1];
        if (!pointInPolygonFlat(x, y, outerFlat)) return false;
    }
    return true;
}

function lineArrayToStrings(lines) {
    return lines.map(l => l.toString())
}

function arrayRemoveObjects(theArray, ...removeObjects) {
    if (!removeObjects) return 0;
    return removeObjects.map(o => arrayRemoveObject(theArray, o)).filter(r => r === true).length
}
function arrayRemoveObject(theArray, removeObject: object) {
    if (!removeObject) return false;
    let index = theArray.indexOf(removeObject);
    if (index !== -1) {
        theArray.splice(index, 1);
        return true;
    }
    return false;
}