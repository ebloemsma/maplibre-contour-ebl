import type { LineDefinition } from "./isopolygons";

/**
* Checks how many rectangle corners are passed by a line.
* @param {number[]} line - Line defined as [x1, y1, x2, y2, ...]
* @param {Object} rect - Rectangle defined by {minX, minY, maxX, maxY}
* @returns {number} - Number of rectangle corners touched by the line
*/
export function countCornersPassed( line ) {
    const rect = { minX: -32, minY: -32, maxX: 4128, maxY: 4128 };
    const corners = [
        [rect.minX, rect.minY],
        [rect.minX, rect.maxY],
        [rect.maxX, rect.minY],
        [rect.maxX, rect.maxY]
    ];

    // Helper to check if point lies exactly on the line segment
    function pointOnSegment(px, py, x1, y1, x2, y2) {
        const cross = (px - x1) * (y2 - y1) - (py - y1) * (x2 - x1);
        if (Math.abs(cross) > 1e-10) return false;

        const dot = (px - x1) * (px - x2) + (py - y1) * (py - y2);
        return dot <= 0;
    }

    let count = 0;
    for (const [cx, cy] of corners) {
        for (let i = 0; i < line.length - 2; i += 2) {
            if (pointOnSegment(cx, cy, line[i], line[i + 1], line[i + 2], line[i + 3])) {
                count++;
                break; // Don't count the same corner more than once
            }
        }
    }

    return count;
}

export function doesLineIntersectItself( coords: number [] ) {
    // Convert flat array to point array
    const points : [number,number][] = [];
    for (let i = 0; i < coords.length; i += 2) {
        points.push( [coords[i], coords[i + 1]] );
    }

    function segmentsIntersect(p1, p2, q1, q2) {
        function ccw(a, b, c) {
            return (c[1] - a[1]) * (b[0] - a[0]) > (b[1] - a[1]) * (c[0] - a[0]);
        }
        return (
            ccw(p1, q1, q2) !== ccw(p2, q1, q2) &&
            ccw(p1, p2, q1) !== ccw(p1, p2, q2)
        );
    }

    for (let i = 0; i < points.length - 1; i++) {
        for (let j = i + 2; j < points.length - 1; j++) {
            // Skip adjacent segments and the first-last segment if open line
            if (i === 0 && j === points.length - 2) continue;
            if (segmentsIntersect(points[i], points[i + 1], points[j], points[j + 1])) {
                return true;
            }
        }
    }
    return false;
}


export function testPolyContainsInner(poly, innerPolys) {
    console.log("- testPolyInner:", poly.toString2())
    innerPolys.forEach(inner => {
        const isInseide = isPolygonInsideFlat(inner.line, poly.line)
        console.log(`  - ${isInseide} <- ${inner.toString2()}`)
    })
}

export function pointInPolygonFlat(px, py, polygon) {
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

export function isPolygonInsideFlat(innerFlat, outerFlat) {
    for (let i = 0; i < innerFlat.length; i += 2) {
        const x = innerFlat[i];
        const y = innerFlat[i + 1];
        if (!pointInPolygonFlat(x, y, outerFlat)) return false;
    }
    return true;
}

export function lineArrayToStrings(lines) {
    return lines.map(l => l.toString())
}

export function arrayRemoveObjects(theArray, ...removeObjects) {
    if (!removeObjects) return 0;
    return removeObjects.map(o => arrayRemoveObject(theArray, o)).filter(r => r === true).length
}
export function arrayRemoveObject(theArray, removeObject: object) {
    if (!removeObject) return false;
    let index = theArray.indexOf(removeObject);
    if (index !== -1) {
        theArray.splice(index, 1);
        return true;
    }
    return false;
}

export function reverseLine(line?:LineDefinition) {
  if (!line) {
    throw new Error("Invalid input: line null");
  }

  if (line.length % 2 !== 0) {
    throw new Error("Invalid input: line must have even number of coordinates");
  }

  const reversed : LineDefinition = [];
  for (let i = line.length - 2; i >= 0; i -= 2) {
    reversed.push(line[i], line[i + 1]);
  }
  return reversed;
}