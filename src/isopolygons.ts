export class TileInformation  {
    max?: number ;
    min?: number ;
    x?: number;
    y?: number;
    z?: number;
    minXY?: number;
    maxXY?: number;
    minElev?: number;
    maxElev?:number;
    constructor(z,x,y){
        this.z=z;
        this.y=y;
        this.x=x;
    }

    toString(){
        return `TileInfo: z,x,y: ${this.z},${this.x},${this.y}, min/max: ${this.min}/${this.max}  min/maxXY: ${this.minXY},${this.maxXY} ` 
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

type TileEdgeLineIndex = Record<EdgeId, EdgeLineIndex>


function findBorder(x, y, minXY, maxXY) {
    let left = x == minXY;
    let top = y == minXY;
    let right = x == maxXY;
    let bottom = y == maxXY;

    let code = (top ? 1 : 0 | (right ? 2 : 0) | (bottom ? 4 : 0) | (left ? 8 : 0));

    // hack to fix corner points
    if ( code == 6) code = 2;
    if ( code == 12) code = 4;
    if ( code == 3) code = 1;
    if ( code == 9) code = 8;
    

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

function getLineBorderCode(line: LineDefinition, minXY, maxXY) {

    if(!line) throw new Error("empty line")

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



export function generateFullTileIsoPolygons(fullTile: TileInformation, gpwslevels, segm, minXY, maxXY, x, y, z) {
    
    // console.log("ADD FULL:",fullTile,gpwslevels)

    
    if( fullTile.min == undefined) return [];

    const fullTilePolygons : ElevationLinesMap = {};

    for (const lvl of gpwslevels) {

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

type LineDefinition = number [];

type LineArray = LineDefinition[];

type Elevation = number;

// holds lines[] indexed at elevation
export type ElevationLinesMap = Record<Elevation,LineArray>

class TiledLine {

    done: boolean;
    line?: LineDefinition ;
    minXY?: number ;
    maxXY?: number ;
    start: any;
    end: any;
    brd: any;

    constructor(line, minXY, maxXY) {
        this.done = false
        if (line) {
            this.line = [...line],
            this.update(minXY, maxXY)
            this.minXY = minXY;
            this.maxXY = maxXY;
        }
    }

    update(minXY, maxXY) {
        if(!this.line) throw new Error("empty this.line")

        const l = this.line

        const border = getLineBorderCode(l, minXY, maxXY);
        this.start = getLineFirst(l)
        this.end = getLineLast(l)
        this.brd = border
    }

    clone() {
        const line = new TiledLine(this.line, this.minXY, this.maxXY);
        return line
    }

    get hash() {
        return hashArray(this.line);
    }

    get isClosed() {
        if(!this.line) throw new Error("empty this.line")

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
        if(!this.line) throw new Error("empty this.line")

        this.line.push(...appendLine.line)
        this.update(minXY, maxXY)
    }

    /**
     * corners must be in counter Clockwise sorting
     * 
     */
    appendCornersAtEnd(corners: number [], minXY, maxXY) {
        if(!this.line) throw new Error("empty this.line")

        this.line.push(...corners)

        // add start to close ring
        this.update(minXY, maxXY)
    }

    closeLineStartEnd(minXY, maxXY) {
        if(!this.line) throw new Error("empty this.line")

        this.line.push(this.line[0])
        this.line.push(this.line[1])
        this.update(minXY, maxXY)
    }
} // class TileLine

const EDGES : EdgeId [] = [1, 2, 4, 8]

class LineIndex {
    lineIndex: TileEdgeLineIndex;
    origIndex: TileEdgeLineIndex;
    finalPool: TiledLine[] = [];
    inner: TiledLine[] = [];

    constructor(lines, minXY, maxXY) {
        this.lineIndex = this.createLineIndex(lines, minXY, maxXY);
        this.origIndex = this.createLineIndex(lines, minXY, maxXY);
        this.finalPool = [];

        const lineObjects = lines.map(l => {
            return new TiledLine(l, minXY, maxXY)
        })
        this.inner = lineObjects.filter(lo => lo.brd.start == 0 || lo.brd.end == 0);
    }

    getFirst() {
        const edges = Object.keys(this.lineIndex)
        for (let c of edges) {
            let lines = this.lineIndex[c];
            
            //let lines = this.get(c);
            if ( !lines || !lines.s ) continue;
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

    lineIndexFlatList(indexDb : TileEdgeLineIndex) {
        const rem : TiledLine [] = [];
        for (const [edge, node] of Object.entries(indexDb)) {
            //console.log( edge, node)
            rem.push(...node.s)
        }
        return Array.from(new Set(rem));
    }

    getRemaining() {
        return this.lineIndexFlatList(this.lineIndex)
    }

    get all() {
        return this.getRemaining();
    }

    get remainCount() {
        return this.getRemaining().length;
    }

    createLineIndex(lines, minXY, maxXY) {
        const lineObjects = lines.map(l => {
            return new TiledLine(l, minXY, maxXY)
        })

        // console.log( inner )

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

        return {

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
    }


    findNext(line) {

        const point = line.end;
        const edge = line.brd.end;
        return this.findNext2(point, edge, "start");
    }

    

    static findOnEdge(lineIndex:TileEdgeLineIndex, edge : EdgeId, startOrEnd: LineEndingDirection, mode: SearchDirection, point?: LinePoint) {

        let lineCandiates = LineIndex.getEdgeLisFromIndex(lineIndex, edge, startOrEnd);

        if (!lineCandiates) return undefined;

        if ( !point && mode != "first") throw new Error("point is missing for mode: " + mode)
        // console.log("findOnEdge",edge,startOrEnd,mode,point)

        if (mode == "after") {
            if(!point) throw new Error("point is missing for mode: " + mode)
            if (edge == 1) return lineCandiates.find(l => l[startOrEnd].x > point.x);
            if (edge == 2) return lineCandiates.find(l => l[startOrEnd].y > point.y);
            if (edge == 4) return lineCandiates.find(l => l[startOrEnd].x < point.x);
            if (edge == 8) return lineCandiates.find(l => l[startOrEnd].y < point.y);
            throw new Error("findOnEdge: invalid edge " + edge)
        }
        else if (mode == "before") {
            if(!point) throw new Error("point is missing for mode: " + mode)
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
    static findNextEdgeLine(lineIndex:TileEdgeLineIndex, point: LinePoint, pointEdge: EdgeId, startOrEnd: LineEndingDirection) {
        let found : TiledLine| undefined ;
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
        if (!startOrEnd) throw new Error("start or end missing"); //return list;
        if (startOrEnd == "start") return list.s;
        if (startOrEnd == "end") return list.e;
        throw new Error("get: invalid startOrEnd: " + startOrEnd);
    }

    get(edge: EdgeId, startOrEnd?: LineEndingDirection ) {
        const list = this.lineIndex[edge]
        if (!startOrEnd) return list;
        if (startOrEnd == "start") return list.s;
        if (startOrEnd == "end") return list.e;
        throw new Error("get: invalid startOrEnd: " + startOrEnd);
    }



    addToFinal(line: TiledLine) {
        this.finalPool.push(line)
        // console.log( "FINAL add:",line ) 
    }

    debugIndexOrig() {
        return this.debugIndexDB(this.origIndex)
    }

    debugIndex() {
        return this.debugIndexDB(this.lineIndex)
    }

    debugIndexDB(lineIndex : TileEdgeLineIndex) {
        const debug : any = {
            all : [],
        }



        const toString = (l : TiledLine ) => {

            let closable = (this.lineIsClosable(l)) ? "closable" : "";

            return `#${l.hash} edges: ${l.brd.start}-${l.brd.end} [${l.start.x},${l.start.y}] - [${l.end.x},${l.end.y} ${closable}]`
        }

        for (const [edge, node] of Object.entries(lineIndex)) {
            //console.log( edge, node)
            debug[edge] = {}
            debug[edge].s = node.s.map(l => toString(l))
            debug[edge].e = node.e.map(l => toString(l))
        }

        for (const line of this.lineIndexFlatList(lineIndex)) {
            debug.all.push(toString(line))
        }

        return debug;
    }

    removeFromSearch(line : TiledLine ) {
        //  console.log( "REMOVE:",line )
        // console.log(this.debugIndex())
        for (const [edge, node] of Object.entries(this.lineIndex)) {
            //console.log( edge, node)
            node.s = node.s.filter(l => l !== line)
            node.e = node.e.filter(l => l !== line)
        }
        // console.log(this.debugIndex())
        // console.log(this.lineIndex)

    }

    /** check if line is closable by adding tile corners, 
     * so that no other lines ar found along the tile edges  
     **/
    lineIsClosable(line ) {
        //throw new Error("Disabled lineIsClosable")
        if (!line) return false;

        const point = line.start;
        const edge = line.brd.start;
        let nextLine = LineIndex.findNextEdgeLine(this.origIndex, point, edge, "end");

        const isSame = (line.isIdentical(nextLine))
        // let nextLine = this.findNextStartEnd(line )
        // console.log("lineIsClosable? ",isSame, line,nextLine)
        return isSame
    }

    /**
     * create a closed polygon for the full tile
     */
    static getFullTilePolygon(minXY:number, maxXY:number){
        const corners = LineIndex.getTileCornersCounterClockWiseCount(1,4,minXY, maxXY);
        //Close polygon
        corners.push(corners[0])
        corners.push(corners[1])
        return corners;
    }

    static getTileCornersCounterClockWiseCount(edgeStart:EdgeId, count:number, minXY:number, maxXY:number) {
        if (!EDGES.includes(edgeStart)) throw new Error("getTileCornersClockWise: invalid edgeStart " + edgeStart)
        if (count < 0 || count > 4) throw new Error("getTileCornersClockWise: invalid count " + count)

        const dbg = false;

        const corners : number [] = [];

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

        const corners : number [] = [];

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
        const sameEdge = this.lineFollowsCounterClockwiseOnSameEdge(line1,line2);

        if(sameEdge) {
            //console.log(`corner sameEdge`)
            return LineIndex.getTileCornersCounterClockWiseCount(line1.brd.end, 4, minXY, maxXY);
        }
        return this.getTileCornersCounterClockWise( line1.brd.end, line2.brd.start,minXY,maxXY );
    }


    /**
     * check if line2 starts on same edge as line1 ends in counterclockwise direction 
     * 
     * @param {*} line1 
     * @param {*} line2 
     * @returns 
     */
    lineFollowsCounterClockwiseOnSameEdge(line1,line2) {
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


    appendLinesToClone(lineIn: TiledLine, buffer, minXY:number, maxXY:number) {
        const dbg = false;

        const bufferRev = [...buffer].reverse()
        const line = lineIn.clone();

        if (dbg) console.log("appendLinesToClone", bufferRev)

        for (const buffLine of bufferRev) {
            // buffLine is appended 

            // buffline start will always be before
            //const lineEndEdge = line.brd.end
            //const corners = this.getTileCornersCounterClockWise(lineEndEdge, buffLine.brd.start, minXY, maxXY)
            
            const corners = this.getTileCornersCounterClockWiseBetweenLines(line, buffLine, minXY, maxXY);

            if (dbg) console.log("appendLinesToClone - add corners: ", corners)

            // insert corners if req
            line.appendCornersAtEnd(corners, minXY, maxXY)

            if (dbg) console.log("appendLinesToClone - add line: ", buffLine)
            line.appendLine(buffLine, minXY, maxXY)

        }

        this.closeLine(line, minXY, maxXY)

        return line;
    }

    checkAndClosableLine(line, minXY, maxXY) {
        throw new Error("Disabled checkAndClosableLine")
        var isClosable = this.lineIsClosable(line);
        if (!isClosable) return false;

        //console.log("CLOSABLE: " , line )
        // close lin                        
        const lineClone = this.closeLine(line, minXY, maxXY)
        //this.addToFinal( lineClone )
        this.removeFromSearch(line)
        return true
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
export function convertTileIsolinesToPolygons(lvl, lines: LineArray, tileInfo: TileInformation) {

    if( !lines || lines.length < 1 ) return  [];

    const newLines : LineArray=[];
    const dbg = false;

    const minXY=tileInfo.minXY;
    const maxXY=tileInfo.maxXY;
    if( minXY == undefined || maxXY == undefined ) throw new Error(`min/maxXY is missing min:${minXY} max:${maxXY}`);

    const lineIndex = new LineIndex(lines, minXY, maxXY)
    // console.log( "INDEX",lineIndex.debugIndex() ) 
    // console.log( "INDEX Orig",lineIndex.debugIndexOrig() ) 

    const initLineCount = lineIndex.getRemaining().length;
    const firstline = lineIndex.getFirst();
    let line = firstline;
    let edge = line?.brd?.start || false;
    let i = -1;
    //----

    // iterate over all lines in the tile.
    // not all lines will end up here because they me be appended to other lines and removed from the list
    while (line) {
        i++;
        // stop if first line is reached again
        if ( (i > 1 && firstline == line) || i > 50) {
            line = null;
            if (dbg) console.log("=== END : reached first again", i)
            break;
        };

        if ( i > initLineCount) {
            line = null;
            if (dbg) console.log("=== END : initial line count reached", i)
            break;
        };

        if (dbg) console.log("LINE " + i, line)

        let appendingLines : TiledLine [] = [];
        

        let nextAppendLine = line
        // look for all lines with edge contact in clockwise
        for (let appendLoopCount = 0; appendLoopCount < initLineCount; appendLoopCount++) {
            
            //if (appendLoopCount == initLineCount-1) {
                //console.log("WARN: appendLoop has reached init line count");
            //}

            //the next line which end is on the edge can be appended
            let nextLine = lineIndex.findNext2(nextAppendLine.start, nextAppendLine.brd.start, "end")
            
            if(!nextLine){
                console.log("ERROR: during appendLoop, next line is empty, count:"+appendLoopCount, {line,nextAppendLine})
                break;
            }

            const nextIsSame = line.isIdentical(nextLine)
            if (nextIsSame) {
                if (dbg) console.log("appendLoop: End self reached, count:", appendingLines.length)
                break;
            }
            if (dbg) console.log("appendLoop: testing line", nextLine)

            if(nextLine) appendingLines.push(nextLine)
            nextAppendLine = nextLine
        }

        const newLine = lineIndex.appendLinesToClone(line, appendingLines, minXY, maxXY)

        lineIndex.addToFinal(newLine)
        lineIndex.removeFromSearch(line)
        appendingLines.forEach(l => lineIndex.removeFromSearch(l))

        line = lineIndex.getFirst();
    }




    lineIndex.finalPool.forEach(l => {
        // console.log(l.line)

        if(l.line) newLines.push(l.line)
    })


    lineIndex.inner.forEach(l => {
        // console.log(l.line)
        if(l.line) newLines.push(l.line)
    })


    const rem = lineIndex.getRemaining();
    if (rem.length) {
        if (dbg) console.log("REMaining: ", rem.length)
    } else {
        if (dbg) console.log("REM empty ")
    }
    rem.forEach(l => {
        // console.log(l.line)
        if(l.line) newLines.push(l.line)
    })

    for (let line of lines) {
        //  line = checkLine(line, minXY,maxXY)
        //  console.log(line)
        // newLines.push( line );
    }

    for (let line of lines) {
        //line = checkLine(line, minXY,maxXY)
        // console.log(line)
        // newLines.push( line );
    }
    if (dbg) console.log("===============", lineIndex)
    return newLines;
}