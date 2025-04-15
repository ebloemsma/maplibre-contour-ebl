function doesLineIntersectItself(coords) {
    // Convert flat array to point array
    const points = [];
    for (let i = 0; i < coords.length; i += 2) {
        points.push([coords[i], coords[i + 1]]);
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