const intersect = require("path-intersection")
const {SVGPathData, SVGPathDataTransformer, SVGPathDataEncoder, SVGPathDataParse, encodeSVGPath} = require('svg-pathdata');

// path = "M1084.09 2482.14L1084.09 2482.14Q968.13 2482.14 872.45 2438.24Q776.76 2394.33 726.10 2290.77L726.10 2290.77Q602.27 2482.14 389.51 2482.14L389.51 2482.14Q226.27 2482.14 122.71 2371.82L122.71 2371.82Q0 2242.36 0 1967.68L0 1967.68Q0 1813.45 38.84 1659.23Q77.68 1505.00 152.54 1377.79Q227.40 1250.58 336.60 1173.47Q445.79 1096.36 585.38 1096.36L585.38 1096.36Q691.20 1096.36 755.93 1146.45Q820.66 1196.55 853.31 1292.24L853.31 1292.24Q862.32 1220.19 862.32 1158.27L862.32 1158.27Q920.85 1158.27 980.52 1144.77L980.52 1144.77Q1034.55 1133.51 1076.21 1133.51L1076.21 1133.51Q1127.99 1133.51 1156.13 1156.59Q1184.28 1179.66 1194.97 1215.12Q1205.67 1250.58 1205.67 1287.73L1205.67 1287.73Q1205.67 1348.52 1185.40 1442.52Q1165.14 1536.52 1138.12 1642.34L1138.12 1642.34Q1107.73 1758.29 1084.09 1868.05Q1060.45 1977.81 1060.45 2055.49L1060.45 2055.49Q1060.45 2089.26 1071.14 2119.65Q1081.83 2150.05 1106.04 2169.75Q1130.24 2189.45 1168.52 2189.45L1168.52 2189.45Q1222.55 2189.45 1268.71 2147.80Q1314.86 2106.15 1352.01 2035.22Q1389.16 1964.30 1418.43 1873.12L1418.43 1873.12Q1430.81 1834.84 1457.83 1817.39Q1484.85 1799.94 1516.37 1799.94L1516.37 1799.94Q1568.15 1799.94 1615.43 1839.91Q1662.72 1879.87 1662.72 1948.54L1662.72 1948.54Q1662.72 1981.19 1648.08 2018.34L1648.08 2018.34Q1601.93 2147.80 1527.06 2252.49Q1452.20 2357.19 1343.57 2419.66Q1234.93 2482.14 1084.09 2482.14ZM507.71 2138.79L507.71 2138.79Q562.87 2138.79 607.90 2093.76Q652.93 2048.73 685.57 1976.69Q718.22 1904.64 736.23 1819.08Q754.24 1733.53 754.24 1651.35L754.24 1651.35Q754.24 1589.43 741.86 1538.77Q729.48 1488.12 703.02 1458.28Q676.57 1428.45 633.79 1428.45L633.79 1428.45Q578.63 1428.45 533.04 1474.61Q487.44 1520.76 455.36 1594.50Q423.28 1668.23 405.27 1753.79Q387.25 1839.35 387.25 1919.27L387.25 1919.27Q387.25 1980.06 399.64 2030.16Q412.02 2080.25 438.48 2109.52Q464.93 2138.79 507.71 2138.79ZM1944.15 2138.79L1944.15 2138.79Q2022.95 2138.79 2077.55 2062.80Q2132.15 1986.82 2162.54 1875.37Q2192.94 1763.92 2192.94 1656.98L2192.94 1656.98Q2192.94 1563.54 2165.92 1496.00Q2138.90 1428.45 2072.48 1428.45L2072.48 1428.45Q2000.44 1428.45 1944.71 1506.69Q1888.99 1584.93 1857.47 1699.19Q1825.95 1813.45 1825.95 1917.02L1825.95 1917.02Q1825.95 2013.83 1855.22 2076.31Q1884.49 2138.79 1944.15 2138.79ZM2349.42 2482.14L2349.42 2482.14Q2235.72 2482.14 2140.03 2438.24L2140.03 2438.24Q2137.78 2438.24 2135.53 2435.99L2135.53 2435.99Q2027.45 2482.14 1900.25 2482.14L1900.25 2482.14Q1771.91 2482.14 1664.97 2429.23Q1558.02 2376.32 1496.11 2260.37L1496.11 2260.37Q1431.94 2146.67 1431.94 1963.18L1431.94 1963.18Q1431.94 1849.48 1459.52 1699.19Q1487.10 1548.91 1524.25 1382.30L1524.25 1382.30Q1604.18 1052.45 1627.82 768.77L1627.82 768.77Q1630.07 731.62 1630.07 697.85L1630.07 697.85Q1668.34 697.85 1715.63 685.46L1715.63 685.46Q1769.66 671.95 1828.20 671.95L1828.20 671.95Q1908.13 671.95 1949.22 713.61Q1990.31 755.26 1990.31 858.83L1990.31 858.83Q1990.31 907.23 1973.42 1019.25Q1956.53 1131.26 1922.76 1264.09L1922.76 1264.09Q1957.66 1206.68 2038.71 1151.52Q2119.77 1096.36 2227.84 1096.36L2227.84 1096.36Q2393.32 1096.36 2485.63 1230.32L2485.63 1230.32Q2575.69 1367.66 2575.69 1598.44L2575.69 1598.44Q2575.69 1951.92 2421.46 2189.45L2421.46 2189.45L2434.97 2189.45Q2514.90 2189.45 2577.38 2100.52Q2639.86 2011.58 2683.76 1873.12L2683.76 1873.12Q2714.15 1799.94 2782.82 1799.94L2782.82 1799.94Q2852.62 1802.20 2901.03 1859.61L2901.03 1859.61Q2926.92 1894.51 2926.92 1942.91L2926.92 1942.91Q2926.92 1977.81 2914.54 2018.34L2914.54 2018.34Q2868.38 2146.67 2792.96 2252.49Q2717.53 2358.31 2609.46 2420.23Q2501.39 2482.14 2349.42 2482.14Z"

