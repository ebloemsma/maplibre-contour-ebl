(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.mlcontour = factory());
})(this, (function () { 'use strict';

    /* eslint-disable */
    
    var shared, worker, mlcontour;
    // define gets called three times: one for each chunk. we rely on the order
    // they're imported to know which is which
    function define(_, chunk) {
      if (!shared) {
        shared = chunk;
      } else if (!worker) {
        worker = chunk;
      } else {
        var workerBundleString =
          "var sharedChunk = {}; (" +
          shared +
          ")(sharedChunk); (" +
          worker +
          ")(sharedChunk);";
    
        var sharedChunk = {};
        shared(sharedChunk);
        mlcontour = chunk(sharedChunk);
        if (typeof window !== "undefined") {
          mlcontour.workerUrl = window.URL.createObjectURL(
            new Blob([workerBundleString], { type: "text/javascript" })
          );
        }
      }
    }


    define(['exports'], (function (exports) { 'use strict';

    /**
     * A standalone point geometry with useful accessor, comparison, and
     * modification methods.
     *
     * @class
     * @param {number} x the x-coordinate. This could be longitude or screen pixels, or any other sort of unit.
     * @param {number} y the y-coordinate. This could be latitude or screen pixels, or any other sort of unit.
     *
     * @example
     * const point = new Point(-77, 38);
     */
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    Point.prototype = {
        /**
         * Clone this point, returning a new point that can be modified
         * without affecting the old one.
         * @return {Point} the clone
         */
        clone() { return new Point(this.x, this.y); },

        /**
         * Add this point's x & y coordinates to another point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        add(p) { return this.clone()._add(p); },

        /**
         * Subtract this point's x & y coordinates to from point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        sub(p) { return this.clone()._sub(p); },

        /**
         * Multiply this point's x & y coordinates by point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        multByPoint(p) { return this.clone()._multByPoint(p); },

        /**
         * Divide this point's x & y coordinates by point,
         * yielding a new point.
         * @param {Point} p the other point
         * @return {Point} output point
         */
        divByPoint(p) { return this.clone()._divByPoint(p); },

        /**
         * Multiply this point's x & y coordinates by a factor,
         * yielding a new point.
         * @param {number} k factor
         * @return {Point} output point
         */
        mult(k) { return this.clone()._mult(k); },

        /**
         * Divide this point's x & y coordinates by a factor,
         * yielding a new point.
         * @param {number} k factor
         * @return {Point} output point
         */
        div(k) { return this.clone()._div(k); },

        /**
         * Rotate this point around the 0, 0 origin by an angle a,
         * given in radians
         * @param {number} a angle to rotate around, in radians
         * @return {Point} output point
         */
        rotate(a) { return this.clone()._rotate(a); },

        /**
         * Rotate this point around p point by an angle a,
         * given in radians
         * @param {number} a angle to rotate around, in radians
         * @param {Point} p Point to rotate around
         * @return {Point} output point
         */
        rotateAround(a, p) { return this.clone()._rotateAround(a, p); },

        /**
         * Multiply this point by a 4x1 transformation matrix
         * @param {[number, number, number, number]} m transformation matrix
         * @return {Point} output point
         */
        matMult(m) { return this.clone()._matMult(m); },

        /**
         * Calculate this point but as a unit vector from 0, 0, meaning
         * that the distance from the resulting point to the 0, 0
         * coordinate will be equal to 1 and the angle from the resulting
         * point to the 0, 0 coordinate will be the same as before.
         * @return {Point} unit vector point
         */
        unit() { return this.clone()._unit(); },

        /**
         * Compute a perpendicular point, where the new y coordinate
         * is the old x coordinate and the new x coordinate is the old y
         * coordinate multiplied by -1
         * @return {Point} perpendicular point
         */
        perp() { return this.clone()._perp(); },

        /**
         * Return a version of this point with the x & y coordinates
         * rounded to integers.
         * @return {Point} rounded point
         */
        round() { return this.clone()._round(); },

        /**
         * Return the magnitude of this point: this is the Euclidean
         * distance from the 0, 0 coordinate to this point's x and y
         * coordinates.
         * @return {number} magnitude
         */
        mag() {
            return Math.sqrt(this.x * this.x + this.y * this.y);
        },

        /**
         * Judge whether this point is equal to another point, returning
         * true or false.
         * @param {Point} other the other point
         * @return {boolean} whether the points are equal
         */
        equals(other) {
            return this.x === other.x &&
                   this.y === other.y;
        },

        /**
         * Calculate the distance from this point to another point
         * @param {Point} p the other point
         * @return {number} distance
         */
        dist(p) {
            return Math.sqrt(this.distSqr(p));
        },

        /**
         * Calculate the distance from this point to another point,
         * without the square root step. Useful if you're comparing
         * relative distances.
         * @param {Point} p the other point
         * @return {number} distance
         */
        distSqr(p) {
            const dx = p.x - this.x,
                dy = p.y - this.y;
            return dx * dx + dy * dy;
        },

        /**
         * Get the angle from the 0, 0 coordinate to this point, in radians
         * coordinates.
         * @return {number} angle
         */
        angle() {
            return Math.atan2(this.y, this.x);
        },

        /**
         * Get the angle from this point to another point, in radians
         * @param {Point} b the other point
         * @return {number} angle
         */
        angleTo(b) {
            return Math.atan2(this.y - b.y, this.x - b.x);
        },

        /**
         * Get the angle between this point and another point, in radians
         * @param {Point} b the other point
         * @return {number} angle
         */
        angleWith(b) {
            return this.angleWithSep(b.x, b.y);
        },

        /**
         * Find the angle of the two vectors, solving the formula for
         * the cross product a x b = |a||b|sin(θ) for θ.
         * @param {number} x the x-coordinate
         * @param {number} y the y-coordinate
         * @return {number} the angle in radians
         */
        angleWithSep(x, y) {
            return Math.atan2(
                this.x * y - this.y * x,
                this.x * x + this.y * y);
        },

        /** @param {[number, number, number, number]} m */
        _matMult(m) {
            const x = m[0] * this.x + m[1] * this.y,
                y = m[2] * this.x + m[3] * this.y;
            this.x = x;
            this.y = y;
            return this;
        },

        /** @param {Point} p */
        _add(p) {
            this.x += p.x;
            this.y += p.y;
            return this;
        },

        /** @param {Point} p */
        _sub(p) {
            this.x -= p.x;
            this.y -= p.y;
            return this;
        },

        /** @param {number} k */
        _mult(k) {
            this.x *= k;
            this.y *= k;
            return this;
        },

        /** @param {number} k */
        _div(k) {
            this.x /= k;
            this.y /= k;
            return this;
        },

        /** @param {Point} p */
        _multByPoint(p) {
            this.x *= p.x;
            this.y *= p.y;
            return this;
        },

        /** @param {Point} p */
        _divByPoint(p) {
            this.x /= p.x;
            this.y /= p.y;
            return this;
        },

        _unit() {
            this._div(this.mag());
            return this;
        },

        _perp() {
            const y = this.y;
            this.y = this.x;
            this.x = -y;
            return this;
        },

        /** @param {number} angle */
        _rotate(angle) {
            const cos = Math.cos(angle),
                sin = Math.sin(angle),
                x = cos * this.x - sin * this.y,
                y = sin * this.x + cos * this.y;
            this.x = x;
            this.y = y;
            return this;
        },

        /**
         * @param {number} angle
         * @param {Point} p
         */
        _rotateAround(angle, p) {
            const cos = Math.cos(angle),
                sin = Math.sin(angle),
                x = p.x + cos * (this.x - p.x) - sin * (this.y - p.y),
                y = p.y + sin * (this.x - p.x) + cos * (this.y - p.y);
            this.x = x;
            this.y = y;
            return this;
        },

        _round() {
            this.x = Math.round(this.x);
            this.y = Math.round(this.y);
            return this;
        },

        constructor: Point
    };

    /**
     * Construct a point from an array if necessary, otherwise if the input
     * is already a Point, return it unchanged.
     * @param {Point | [number, number] | {x: number, y: number}} p input value
     * @return {Point} constructed point.
     * @example
     * // this
     * var point = Point.convert([0, 1]);
     * // is equivalent to
     * var point = new Point(0, 1);
     */
    Point.convert = function (p) {
        if (p instanceof Point) {
            return /** @type {Point} */ (p);
        }
        if (Array.isArray(p)) {
            return new Point(+p[0], +p[1]);
        }
        if (p.x !== undefined && p.y !== undefined) {
            return new Point(+p.x, +p.y);
        }
        throw new Error('Expected [x, y] or {x, y} point format');
    };

    class TileInformation {
        setTile(tile) {
            const { edgeMin, edgeMax } = findTileEdgeMinMax(tile);
            this.edgeMin = Math.round(edgeMin);
            this.edgeMax = Math.round(edgeMax);
        }
        constructor(z, x, y, tile) {
            this.z = z;
            this.y = y;
            this.x = x;
            if (tile)
                this.setTile(tile);
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
            return (isZ && isX && isY);
        }
        toString() {
            return `Tile: ${this.z}/${this.x}/${this.y}, min/max: ${Math.round(this.min || 0)}/${Math.round(this.max || 0)}  edgemin/max: ${this.edgeMin}/${this.edgeMax}`; //min/maxXY: ${this.minXY},${this.maxXY} `
        }
        coordString() {
            return `Tile: ${this.z}/${this.x}/${this.y}`;
        }
    }
    class TileEdgeLineIndex {
        static __createFromLines(lines, minXY, maxXY) {
            const lineObjects = lines.map(l => {
                return new TiledLine(l, minXY, maxXY);
            });
            return TileEdgeLineIndex.__createFromTileLines(lineObjects, minXY, maxXY);
        }
        static __createFromTileLines(lineObjectsAll, minXY, maxXY) {
            // const lineObjects = lines.map(l => {
            //     return new TiledLine(l, minXY, maxXY);
            // });
            // console.log( inner )
            const lineObjects = lineObjectsAll.filter(l => (!l.isClosed && !l.isTiny));
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
            };
            return Object.assign(index, data);
        }
        removeLine(line) {
            if (!line)
                return;
            for (const [edge, node] of Object.entries(this)) {
                //console.log( edge, node)
                node.s = node.s.filter(l => l !== line);
                node.e = node.e.filter(l => l !== line);
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
        if (code == 6)
            code = 2;
        if (code == 12)
            code = 4;
        if (code == 3)
            code = 1;
        if (code == 9)
            code = 8;
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
        return { x: line[line.length - 2], y: line[line.length - 1] };
    }
    function getLineFirst(line) {
        return { x: line[0], y: line[1] };
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
        };
    }
    function getLineBorderCode(line, minXY, maxXY) {
        if (!line)
            throw new Error("empty line");
        const l = line.length;
        let sx = line[0];
        let sy = line[0 + 1];
        let ex = line[l - 2];
        let ey = line[l - 1];
        const start = findBorder(sx, sy, minXY, maxXY);
        const end = findBorder(ex, ey, minXY, maxXY);
        return { start, end, code: [start, end] };
    }
    function generateFullTileIsoPolygons(fullTile, levels, minXY, maxXY, x, y, z) {
        // console.log("ADD FULL:",fullTile,gpwslevels)
        if (fullTile.min == undefined)
            return [];
        const fullTilePolygons = {};
        for (const lvl of levels) {
            if (fullTile.min >= lvl) {
                const polygon = LineIndex.getFullTilePolygon(minXY, maxXY);
                //console.log(`ADD full layer tile ${z},${x},${y}: ${lvl}` , line)
                if (!fullTilePolygons[lvl])
                    fullTilePolygons[lvl] = [];
                fullTilePolygons[lvl].push(polygon);
            }
        }
        // if( Object.keys(fullTilePolygons).length ) {
        //     // console.log("fullTilePolys",fullTilePolys );
        //     console.log(`generateFullTileIsoPolygons`, fullTile.toString(), fullTilePolygons )
        // }
        return fullTilePolygons;
    }
    function findTileEdgeMinMax(tile) {
        let edgeMin = -Infinity;
        let edgeMax = Infinity;
        for (let col = 0; col < tile.width; col++) {
            const top = tile.get(0, col);
            const botom = tile.get(tile.height - 1, col);
            edgeMin = Math.max(edgeMin, top, botom);
            edgeMax = Math.min(edgeMax, top, botom);
        }
        for (let row = 0; row < tile.height; row++) {
            const left = tile.get(row, 0);
            const right = tile.get(row, tile.width - 1);
            edgeMin = Math.max(edgeMin, left, right);
            edgeMax = Math.min(edgeMax, left, right);
        }
        return { edgeMin, edgeMax };
    }
    function analyzePolygon(coords) {
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
        //const isTiny = absoluteArea < 50*50;
        // let min = Infinity;
        // let max = -Infinity;
        // iteratePointsInsidePolygon(coords, (x, y) => {
        //     const elev = tile.get(x,y)
        //     min = Math.min(min, elev)
        //     max = Math.max(max, elev)
        // })
        return {
            //isTiny,
            signedArea,
            area: absoluteArea,
            length: perimeter,
            winding
        };
    }
    class TiledLine {
        constructor(line, minXY, maxXY) {
            this.done = false;
            if (line) {
                this.line = [...this.fixLineEnds(line)];
                this.update(minXY, maxXY);
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
            if (value == 0)
                return -32;
            if (value == 4096)
                return 4128;
            return value;
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
            line[0];
            line[0 + 1];
            line[l - 2];
            line[l - 1];
            line[0] = this.fixInvalidLineEnd(line[0]);
            line[0 + 1] = this.fixInvalidLineEnd(line[0 + 1]);
            line[l - 2] = this.fixInvalidLineEnd(line[l - 2]);
            line[l - 1] = this.fixInvalidLineEnd(line[l - 1]);
            return line;
        }
        update(minXY, maxXY) {
            if (!this.line)
                throw new Error("empty this.line");
            const l = this.line;
            const border = getLineBorderCode(l, minXY, maxXY);
            this.start = getLineFirst(l);
            this.end = getLineLast(l);
            this.brd = border;
            // cw : inner lower
            // ccw: inner is higher
            this.bbox = getLineBBox(l);
            if (this.isClosed) {
                const polyInfo = analyzePolygon(this.line);
                this.info = polyInfo;
                //this.isTiny = polyInfo.isTiny
                this.length = polyInfo.length;
                this.winding = polyInfo.winding;
                this.area = polyInfo.area;
            }
        }
        clone() {
            const line = new TiledLine(this.line, this.minXY, this.maxXY);
            return line;
        }
        get hash() {
            return hashArray(this.line);
        }
        get isTiny() {
            return (this.area != undefined) ? this.area < 50 * 50 : null;
        }
        get isClosed() {
            if (!this.line)
                throw new Error("empty this.line");
            const sx = this.line[0];
            const sy = this.line[1];
            const ex = this.line[this.line.length - 2];
            const ey = this.line[this.line.length - 1];
            return (sx == ex && sy == ey);
        }
        isCongruent(line) {
            if (!line)
                return false;
            return (this.hash == line.hash);
        }
        isSame(line) {
            return (line === this);
        }
        isIdentical(line) {
            return JSON.stringify(this) === JSON.stringify(line);
        }
        appendLine(appendLine, minXY, maxXY) {
            if (!this.line)
                throw new Error("empty this.line");
            this.line.push(...appendLine.line);
            this.update(minXY, maxXY);
        }
        /**
         * corners must be in counter Clockwise sorting
         *
         */
        appendCornersAtEnd(corners, minXY, maxXY) {
            if (!this.line)
                throw new Error("empty this.line");
            this.line.push(...corners);
            // add start to close ring
            this.update(minXY, maxXY);
        }
        closeLineStartEnd(minXY, maxXY) {
            if (!this.line)
                throw new Error("empty this.line");
            this.line.push(this.line[0]);
            this.line.push(this.line[1]);
            this.update(minXY, maxXY);
        }
        toString() {
            return this.toString2();
        }
        ;
        toString2(tileLineIndex) {
            const l = this;
            const winding = (l.winding) ? l.winding : "";
            const innerHighLow = (l.winding == "cw") ? "low" : (l.winding == "ccw" ? "high" : "");
            const closed = (l.isClosed) ? `closed:${winding}/${innerHighLow},` : "";
            const tiny = (l.isTiny) ? "tiny," : "";
            const length = (l.line) ? "l:" + l.line.length + "," : "";
            const area = (l.isClosed) ? `area:${l.info.area},` : "";
            const bbox = (l.bbox) ? `bbx: [${l.bbox.minX},${l.bbox.minY} - ${l.bbox.maxX},${l.bbox.maxY}],` : "";
            let selfClosable = (tileLineIndex === null || tileLineIndex === undefined ? undefined : tileLineIndex.lineIsSelfClosable(l)) ? "selfClosable" : "";
            if (l.isClosed) {
                return `#${l.hash} ${closed} ${length} ${area} ${bbox} ${tiny}`;
            }
            return `#${l.hash} ${length} edges: ${l.brd.start}-${l.brd.end} [${l.start.x},${l.start.y}--${l.end.x},${l.end.y}] ${selfClosable} ${bbox}`;
        }
    } // class TileLine
    const EDGES = [1, 2, 4, 8];
    class LineIndex {
        getHoleCandidates() {
            return this.inner.filter(l => l.winding == "cw").filter(l => !l.isTiny);
        }
        getTopCandidates() {
            return this.inner.filter(l => l.winding == "ccw").filter(l => !l.isTiny);
        }
        constructor(lines, minXY, maxXY) {
            //finalPool: TiledLine[] = [];
            this.filtered = [];
            this.inner = [];
            this.lineIndex = this.createLineEdgeIndexFromLines(lines, minXY, maxXY);
            this.origIndex = this.createLineEdgeIndexFromLines(lines, minXY, maxXY);
            //this.finalPool = [];
            const lineObjects = lines.map(l => {
                return new TiledLine(l, minXY, maxXY);
            });
            this.filtered = lineObjects.filter(l => (!l.isClosed && !l.isTiny));
            this.inner = lineObjects.filter(lo => lo.brd.start == 0 || lo.brd.end == 0);
        }
        getFirst() {
            const edges = Object.keys(this.lineIndex);
            for (let c of edges) {
                let lines = this.lineIndex[c];
                //let lines = this.get(c);
                if (!lines || !lines.s)
                    continue;
                let line = lines.s[0] || null;
                if (!line)
                    continue;
                // console.log("FIRST" + c, line)
                return line;
            }
            return null;
        }
        // getIterationList() {
        //     return [...this.lineIndex, ...rightStart, ...bottomStart, ...leftStart]
        // }
        lineIndexFlatList(indexDb) {
            const rem = [];
            for (const [edge, node] of Object.entries(indexDb)) {
                //console.log( edge, node)
                rem.push(...node.s);
            }
            return Array.from(new Set(rem));
        }
        getRemaining() {
            return this.lineIndexFlatList(this.lineIndex);
        }
        get all() {
            return this.getRemaining();
        }
        get remainCount() {
            return this.getRemaining().length;
        }
        createLineEdgeIndexFromLines(lines, minXY, maxXY) {
            const lineObjects = lines.map(l => {
                return new TiledLine(l, minXY, maxXY);
            });
            return this.createLineEdgeIndex(lineObjects, minXY, maxXY);
        }
        createLineEdgeIndex(lineObjectsAll, minXY, maxXY) {
            // const lineObjects = lines.map(l => {
            //     return new TiledLine(l, minXY, maxXY);
            // });
            // console.log( inner )
            const lineObjects = lineObjectsAll.filter(l => (!l.isClosed && !l.isTiny));
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
            };
            return Object.assign(new TileEdgeLineIndex(), indexData);
        }
        findNext(line) {
            const point = line.end;
            const edge = line.brd.end;
            return this.findNext2(point, edge, "start");
        }
        static findOnEdge(lineIndex, edge, startOrEnd, mode, point) {
            let lineCandiates = LineIndex.getEdgeLisFromIndex(lineIndex, edge, startOrEnd);
            if (!lineCandiates)
                return undefined;
            if (!point && mode != "first")
                throw new Error("point is missing for mode: " + mode);
            // console.log("findOnEdge",edge,startOrEnd,mode,point)
            if (mode == "after") {
                if (!point)
                    throw new Error("point is missing for mode: " + mode);
                if (edge == 1)
                    return lineCandiates.find(l => l[startOrEnd].x > point.x);
                if (edge == 2)
                    return lineCandiates.find(l => l[startOrEnd].y > point.y);
                if (edge == 4)
                    return lineCandiates.find(l => l[startOrEnd].x < point.x);
                if (edge == 8)
                    return lineCandiates.find(l => l[startOrEnd].y < point.y);
                throw new Error("findOnEdge: invalid edge " + edge);
            }
            else if (mode == "before") {
                if (!point)
                    throw new Error("point is missing for mode: " + mode);
                if (edge == 1)
                    return lineCandiates.find(l => l[startOrEnd].x < point.x);
                if (edge == 2)
                    return lineCandiates.find(l => l[startOrEnd].y < point.y);
                if (edge == 4)
                    return lineCandiates.find(l => l[startOrEnd].x > point.x);
                if (edge == 8)
                    return lineCandiates.find(l => l[startOrEnd].y > point.y);
                throw new Error("findOnEdge: invalid edge " + edge);
            }
            else if (mode == "first") {
                return lineCandiates[0];
            }
            else {
                throw new Error("findOnEdge: invalid mode " + mode);
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
        static findNextEdgeLine(lineIndex, point, pointEdge, startOrEnd) {
            let found;
            // direction clockwise
            // start at edge of point
            let startIndex = EDGES.indexOf(pointEdge);
            for (let i = 0; i <= 4; i++) {
                const index = (startIndex + i) % EDGES.length;
                const edge = EDGES[index];
                if (i == 0) {
                    //on own edge - look after
                    found = LineIndex.findOnEdge(lineIndex, edge, startOrEnd, "after", point);
                }
                else if (i == 4) {
                    //on own edge - look before
                    found = LineIndex.findOnEdge(lineIndex, edge, startOrEnd, "before", point);
                }
                else {
                    //
                    found = LineIndex.findOnEdge(lineIndex, edge, startOrEnd, "first");
                }
                // console.log("--=",i,edge,pointEdge)
                if (found)
                    break;
            }
            // console.log("findNextDB end:", found)
            return found;
        }
        static getEdgeLisFromIndex(db, edge, startOrEnd) {
            const list = db[edge];
            if (!list)
                throw new Error("edgeIndex is null for edge: " + edge);
            if (!startOrEnd)
                throw new Error("start or end missing"); //return list;
            if (startOrEnd == "start")
                return list.s;
            if (startOrEnd == "end")
                return list.e;
            throw new Error("get: invalid startOrEnd: " + startOrEnd);
        }
        get(edge, startOrEnd) {
            const list = this.lineIndex[edge];
            if (!startOrEnd)
                return list;
            if (startOrEnd == "start")
                return list.s;
            if (startOrEnd == "end")
                return list.e;
            throw new Error("get: invalid startOrEnd: " + startOrEnd);
        }
        // addToFinal(line: TiledLine) {
        //     this.finalPool.push(line)
        //     // console.log( "FINAL add:",line ) 
        // }
        debugIndexOrig() {
            return this.debugIndexDB(this.origIndex);
        }
        debugIndex() {
            return this.debugIndexDB(this.lineIndex);
        }
        debugIndexDB(lineIndex) {
            const debug = {
                all: [],
                inner: [],
            };
            const lineToString = (l) => {
                return l.toString2();
            };
            for (const [edge, node] of Object.entries(lineIndex)) {
                //console.log( edge, node)
                debug[edge] = {};
                debug[edge].s = node.s.map(l => lineToString(l));
                debug[edge].e = node.e.map(l => lineToString(l));
            }
            for (const line of this.lineIndexFlatList(lineIndex)) {
                debug.all.push(lineToString(line));
            }
            for (const line of this.inner) {
                debug.inner.push(lineToString(line));
            }
            return debug;
        }
        removeFromSearch(line) {
            if (Array.isArray(line)) {
                line.forEach(l => this.removeFromSearch(l));
                return;
            }
            //  console.log( "REMOVE:",line )
            this.lineIndex.removeLine(line);
            this.inner = this.inner.filter(l => l !== line);
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
            if (!line)
                return false;
            const point = line.start;
            const edge = line.brd.start;
            // no edge found so line is closed
            if (line.isClosed)
                return false;
            if (!edge)
                return false;
            let nextLine = LineIndex.findNextEdgeLine(this.origIndex, point, edge, "end");
            const isSame = (line.isIdentical(nextLine));
            // let nextLine = this.findNextStartEnd(line )
            // console.log("lineIsSelfClosable? ",isSame, line,nextLine)
            return isSame;
        }
        /**
         * create a closed polygon for the full tile
         */
        static getFullTilePolygon(minXY, maxXY) {
            const corners = LineIndex.getTileCornersCounterClockWiseCount(1, 4, minXY, maxXY);
            //Close polygon
            corners.push(corners[0]);
            corners.push(corners[1]);
            return corners;
        }
        static getTileCornersCounterClockWiseCount(edgeStart, count, minXY, maxXY) {
            if (!EDGES.includes(edgeStart))
                throw new Error("getTileCornersClockWise: invalid edgeStart " + edgeStart);
            if (count < 0 || count > 4)
                throw new Error("getTileCornersClockWise: invalid count " + count);
            const corners = [];
            const wrapIndex = (value) => {
                const start = 0;
                const end = 4;
                let range = end - start;
                return ((value - start) % range + range) % range + start;
            };
            let startIndex = EDGES.indexOf(edgeStart);
            EDGES[wrapIndex(startIndex - count)];
            for (let i = 0; i < count; i++) {
                const index = wrapIndex(startIndex - i);
                const edgeLoop = EDGES[index];
                // console.log( "tileConerCCW-loop:",i,index,edgeLoop )
                if (edgeLoop == 1)
                    corners.push(minXY, minXY);
                if (edgeLoop == 2)
                    corners.push(maxXY, minXY);
                if (edgeLoop == 4)
                    corners.push(maxXY, maxXY);
                if (edgeLoop == 8)
                    corners.push(minXY, maxXY);
            }
            return corners;
        }
        getTileCornersCounterClockWise(edgeStart, edgeEnd, minXY, maxXY) {
            // if ( !EDGES.includes(edgeStart) || !EDGES.includes(edgeEnd) ) throw new Error("getEdgePointsClockWise: invalid edgevalue " +edgeEnd+" " +edgeStart)
            if (!EDGES.includes(edgeStart))
                throw new Error("getTileCornersClockWise: invalid edgeStart " + edgeStart);
            if (!EDGES.includes(edgeEnd))
                throw new Error("getTileCornersClockWise: invalid edgeEnd " + edgeEnd);
            const corners = [];
            let startIndex = EDGES.indexOf(edgeStart);
            const wrapIndex = (value) => {
                const start = 0;
                const end = 4;
                let range = end - start;
                return ((value - start) % range + range) % range + start;
            };
            let edgeLoop = edgeStart;
            for (let i = 0; edgeLoop != edgeEnd && i > -20; i--) {
                const index = wrapIndex(startIndex + i);
                const edgeLoop = EDGES[index];
                if (edgeLoop == edgeEnd)
                    break;
                // console.log( "tileConerCCW-loop:",i,index,edgeLoop )
                if (edgeLoop == 1)
                    corners.push(minXY, minXY);
                if (edgeLoop == 2)
                    corners.push(maxXY, minXY);
                if (edgeLoop == 4)
                    corners.push(maxXY, maxXY);
                if (edgeLoop == 8)
                    corners.push(minXY, maxXY);
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
            if (line.brd.end != line.brd.start)
                return false; //throw new Error("isEndBeforeStartSameEdge: not on same edge");
            const end = line.end;
            const start = line.start;
            const edge = line.brd.start;
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
        countCornersBetweenEdgesBackwards(edgeFrom, edgeTo) {
            EDGES.indexOf(edgeFrom);
            let count = -1;
            let edge = edgeFrom;
            const wrapNumber = (value, start, end) => {
                let range = end - start;
                return ((value - start) % range + range) % range + start;
            };
            for (; edge != edgeTo;) {
                count--;
                const index = wrapNumber(count, 0, 4);
                console.log(index, count);
                edge = EDGES[index];
            }
            // console.log("cornerCountBw:", edgeFrom,edgeTo, count)
            return Math.abs(count);
        }
        countCornersBetweenEdges(edgeFrom, edgeTo) {
            let startIndex = EDGES.indexOf(edgeFrom);
            let count = -1;
            let edge = edgeFrom;
            while (edge != edgeTo && count < 4) {
                count++;
                const index = (startIndex + count) % 4;
                edge = EDGES[index];
                console.log("--##", edge, index, count);
            }
            // console.log("CLOSE Line count:", edgeFrom,edgeTo,count)
            return count;
        }
        closeLine(line, minXY, maxXY) {
            const startEdge = line.brd.start;
            const endEdge = line.brd.end;
            let count = 0;
            const endBeforeOnSame = this.isEndBeforeStartSameEdge(line);
            if (endBeforeOnSame) {
                count = 4;
            }
            else {
                // get required edge count from start to end
                let edge = startEdge;
                let startIndex = EDGES.indexOf(startEdge);
                count = 0;
                for (; edge != endEdge;) {
                    count++;
                    const index = (startIndex + count) % 4;
                    edge = EDGES[index];
                }
            }
            const corners = LineIndex.getTileCornersCounterClockWiseCount(endEdge, count, minXY, maxXY);
            // add corners reverse to the end
            //const lineClone = line.clone();        
            line.appendCornersAtEnd(corners, minXY, maxXY);
            line.closeLineStartEnd(minXY, maxXY);
            // add the start point at end
            return line;
        }
        createConcatedLine(lineIn, buffer, minXY, maxXY) {
            const dbg = `${0}`;
            const bufferRev = [...buffer].reverse();
            const line = lineIn.clone();
            if (dbg == "1")
                console.log("appendLinesToClone", bufferRev);
            for (const buffLine of bufferRev) {
                // buffLine is appended 
                // buffline start will always be before
                //const lineEndEdge = line.brd.end
                //const corners = this.getTileCornersCounterClockWise(lineEndEdge, buffLine.brd.start, minXY, maxXY)
                const corners = this.getTileCornersCounterClockWiseBetweenLines(line, buffLine, minXY, maxXY);
                if (dbg == "1") {
                    console.log("appendLinesToClone - add corners: ", corners);
                }
                // insert corners if req
                line.appendCornersAtEnd(corners, minXY, maxXY);
                if (dbg == "1")
                    console.log("appendLinesToClone - add line: ", buffLine);
                line.appendLine(buffLine, minXY, maxXY);
            }
            this.closeLine(line, minXY, maxXY);
            return line;
        }
        checkAndClosableLine(line, minXY, maxXY) {
            throw new Error("Disabled checkAndClosableLine");
        }
        toArrayAllInner(lineFilter) {
            const useFilter = (lineFilter) ? lineFilter : () => true;
            return [...this.all.filter(useFilter).map(tl => tl.line), ...this.inner.filter(useFilter).map(tl => tl.line),];
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
    function convertTileIsolinesToPolygons(lvl, linesIn, tileInfo) {
        const lines = linesIn.filter(l => l.length > 6);
        if (!lines || lines.length < 1) {
            console.log("Tile w/o lines: " + tileInfo.coordString());
            return [];
        }
        const newLines = [];
        const concatedPolygonsArray = [];
        // SET-DBG convertTileIsolinesToPolygons 
        const dbg = Number(`${tileInfo.isTile(null, 328, 713) ? "1" : "0"}`);
        //const dbg = Number(`${0}`);
        if (dbg >= 1)
            console.log(`convertIsoToPolys START - Tile: ${tileInfo.coordString()} `);
        const minXY = tileInfo.minXY;
        const maxXY = tileInfo.maxXY;
        if (minXY == undefined || maxXY == undefined)
            throw new Error(`min/maxXY is missing min:${minXY} max:${maxXY}`);
        const lineIndex = new LineIndex(lines, minXY, maxXY);
        //const innerHighPolygons = lineIndex.inner.filter(l => l.winding == "ccw");
        //const innerLowPolygonsCW = lineIndex.inner.filter(l => l.winding == "cw");
        // console.log( "INDEX",lineIndex.debugIndex() ) 
        // console.log( "INDEX Orig",lineIndex.debugIndexOrig() ) 
        if (dbg >= 1)
            console.log(`- lvl: ${lvl}, lines:`, lineIndex.debugIndexOrig());
        // iterate over all edge-lines in the tile.
        // not all lines will end up here because they me be appended to other lines and removed from the list
        const totalEdgeLineCount = lineIndex.getRemaining().length;
        const firstline = lineIndex.getFirst();
        let i = -1;
        let currentEdgeLine = firstline;
        while (currentEdgeLine) {
            i++;
            // stop if first line is reached again
            if ((i > 1 && firstline == currentEdgeLine) || i > 50) {
                currentEdgeLine = null;
                if (dbg >= 2)
                    console.log(`close line(${i} END - reached first again`);
                break;
            }
            if (i > totalEdgeLineCount) {
                currentEdgeLine = null;
                if (dbg >= 2)
                    console.log(`close line(${i} END - line count reached`);
                break;
            }
            if (dbg >= 2)
                console.log(`close Line (${i}) START`, currentEdgeLine);
            let linesToAppend = [];
            let currentAppendCandidateLine = currentEdgeLine;
            // look for all other edge-lines in clockwise direction if they may be concat to currentLines
            for (let appendLoopCount = 0; appendLoopCount < totalEdgeLineCount; appendLoopCount++) {
                //if (appendLoopCount == initLineCount-1) {
                //console.log("WARN: appendLoop has reached init line count");
                //}
                try {
                    //the next line which end is on the edge can be appended
                    let nextAppendCandidate = lineIndex.findNext2(currentAppendCandidateLine.start, currentAppendCandidateLine.brd.start, "end");
                    if (!nextAppendCandidate) {
                        console.log("ERROR: during appendLoop, next line is empty, count:" + appendLoopCount, { currentEdgeLine, currentAppendCandidateLine });
                        break;
                    }
                    const nextIsSame = currentEdgeLine.isIdentical(nextAppendCandidate);
                    if (nextIsSame) {
                        if (dbg >= 2)
                            console.log(`close line(${i} END self reached, append-count: ${linesToAppend.length}`);
                        break;
                    }
                    if (nextAppendCandidate) {
                        if (dbg >= 2)
                            console.log(`close line(${i} - append line:`, nextAppendCandidate);
                        linesToAppend.push(nextAppendCandidate);
                    }
                    currentAppendCandidateLine = nextAppendCandidate;
                }
                catch (error) {
                    console.error("currentAppendCandidateLine", currentAppendCandidateLine);
                    console.error(error);
                }
            }
            const concatedLine = lineIndex.createConcatedLine(currentEdgeLine, linesToAppend, minXY, maxXY);
            concatedPolygonsArray.push(concatedLine);
            //lineIndex.addToFinal(concatedLine)
            lineIndex.removeFromSearch(currentEdgeLine);
            linesToAppend.forEach(l => lineIndex.removeFromSearch(l));
            currentEdgeLine = lineIndex.getFirst();
        }
        if (dbg >= 1)
            console.log("- concatedPolygons: ", lineArrayToStrings(concatedPolygonsArray));
        if (dbg >= 1)
            console.log("- lineIndex (should have noe egde lines): ", lineIndex.debugIndex());
        // handle inner self-closed lines (rings/polygons) that never touched edges
        // depending on winding they denote higher or lower terrain
        // ccw: denotes higher terrain - can just be added as polygons
        // cw: denotes lower terrain so they are holes inside other polygons that already exist. that may be 
        //     polygons created by appending ot maybe a fulltile polygon
        // all polygons that may contain inner holes
        const highPolys = [...concatedPolygonsArray, ...lineIndex.getTopCandidates()];
        // process concated polygons and possible holes
        highPolys.forEach(concatPoly => {
            // console.log(l.line)
            if (!concatPoly.line)
                return;
            // find any holes (inner polys with low terrain inside)
            const currentHoleCandidates = lineIndex.getHoleCandidates();
            if (dbg >= 1 && currentHoleCandidates.length > 0)
                console.log(`- find holes(inner-low):${currentHoleCandidates.length} in high-poly:`, concatPoly.toString2(), currentHoleCandidates);
            const foundHoles = [];
            currentHoleCandidates.forEach(inner => {
                // if (inner.isTiny) {
                //     if (dbg >= 1) console.log(`  - skip hole (tiny): ${inner.toString2()}`)
                //     return;
                // }
                const isInseide = isPolygonInsideFlat(inner.line, concatPoly.line);
                if (isInseide) {
                    foundHoles.push(inner);
                    if (dbg >= 1)
                        console.log(`  - found hole: ${inner.toString2()}`);
                }
            });
            if (dbg >= 1)
                console.log(` - finalize poly, holes: ${foundHoles.length}`);
            newLines.push(concatPoly.line, ...foundHoles.map(l => l.line).filter(l => l != undefined));
            lineIndex.removeFromSearch(foundHoles);
            lineIndex.removeFromSearch(concatPoly);
            // const removed = arrayRemoveObjects(holeCandidates, ...foundHoles)
            // if (dbg >= 2) console.log("removed hole candidates:" + removed )
        });
        const fullTileCCW = [-32, -32, -32, 4128, 4128, 4128, 4128, -32, -32, -32];
        // these should be empty now
        const remainingTops = lineIndex.getTopCandidates();
        // handle remaining holes (not conatined in any high polygon). they are contained in a fulltile polygon that will be created
        const fullTileHoles = lineIndex.getHoleCandidates();
        try {
            if (fullTileHoles.length > 0) {
                // holes inside other polygons on this level
                if (dbg >= 1)
                    console.log("uncontained holes (for full-tile): ", lineArrayToStrings(fullTileHoles));
                // check preconditions
                if (remainingTops.length > 0)
                    throw new Error(`uncontained holes(${fullTileHoles.length}) + unhandled tops(${remainingTops.length}), not handled `);
                // these cases are not handled correctly, must be holes in other polygons
                //if (lineIndex.finalPool.length > 0) throw new Error(`innerPolys LOW (${innerLowPolygonsCW.length}) + non-inner/final polys ((${lineIndex.finalPool.length})) `)
                if (lineIndex.remainCount > 0)
                    throw new Error(`innerPolys LOW (${fullTileHoles.length}) +  remainCount: ${lineIndex.remainCount}`);
                // add as holes to full tile poly
                if (dbg >= 1)
                    console.log(` add fullTileCCW (high) + holes:${fullTileHoles.length} `, { fullTileCCW });
                newLines.push(fullTileCCW, ...fullTileHoles.map(l => l.line));
                lineIndex.removeFromSearch(fullTileHoles);
            }
        }
        catch (e) {
            console.log("ERROR innerPoly LOW handling, tile:" + tileInfo.coordString());
            console.log(e);
            console.log({ tops: lineArrayToStrings(remainingTops), holes: lineArrayToStrings(fullTileHoles) });
            console.log("----------------- ");
        }
        const remainingInnerRingsHigh = lineIndex.getTopCandidates();
        // add remaining TOP-rings (that have not been added before)
        if (remainingInnerRingsHigh.length > 0) {
            if (dbg >= 1)
                console.log("remainingInnerRingsHigh: ", lineArrayToStrings(remainingInnerRingsHigh));
            remainingInnerRingsHigh.forEach(l => {
                if (l.line)
                    newLines.push(l.line);
                lineIndex.removeFromSearch(l);
            });
            //lineIndex.inner = lineIndex.inner.filter(l => l.winding !== "ccw");
        }
        // lineIndex should be completely Empty
        const rem = lineIndex.getRemaining();
        if (rem.length) {
            console.log("## WARN: remaing lines (are added) tile: " + tileInfo.coordString(), rem.length);
            console.error(lineIndex.debugIndex());
            throw new Error("lineIndex at end not empty: " + tileInfo.coordString());
        }
        rem.forEach(l => {
            console.log("- add remaining line: ", l.line);
            if (l.line)
                newLines.push(l.line);
        });
        for (let line of lines) {
            //  line = checkLine(line, minXY,maxXY)
            //  console.log(line)
            // newLines.push( line );
        }
        for (let line of lines) {
            // if (lvl==2500) findAbnormal(line)
            //line = checkLine(line, minXY,maxXY)
            // console.log(line)
            // newLines.push( line );
        }
        //if (dbg >= 1) console.log("createIso = END ==============", lineIndex)
        return newLines;
    }
    function pointInPolygonFlat(px, py, polygon) {
        let inside = false;
        const len = polygon.length;
        for (let i = 0, j = len - 2; i < len; j = i, i += 2) {
            const xi = polygon[i], yi = polygon[i + 1];
            const xj = polygon[j], yj = polygon[j + 1];
            const intersect = ((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
            if (intersect)
                inside = !inside;
        }
        return inside;
    }
    function isPolygonInsideFlat(innerFlat, outerFlat) {
        for (let i = 0; i < innerFlat.length; i += 2) {
            const x = innerFlat[i];
            const y = innerFlat[i + 1];
            if (!pointInPolygonFlat(x, y, outerFlat))
                return false;
        }
        return true;
    }
    function lineArrayToStrings(lines) {
        return lines.map(l => l.toString());
    }

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
    class Fragment {
        constructor(start, end) {
            this.start = start;
            this.end = end;
            this.points = [];
            this.append = this.append.bind(this);
            this.prepend = this.prepend.bind(this);
        }
        append(x, y) {
            this.points.push(Math.round(x), Math.round(y));
        }
        prepend(x, y) {
            this.points.splice(0, 0, Math.round(x), Math.round(y));
        }
        lineString() {
            return this.toArray();
        }
        isEmpty() {
            return this.points.length < 2;
        }
        appendFragment(other) {
            this.points.push(...other.points);
            this.end = other.end;
        }
        toArray() {
            return this.points;
        }
    }
    const CASES = [
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
    function index(width, x, y, point) {
        x = x * 2 + point[0];
        y = y * 2 + point[1];
        return x + y * (width + 1) * 2;
    }
    function ratio(a, b, c) {
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
    function generateIsolines(isoOptions, tile, extent = 4096, buffer = 1, x, y, z) {
        // if (!interval) {
        //   return {};
        // }
        const multiplier = extent / (tile.width - 1);
        let tld, trd, bld, brd;
        let r, c;
        const segments = {};
        const fragmentByStartByLevel = new Map();
        const fragmentByEndByLevel = new Map();
        //ISOPOLYS: need this to identify edges
        const dbg = `${0}`;
        const minXY = multiplier * (0 - 1);
        const maxXY = 4096 + Math.abs(minXY);
        const fullTile = new TileInformation(z, x, y, tile);
        fullTile.minXY = minXY;
        fullTile.maxXY = maxXY;
        if (dbg == "1")
            console.log(`genIsolines: ${z}/${y}/${x} `);
        function interpolate(point, threshold, accept) {
            if (point[0] === 0) {
                // left
                accept(multiplier * (c - 1), multiplier * (r - ratio(bld, threshold, tld)));
            }
            else if (point[0] === 2) {
                // right
                accept(multiplier * c, multiplier * (r - ratio(brd, threshold, trd)));
            }
            else if (point[1] === 0) {
                // top
                accept(multiplier * (c - ratio(trd, threshold, tld)), multiplier * (r - 1));
            }
            else {
                // bottom
                accept(multiplier * (c - ratio(brd, threshold, bld)), multiplier * r);
            }
        }
        function createLevelsSet(min, max, levelSet) {
            return levelSet.filter(l => l >= min && l <= max);
        }
        function createLevelsInterval(min, max, interval, filterCb) {
            const start = Math.ceil(min / interval) * interval;
            const end = Math.floor(max / interval) * interval;
            const _levels = [];
            for (let threshold = start; threshold <= end; threshold += interval) {
                _levels.push(threshold);
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
                const maxElev = Math.max(tld, trd, bld, brd);
                const minElev = Math.min(tld, trd, bld, brd);
                fullTile.max = Math.max(fullTile.max || 0, maxElev);
                fullTile.min = Math.min(fullTile.min || Number.MAX_SAFE_INTEGER, minElev);
                //fullTile.setMin(minElev)
                //convertTileIsolinesToPolygonsfullTile.setMin(minElev)
                let isoLevels = undefined;
                if (isoOptions.levels) {
                    isoLevels = createLevelsSet(min, max, isoOptions.levels);
                }
                else if (isoOptions.contours) {
                    const levels = isoOptions.contours.map(contourDef => contourDef.contourElevation);
                    isoLevels = createLevelsSet(min, max, levels);
                }
                else if (isoOptions.intervals) {
                    const intervals = isoOptions.intervals;
                    isoLevels = createLevelsInterval(min, max, intervals[0]);
                }
                else {
                    throw new Error("no levels, interval set");
                }
                if (!isoLevels)
                    throw new Error("levels is undefined");
                if (isoOptions.min != null)
                    isoLevels = isoLevels.filter(l => { var _a; return l >= ((_a = isoOptions.min) !== null && _a !== undefined ? _a : -Infinity); });
                //const levelStart = ( lowCutout!= undefined) ? Math.max(start,lowCutout) : start;
                //const isoLevels = createLevels( start ,end, isoOptions )
                //console.log("isoLevels",isoLevels)
                for (let threshold of isoLevels) {
                    // if ( lowCutout != undefined && threshold < lowCutout ) continue;
                    const tl = tld > threshold;
                    const tr = trd > threshold;
                    const bl = bld > threshold;
                    const br = brd > threshold;
                    for (const segment of CASES[(tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0)]) {
                        let fragmentByStart = fragmentByStartByLevel.get(threshold);
                        if (!fragmentByStart)
                            fragmentByStartByLevel.set(threshold, (fragmentByStart = new Map()));
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
                                }
                                else {
                                    // connecting 2 segments
                                    f.appendFragment(g);
                                    fragmentByEnd.set((f.end = g.end), f);
                                }
                            }
                            else {
                                // adding to the end of f
                                interpolate(end, threshold, f.append);
                                fragmentByEnd.set((f.end = endIndex), f);
                            }
                        }
                        else if ((f = fragmentByStart.get(endIndex))) {
                            fragmentByStart.delete(endIndex);
                            // extending the start of f
                            interpolate(start, threshold, f.prepend);
                            fragmentByStart.set((f.start = startIndex), f);
                        }
                        else {
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
            let list = null;
            for (const value of fragmentByStart.values()) {
                if (!value.isEmpty()) {
                    if (list == null) {
                        list = segments[level] || (segments[level] = []);
                    }
                    list.push(value.lineString());
                }
            }
        }
        if (dbg == "1")
            console.log(fullTile.toString());
        if (isoOptions.polygons) {
            if (!isoOptions.contours) {
                throw new Error("polygons only possible with countours or levels defined");
            }
            // generate iso-polygons from isolines 
            // only works with contours or levels set not with intervals   
            try {
                const isoPolygonsMap = {};
                for (const [elevationLevel, elevationIsoLines] of Object.entries(segments)) {
                    const polys = convertTileIsolinesToPolygons(elevationLevel, elevationIsoLines, fullTile);
                    if (polys.length > 0)
                        isoPolygonsMap[elevationLevel] = polys;
                }
                if (dbg == "1")
                    console.log("isoPolygonsMap", isoPolygonsMap);
                // generate full tile polys
                let levels;
                if (isoOptions.levels) {
                    levels = isoOptions.levels;
                }
                else if (isoOptions.contours) {
                    levels = isoOptions.contours.map(contourDef => contourDef.contourElevation);
                }
                else {
                    throw new Error("no levels, contours set");
                }
                const fullTilePolys = generateFullTileIsoPolygons(fullTile, levels, minXY, maxXY, x, y, z);
                if (Object.keys(fullTilePolys).length) {
                    // console.log("fullTilePolys",fullTilePolys );
                    if (dbg == "1")
                        console.log(`- fullTilePolys`, fullTilePolys);
                }
                const mergedPolys = mergeElevationMaps(isoPolygonsMap, fullTilePolys);
                if (dbg == "1")
                    console.log("- mergedPolys:", mergedPolys);
                return mergedPolys;
            }
            catch (e) {
                console.log(e);
            }
        }
        else {
            const isos = {};
            for (const [elevationLevel, elevationIsoLines] of Object.entries(segments)) {
                // const levelIsoLines = segments[elevationLevel]
                const lineIndex = new LineIndex(elevationIsoLines, minXY, maxXY);
                if (dbg == "1")
                    console.log("lineIndex", elevationLevel, lineIndex.debugIndex());
                //if (polys.length > 0)
                isos[elevationLevel] = lineIndex.toArrayAllInner(l => !l.isTiny);
            }
            return isos;
        }
        return segments;
    }
    /**
     *
     * @param map1 merges an ElevLineMap onto another. changes the map1 object
     * @param map2
     */
    function mergeElevationMaps(map1, map2) {
        const merged = {};
        const lowCutout = 0;
        for (const [lvlStr, lines] of Object.entries(map1)) {
            const lvl = Number(lvlStr);
            if (lvl < lowCutout)
                continue;
            if (!merged[lvl])
                merged[lvl] = [];
            //console.log("merged--",{...merged})
            merged[lvl].push(...lines);
        }
        //console.log("entries",Object.entries(map2))
        for (const [lvlStr, lines] of Object.entries(map2)) {
            // console.log("lvl,merged",lvl,{...merged})
            const lvl = Number(lvlStr);
            if (lvl < 0)
                continue;
            if (!merged[lvl])
                merged[lvl] = [];
            //console.log("merged--",{...merged})
            merged[lvl].push(...lines);
        }
        return merged;
    }

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise, SuppressedError, Symbol, Iterator */


    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
        var e = new Error(message);
        return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
    };

    function sortedEntries(object) {
        const entries = Object.entries(object);
        entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
        return entries;
    }
    function encodeThresholds(thresholds) {
        return sortedEntries(thresholds)
            .map(([key, value]) => [key, ...(typeof value === "number" ? [value] : value)].join("*"))
            .join("~");
    }
    function decodeThresholds(thresholds) {
        return Object.fromEntries(thresholds
            .split("~")
            .map((part) => part.split("*").map(Number))
            .map(([key, ...values]) => [key, values]));
    }
    function encodeOptions(_a) {
        var { thresholds } = _a, rest = __rest(_a, ["thresholds"]);
        return sortedEntries(Object.assign({ thresholds: encodeThresholds(thresholds) }, rest))
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join("&");
    }
    function decodeOptions(options) {
        return Object.fromEntries(options
            .replace(/^.*\?/, "")
            .split("&")
            .map((part) => {
            const parts = part.split("=").map(decodeURIComponent);
            const k = parts[0];
            let v = parts[1];
            switch (k) {
                case "thresholds":
                    v = decodeThresholds(v);
                    break;
                case "extent":
                case "multiplier":
                case "overzoom":
                case "buffer":
                    v = Number(v);
            }
            return [k, v];
        }));
    }
    function md5(inputString) {
        var hc = "0123456789abcdef";
        function rh(n) { var j, s = ""; for (j = 0; j <= 3; j++)
            s += hc.charAt((n >> (j * 8 + 4)) & 0x0F) + hc.charAt((n >> (j * 8)) & 0x0F); return s; }
        function ad(x, y) { var l = (x & 0xFFFF) + (y & 0xFFFF); var m = (x >> 16) + (y >> 16) + (l >> 16); return (m << 16) | (l & 0xFFFF); }
        function rl(n, c) { return (n << c) | (n >>> (32 - c)); }
        function cm(q, a, b, x, s, t) { return ad(rl(ad(ad(a, q), ad(x, t)), s), b); }
        function ff(a, b, c, d, x, s, t) { return cm((b & c) | ((~b) & d), a, b, x, s, t); }
        function gg(a, b, c, d, x, s, t) { return cm((b & d) | (c & (~d)), a, b, x, s, t); }
        function hh(a, b, c, d, x, s, t) { return cm(b ^ c ^ d, a, b, x, s, t); }
        function ii(a, b, c, d, x, s, t) { return cm(c ^ (b | (~d)), a, b, x, s, t); }
        function sb(x) {
            var i;
            var nblk = ((x.length + 8) >> 6) + 1;
            var blks = new Array(nblk * 16);
            for (i = 0; i < nblk * 16; i++)
                blks[i] = 0;
            for (i = 0; i < x.length; i++)
                blks[i >> 2] |= x.charCodeAt(i) << ((i % 4) * 8);
            blks[i >> 2] |= 0x80 << ((i % 4) * 8);
            blks[nblk * 16 - 2] = x.length * 8;
            return blks;
        }
        var i, x = sb("" + inputString), a = 1732584193, b = -271733879, c = -1732584194, d = 271733878, olda, oldb, oldc, oldd;
        for (i = 0; i < x.length; i += 16) {
            olda = a;
            oldb = b;
            oldc = c;
            oldd = d;
            a = ff(a, b, c, d, x[i + 0], 7, -680876936);
            d = ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = ff(c, d, a, b, x[i + 10], 17, -42063);
            b = ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = hh(a, b, c, d, x[i + 5], 4, -378558);
            d = hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = ii(a, b, c, d, x[i + 0], 6, -198630844);
            d = ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = ii(b, c, d, a, x[i + 9], 21, -343485551);
            a = ad(a, olda);
            b = ad(b, oldb);
            c = ad(c, oldc);
            d = ad(d, oldd);
        }
        return rh(a) + rh(b) + rh(c) + rh(d);
    }
    function encodeIndividualOptions(options) {
        return md5(JSON.stringify(options));
        //return sortedEntries(options)
        //  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        //  .join(",");
    }
    function getOptionsForZoom(options, zoom) {
        const { thresholds } = options, rest = __rest(options, ["thresholds"]);
        let intervals = [];
        let maxLessThanOrEqualTo = -Infinity;
        Object.entries(thresholds).forEach(([zString, value]) => {
            const z = Number(zString);
            if (z <= zoom && z > maxLessThanOrEqualTo) {
                maxLessThanOrEqualTo = z;
                intervals = typeof value === "number" ? [value] : value;
            }
        });
        return Object.assign({ intervals }, rest);
    }
    function copy(src) {
        const dst = new ArrayBuffer(src.byteLength);
        new Uint8Array(dst).set(new Uint8Array(src));
        return dst;
    }
    function prepareDemTile(promise, copy) {
        return promise.then((_a) => {
            var { data } = _a, rest = __rest(_a, ["data"]);
            let newData = data;
            if (copy) {
                newData = new Float32Array(data.length);
                newData.set(data);
            }
            return Object.assign(Object.assign({}, rest), { data: newData, transferrables: [newData.buffer] });
        });
    }
    function prepareContourTile(promise) {
        return promise.then(({ arrayBuffer }) => {
            const clone = copy(arrayBuffer);
            return {
                arrayBuffer: clone,
                transferrables: [clone],
            };
        });
    }
    let supportsOffscreenCanvas = null;
    function offscreenCanvasSupported() {
        if (supportsOffscreenCanvas == null) {
            supportsOffscreenCanvas =
                typeof OffscreenCanvas !== "undefined" &&
                    new OffscreenCanvas(1, 1).getContext("2d") &&
                    typeof createImageBitmap === "function";
        }
        return supportsOffscreenCanvas || false;
    }
    let useVideoFrame = null;
    function shouldUseVideoFrame() {
        if (useVideoFrame == null) {
            useVideoFrame = false;
            // if webcodec is supported, AND if the browser mangles getImageData results
            // (ie. safari with increased privacy protections) then use webcodec VideoFrame API
            if (offscreenCanvasSupported() && typeof VideoFrame !== "undefined") {
                const size = 5;
                const canvas = new OffscreenCanvas(5, 5);
                const context = canvas.getContext("2d", { willReadFrequently: true });
                if (context) {
                    for (let i = 0; i < size * size; i++) {
                        const base = i * 4;
                        context.fillStyle = `rgb(${base},${base + 1},${base + 2})`;
                        context.fillRect(i % size, Math.floor(i / size), 1, 1);
                    }
                    const data = context.getImageData(0, 0, size, size).data;
                    for (let i = 0; i < size * size * 4; i++) {
                        if (i % 4 !== 3 && data[i] !== i) {
                            useVideoFrame = true;
                            break;
                        }
                    }
                }
            }
        }
        return useVideoFrame || false;
    }
    function withTimeout(timeoutMs, value, abortController) {
        let reject = () => { };
        const timeout = setTimeout(() => {
            reject(new Error("timed out"));
            abortController === null || abortController === undefined ? undefined : abortController.abort();
        }, timeoutMs);
        onAbort(abortController, () => {
            reject(new Error("aborted"));
            clearTimeout(timeout);
        });
        const cancelPromise = new Promise((_, rej) => {
            reject = rej;
        });
        return Promise.race([
            cancelPromise,
            value.finally(() => clearTimeout(timeout)),
        ]);
    }
    function onAbort(abortController, action) {
        if (action) {
            abortController === null || abortController === undefined ? undefined : abortController.signal.addEventListener("abort", action);
        }
    }
    function isAborted(abortController) {
        var _a;
        return Boolean((_a = abortController === null || abortController === undefined ? undefined : abortController.signal) === null || _a === undefined ? undefined : _a.aborted);
    }

    let num = 0;
    /**
     * LRU Cache for CancelablePromises.
     * The underlying request is only canceled when all callers have canceled their usage of it.
     */
    class AsyncCache {
        constructor(maxSize = 100) {
            this.size = () => this.items.size;
            this.get = (key, supplier, abortController) => {
                let result = this.items.get(key);
                if (!result) {
                    const sharedAbortController = new AbortController();
                    const value = supplier(key, sharedAbortController);
                    result = {
                        abortController: sharedAbortController,
                        item: value,
                        lastUsed: ++num,
                        waiting: 1,
                    };
                    this.items.set(key, result);
                    this.prune();
                }
                else {
                    result.lastUsed = ++num;
                    result.waiting++;
                }
                const items = this.items;
                const value = result.item.then((r) => r, (e) => {
                    items.delete(key);
                    return Promise.reject(e);
                });
                let canceled = false;
                onAbort(abortController, () => {
                    var _a;
                    if (result && result.abortController && !canceled) {
                        canceled = true;
                        if (--result.waiting <= 0) {
                            (_a = result.abortController) === null || _a === undefined ? undefined : _a.abort();
                            items.delete(key);
                        }
                    }
                });
                return value;
            };
            this.clear = () => this.items.clear();
            this.maxSize = maxSize;
            this.items = new Map();
        }
        prune() {
            if (this.items.size > this.maxSize) {
                let minKey;
                let minUse = Infinity;
                this.items.forEach((value, key) => {
                    if (value.lastUsed < minUse) {
                        minUse = value.lastUsed;
                        minKey = key;
                    }
                });
                if (typeof minKey !== "undefined") {
                    this.items.delete(minKey);
                }
            }
        }
    }

    let offscreenCanvas;
    let offscreenContext;
    let canvas;
    let canvasContext;
    /**
     * Parses a `raster-dem` image into a DemTile using Webcoded VideoFrame API.
     */
    function decodeImageModern(blob, encoding, abortController) {
        return __awaiter(this, undefined, undefined, function* () {
            const img = yield createImageBitmap(blob);
            if (isAborted(abortController))
                return null;
            return decodeImageUsingOffscreenCanvas(img, encoding);
        });
    }
    function decodeImageUsingOffscreenCanvas(img, encoding) {
        if (!offscreenCanvas) {
            offscreenCanvas = new OffscreenCanvas(img.width, img.height);
            offscreenContext = offscreenCanvas.getContext("2d", {
                willReadFrequently: true,
            });
        }
        return getElevations(img, encoding, offscreenCanvas, offscreenContext);
    }
    /**
     * Parses a `raster-dem` image into a DemTile using webcodec VideoFrame API which works
     * even when browsers disable/degrade the canvas getImageData API as a privacy protection.
     */
    function decodeImageVideoFrame(blob, encoding, abortController) {
        return __awaiter(this, undefined, undefined, function* () {
            var _a, _b, _c;
            const img = yield createImageBitmap(blob);
            if (isAborted(abortController))
                return null;
            const vf = new VideoFrame(img, { timestamp: 0 });
            try {
                // formats we can handle: BGRX, BGRA, RGBA, RGBX
                const valid = ((_a = vf === null || vf === void 0 ? void 0 : vf.format) === null || _a === void 0 ? void 0 : _a.startsWith("BGR")) || ((_b = vf === null || vf === void 0 ? void 0 : vf.format) === null || _b === void 0 ? void 0 : _b.startsWith("RGB"));
                if (!valid) {
                    throw new Error(`Unrecognized format: ${vf === null || vf === void 0 ? void 0 : vf.format}`);
                }
                const swapBR = (_c = vf === null || vf === void 0 ? void 0 : vf.format) === null || _c === void 0 ? void 0 : _c.startsWith("BGR");
                const size = vf.allocationSize();
                const data = new Uint8ClampedArray(size);
                yield vf.copyTo(data);
                if (swapBR) {
                    for (let i = 0; i < data.length; i += 4) {
                        const tmp = data[i];
                        data[i] = data[i + 2];
                        data[i + 2] = tmp;
                    }
                }
                return decodeParsedImage(img.width, img.height, encoding, data);
            }
            catch (_) {
                if (isAborted(abortController))
                    return null;
                // fall back to offscreen canvas
                return decodeImageUsingOffscreenCanvas(img, encoding);
            }
            finally {
                vf.close();
            }
        });
    }
    /**
     * Parses a `raster-dem` image into a DemTile using `<img>` element drawn to a `<canvas>`.
     * Only works on the main thread, but works across all browsers.
     */
    function decodeImageOld(blob, encoding, abortController) {
        return __awaiter(this, undefined, undefined, function* () {
            if (!canvas) {
                canvas = document.createElement("canvas");
                canvasContext = canvas.getContext("2d", {
                    willReadFrequently: true,
                });
            }
            const img = new Image();
            onAbort(abortController, () => (img.src = ""));
            const fetchedImage = yield new Promise((resolve, reject) => {
                img.onload = () => {
                    if (!isAborted(abortController))
                        resolve(img);
                    URL.revokeObjectURL(img.src);
                    img.onload = null;
                };
                img.onerror = () => reject(new Error("Could not load image."));
                img.src = blob.size ? URL.createObjectURL(blob) : "";
            });
            return getElevations(fetchedImage, encoding, canvas, canvasContext);
        });
    }
    /**
     * Parses a `raster-dem` image in a worker that doesn't support OffscreenCanvas and createImageBitmap
     * by running decodeImageOld on the main thread and returning the result.
     */
    function decodeImageOnMainThread(blob, encoding, abortController) {
        return self.actor.send("decodeImage", [], abortController, undefined, blob, encoding);
    }
    function isWorker() {
        return (
        // @ts-expect-error WorkerGlobalScope defined
        typeof WorkerGlobalScope !== "undefined" &&
            typeof self !== "undefined" &&
            // @ts-expect-error WorkerGlobalScope defined
            self instanceof WorkerGlobalScope);
    }
    const defaultDecoder = shouldUseVideoFrame()
        ? decodeImageVideoFrame
        : offscreenCanvasSupported()
            ? decodeImageModern
            : isWorker()
                ? decodeImageOnMainThread
                : decodeImageOld;
    function getElevations(img, encoding, canvas, canvasContext) {
        canvas.width = img.width;
        canvas.height = img.height;
        if (!canvasContext)
            throw new Error("failed to get context");
        canvasContext.drawImage(img, 0, 0, img.width, img.height);
        const rgba = canvasContext.getImageData(0, 0, img.width, img.height).data;
        return decodeParsedImage(img.width, img.height, encoding, rgba);
    }
    function decodeParsedImage(width, height, encoding, input) {
        const decoder = encoding === "mapbox"
            ? (r, g, b) => -1e4 + (r * 256 * 256 + g * 256 + b) * 0.1
            : (r, g, b) => r * 256 + g + b / 256 - 32768;
        const data = new Float32Array(width * height);
        for (let i = 0; i < input.length; i += 4) {
            data[i / 4] = decoder(input[i], input[i + 1], input[i + 2]);
        }
        return { width, height, data };
    }

    const MIN_VALID_M = -12e3;
    const MAX_VALID_M = 9000;
    function defaultIsValid(number) {
        return !isNaN(number) && number >= MIN_VALID_M && number <= MAX_VALID_M;
    }
    /** A tile containing elevation values aligned to a grid. */
    class HeightTile {
        constructor(width, height, get) {
            /**
             * Splits this tile into a `1<<subz` x `1<<subz` grid and returns the tile at coordinates `subx, suby`.
             */
            this.split = (subz, subx, suby) => {
                if (subz === 0)
                    return this;
                const by = 1 << subz;
                const dx = (subx * this.width) / by;
                const dy = (suby * this.height) / by;
                return new HeightTile(this.width / by, this.height / by, (x, y) => this.get(x + dx, y + dy));
            };
            /**
             * Returns a new tile scaled up by `factor` with pixel values that are subsampled using
             * bilinear interpolation between the original height tile values.
             *
             * The original and result tile are assumed to represent values taken at the center of each pixel.
             */
            this.subsamplePixelCenters = (factor) => {
                const lerp = (a, b, f) => isNaN(a) ? b : isNaN(b) ? a : a + (b - a) * f;
                if (factor <= 1)
                    return this;
                const sub = 0.5 - 1 / (2 * factor);
                const blerper = (x, y) => {
                    const dx = x / factor - sub;
                    const dy = y / factor - sub;
                    const ox = Math.floor(dx);
                    const oy = Math.floor(dy);
                    const a = this.get(ox, oy);
                    const b = this.get(ox + 1, oy);
                    const c = this.get(ox, oy + 1);
                    const d = this.get(ox + 1, oy + 1);
                    const fx = dx - ox;
                    const fy = dy - oy;
                    const top = lerp(a, b, fx);
                    const bottom = lerp(c, d, fx);
                    return lerp(top, bottom, fy);
                };
                return new HeightTile(this.width * factor, this.height * factor, blerper);
            };
            /**
             * Assumes the input tile represented measurements taken at the center of each pixel, and
             * returns a new tile where values are the height at the top-left of each pixel by averaging
             * the 4 adjacent pixel values.
             */
            this.averagePixelCentersToGrid = (radius = 1) => new HeightTile(this.width + 1, this.height + 1, (x, y) => {
                let sum = 0, count = 0, v = 0;
                for (let newX = x - radius; newX < x + radius; newX++) {
                    for (let newY = y - radius; newY < y + radius; newY++) {
                        if (!isNaN((v = this.get(newX, newY)))) {
                            count++;
                            sum += v;
                        }
                    }
                }
                return count === 0 ? NaN : sum / count;
            });
            /** Returns a new tile with elevation values scaled by `multiplier`. */
            this.scaleElevation = (multiplier) => multiplier === 1
                ? this
                : new HeightTile(this.width, this.height, (x, y) => this.get(x, y) * multiplier);
            /**
             * Precompute every value from `-bufer, -buffer` to `width + buffer, height + buffer` and serve them
             * out of a `Float32Array`. Until this method is called, all `get` requests are lazy and call all previous
             * methods in the chain up to the root DEM tile.
             */
            this.materialize = (buffer = 2) => {
                const stride = this.width + 2 * buffer;
                const data = new Float32Array(stride * (this.height + 2 * buffer));
                let idx = 0;
                for (let y = -buffer; y < this.height + buffer; y++) {
                    for (let x = -buffer; x < this.width + buffer; x++) {
                        data[idx++] = this.get(x, y);
                    }
                }
                return new HeightTile(this.width, this.height, (x, y) => data[(y + buffer) * stride + x + buffer]);
            };
            this.get = get;
            this.width = width;
            this.height = height;
        }
        /** Construct a height tile from raw DEM pixel values */
        static fromRawDem(demTile) {
            return new HeightTile(demTile.width, demTile.height, (x, y) => {
                const value = demTile.data[y * demTile.width + x];
                return defaultIsValid(value) ? value : NaN;
            });
        }
        /**
         * Construct a height tile from a DEM tile plus it's 8 neighbors, so that
         * you can request `x` or `y` outside the bounds of the original tile.
         *
         * @param neighbors An array containing tiles: `[nw, n, ne, w, c, e, sw, s, se]`
         */
        static combineNeighbors(neighbors) {
            if (neighbors.length !== 9) {
                throw new Error("Must include a tile plus 8 neighbors");
            }
            const mainTile = neighbors[4];
            if (!mainTile) {
                return undefined;
            }
            const width = mainTile.width;
            const height = mainTile.height;
            return new HeightTile(width, height, (x, y) => {
                let gridIdx = 0;
                if (y < 0) {
                    y += height;
                }
                else if (y < height) {
                    gridIdx += 3;
                }
                else {
                    y -= height;
                    gridIdx += 6;
                }
                if (x < 0) {
                    x += width;
                }
                else if (x < width) {
                    gridIdx += 1;
                }
                else {
                    x -= width;
                    gridIdx += 2;
                }
                const grid = neighbors[gridIdx];
                return grid ? grid.get(x, y) : NaN;
            });
        }
    }

    const SHIFT_LEFT_32 = (1 << 16) * (1 << 16);
    const SHIFT_RIGHT_32 = 1 / SHIFT_LEFT_32;

    // Threshold chosen based on both benchmarking and knowledge about browser string
    // data structures (which currently switch structure types at 12 bytes or more)
    const TEXT_DECODER_MIN_LENGTH = 12;
    const utf8TextDecoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder('utf-8');

    const PBF_VARINT  = 0; // varint: int32, int64, uint32, uint64, sint32, sint64, bool, enum
    const PBF_FIXED64 = 1; // 64-bit: double, fixed64, sfixed64
    const PBF_BYTES   = 2; // length-delimited: string, bytes, embedded messages, packed repeated fields
    const PBF_FIXED32 = 5; // 32-bit: float, fixed32, sfixed32

    class Pbf {
        /**
         * @param {Uint8Array | ArrayBuffer} [buf]
         */
        constructor(buf = new Uint8Array(16)) {
            this.buf = ArrayBuffer.isView(buf) ? buf : new Uint8Array(buf);
            this.dataView = new DataView(this.buf.buffer);
            this.pos = 0;
            this.type = 0;
            this.length = this.buf.length;
        }

        // === READING =================================================================

        /**
         * @template T
         * @param {(tag: number, result: T, pbf: Pbf) => void} readField
         * @param {T} result
         * @param {number} [end]
         */
        readFields(readField, result, end = this.length) {
            while (this.pos < end) {
                const val = this.readVarint(),
                    tag = val >> 3,
                    startPos = this.pos;

                this.type = val & 0x7;
                readField(tag, result, this);

                if (this.pos === startPos) this.skip(val);
            }
            return result;
        }

        /**
         * @template T
         * @param {(tag: number, result: T, pbf: Pbf) => void} readField
         * @param {T} result
         */
        readMessage(readField, result) {
            return this.readFields(readField, result, this.readVarint() + this.pos);
        }

        readFixed32() {
            const val = this.dataView.getUint32(this.pos, true);
            this.pos += 4;
            return val;
        }

        readSFixed32() {
            const val = this.dataView.getInt32(this.pos, true);
            this.pos += 4;
            return val;
        }

        // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)

        readFixed64() {
            const val = this.dataView.getUint32(this.pos, true) + this.dataView.getUint32(this.pos + 4, true) * SHIFT_LEFT_32;
            this.pos += 8;
            return val;
        }

        readSFixed64() {
            const val = this.dataView.getUint32(this.pos, true) + this.dataView.getInt32(this.pos + 4, true) * SHIFT_LEFT_32;
            this.pos += 8;
            return val;
        }

        readFloat() {
            const val = this.dataView.getFloat32(this.pos, true);
            this.pos += 4;
            return val;
        }

        readDouble() {
            const val = this.dataView.getFloat64(this.pos, true);
            this.pos += 8;
            return val;
        }

        /**
         * @param {boolean} [isSigned]
         */
        readVarint(isSigned) {
            const buf = this.buf;
            let val, b;

            b = buf[this.pos++]; val  =  b & 0x7f;        if (b < 0x80) return val;
            b = buf[this.pos++]; val |= (b & 0x7f) << 7;  if (b < 0x80) return val;
            b = buf[this.pos++]; val |= (b & 0x7f) << 14; if (b < 0x80) return val;
            b = buf[this.pos++]; val |= (b & 0x7f) << 21; if (b < 0x80) return val;
            b = buf[this.pos];   val |= (b & 0x0f) << 28;

            return readVarintRemainder(val, isSigned, this);
        }

        readVarint64() { // for compatibility with v2.0.1
            return this.readVarint(true);
        }

        readSVarint() {
            const num = this.readVarint();
            return num % 2 === 1 ? (num + 1) / -2 : num / 2; // zigzag encoding
        }

        readBoolean() {
            return Boolean(this.readVarint());
        }

        readString() {
            const end = this.readVarint() + this.pos;
            const pos = this.pos;
            this.pos = end;

            if (end - pos >= TEXT_DECODER_MIN_LENGTH && utf8TextDecoder) {
                // longer strings are fast with the built-in browser TextDecoder API
                return utf8TextDecoder.decode(this.buf.subarray(pos, end));
            }
            // short strings are fast with our custom implementation
            return readUtf8(this.buf, pos, end);
        }

        readBytes() {
            const end = this.readVarint() + this.pos,
                buffer = this.buf.subarray(this.pos, end);
            this.pos = end;
            return buffer;
        }

        // verbose for performance reasons; doesn't affect gzipped size

        /**
         * @param {number[]} [arr]
         * @param {boolean} [isSigned]
         */
        readPackedVarint(arr = [], isSigned) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readVarint(isSigned));
            return arr;
        }
        /** @param {number[]} [arr] */
        readPackedSVarint(arr = []) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readSVarint());
            return arr;
        }
        /** @param {boolean[]} [arr] */
        readPackedBoolean(arr = []) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readBoolean());
            return arr;
        }
        /** @param {number[]} [arr] */
        readPackedFloat(arr = []) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readFloat());
            return arr;
        }
        /** @param {number[]} [arr] */
        readPackedDouble(arr = []) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readDouble());
            return arr;
        }
        /** @param {number[]} [arr] */
        readPackedFixed32(arr = []) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readFixed32());
            return arr;
        }
        /** @param {number[]} [arr] */
        readPackedSFixed32(arr = []) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readSFixed32());
            return arr;
        }
        /** @param {number[]} [arr] */
        readPackedFixed64(arr = []) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readFixed64());
            return arr;
        }
        /** @param {number[]} [arr] */
        readPackedSFixed64(arr = []) {
            const end = this.readPackedEnd();
            while (this.pos < end) arr.push(this.readSFixed64());
            return arr;
        }
        readPackedEnd() {
            return this.type === PBF_BYTES ? this.readVarint() + this.pos : this.pos + 1;
        }

        /** @param {number} val */
        skip(val) {
            const type = val & 0x7;
            if (type === PBF_VARINT) while (this.buf[this.pos++] > 0x7f) {}
            else if (type === PBF_BYTES) this.pos = this.readVarint() + this.pos;
            else if (type === PBF_FIXED32) this.pos += 4;
            else if (type === PBF_FIXED64) this.pos += 8;
            else throw new Error(`Unimplemented type: ${type}`);
        }

        // === WRITING =================================================================

        /**
         * @param {number} tag
         * @param {number} type
         */
        writeTag(tag, type) {
            this.writeVarint((tag << 3) | type);
        }

        /** @param {number} min */
        realloc(min) {
            let length = this.length || 16;

            while (length < this.pos + min) length *= 2;

            if (length !== this.length) {
                const buf = new Uint8Array(length);
                buf.set(this.buf);
                this.buf = buf;
                this.dataView = new DataView(buf.buffer);
                this.length = length;
            }
        }

        finish() {
            this.length = this.pos;
            this.pos = 0;
            return this.buf.subarray(0, this.length);
        }

        /** @param {number} val */
        writeFixed32(val) {
            this.realloc(4);
            this.dataView.setInt32(this.pos, val, true);
            this.pos += 4;
        }

        /** @param {number} val */
        writeSFixed32(val) {
            this.realloc(4);
            this.dataView.setInt32(this.pos, val, true);
            this.pos += 4;
        }

        /** @param {number} val */
        writeFixed64(val) {
            this.realloc(8);
            this.dataView.setInt32(this.pos, val & -1, true);
            this.dataView.setInt32(this.pos + 4, Math.floor(val * SHIFT_RIGHT_32), true);
            this.pos += 8;
        }

        /** @param {number} val */
        writeSFixed64(val) {
            this.realloc(8);
            this.dataView.setInt32(this.pos, val & -1, true);
            this.dataView.setInt32(this.pos + 4, Math.floor(val * SHIFT_RIGHT_32), true);
            this.pos += 8;
        }

        /** @param {number} val */
        writeVarint(val) {
            val = +val || 0;

            if (val > 0xfffffff || val < 0) {
                writeBigVarint(val, this);
                return;
            }

            this.realloc(4);

            this.buf[this.pos++] =           val & 0x7f  | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
            this.buf[this.pos++] = ((val >>>= 7) & 0x7f) | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
            this.buf[this.pos++] = ((val >>>= 7) & 0x7f) | (val > 0x7f ? 0x80 : 0); if (val <= 0x7f) return;
            this.buf[this.pos++] =   (val >>> 7) & 0x7f;
        }

        /** @param {number} val */
        writeSVarint(val) {
            this.writeVarint(val < 0 ? -val * 2 - 1 : val * 2);
        }

        /** @param {boolean} val */
        writeBoolean(val) {
            this.writeVarint(+val);
        }

        /** @param {string} str */
        writeString(str) {
            str = String(str);
            this.realloc(str.length * 4);

            this.pos++; // reserve 1 byte for short string length

            const startPos = this.pos;
            // write the string directly to the buffer and see how much was written
            this.pos = writeUtf8(this.buf, str, this.pos);
            const len = this.pos - startPos;

            if (len >= 0x80) makeRoomForExtraLength(startPos, len, this);

            // finally, write the message length in the reserved place and restore the position
            this.pos = startPos - 1;
            this.writeVarint(len);
            this.pos += len;
        }

        /** @param {number} val */
        writeFloat(val) {
            this.realloc(4);
            this.dataView.setFloat32(this.pos, val, true);
            this.pos += 4;
        }

        /** @param {number} val */
        writeDouble(val) {
            this.realloc(8);
            this.dataView.setFloat64(this.pos, val, true);
            this.pos += 8;
        }

        /** @param {Uint8Array} buffer */
        writeBytes(buffer) {
            const len = buffer.length;
            this.writeVarint(len);
            this.realloc(len);
            for (let i = 0; i < len; i++) this.buf[this.pos++] = buffer[i];
        }

        /**
         * @template T
         * @param {(obj: T, pbf: Pbf) => void} fn
         * @param {T} obj
         */
        writeRawMessage(fn, obj) {
            this.pos++; // reserve 1 byte for short message length

            // write the message directly to the buffer and see how much was written
            const startPos = this.pos;
            fn(obj, this);
            const len = this.pos - startPos;

            if (len >= 0x80) makeRoomForExtraLength(startPos, len, this);

            // finally, write the message length in the reserved place and restore the position
            this.pos = startPos - 1;
            this.writeVarint(len);
            this.pos += len;
        }

        /**
         * @template T
         * @param {number} tag
         * @param {(obj: T, pbf: Pbf) => void} fn
         * @param {T} obj
         */
        writeMessage(tag, fn, obj) {
            this.writeTag(tag, PBF_BYTES);
            this.writeRawMessage(fn, obj);
        }

        /**
         * @param {number} tag
         * @param {number[]} arr
         */
        writePackedVarint(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedVarint, arr);
        }
        /**
         * @param {number} tag
         * @param {number[]} arr
         */
        writePackedSVarint(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedSVarint, arr);
        }
        /**
         * @param {number} tag
         * @param {boolean[]} arr
         */
        writePackedBoolean(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedBoolean, arr);
        }
        /**
         * @param {number} tag
         * @param {number[]} arr
         */
        writePackedFloat(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedFloat, arr);
        }
        /**
         * @param {number} tag
         * @param {number[]} arr
         */
        writePackedDouble(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedDouble, arr);
        }
        /**
         * @param {number} tag
         * @param {number[]} arr
         */
        writePackedFixed32(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedFixed32, arr);
        }
        /**
         * @param {number} tag
         * @param {number[]} arr
         */
        writePackedSFixed32(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedSFixed32, arr);
        }
        /**
         * @param {number} tag
         * @param {number[]} arr
         */
        writePackedFixed64(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedFixed64, arr);
        }
        /**
         * @param {number} tag
         * @param {number[]} arr
         */
        writePackedSFixed64(tag, arr) {
            if (arr.length) this.writeMessage(tag, writePackedSFixed64, arr);
        }

        /**
         * @param {number} tag
         * @param {Uint8Array} buffer
         */
        writeBytesField(tag, buffer) {
            this.writeTag(tag, PBF_BYTES);
            this.writeBytes(buffer);
        }
        /**
         * @param {number} tag
         * @param {number} val
         */
        writeFixed32Field(tag, val) {
            this.writeTag(tag, PBF_FIXED32);
            this.writeFixed32(val);
        }
        /**
         * @param {number} tag
         * @param {number} val
         */
        writeSFixed32Field(tag, val) {
            this.writeTag(tag, PBF_FIXED32);
            this.writeSFixed32(val);
        }
        /**
         * @param {number} tag
         * @param {number} val
         */
        writeFixed64Field(tag, val) {
            this.writeTag(tag, PBF_FIXED64);
            this.writeFixed64(val);
        }
        /**
         * @param {number} tag
         * @param {number} val
         */
        writeSFixed64Field(tag, val) {
            this.writeTag(tag, PBF_FIXED64);
            this.writeSFixed64(val);
        }
        /**
         * @param {number} tag
         * @param {number} val
         */
        writeVarintField(tag, val) {
            this.writeTag(tag, PBF_VARINT);
            this.writeVarint(val);
        }
        /**
         * @param {number} tag
         * @param {number} val
         */
        writeSVarintField(tag, val) {
            this.writeTag(tag, PBF_VARINT);
            this.writeSVarint(val);
        }
        /**
         * @param {number} tag
         * @param {string} str
         */
        writeStringField(tag, str) {
            this.writeTag(tag, PBF_BYTES);
            this.writeString(str);
        }
        /**
         * @param {number} tag
         * @param {number} val
         */
        writeFloatField(tag, val) {
            this.writeTag(tag, PBF_FIXED32);
            this.writeFloat(val);
        }
        /**
         * @param {number} tag
         * @param {number} val
         */
        writeDoubleField(tag, val) {
            this.writeTag(tag, PBF_FIXED64);
            this.writeDouble(val);
        }
        /**
         * @param {number} tag
         * @param {boolean} val
         */
        writeBooleanField(tag, val) {
            this.writeVarintField(tag, +val);
        }
    }
    /**
     * @param {number} l
     * @param {boolean | undefined} s
     * @param {Pbf} p
     */
    function readVarintRemainder(l, s, p) {
        const buf = p.buf;
        let h, b;

        b = buf[p.pos++]; h  = (b & 0x70) >> 4;  if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x7f) << 3;  if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x7f) << 10; if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x7f) << 17; if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x7f) << 24; if (b < 0x80) return toNum(l, h, s);
        b = buf[p.pos++]; h |= (b & 0x01) << 31; if (b < 0x80) return toNum(l, h, s);

        throw new Error('Expected varint not more than 10 bytes');
    }

    /**
     * @param {number} low
     * @param {number} high
     * @param {boolean} [isSigned]
     */
    function toNum(low, high, isSigned) {
        return isSigned ? high * 0x100000000 + (low >>> 0) : ((high >>> 0) * 0x100000000) + (low >>> 0);
    }

    /**
     * @param {number} val
     * @param {Pbf} pbf
     */
    function writeBigVarint(val, pbf) {
        let low, high;

        if (val >= 0) {
            low  = (val % 0x100000000) | 0;
            high = (val / 0x100000000) | 0;
        } else {
            low  = ~(-val % 0x100000000);
            high = ~(-val / 0x100000000);

            if (low ^ 0xffffffff) {
                low = (low + 1) | 0;
            } else {
                low = 0;
                high = (high + 1) | 0;
            }
        }

        if (val >= 0x10000000000000000 || val < -18446744073709552e3) {
            throw new Error('Given varint doesn\'t fit into 10 bytes');
        }

        pbf.realloc(10);

        writeBigVarintLow(low, high, pbf);
        writeBigVarintHigh(high, pbf);
    }

    /**
     * @param {number} high
     * @param {number} low
     * @param {Pbf} pbf
     */
    function writeBigVarintLow(low, high, pbf) {
        pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
        pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
        pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
        pbf.buf[pbf.pos++] = low & 0x7f | 0x80; low >>>= 7;
        pbf.buf[pbf.pos]   = low & 0x7f;
    }

    /**
     * @param {number} high
     * @param {Pbf} pbf
     */
    function writeBigVarintHigh(high, pbf) {
        const lsb = (high & 0x07) << 4;

        pbf.buf[pbf.pos++] |= lsb         | ((high >>>= 3) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f | ((high >>>= 7) ? 0x80 : 0); if (!high) return;
        pbf.buf[pbf.pos++]  = high & 0x7f;
    }

    /**
     * @param {number} startPos
     * @param {number} len
     * @param {Pbf} pbf
     */
    function makeRoomForExtraLength(startPos, len, pbf) {
        const extraLen =
            len <= 0x3fff ? 1 :
            len <= 0x1fffff ? 2 :
            len <= 0xfffffff ? 3 : Math.floor(Math.log(len) / (Math.LN2 * 7));

        // if 1 byte isn't enough for encoding message length, shift the data to the right
        pbf.realloc(extraLen);
        for (let i = pbf.pos - 1; i >= startPos; i--) pbf.buf[i + extraLen] = pbf.buf[i];
    }

    /**
     * @param {number[]} arr
     * @param {Pbf} pbf
     */
    function writePackedVarint(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeVarint(arr[i]);
    }
    /**
     * @param {number[]} arr
     * @param {Pbf} pbf
     */
    function writePackedSVarint(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeSVarint(arr[i]);
    }
    /**
     * @param {number[]} arr
     * @param {Pbf} pbf
     */
    function writePackedFloat(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeFloat(arr[i]);
    }
    /**
     * @param {number[]} arr
     * @param {Pbf} pbf
     */
    function writePackedDouble(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeDouble(arr[i]);
    }
    /**
     * @param {boolean[]} arr
     * @param {Pbf} pbf
     */
    function writePackedBoolean(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeBoolean(arr[i]);
    }
    /**
     * @param {number[]} arr
     * @param {Pbf} pbf
     */
    function writePackedFixed32(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeFixed32(arr[i]);
    }
    /**
     * @param {number[]} arr
     * @param {Pbf} pbf
     */
    function writePackedSFixed32(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeSFixed32(arr[i]);
    }
    /**
     * @param {number[]} arr
     * @param {Pbf} pbf
     */
    function writePackedFixed64(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeFixed64(arr[i]);
    }
    /**
     * @param {number[]} arr
     * @param {Pbf} pbf
     */
    function writePackedSFixed64(arr, pbf) {
        for (let i = 0; i < arr.length; i++) pbf.writeSFixed64(arr[i]);
    }

    // Buffer code below from https://github.com/feross/buffer, MIT-licensed

    /**
     * @param {Uint8Array} buf
     * @param {number} pos
     * @param {number} end
     */
    function readUtf8(buf, pos, end) {
        let str = '';
        let i = pos;

        while (i < end) {
            const b0 = buf[i];
            let c = null; // codepoint
            let bytesPerSequence =
                b0 > 0xEF ? 4 :
                b0 > 0xDF ? 3 :
                b0 > 0xBF ? 2 : 1;

            if (i + bytesPerSequence > end) break;

            let b1, b2, b3;

            if (bytesPerSequence === 1) {
                if (b0 < 0x80) {
                    c = b0;
                }
            } else if (bytesPerSequence === 2) {
                b1 = buf[i + 1];
                if ((b1 & 0xC0) === 0x80) {
                    c = (b0 & 0x1F) << 0x6 | (b1 & 0x3F);
                    if (c <= 0x7F) {
                        c = null;
                    }
                }
            } else if (bytesPerSequence === 3) {
                b1 = buf[i + 1];
                b2 = buf[i + 2];
                if ((b1 & 0xC0) === 0x80 && (b2 & 0xC0) === 0x80) {
                    c = (b0 & 0xF) << 0xC | (b1 & 0x3F) << 0x6 | (b2 & 0x3F);
                    if (c <= 0x7FF || (c >= 0xD800 && c <= 0xDFFF)) {
                        c = null;
                    }
                }
            } else if (bytesPerSequence === 4) {
                b1 = buf[i + 1];
                b2 = buf[i + 2];
                b3 = buf[i + 3];
                if ((b1 & 0xC0) === 0x80 && (b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
                    c = (b0 & 0xF) << 0x12 | (b1 & 0x3F) << 0xC | (b2 & 0x3F) << 0x6 | (b3 & 0x3F);
                    if (c <= 0xFFFF || c >= 0x110000) {
                        c = null;
                    }
                }
            }

            if (c === null) {
                c = 0xFFFD;
                bytesPerSequence = 1;

            } else if (c > 0xFFFF) {
                c -= 0x10000;
                str += String.fromCharCode(c >>> 10 & 0x3FF | 0xD800);
                c = 0xDC00 | c & 0x3FF;
            }

            str += String.fromCharCode(c);
            i += bytesPerSequence;
        }

        return str;
    }

    /**
     * @param {Uint8Array} buf
     * @param {string} str
     * @param {number} pos
     */
    function writeUtf8(buf, str, pos) {
        for (let i = 0, c, lead; i < str.length; i++) {
            c = str.charCodeAt(i); // code point

            if (c > 0xD7FF && c < 0xE000) {
                if (lead) {
                    if (c < 0xDC00) {
                        buf[pos++] = 0xEF;
                        buf[pos++] = 0xBF;
                        buf[pos++] = 0xBD;
                        lead = c;
                        continue;
                    } else {
                        c = lead - 0xD800 << 10 | c - 0xDC00 | 0x10000;
                        lead = null;
                    }
                } else {
                    if (c > 0xDBFF || (i + 1 === str.length)) {
                        buf[pos++] = 0xEF;
                        buf[pos++] = 0xBF;
                        buf[pos++] = 0xBD;
                    } else {
                        lead = c;
                    }
                    continue;
                }
            } else if (lead) {
                buf[pos++] = 0xEF;
                buf[pos++] = 0xBF;
                buf[pos++] = 0xBD;
                lead = null;
            }

            if (c < 0x80) {
                buf[pos++] = c;
            } else {
                if (c < 0x800) {
                    buf[pos++] = c >> 0x6 | 0xC0;
                } else {
                    if (c < 0x10000) {
                        buf[pos++] = c >> 0xC | 0xE0;
                    } else {
                        buf[pos++] = c >> 0x12 | 0xF0;
                        buf[pos++] = c >> 0xC & 0x3F | 0x80;
                    }
                    buf[pos++] = c >> 0x6 & 0x3F | 0x80;
                }
                buf[pos++] = c & 0x3F | 0x80;
            }
        }
        return pos;
    }

    /*
    Adapted from vt-pbf https://github.com/mapbox/vt-pbf

    The MIT License (MIT)

    Copyright (c) 2015 Anand Thakker

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
    */
    var GeomType;
    (function (GeomType) {
        GeomType[GeomType["UNKNOWN"] = 0] = "UNKNOWN";
        GeomType[GeomType["POINT"] = 1] = "POINT";
        GeomType[GeomType["LINESTRING"] = 2] = "LINESTRING";
        GeomType[GeomType["POLYGON"] = 3] = "POLYGON";
    })(GeomType || (GeomType = {}));
    /**
     * Enodes and serializes a mapbox vector tile as an array of bytes.
     */
    function encodeVectorTile(tile) {
        const pbf = new Pbf();
        for (const id in tile.layers) {
            const layer = tile.layers[id];
            if (!layer.extent) {
                layer.extent = tile.extent;
            }
            pbf.writeMessage(3, writeLayer, Object.assign(Object.assign({}, layer), { id }));
        }
        return pbf.finish();
    }
    function writeLayer(layer, pbf) {
        if (!pbf)
            throw new Error("pbf undefined");
        pbf.writeVarintField(15, 2);
        pbf.writeStringField(1, layer.id || "");
        pbf.writeVarintField(5, layer.extent || 4096);
        const context = {
            keys: [],
            values: [],
            keycache: {},
            valuecache: {},
        };
        for (const feature of layer.features) {
            context.feature = feature;
            pbf.writeMessage(2, writeFeature, context);
        }
        for (const key of context.keys) {
            pbf.writeStringField(3, key);
        }
        for (const value of context.values) {
            pbf.writeMessage(4, writeValue, value);
        }
    }
    function writeFeature(context, pbf) {
        const feature = context.feature;
        if (!feature || !pbf)
            throw new Error();
        pbf.writeMessage(2, writeProperties, context);
        pbf.writeVarintField(3, feature.type);
        pbf.writeMessage(4, writeGeometry, feature);
    }
    function writeProperties(context, pbf) {
        const feature = context.feature;
        if (!feature || !pbf)
            throw new Error();
        const keys = context.keys;
        const values = context.values;
        const keycache = context.keycache;
        const valuecache = context.valuecache;
        for (const key in feature.properties) {
            let value = feature.properties[key];
            let keyIndex = keycache[key];
            if (value === null)
                continue; // don't encode null value properties
            if (typeof keyIndex === "undefined") {
                keys.push(key);
                keyIndex = keys.length - 1;
                keycache[key] = keyIndex;
            }
            pbf.writeVarint(keyIndex);
            const type = typeof value;
            if (type !== "string" && type !== "boolean" && type !== "number") {
                value = JSON.stringify(value);
            }
            const valueKey = `${type}:${value}`;
            let valueIndex = valuecache[valueKey];
            if (typeof valueIndex === "undefined") {
                values.push(value);
                valueIndex = values.length - 1;
                valuecache[valueKey] = valueIndex;
            }
            pbf.writeVarint(valueIndex);
        }
    }
    function command(cmd, length) {
        return (length << 3) + (cmd & 0x7);
    }
    function zigzag(num) {
        return (num << 1) ^ (num >> 31);
    }
    function writeGeometry(feature, pbf) {
        if (!pbf)
            throw new Error();
        const geometry = feature.geometry;
        const type = feature.type;
        let x = 0;
        let y = 0;
        for (const ring of geometry) {
            let count = 1;
            if (type === GeomType.POINT) {
                count = ring.length / 2;
            }
            pbf.writeVarint(command(1, count)); // moveto
            // do not write polygon closing path as lineto
            const length = ring.length / 2;
            const lineCount = type === GeomType.POLYGON ? length - 1 : length;
            for (let i = 0; i < lineCount; i++) {
                if (i === 1 && type !== 1) {
                    pbf.writeVarint(command(2, lineCount - 1)); // lineto
                }
                const dx = ring[i * 2] - x;
                const dy = ring[i * 2 + 1] - y;
                pbf.writeVarint(zigzag(dx));
                pbf.writeVarint(zigzag(dy));
                x += dx;
                y += dy;
            }
            if (type === GeomType.POLYGON) {
                pbf.writeVarint(command(7, 1)); // closepath
            }
        }
    }
    function writeValue(value, pbf) {
        if (!pbf)
            throw new Error();
        if (typeof value === "string") {
            pbf.writeStringField(1, value);
        }
        else if (typeof value === "boolean") {
            pbf.writeBooleanField(7, value);
        }
        else if (typeof value === "number") {
            if (value % 1 !== 0) {
                pbf.writeDoubleField(3, value);
            }
            else if (value < 0) {
                pbf.writeSVarintField(6, value);
            }
            else {
                pbf.writeVarintField(5, value);
            }
        }
    }

    const perf = typeof performance !== "undefined" ? performance : undefined;
    const timeOrigin = perf
        ? perf.timeOrigin || new Date().getTime() - perf.now()
        : new Date().getTime();
    function getResourceTiming(url) {
        var _a;
        return JSON.parse(JSON.stringify(((_a = perf === null || perf === undefined ? undefined : perf.getEntriesByName) === null || _a === undefined ? undefined : _a.call(perf, url)) || []));
    }
    function now() {
        return perf ? perf.now() : new Date().getTime();
    }
    function flatten(input) {
        const result = [];
        for (const list of input) {
            result.push(...list);
        }
        return result;
    }
    /** Utility for tracking how long tiles take to generate, and where the time is going. */
    class Timer {
        constructor(name) {
            this.marks = {};
            this.urls = [];
            this.fetched = [];
            this.resources = [];
            this.tilesFetched = 0;
            this.timeOrigin = timeOrigin;
            this.finish = (url) => {
                this.markFinish();
                const get = (type) => {
                    const all = this.marks[type] || [];
                    const max = Math.max(...all.map((ns) => Math.max(...ns)));
                    const min = Math.min(...all.map((ns) => Math.min(...ns)));
                    return Number.isFinite(max) ? max - min : undefined;
                };
                const duration = get("main") || 0;
                const fetch = get("fetch");
                const decode = get("decode");
                const process = get("isoline");
                return {
                    url,
                    tilesUsed: this.tilesFetched,
                    origin: this.timeOrigin,
                    marks: this.marks,
                    resources: [
                        ...this.resources,
                        ...flatten(this.fetched.map(getResourceTiming)),
                    ],
                    duration,
                    fetch,
                    decode,
                    process,
                    wait: duration - (fetch || 0) - (decode || 0) - (process || 0),
                };
            };
            this.error = (url) => (Object.assign(Object.assign({}, this.finish(url)), { error: true }));
            this.marker = (category) => {
                var _a;
                if (!this.marks[category]) {
                    this.marks[category] = [];
                }
                const marks = [now()];
                (_a = this.marks[category]) === null || _a === undefined ? undefined : _a.push(marks);
                return () => marks.push(now());
            };
            this.useTile = (url) => {
                if (this.urls.indexOf(url) < 0) {
                    this.urls.push(url);
                    this.tilesFetched++;
                }
            };
            this.fetchTile = (url) => {
                if (this.fetched.indexOf(url) < 0) {
                    this.fetched.push(url);
                }
            };
            this.addAll = (timings) => {
                var _a;
                this.tilesFetched += timings.tilesUsed;
                const offset = timings.origin - this.timeOrigin;
                for (const category in timings.marks) {
                    const key = category;
                    const ourList = this.marks[key] || (this.marks[key] = []);
                    ourList.push(...(((_a = timings.marks[key]) === null || _a === undefined ? undefined : _a.map((ns) => ns.map((n) => n + offset))) || []));
                }
                this.resources.push(...timings.resources.map((rt) => applyOffset(rt, offset)));
            };
            this.markFinish = this.marker(name);
        }
    }
    const startOrEnd = /(Start$|End$|^start|^end)/;
    function applyOffset(obj, offset) {
        const result = {};
        for (const key in obj) {
            if (obj[key] !== 0 && startOrEnd.test(key)) {
                result[key] = Number(obj[key]) + offset;
            }
            else {
                result[key] = obj[key];
            }
        }
        return result;
    }

    const defaultGetTile = (url, abortController) => __awaiter(undefined, undefined, undefined, function* () {
        const options = {
            signal: abortController.signal,
        };
        const response = yield fetch(url, options);
        if (!response.ok) {
            throw new Error(`Bad response: ${response.status} for ${url}`);
        }
        return {
            data: yield response.blob(),
            expires: response.headers.get("expires") || undefined,
            cacheControl: response.headers.get("cache-control") || undefined,
        };
    });
    /**
     * Caches, decodes, and processes raster tiles in the current thread.
     */
    class LocalDemManager {
        constructor(options) {
            this.loaded = Promise.resolve();
            this.fetchAndParseTile = (z, x, y, abortController, timer) => {
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                const self = this;
                const url = this.demUrlPattern
                    .replace("{z}", z.toString())
                    .replace("{x}", x.toString())
                    .replace("{y}", y.toString());
                timer === null || timer === undefined ? undefined : timer.useTile(url);
                return this.parsedCache.get(url, (_, childAbortController) => __awaiter(this, undefined, undefined, function* () {
                    const response = yield self.fetchTile(z, x, y, childAbortController, timer);
                    if (isAborted(childAbortController))
                        throw new Error("canceled");
                    const promise = self.decodeImage(response.data, self.encoding, childAbortController);
                    const mark = timer === null || timer === undefined ? undefined : timer.marker("decode");
                    const result = yield promise;
                    mark === null || mark === undefined ? undefined : mark();
                    return result;
                }), abortController);
            };
            this.tileCache = new AsyncCache(options.cacheSize);
            this.parsedCache = new AsyncCache(options.cacheSize);
            this.contourCache = new AsyncCache(options.cacheSize);
            this.timeoutMs = options.timeoutMs;
            this.demUrlPattern = options.demUrlPattern;
            this.encoding = options.encoding;
            this.maxzoom = options.maxzoom;
            this.decodeImage = options.decodeImage || defaultDecoder;
            this.getTile = options.getTile || defaultGetTile;
        }
        fetchTile(z, x, y, parentAbortController, timer) {
            const url = this.demUrlPattern
                .replace("{z}", z.toString())
                .replace("{x}", x.toString())
                .replace("{y}", y.toString());
            timer === null || timer === undefined ? undefined : timer.useTile(url);
            return this.tileCache.get(url, (_, childAbortController) => {
                timer === null || timer === undefined ? undefined : timer.fetchTile(url);
                const mark = timer === null || timer === undefined ? undefined : timer.marker("fetch");
                return withTimeout(this.timeoutMs, this.getTile(url, childAbortController).finally(() => mark === null || mark === undefined ? undefined : mark()), childAbortController);
            }, parentAbortController);
        }
        fetchDem(z, x, y, options, abortController, timer) {
            return __awaiter(this, undefined, undefined, function* () {
                //const zoom = Math.min(z - (options.overzoom || 0), this.maxzoom);
                const maxFetchZoom = options.maxFetchZoom || 22;
                const zoom = Math.min(Math.min(z - (options.overzoom || 0), this.maxzoom), maxFetchZoom);
                const subZ = z - zoom;
                const div = 1 << subZ;
                const newX = Math.floor(x / div);
                const newY = Math.floor(y / div);
                const tile = yield this.fetchAndParseTile(zoom, newX, newY, abortController, timer);
                return HeightTile.fromRawDem(tile).split(subZ, x % div, y % div);
            });
        }
        fetchContourTile(z, x, y, options, parentAbortController, timer) {
            const { contours, levels, intervals, multiplier = 1, buffer = 1, extent = 4096, contourLayer = "contours", elevationKey = "ele", deltaKey = "delta", intervalKey = "intervalIndex", subsampleBelow = 100, } = options;
            // console.log(`FETCH options`, options)
            // no levels means less than min zoom with levels specified
            if ((!intervals || intervals.length === 0) && (!levels || levels.length === 0) && (!contours || contours.length === 0)) {
                return Promise.resolve({ arrayBuffer: new ArrayBuffer(0) });
            }
            const key = [z, x, y, encodeIndividualOptions(options)].join("/");
            return this.contourCache.get(key, (_, childAbortController) => __awaiter(this, undefined, undefined, function* () {
                const max = 1 << z;
                const neighborPromises = [];
                for (let iy = y - 1; iy <= y + 1; iy++) {
                    for (let ix = x - 1; ix <= x + 1; ix++) {
                        neighborPromises.push(iy < 0 || iy >= max
                            ? undefined
                            : this.fetchDem(z, (ix + max) % max, iy, options, childAbortController, timer));
                    }
                }
                const neighbors = yield Promise.all(neighborPromises);
                let virtualTile = HeightTile.combineNeighbors(neighbors);
                if (!virtualTile || isAborted(childAbortController)) {
                    return { arrayBuffer: new Uint8Array().buffer };
                }
                const mark = timer === null || timer === undefined ? undefined : timer.marker("isoline");
                if (virtualTile.width >= subsampleBelow) {
                    virtualTile = virtualTile.materialize(2);
                }
                else {
                    while (virtualTile.width < subsampleBelow) {
                        virtualTile = virtualTile.subsamplePixelCenters(2).materialize(2);
                    }
                }
                virtualTile = virtualTile
                    .averagePixelCentersToGrid()
                    .scaleElevation(multiplier)
                    .materialize(1);
                // const isoOptions = {
                //     levels: [ -300, 0, 400],
                //     interval : 100, //levels[0]
                //     polygons: false,
                //     deltaReference: 0,
                // } as IsoOptions;
                const isolines = generateIsolines(options, virtualTile, extent, buffer, x, y, z);
                const geomType = (options.polygons) ? GeomType.POLYGON : GeomType.LINESTRING;
                // natural ordering will messe up ordering if negative levels are involved
                const isoLinesKeysSorted = Object.keys(isolines).map(a => Number(a)).sort((a, b) => a - b);
                mark === null || mark === undefined ? undefined : mark();
                const result = encodeVectorTile({
                    extent,
                    layers: {
                        [contourLayer]: {
                            //features: Object.entries(isolines).map(([eleString, geom]) => {
                            features: isoLinesKeysSorted.map(l => { return { ele: l, geom: isolines[l] }; }).map(({ ele, geom }) => {
                                // const ele = Number(eleString);
                                var _a;
                                const baseProps = {
                                    [elevationKey]: ele,
                                    [intervalKey]: (intervals) ? Math.max(...intervals.map((l, i) => (ele % l === 0 ? i : 0))) : 0,
                                };
                                //POLYGONS: calc delta value and extend props
                                const deltaAlt = (options.deltaBaseAltitude != undefined) ? ele - options.deltaBaseAltitude : undefined;
                                const deltaProps = (deltaAlt != undefined) ? {
                                    [deltaKey]: deltaAlt,
                                } : {};
                                // get optional custom props from config
                                const countourDefintion = (_a = options.contours) === null || _a === undefined ? undefined : _a.find(e => Number(e.contourElevation) == ele);
                                const customProps = (countourDefintion) ? countourDefintion.addProperties : {};
                                const properties = Object.assign(baseProps, deltaProps, customProps);
                                // console.log(properties)
                                return {
                                    type: geomType,
                                    geometry: geom,
                                    properties: properties,
                                };
                            }),
                        },
                    },
                });
                mark === null || mark === undefined ? undefined : mark();
                return { arrayBuffer: result.buffer };
            }), parentAbortController);
        }
    }

    let id = 0;
    /**
     * Utility for sending messages to a remote instance of `<T>` running in a web worker
     * from the main thread, or in the main thread running from a web worker.
     */
    class Actor {
        constructor(dest, dispatcher, timeoutMs = 20000) {
            this.callbacks = {};
            this.cancels = {};
            this.dest = dest;
            this.timeoutMs = timeoutMs;
            this.dest.onmessage = (_a) => __awaiter(this, [_a], undefined, function* ({ data }) {
                const message = data;
                if (message.type === "cancel") {
                    const cancel = this.cancels[message.id];
                    delete this.cancels[message.id];
                    cancel === null || cancel === undefined ? undefined : cancel.abort();
                }
                else if (message.type === "response") {
                    const callback = this.callbacks[message.id];
                    delete this.callbacks[message.id];
                    if (callback) {
                        callback(message.error ? new Error(message.error) : undefined, message.response, message.timings);
                    }
                }
                else if (message.type === "request") {
                    const timer = new Timer("worker");
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                    const handler = dispatcher[message.name];
                    const abortController = new AbortController();
                    const request = handler.apply(handler, [
                        ...message.args,
                        abortController,
                        timer,
                    ]);
                    const url = `${message.name}_${message.id}`;
                    if (message.id && request) {
                        this.cancels[message.id] = abortController;
                        try {
                            const response = yield request;
                            const transferrables = response === null || response === void 0 ? void 0 : response.transferrables;
                            this.postMessage({
                                id: message.id,
                                type: "response",
                                response,
                                timings: timer.finish(url),
                            }, transferrables);
                        }
                        catch (e) {
                            this.postMessage({
                                id: message.id,
                                type: "response",
                                error: (e === null || e === undefined ? undefined : e.toString()) || "error",
                                timings: timer.finish(url),
                            });
                        }
                        delete this.cancels[message.id];
                    }
                }
            });
        }
        postMessage(message, transferrables) {
            this.dest.postMessage(message, transferrables || []);
        }
        /** Invokes a method by name with a set of arguments in the remote context. */
        send(name, transferrables, abortController, timer, ...args) {
            const thisId = ++id;
            const value = new Promise((resolve, reject) => {
                this.postMessage({ id: thisId, type: "request", name, args }, transferrables);
                this.callbacks[thisId] = (error, result, timings) => {
                    timer === null || timer === undefined ? undefined : timer.addAll(timings);
                    if (error)
                        reject(error);
                    else
                        resolve(result);
                };
            });
            onAbort(abortController, () => {
                delete this.callbacks[thisId];
                this.postMessage({ id: thisId, type: "cancel" });
            });
            return withTimeout(this.timeoutMs, value, abortController);
        }
    }

    exports.A = Actor;
    exports.H = HeightTile;
    exports.L = LocalDemManager;
    exports.T = Timer;
    exports._ = __awaiter;
    exports.a = decodeOptions;
    exports.b = generateIsolines;
    exports.c = decodeParsedImage;
    exports.d = defaultDecoder;
    exports.e = encodeOptions;
    exports.f = prepareContourTile;
    exports.g = getOptionsForZoom;
    exports.p = prepareDemTile;

    }));

    define(['./shared'], (function (actor) { 'use strict';

    const noManager = (managerId) => Promise.reject(new Error(`No manager registered for ${managerId}`));
    /**
     * Receives messages from an actor in the web worker.
     */
    class WorkerDispatch {
        constructor() {
            /** There is one worker shared between all managers in the main thread using the plugin, so need to store each of their configurations. */
            this.managers = {};
            this.init = (message, _) => {
                this.managers[message.managerId] = new actor.L(message);
                return Promise.resolve();
            };
            this.fetchTile = (managerId, z, x, y, abortController, timer) => {
                var _a;
                return ((_a = this.managers[managerId]) === null || _a === undefined ? undefined : _a.fetchTile(z, x, y, abortController, timer)) ||
                    noManager(managerId);
            };
            this.fetchAndParseTile = (managerId, z, x, y, abortController, timer) => {
                var _a;
                return actor.p(((_a = this.managers[managerId]) === null || _a === undefined ? undefined : _a.fetchAndParseTile(z, x, y, abortController, timer)) || noManager(managerId), true);
            };
            this.fetchContourTile = (managerId, z, x, y, options, abortController, timer) => {
                var _a;
                return actor.f(((_a = this.managers[managerId]) === null || _a === undefined ? undefined : _a.fetchContourTile(z, x, y, options, abortController, timer)) || noManager(managerId));
            };
        }
    }

    const g = typeof self !== "undefined"
        ? self
        : typeof window !== "undefined"
            ? window
            : global;
    g.actor = new actor.A(g, new WorkerDispatch());

    }));

    define(['./shared'], (function (actor) { 'use strict';

    const CONFIG = { workerUrl: "" };

    let _actor;
    let id = 0;
    class MainThreadDispatch {
        constructor() {
            this.decodeImage = (blob, encoding, abortController) => actor.p(actor.d(blob, encoding, abortController), false);
        }
    }
    function defaultActor() {
        if (!_actor) {
            const worker = new Worker(CONFIG.workerUrl);
            const dispatch = new MainThreadDispatch();
            _actor = new actor.A(worker, dispatch);
        }
        return _actor;
    }
    /**
     * Caches, decodes, and processes raster tiles in a shared web worker.
     */
    class RemoteDemManager {
        constructor(options) {
            this.fetchTile = (z, x, y, abortController, timer) => this.actor.send("fetchTile", [], abortController, timer, this.managerId, z, x, y);
            this.fetchAndParseTile = (z, x, y, abortController, timer) => this.actor.send("fetchAndParseTile", [], abortController, timer, this.managerId, z, x, y);
            this.fetchContourTile = (z, x, y, options, abortController, timer) => this.actor.send("fetchContourTile", [], abortController, timer, this.managerId, z, x, y, options);
            const managerId = (this.managerId = ++id);
            this.actor = options.actor || defaultActor();
            this.loaded = this.actor.send("init", [], new AbortController(), undefined, Object.assign(Object.assign({}, options), { managerId }));
        }
    }

    if (!Blob.prototype.arrayBuffer) {
        Blob.prototype.arrayBuffer = function arrayBuffer() {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = (event) => { var _a; return resolve((_a = event.target) === null || _a === undefined ? undefined : _a.result); };
                fileReader.onerror = reject;
                fileReader.readAsArrayBuffer(this);
            });
        };
    }
    const v3compat = (v4) => (requestParameters, arg2) => {
        if (arg2 instanceof AbortController) {
            return v4(requestParameters, arg2);
        }
        else {
            const abortController = new AbortController();
            v4(requestParameters, abortController)
                .then((result) => arg2(undefined, result.data, result.cacheControl, result.expires), (err) => arg2(err))
                .catch((err) => arg2(err));
            return { cancel: () => abortController.abort() };
        }
    };
    const used = new Set();
    /**
     * A remote source of DEM tiles that can be connected to maplibre.
     */
    class DemSource {
        constructor({ url, cacheSize = 100, id = "dem", encoding = "terrarium", maxzoom = 12, worker = true, timeoutMs = 10000, actor: actor$1, }) {
            this.timingCallbacks = [];
            /** Registers a callback to be invoked with a performance report after each tile is requested. */
            this.onTiming = (callback) => {
                this.timingCallbacks.push(callback);
            };
            /**
             * Adds contour and shared DEM protocol handlers to maplibre.
             *
             * @param maplibre maplibre global object
             */
            this.setupMaplibre = (maplibre) => {
                maplibre.addProtocol(this.sharedDemProtocolId, this.sharedDemProtocol);
                maplibre.addProtocol(this.contourProtocolId, this.contourProtocol);
            };
            /**
             * Callback to be used with maplibre addProtocol to re-use cached DEM tiles across sources.
             */
            this.sharedDemProtocolV4 = (request, abortController) => actor._(this, undefined, undefined, function* () {
                const [z, x, y] = this.parseUrl(request.url);
                const timer = new actor.T("main");
                let timing;
                try {
                    const data = yield this.manager.fetchTile(z, x, y, abortController, timer);
                    timing = timer.finish(request.url);
                    const arrayBuffer = yield data.data.arrayBuffer();
                    return {
                        data: arrayBuffer,
                        cacheControl: data.cacheControl,
                        expires: data.expires,
                    };
                }
                catch (error) {
                    timing = timer.error(request.url);
                    throw error;
                }
                finally {
                    this.timingCallbacks.forEach((cb) => cb(timing));
                }
            });
            /**
             * Callback to be used with maplibre addProtocol to generate contour vector tiles according
             * to options encoded in the tile URL pattern generated by `contourProtocolUrl`.
             */
            this.contourProtocolV4 = (request, abortController) => actor._(this, undefined, undefined, function* () {
                const timer = new actor.T("main");
                let timing;
                try {
                    const [z, x, y] = this.parseUrl(request.url);
                    const reqOptions = actor.a(request.url);
                    //POLYLINES      
                    let overrideOptions = null;
                    if (this.GetOptions) {
                        overrideOptions = this.GetOptions({ z, x, y });
                    }
                    const options = Object.assign({}, reqOptions, overrideOptions);
                    const data = yield this.manager.fetchContourTile(z, x, y, actor.g(options, z), abortController, timer);
                    timing = timer.finish(request.url);
                    return { data: data.arrayBuffer };
                }
                catch (error) {
                    timing = timer.error(request.url);
                    throw error;
                }
                finally {
                    this.timingCallbacks.forEach((cb) => cb(timing));
                }
            });
            this.contourProtocol = v3compat(this.contourProtocolV4);
            this.sharedDemProtocol = v3compat(this.sharedDemProtocolV4);
            /**
             * Returns a URL with the correct maplibre protocol prefix and all `option` encoded in request parameters.
             */
            this.contourProtocolUrl = (options) => `${this.contourProtocolUrlBase}?${actor.e(options)}`;
            let protocolPrefix = id;
            let i = 1;
            while (used.has(protocolPrefix)) {
                protocolPrefix = id + i++;
            }
            used.add(protocolPrefix);
            this.sharedDemProtocolId = `${protocolPrefix}-shared`;
            this.contourProtocolId = `${protocolPrefix}-contour`;
            this.sharedDemProtocolUrl = `${this.sharedDemProtocolId}://{z}/{x}/{y}`;
            this.contourProtocolUrlBase = `${this.contourProtocolId}://{z}/{x}/{y}`;
            const ManagerClass = worker ? RemoteDemManager : actor.L;
            this.manager = new ManagerClass({
                demUrlPattern: url,
                cacheSize,
                encoding,
                maxzoom,
                timeoutMs,
                actor: actor$1,
            });
        }
        getDemTile(z, x, y, abortController) {
            return this.manager.fetchAndParseTile(z, x, y, abortController || new AbortController());
        }
        parseUrl(url) {
            const [, z, x, y] = /\/\/(\d+)\/(\d+)\/(\d+)/.exec(url) || [];
            return [Number(z), Number(x), Number(y)];
        }
    }

    const exported = {
        generateIsolines: actor.b,
        DemSource,
        HeightTile: actor.H,
        LocalDemManager: actor.L,
        decodeParsedImage: actor.c,
        set workerUrl(url) {
            CONFIG.workerUrl = url;
        },
        get workerUrl() {
            return CONFIG.workerUrl;
        },
    };

    return exported;

    }));

    /* eslint-disable no-undef */

    var mlcontour$1 = mlcontour;

    return mlcontour$1;

}));