function union(path) {
    paths = path.split(/(?<=Z)(?=M)/g).map( path => {
                return {
                    path: path,
                    segments: new SVGPathData(path).commands
                }
            })
    
    // Making a Copy of the Array
    segmented_paths = paths.map( path => Array() )
    
    var index = [0, 0]
    
    // Finding Intersections and isolating them
    for(index[0] = 0; index[0] < paths.length - 1; index[0]++) {
        for(index[1] = (index[0] + 1); index[1] < paths.length; index[1]++) {
            intersect(paths[index[0]].path, paths[index[1]].path).map( intersection => {
                // Assuming no relativity in the data
    
                for(path_no = 1; path_no <= 2; path_no++)
                {
                    P0 = P1 = P2 = [0, 0]
                    prev_segment = (intersection['segment' + path_no] > 0) ? paths[index[path_no - 1]].segments[intersection['segment' + path_no] - 1] : null
                    if( prev_segment ) {
                        switch( prev_segment.type ) {
                            case SVGPathData.MOVE_TO:
                            case SVGPathData.LINE_TO:
                            case SVGPathData.QUAD_TO:
                                P0 = [prev_segment.x, prev_segment.y]
                            break;
                        }
                    }
        
                    curr_segment = paths[index[path_no - 1]].segments[intersection['segment' + path_no]]
        
                    new_segments = []
        
                    switch( curr_segment.type ) {
                        case SVGPathData.LINE_TO:
                            new_segments = new SVGPathData(`
                                                L${intersection.x} ${intersection.y}
                                                L${curr_segment.x} ${curr_segment.y}`).commands
                        break;
                        case SVGPathData.QUAD_TO:
                            P1 = [curr_segment.x1, curr_segment.y1]
                            P2 = [curr_segment.x, curr_segment.y]
                            var [left, right] = splitQCurve([P0, P1, P2], intersection['t' + path_no])
        
                            segment_string = (left.length == 3) ? `Q${left[1][0]} ${left[1][1]} ${left[2][0]} ${left[2][1]}` : ""
                            segment_string += (right.length == 3) ? `Q${right[1][0]} ${right[1][1]} ${right[2][0]} ${right[2][1]}` : ""
        
                            new_segments = new SVGPathData(segment_string).commands
                        break;
                        case SVGPathData.CLOSE_PATH:
                            new_segments = new SVGPathData(`
                                                L${intersection.x} ${intersection.y}
                                                L${paths[index[path_no - 1]].segments[0].x} ${paths[index[path_no - 1]].segments[0].y}`).commands
                        break;
                    }
        
                    if( new_segments ) {
                        // console.log( index[path_no - 1], segmented_paths[index[path_no - 1]])
                        segmented_paths[index[path_no - 1]].push({
                            segment_no: intersection['segment' + path_no],
                            new_segments: new_segments
                        })
                        // segmented_paths[index[path_no - 1]].segments.splice(intersection['segment' + path_no], 1, ...new_segments)
                    }
                }
    
                // return intersection
                // Create Two segments at the intersection
            })
        }
    }
    
    
    // Creating new Segments around the intersections
    segmented_paths.forEach( (path_segments, index) => {
        path_segments = path_segments.sort( (a, b) => ( a.segment_no - b.segment_no ) )
        var new_path_segments = []
        var start = 0
    
        path_segments.forEach( segment => {
            new_path_segments = new_path_segments.concat(paths[index].segments.slice(start, segment.segment_no))
            new_path_segments = new_path_segments.concat(segment.new_segments)
            start = segment.segment_no + 1
        })
    
        new_path_segments = new_path_segments.concat(paths[index].segments.slice(start))
    
        paths[index] = {
            path: encodeSVGPath(new_path_segments),
            segments: new_path_segments
        }
    })
    
    // Removing the Segments inside the Union of the Paths
    paths = paths.map( (path, index) => {
        if( segmented_paths[index].length == 0 ) {
            return path
        }
    
        var segments = path.segments.map( (segment, s_index) => {
            if( s_index > 0 ) {
                var P0 = P1 = P2 = [0, 0]
                var midpoint = null
                prev_segment = path.segments[s_index - 1]
                if( prev_segment ) {
                    switch( prev_segment.type ) {
                        case SVGPathData.MOVE_TO:
                        case SVGPathData.LINE_TO:
                        case SVGPathData.QUAD_TO:
                            P0 = [prev_segment.x, prev_segment.y]
                        break;
                    }
                }
    
                switch(segment.type) {
                    case SVGPathData.LINE_TO:
                        P2 = [segment.x, segment.y]
                        midpoint = [
                            (P0[0] + segment.x) / 2,
                            (P0[1] + segment.y) / 2
                        ]
                    break;
                    case SVGPathData.QUAD_TO:
                        P2 = [segment.x, segment.y]
                        var [{2: midpoint}, right] = splitQCurve([P0, [segment.x1, segment.y1], [segment.x, segment.y]], 0.5)
                    break;
                    case SVGPathData.CLOSE_PATH:
                        P2 = [path.segments[0].x, path.segments[0].y]
                        midpoint = [
                            (P0[0] + P2[0]) / 2,
                            (P0[1] + P2[1]) / 2
                        ]
                }
    
                if( midpoint ) {
                    other_paths = paths.reduce( (prev, current, p_index) => prev + (( p_index != index ) ? current.path : ""), "" )
                    y_perpendicular_path = `M${midpoint[0]} ${midpoint[1]}L0 ${midpoint[1]}`
                    x_perpendicular_path = `M${midpoint[0]} ${midpoint[1]}L${midpoint[0]} 0`
                    y_intersection_count = intersect(other_paths, y_perpendicular_path, true)
                    x_intersection_count = intersect(other_paths, x_perpendicular_path, true)
                    if( (y_intersection_count % 2 == 1) && (x_intersection_count % 2 == 1) ) {
                        return new SVGPathData(`M${P2[0]} ${P2[1]}`).commands[0]
                        // console.log(new SVGPathData(`M${P2[0]} ${P2[1]}`).commands[0])
                        // return
                    }
                }
    
                if( (s_index == (path.segments.length - 1)) && (segment.type == SVGPathData.CLOSE_PATH) ) {
                    return new SVGPathData(`L${path.segments[0].x} ${path.segments[0].y}`).commands[0]
                }
            }
    
            return segment
        })
    
        // segments = segments.filter( segment => segment )
    
        return {
            path: encodeSVGPath(segments),
            segments: segments
        }
    })
    
    return paths.reduce( (prev, current) => ( prev + current.path ), "" )
}

function splitQCurve(points, t, left = [], right = []) {
    if( points.length == 1) {
        left.push(points[0])
        right.unshift(points[0])
    }
    else {
        newpoints = Array(points.length - 1)
        for(i = 0; i < newpoints.length; i++) {
            if( i == 0 ) {
                left.push(points[i])
            }
            if( i == (newpoints.length - 1) ) {
                right.unshift(points[i + 1])
            }
            newpoints[i] = cartAdd( cartMul(points[i], (1 - t)), cartMul(points[i + 1], t) )
        }
        [left, right] = splitQCurve(newpoints, t, left, right)
    }

    return [left, right]
}

// Cartesian Multipy
function cartMul(point, constant) {
    return [ (constant * point[0]), (constant * point[1]) ]
}

// Cartesian Add
function cartAdd(point1, point2) {
    return [ (point1[0] + point2[0]), (point1[1] + point2[1]) ]
}

module.exports = union

window.union = union