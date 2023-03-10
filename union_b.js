(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

/**
 * This file contains source code adapted from Snap.svg (licensed Apache-2.0).
 *
 * @see https://github.com/adobe-webplatform/Snap.svg/blob/master/src/path.js
 */

/* eslint no-fallthrough: "off" */

var p2s = /,?([a-z]),?/gi,
    toFloat = parseFloat,
    math = Math,
    PI = math.PI,
    mmin = math.min,
    mmax = math.max,
    pow = math.pow,
    abs = math.abs,
    pathCommand = /([a-z])[\s,]*((-?\d*\.?\d*(?:e[-+]?\d+)?[\s]*,?[\s]*)+)/ig,
    pathValues = /(-?\d*\.?\d*(?:e[-+]?\d+)?)[\s]*,?[\s]*/ig;

var isArray = Array.isArray || function(o) { return o instanceof Array; };

function hasProperty(obj, property) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

function clone(obj) {

  if (typeof obj == 'function' || Object(obj) !== obj) {
    return obj;
  }

  var res = new obj.constructor;

  for (var key in obj) {
    if (hasProperty(obj, key)) {
      res[key] = clone(obj[key]);
    }
  }

  return res;
}

function repush(array, item) {
  for (var i = 0, ii = array.length; i < ii; i++) if (array[i] === item) {
    return array.push(array.splice(i, 1)[0]);
  }
}

function cacher(f) {

  function newf() {

    var arg = Array.prototype.slice.call(arguments, 0),
        args = arg.join('\u2400'),
        cache = newf.cache = newf.cache || {},
        count = newf.count = newf.count || [];

    if (hasProperty(cache, args)) {
      repush(count, args);
      return cache[args];
    }

    count.length >= 1e3 && delete cache[count.shift()];
    count.push(args);
    cache[args] = f.apply(0, arg);

    return cache[args];
  }
  return newf;
}

function parsePathString(pathString) {

  if (!pathString) {
    return null;
  }

  var pth = paths(pathString);

  if (pth.arr) {
    return clone(pth.arr);
  }

  var paramCounts = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0 },
      data = [];

  if (isArray(pathString) && isArray(pathString[0])) { // rough assumption
    data = clone(pathString);
  }

  if (!data.length) {

    String(pathString).replace(pathCommand, function(a, b, c) {
      var params = [],
          name = b.toLowerCase();

      c.replace(pathValues, function(a, b) {
        b && params.push(+b);
      });

      if (name == 'm' && params.length > 2) {
        data.push([b].concat(params.splice(0, 2)));
        name = 'l';
        b = b == 'm' ? 'l' : 'L';
      }

      while (params.length >= paramCounts[name]) {
        data.push([b].concat(params.splice(0, paramCounts[name])));
        if (!paramCounts[name]) {
          break;
        }
      }
    });
  }

  data.toString = paths.toString;
  pth.arr = clone(data);

  return data;
}

function paths(ps) {
  var p = paths.ps = paths.ps || {};

  if (p[ps]) {
    p[ps].sleep = 100;
  } else {
    p[ps] = {
      sleep: 100
    };
  }

  setTimeout(function() {
    for (var key in p) {
      if (hasProperty(p, key) && key != ps) {
        p[key].sleep--;
        !p[key].sleep && delete p[key];
      }
    }
  });

  return p[ps];
}

function rectBBox(x, y, width, height) {

  if (arguments.length === 1) {
    y = x.y;
    width = x.width;
    height = x.height;
    x = x.x;
  }

  return {
    x: x,
    y: y,
    width: width,
    height: height,
    x2: x + width,
    y2: y + height
  };
}

function pathToString() {
  return this.join(',').replace(p2s, '$1');
}

function pathClone(pathArray) {
  var res = clone(pathArray);
  res.toString = pathToString;
  return res;
}

function findDotsAtSegment(p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y, t) {
  var t1 = 1 - t,
      t13 = pow(t1, 3),
      t12 = pow(t1, 2),
      t2 = t * t,
      t3 = t2 * t,
      x = t13 * p1x + t12 * 3 * t * c1x + t1 * 3 * t * t * c2x + t3 * p2x,
      y = t13 * p1y + t12 * 3 * t * c1y + t1 * 3 * t * t * c2y + t3 * p2y;

  return {
    x: fixError(x),
    y: fixError(y)
  };
}

function bezierBBox(points) {

  var bbox = curveBBox.apply(null, points);

  return rectBBox(
    bbox.x0,
    bbox.y0,
    bbox.x1 - bbox.x0,
    bbox.y1 - bbox.y0
  );
}

function isPointInsideBBox(bbox, x, y) {
  return x >= bbox.x &&
    x <= bbox.x + bbox.width &&
    y >= bbox.y &&
    y <= bbox.y + bbox.height;
}

function isBBoxIntersect(bbox1, bbox2) {
  bbox1 = rectBBox(bbox1);
  bbox2 = rectBBox(bbox2);
  return isPointInsideBBox(bbox2, bbox1.x, bbox1.y)
    || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y)
    || isPointInsideBBox(bbox2, bbox1.x, bbox1.y2)
    || isPointInsideBBox(bbox2, bbox1.x2, bbox1.y2)
    || isPointInsideBBox(bbox1, bbox2.x, bbox2.y)
    || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y)
    || isPointInsideBBox(bbox1, bbox2.x, bbox2.y2)
    || isPointInsideBBox(bbox1, bbox2.x2, bbox2.y2)
    || (bbox1.x < bbox2.x2 && bbox1.x > bbox2.x
        || bbox2.x < bbox1.x2 && bbox2.x > bbox1.x)
    && (bbox1.y < bbox2.y2 && bbox1.y > bbox2.y
        || bbox2.y < bbox1.y2 && bbox2.y > bbox1.y);
}

function base3(t, p1, p2, p3, p4) {
  var t1 = -3 * p1 + 9 * p2 - 9 * p3 + 3 * p4,
      t2 = t * t1 + 6 * p1 - 12 * p2 + 6 * p3;
  return t * t2 - 3 * p1 + 3 * p2;
}

function bezlen(x1, y1, x2, y2, x3, y3, x4, y4, z) {

  if (z == null) {
    z = 1;
  }

  z = z > 1 ? 1 : z < 0 ? 0 : z;

  var z2 = z / 2,
      n = 12,
      Tvalues = [-.1252,.1252,-.3678,.3678,-.5873,.5873,-.7699,.7699,-.9041,.9041,-.9816,.9816],
      Cvalues = [0.2491,0.2491,0.2335,0.2335,0.2032,0.2032,0.1601,0.1601,0.1069,0.1069,0.0472,0.0472],
      sum = 0;

  for (var i = 0; i < n; i++) {
    var ct = z2 * Tvalues[i] + z2,
        xbase = base3(ct, x1, x2, x3, x4),
        ybase = base3(ct, y1, y2, y3, y4),
        comb = xbase * xbase + ybase * ybase;

    sum += Cvalues[i] * math.sqrt(comb);
  }

  return z2 * sum;
}


function intersectLines(x1, y1, x2, y2, x3, y3, x4, y4) {

  if (
    mmax(x1, x2) < mmin(x3, x4) ||
      mmin(x1, x2) > mmax(x3, x4) ||
      mmax(y1, y2) < mmin(y3, y4) ||
      mmin(y1, y2) > mmax(y3, y4)
  ) {
    return;
  }

  var nx = (x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4),
      ny = (x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4),
      denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (!denominator) {
    return;
  }

  var px = fixError(nx / denominator),
      py = fixError(ny / denominator),
      px2 = +px.toFixed(2),
      py2 = +py.toFixed(2);

  if (
    px2 < +mmin(x1, x2).toFixed(2) ||
      px2 > +mmax(x1, x2).toFixed(2) ||
      px2 < +mmin(x3, x4).toFixed(2) ||
      px2 > +mmax(x3, x4).toFixed(2) ||
      py2 < +mmin(y1, y2).toFixed(2) ||
      py2 > +mmax(y1, y2).toFixed(2) ||
      py2 < +mmin(y3, y4).toFixed(2) ||
      py2 > +mmax(y3, y4).toFixed(2)
  ) {
    return;
  }

  return { x: px, y: py };
}

function fixError(number) {
  return Math.round(number * 100000000000) / 100000000000;
}

function findBezierIntersections(bez1, bez2, justCount) {
  var bbox1 = bezierBBox(bez1),
      bbox2 = bezierBBox(bez2);

  if (!isBBoxIntersect(bbox1, bbox2)) {
    return justCount ? 0 : [];
  }

  // As an optimization, lines will have only 1 segment

  var l1 = bezlen.apply(0, bez1),
      l2 = bezlen.apply(0, bez2),
      n1 = isLine(bez1) ? 1 : ~~(l1 / 5) || 1,
      n2 = isLine(bez2) ? 1 : ~~(l2 / 5) || 1,
      dots1 = [],
      dots2 = [],
      xy = {},
      res = justCount ? 0 : [];

  for (var i = 0; i < n1 + 1; i++) {
    var p = findDotsAtSegment.apply(0, bez1.concat(i / n1));
    dots1.push({ x: p.x, y: p.y, t: i / n1 });
  }

  for (i = 0; i < n2 + 1; i++) {
    p = findDotsAtSegment.apply(0, bez2.concat(i / n2));
    dots2.push({ x: p.x, y: p.y, t: i / n2 });
  }

  for (i = 0; i < n1; i++) {

    for (var j = 0; j < n2; j++) {
      var di = dots1[i],
          di1 = dots1[i + 1],
          dj = dots2[j],
          dj1 = dots2[j + 1],
          ci = abs(di1.x - di.x) < .01 ? 'y' : 'x',
          cj = abs(dj1.x - dj.x) < .01 ? 'y' : 'x',
          is = intersectLines(di.x, di.y, di1.x, di1.y, dj.x, dj.y, dj1.x, dj1.y),
          key;

      if (is) {
        key = is.x.toFixed(9) + '#' + is.y.toFixed(9);

        if (xy[key]) {
          continue;
        }

        xy[key] = true;

        var t1 = di.t + abs((is[ci] - di[ci]) / (di1[ci] - di[ci])) * (di1.t - di.t),
            t2 = dj.t + abs((is[cj] - dj[cj]) / (dj1[cj] - dj[cj])) * (dj1.t - dj.t);

        if (t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1) {

          if (justCount) {
            res++;
          } else {
            res.push({
              x: is.x,
              y: is.y,
              t1: t1,
              t2: t2
            });
          }
        }
      }
    }
  }

  return res;
}


/**
 * Find or counts the intersections between two SVG paths.
 *
 * Returns a number in counting mode and a list of intersections otherwise.
 *
 * A single intersection entry contains the intersection coordinates (x, y)
 * as well as additional information regarding the intersecting segments
 * on each path (segment1, segment2) and the relative location of the
 * intersection on these segments (t1, t2).
 *
 * The path may be an SVG path string or a list of path components
 * such as `[ [ 'M', 0, 10 ], [ 'L', 20, 0 ] ]`.
 *
 * @example
 *
 * var intersections = findPathIntersections(
 *   'M0,0L100,100',
 *   [ [ 'M', 0, 100 ], [ 'L', 100, 0 ] ]
 * );
 *
 * // intersections = [
 * //   { x: 50, y: 50, segment1: 1, segment2: 1, t1: 0.5, t2: 0.5 }
 * // ]
 *
 * @param {String|Array<PathDef>} path1
 * @param {String|Array<PathDef>} path2
 * @param {Boolean} [justCount=false]
 *
 * @return {Array<Intersection>|Number}
 */
function findPathIntersections(path1, path2, justCount) {
  path1 = pathToCurve(path1);
  path2 = pathToCurve(path2);

  var x1, y1, x2, y2, x1m, y1m, x2m, y2m, bez1, bez2,
      res = justCount ? 0 : [];

  for (var i = 0, ii = path1.length; i < ii; i++) {
    var pi = path1[i];

    if (pi[0] == 'M') {
      x1 = x1m = pi[1];
      y1 = y1m = pi[2];
    } else {

      if (pi[0] == 'C') {
        bez1 = [x1, y1].concat(pi.slice(1));
        x1 = bez1[6];
        y1 = bez1[7];
      } else {
        bez1 = [x1, y1, x1, y1, x1m, y1m, x1m, y1m];
        x1 = x1m;
        y1 = y1m;
      }

      for (var j = 0, jj = path2.length; j < jj; j++) {
        var pj = path2[j];

        if (pj[0] == 'M') {
          x2 = x2m = pj[1];
          y2 = y2m = pj[2];
        } else {

          if (pj[0] == 'C') {
            bez2 = [x2, y2].concat(pj.slice(1));
            x2 = bez2[6];
            y2 = bez2[7];
          } else {
            bez2 = [x2, y2, x2, y2, x2m, y2m, x2m, y2m];
            x2 = x2m;
            y2 = y2m;
          }

          var intr = findBezierIntersections(bez1, bez2, justCount);

          if (justCount) {
            res += intr;
          } else {

            for (var k = 0, kk = intr.length; k < kk; k++) {
              intr[k].segment1 = i;
              intr[k].segment2 = j;
              intr[k].bez1 = bez1;
              intr[k].bez2 = bez2;
            }

            res = res.concat(intr);
          }
        }
      }
    }
  }

  return res;
}


function pathToAbsolute(pathArray) {
  var pth = paths(pathArray);

  if (pth.abs) {
    return pathClone(pth.abs);
  }

  if (!isArray(pathArray) || !isArray(pathArray && pathArray[0])) { // rough assumption
    pathArray = parsePathString(pathArray);
  }

  if (!pathArray || !pathArray.length) {
    return [['M', 0, 0]];
  }

  var res = [],
      x = 0,
      y = 0,
      mx = 0,
      my = 0,
      start = 0,
      pa0;

  if (pathArray[0][0] == 'M') {
    x = +pathArray[0][1];
    y = +pathArray[0][2];
    mx = x;
    my = y;
    start++;
    res[0] = ['M', x, y];
  }

  for (var r, pa, i = start, ii = pathArray.length; i < ii; i++) {
    res.push(r = []);
    pa = pathArray[i];
    pa0 = pa[0];

    if (pa0 != pa0.toUpperCase()) {
      r[0] = pa0.toUpperCase();

      switch (r[0]) {
      case 'A':
        r[1] = pa[1];
        r[2] = pa[2];
        r[3] = pa[3];
        r[4] = pa[4];
        r[5] = pa[5];
        r[6] = +pa[6] + x;
        r[7] = +pa[7] + y;
        break;
      case 'V':
        r[1] = +pa[1] + y;
        break;
      case 'H':
        r[1] = +pa[1] + x;
        break;
      case 'M':
        mx = +pa[1] + x;
        my = +pa[2] + y;
      default:
        for (var j = 1, jj = pa.length; j < jj; j++) {
          r[j] = +pa[j] + ((j % 2) ? x : y);
        }
      }
    } else {
      for (var k = 0, kk = pa.length; k < kk; k++) {
        r[k] = pa[k];
      }
    }
    pa0 = pa0.toUpperCase();

    switch (r[0]) {
    case 'Z':
      x = +mx;
      y = +my;
      break;
    case 'H':
      x = r[1];
      break;
    case 'V':
      y = r[1];
      break;
    case 'M':
      mx = r[r.length - 2];
      my = r[r.length - 1];
    default:
      x = r[r.length - 2];
      y = r[r.length - 1];
    }
  }

  res.toString = pathToString;
  pth.abs = pathClone(res);

  return res;
}

function isLine(bez) {
  return (
    bez[0] === bez[2] &&
    bez[1] === bez[3] &&
    bez[4] === bez[6] &&
    bez[5] === bez[7]
  );
}

function lineToCurve(x1, y1, x2, y2) {
  return [
    x1, y1, x2,
    y2, x2, y2
  ];
}

function qubicToCurve(x1, y1, ax, ay, x2, y2) {
  var _13 = 1 / 3,
      _23 = 2 / 3;

  return [
    _13 * x1 + _23 * ax,
    _13 * y1 + _23 * ay,
    _13 * x2 + _23 * ax,
    _13 * y2 + _23 * ay,
    x2,
    y2
  ];
}

function arcToCurve(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {

  // for more information of where this math came from visit:
  // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
  var _120 = PI * 120 / 180,
      rad = PI / 180 * (+angle || 0),
      res = [],
      xy,
      rotate = cacher(function(x, y, rad) {
        var X = x * math.cos(rad) - y * math.sin(rad),
            Y = x * math.sin(rad) + y * math.cos(rad);

        return { x: X, y: Y };
      });

  if (!recursive) {
    xy = rotate(x1, y1, -rad);
    x1 = xy.x;
    y1 = xy.y;
    xy = rotate(x2, y2, -rad);
    x2 = xy.x;
    y2 = xy.y;

    var x = (x1 - x2) / 2,
        y = (y1 - y2) / 2;

    var h = (x * x) / (rx * rx) + (y * y) / (ry * ry);

    if (h > 1) {
      h = math.sqrt(h);
      rx = h * rx;
      ry = h * ry;
    }

    var rx2 = rx * rx,
        ry2 = ry * ry,
        k = (large_arc_flag == sweep_flag ? -1 : 1) *
            math.sqrt(abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x))),
        cx = k * rx * y / ry + (x1 + x2) / 2,
        cy = k * -ry * x / rx + (y1 + y2) / 2,
        f1 = math.asin(((y1 - cy) / ry).toFixed(9)),
        f2 = math.asin(((y2 - cy) / ry).toFixed(9));

    f1 = x1 < cx ? PI - f1 : f1;
    f2 = x2 < cx ? PI - f2 : f2;
    f1 < 0 && (f1 = PI * 2 + f1);
    f2 < 0 && (f2 = PI * 2 + f2);

    if (sweep_flag && f1 > f2) {
      f1 = f1 - PI * 2;
    }
    if (!sweep_flag && f2 > f1) {
      f2 = f2 - PI * 2;
    }
  } else {
    f1 = recursive[0];
    f2 = recursive[1];
    cx = recursive[2];
    cy = recursive[3];
  }

  var df = f2 - f1;

  if (abs(df) > _120) {
    var f2old = f2,
        x2old = x2,
        y2old = y2;

    f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1);
    x2 = cx + rx * math.cos(f2);
    y2 = cy + ry * math.sin(f2);
    res = arcToCurve(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy]);
  }

  df = f2 - f1;

  var c1 = math.cos(f1),
      s1 = math.sin(f1),
      c2 = math.cos(f2),
      s2 = math.sin(f2),
      t = math.tan(df / 4),
      hx = 4 / 3 * rx * t,
      hy = 4 / 3 * ry * t,
      m1 = [x1, y1],
      m2 = [x1 + hx * s1, y1 - hy * c1],
      m3 = [x2 + hx * s2, y2 - hy * c2],
      m4 = [x2, y2];

  m2[0] = 2 * m1[0] - m2[0];
  m2[1] = 2 * m1[1] - m2[1];

  if (recursive) {
    return [m2, m3, m4].concat(res);
  } else {
    res = [m2, m3, m4].concat(res).join().split(',');
    var newres = [];

    for (var i = 0, ii = res.length; i < ii; i++) {
      newres[i] = i % 2 ? rotate(res[i - 1], res[i], rad).y : rotate(res[i], res[i + 1], rad).x;
    }

    return newres;
  }
}

// Returns bounding box of cubic bezier curve.
// Source: http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
// Original version: NISHIO Hirokazu
// Modifications: https://github.com/timo22345
function curveBBox(x0, y0, x1, y1, x2, y2, x3, y3) {
  var tvalues = [],
      bounds = [[], []],
      a, b, c, t, t1, t2, b2ac, sqrtb2ac;

  for (var i = 0; i < 2; ++i) {

    if (i == 0) {
      b = 6 * x0 - 12 * x1 + 6 * x2;
      a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
      c = 3 * x1 - 3 * x0;
    } else {
      b = 6 * y0 - 12 * y1 + 6 * y2;
      a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
      c = 3 * y1 - 3 * y0;
    }

    if (abs(a) < 1e-12) {

      if (abs(b) < 1e-12) {
        continue;
      }

      t = -c / b;

      if (0 < t && t < 1) {
        tvalues.push(t);
      }

      continue;
    }

    b2ac = b * b - 4 * c * a;
    sqrtb2ac = math.sqrt(b2ac);

    if (b2ac < 0) {
      continue;
    }

    t1 = (-b + sqrtb2ac) / (2 * a);

    if (0 < t1 && t1 < 1) {
      tvalues.push(t1);
    }

    t2 = (-b - sqrtb2ac) / (2 * a);

    if (0 < t2 && t2 < 1) {
      tvalues.push(t2);
    }
  }

  var j = tvalues.length,
      jlen = j,
      mt;

  while (j--) {
    t = tvalues[j];
    mt = 1 - t;
    bounds[0][j] = (mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) + (t * t * t * x3);
    bounds[1][j] = (mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) + (t * t * t * y3);
  }

  bounds[0][jlen] = x0;
  bounds[1][jlen] = y0;
  bounds[0][jlen + 1] = x3;
  bounds[1][jlen + 1] = y3;
  bounds[0].length = bounds[1].length = jlen + 2;

  return {
    x0: mmin.apply(0, bounds[0]),
    y0: mmin.apply(0, bounds[1]),
    x1: mmax.apply(0, bounds[0]),
    y1: mmax.apply(0, bounds[1])
  };
}

function pathToCurve(path) {

  var pth = paths(path);

  // return cached curve, if existing
  if (pth.curve) {
    return pathClone(pth.curve);
  }

  var curvedPath = pathToAbsolute(path),
      attrs = { x: 0, y: 0, bx: 0, by: 0, X: 0, Y: 0, qx: null, qy: null },
      processPath = function(path, d, pathCommand) {
        var nx, ny;

        if (!path) {
          return ['C', d.x, d.y, d.x, d.y, d.x, d.y];
        }

        !(path[0] in { T: 1, Q: 1 }) && (d.qx = d.qy = null);

        switch (path[0]) {
        case 'M':
          d.X = path[1];
          d.Y = path[2];
          break;
        case 'A':
          path = ['C'].concat(arcToCurve.apply(0, [d.x, d.y].concat(path.slice(1))));
          break;
        case 'S':
          if (pathCommand == 'C' || pathCommand == 'S') {

            // In 'S' case we have to take into account, if the previous command is C/S.
            nx = d.x * 2 - d.bx;

            // And reflect the previous
            ny = d.y * 2 - d.by;

            // command's control point relative to the current point.
          }
          else {

            // or some else or nothing
            nx = d.x;
            ny = d.y;
          }
          path = ['C', nx, ny].concat(path.slice(1));
          break;
        case 'T':
          if (pathCommand == 'Q' || pathCommand == 'T') {

            // In 'T' case we have to take into account, if the previous command is Q/T.
            d.qx = d.x * 2 - d.qx;

            // And make a reflection similar
            d.qy = d.y * 2 - d.qy;

            // to case 'S'.
          }
          else {

            // or something else or nothing
            d.qx = d.x;
            d.qy = d.y;
          }
          path = ['C'].concat(qubicToCurve(d.x, d.y, d.qx, d.qy, path[1], path[2]));
          break;
        case 'Q':
          d.qx = path[1];
          d.qy = path[2];
          path = ['C'].concat(qubicToCurve(d.x, d.y, path[1], path[2], path[3], path[4]));
          break;
        case 'L':
          path = ['C'].concat(lineToCurve(d.x, d.y, path[1], path[2]));
          break;
        case 'H':
          path = ['C'].concat(lineToCurve(d.x, d.y, path[1], d.y));
          break;
        case 'V':
          path = ['C'].concat(lineToCurve(d.x, d.y, d.x, path[1]));
          break;
        case 'Z':
          path = ['C'].concat(lineToCurve(d.x, d.y, d.X, d.Y));
          break;
        }

        return path;
      },

      fixArc = function(pp, i) {

        if (pp[i].length > 7) {
          pp[i].shift();
          var pi = pp[i];

          while (pi.length) {
            pathCommands[i] = 'A'; // if created multiple C:s, their original seg is saved
            pp.splice(i++, 0, ['C'].concat(pi.splice(0, 6)));
          }

          pp.splice(i, 1);
          ii = curvedPath.length;
        }
      },

      pathCommands = [], // path commands of original path p
      pfirst = '', // temporary holder for original path command
      pathCommand = ''; // holder for previous path command of original path

  for (var i = 0, ii = curvedPath.length; i < ii; i++) {
    curvedPath[i] && (pfirst = curvedPath[i][0]); // save current path command

    if (pfirst != 'C') // C is not saved yet, because it may be result of conversion
    {
      pathCommands[i] = pfirst; // Save current path command
      i && (pathCommand = pathCommands[i - 1]); // Get previous path command pathCommand
    }
    curvedPath[i] = processPath(curvedPath[i], attrs, pathCommand); // Previous path command is inputted to processPath

    if (pathCommands[i] != 'A' && pfirst == 'C') pathCommands[i] = 'C'; // A is the only command
    // which may produce multiple C:s
    // so we have to make sure that C is also C in original path

    fixArc(curvedPath, i); // fixArc adds also the right amount of A:s to pathCommands

    var seg = curvedPath[i],
        seglen = seg.length;

    attrs.x = seg[seglen - 2];
    attrs.y = seg[seglen - 1];
    attrs.bx = toFloat(seg[seglen - 4]) || attrs.x;
    attrs.by = toFloat(seg[seglen - 3]) || attrs.y;
  }

  // cache curve
  pth.curve = pathClone(curvedPath);

  return curvedPath;
}

module.exports = findPathIntersections;

},{}],2:[function(require,module,exports){
// http://geoexamples.com/path-properties/ v1.0.13 Copyright 2022 Roger Veciana i Rovira
"use strict";function t(t,n,e){return n in t?Object.defineProperty(t,n,{value:e,enumerable:!0,configurable:!0,writable:!0}):t[n]=e,t}function n(t){return function(t){if(Array.isArray(t))return e(t)}(t)||function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}(t)||function(t,n){if(!t)return;if("string"==typeof t)return e(t,n);var i=Object.prototype.toString.call(t).slice(8,-1);"Object"===i&&t.constructor&&(i=t.constructor.name);if("Map"===i||"Set"===i)return Array.from(t);if("Arguments"===i||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(i))return e(t,n)}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function e(t,n){(null==n||n>t.length)&&(n=t.length);for(var e=0,i=new Array(n);e<n;e++)i[e]=t[e];return i}Object.defineProperty(exports,"__esModule",{value:!0});var i={a:7,c:6,h:1,l:2,m:2,q:4,s:4,t:2,v:1,z:0},h=/([astvzqmhlc])([^astvzqmhlc]*)/gi,r=/-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/gi,s=function(t){var n=t.match(r);return n?n.map(Number):[]},a=function(n,e,i,h){var r=this;t(this,"x0",void 0),t(this,"x1",void 0),t(this,"y0",void 0),t(this,"y1",void 0),t(this,"getTotalLength",(function(){return Math.sqrt(Math.pow(r.x0-r.x1,2)+Math.pow(r.y0-r.y1,2))})),t(this,"getPointAtLength",(function(t){var n=t/Math.sqrt(Math.pow(r.x0-r.x1,2)+Math.pow(r.y0-r.y1,2));n=Number.isNaN(n)?1:n;var e=(r.x1-r.x0)*n,i=(r.y1-r.y0)*n;return{x:r.x0+e,y:r.y0+i}})),t(this,"getTangentAtLength",(function(t){var n=Math.sqrt((r.x1-r.x0)*(r.x1-r.x0)+(r.y1-r.y0)*(r.y1-r.y0));return{x:-(r.x1-r.x0)/n,y:-(r.y1-r.y0)/n}})),t(this,"getPropertiesAtLength",(function(t){var n=r.getPointAtLength(t),e=r.getTangentAtLength(t);return{x:n.x,y:n.y,tangentX:e.x,tangentY:e.y}})),this.x0=n,this.x1=e,this.y0=i,this.y1=h},o=function(n,e,i,h,r,s,a,o,l){var c=this;t(this,"x0",void 0),t(this,"y0",void 0),t(this,"rx",void 0),t(this,"ry",void 0),t(this,"xAxisRotate",void 0),t(this,"LargeArcFlag",void 0),t(this,"SweepFlag",void 0),t(this,"x1",void 0),t(this,"y1",void 0),t(this,"length",void 0),t(this,"getTotalLength",(function(){return c.length})),t(this,"getPointAtLength",(function(t){t<0?t=0:t>c.length&&(t=c.length);var n=g({x:c.x0,y:c.y0},c.rx,c.ry,c.xAxisRotate,c.LargeArcFlag,c.SweepFlag,{x:c.x1,y:c.y1},t/c.length);return{x:n.x,y:n.y}})),t(this,"getTangentAtLength",(function(t){t<0?t=0:t>c.length&&(t=c.length);var n,e=.05,i=c.getPointAtLength(t);t<0?t=0:t>c.length&&(t=c.length);var h=(n=t<c.length-e?c.getPointAtLength(t+e):c.getPointAtLength(t-e)).x-i.x,r=n.y-i.y,s=Math.sqrt(h*h+r*r);return t<c.length-e?{x:-h/s,y:-r/s}:{x:h/s,y:r/s}})),t(this,"getPropertiesAtLength",(function(t){var n=c.getTangentAtLength(t),e=c.getPointAtLength(t);return{x:e.x,y:e.y,tangentX:n.x,tangentY:n.y}})),this.x0=n,this.y0=e,this.rx=i,this.ry=h,this.xAxisRotate=r,this.LargeArcFlag=s,this.SweepFlag=a,this.x1=o,this.y1=l;var f=u(300,(function(t){return g({x:n,y:e},i,h,r,s,a,{x:o,y:l},t)}));this.length=f.arcLength},g=function(t,n,e,i,h,r,s,a){n=Math.abs(n),e=Math.abs(e),i=l(i,360);var o=c(i);if(t.x===s.x&&t.y===s.y)return{x:t.x,y:t.y,ellipticalArcAngle:0};if(0===n||0===e)return{x:0,y:0,ellipticalArcAngle:0};var g=(t.x-s.x)/2,u=(t.y-s.y)/2,f={x:Math.cos(o)*g+Math.sin(o)*u,y:-Math.sin(o)*g+Math.cos(o)*u},y=Math.pow(f.x,2)/Math.pow(n,2)+Math.pow(f.y,2)/Math.pow(e,2);y>1&&(n=Math.sqrt(y)*n,e=Math.sqrt(y)*e);var p=(Math.pow(n,2)*Math.pow(e,2)-Math.pow(n,2)*Math.pow(f.y,2)-Math.pow(e,2)*Math.pow(f.x,2))/(Math.pow(n,2)*Math.pow(f.y,2)+Math.pow(e,2)*Math.pow(f.x,2));p=p<0?0:p;var v=(h!==r?1:-1)*Math.sqrt(p),M=v*(n*f.y/e),L=v*(-e*f.x/n),w={x:Math.cos(o)*M-Math.sin(o)*L+(t.x+s.x)/2,y:Math.sin(o)*M+Math.cos(o)*L+(t.y+s.y)/2},A={x:(f.x-M)/n,y:(f.y-L)/e},d=x({x:1,y:0},A),P=x(A,{x:(-f.x-M)/n,y:(-f.y-L)/e});!r&&P>0?P-=2*Math.PI:r&&P<0&&(P+=2*Math.PI);var b=d+(P%=2*Math.PI)*a,T=n*Math.cos(b),m=e*Math.sin(b);return{x:Math.cos(o)*T-Math.sin(o)*m+w.x,y:Math.sin(o)*T+Math.cos(o)*m+w.y,ellipticalArcStartAngle:d,ellipticalArcEndAngle:d+P,ellipticalArcAngle:b,ellipticalArcCenter:w,resultantRx:n,resultantRy:e}},u=function(t,n){t=t||500;for(var e,i=0,h=[],r=[],s=n(0),a=0;a<t;a++){var o=y(a*(1/t),0,1);e=n(o),i+=f(s,e),r.push([s,e]),h.push({t:o,arcLength:i}),s=e}return e=n(1),r.push([s,e]),i+=f(s,e),h.push({t:1,arcLength:i}),{arcLength:i,arcLengthMap:h,approximationLines:r}},l=function(t,n){return(t%n+n)%n},c=function(t){return t*(Math.PI/180)},f=function(t,n){return Math.sqrt(Math.pow(n.x-t.x,2)+Math.pow(n.y-t.y,2))},y=function(t,n,e){return Math.min(Math.max(t,n),e)},x=function(t,n){var e=t.x*n.x+t.y*n.y,i=Math.sqrt((Math.pow(t.x,2)+Math.pow(t.y,2))*(Math.pow(n.x,2)+Math.pow(n.y,2)));return(t.x*n.y-t.y*n.x<0?-1:1)*Math.acos(e/i)},p=[[],[],[-.5773502691896257,.5773502691896257],[0,-.7745966692414834,.7745966692414834],[-.33998104358485626,.33998104358485626,-.8611363115940526,.8611363115940526],[0,-.5384693101056831,.5384693101056831,-.906179845938664,.906179845938664],[.6612093864662645,-.6612093864662645,-.2386191860831969,.2386191860831969,-.932469514203152,.932469514203152],[0,.4058451513773972,-.4058451513773972,-.7415311855993945,.7415311855993945,-.9491079123427585,.9491079123427585],[-.1834346424956498,.1834346424956498,-.525532409916329,.525532409916329,-.7966664774136267,.7966664774136267,-.9602898564975363,.9602898564975363],[0,-.8360311073266358,.8360311073266358,-.9681602395076261,.9681602395076261,-.3242534234038089,.3242534234038089,-.6133714327005904,.6133714327005904],[-.14887433898163122,.14887433898163122,-.4333953941292472,.4333953941292472,-.6794095682990244,.6794095682990244,-.8650633666889845,.8650633666889845,-.9739065285171717,.9739065285171717],[0,-.26954315595234496,.26954315595234496,-.5190961292068118,.5190961292068118,-.7301520055740494,.7301520055740494,-.8870625997680953,.8870625997680953,-.978228658146057,.978228658146057],[-.1252334085114689,.1252334085114689,-.3678314989981802,.3678314989981802,-.5873179542866175,.5873179542866175,-.7699026741943047,.7699026741943047,-.9041172563704749,.9041172563704749,-.9815606342467192,.9815606342467192],[0,-.2304583159551348,.2304583159551348,-.44849275103644687,.44849275103644687,-.6423493394403402,.6423493394403402,-.8015780907333099,.8015780907333099,-.9175983992229779,.9175983992229779,-.9841830547185881,.9841830547185881],[-.10805494870734367,.10805494870734367,-.31911236892788974,.31911236892788974,-.5152486363581541,.5152486363581541,-.6872929048116855,.6872929048116855,-.827201315069765,.827201315069765,-.9284348836635735,.9284348836635735,-.9862838086968123,.9862838086968123],[0,-.20119409399743451,.20119409399743451,-.3941513470775634,.3941513470775634,-.5709721726085388,.5709721726085388,-.7244177313601701,.7244177313601701,-.8482065834104272,.8482065834104272,-.937273392400706,.937273392400706,-.9879925180204854,.9879925180204854],[-.09501250983763744,.09501250983763744,-.2816035507792589,.2816035507792589,-.45801677765722737,.45801677765722737,-.6178762444026438,.6178762444026438,-.755404408355003,.755404408355003,-.8656312023878318,.8656312023878318,-.9445750230732326,.9445750230732326,-.9894009349916499,.9894009349916499],[0,-.17848418149584785,.17848418149584785,-.3512317634538763,.3512317634538763,-.5126905370864769,.5126905370864769,-.6576711592166907,.6576711592166907,-.7815140038968014,.7815140038968014,-.8802391537269859,.8802391537269859,-.9506755217687678,.9506755217687678,-.9905754753144174,.9905754753144174],[-.0847750130417353,.0847750130417353,-.2518862256915055,.2518862256915055,-.41175116146284263,.41175116146284263,-.5597708310739475,.5597708310739475,-.6916870430603532,.6916870430603532,-.8037049589725231,.8037049589725231,-.8926024664975557,.8926024664975557,-.9558239495713977,.9558239495713977,-.9915651684209309,.9915651684209309],[0,-.16035864564022537,.16035864564022537,-.31656409996362983,.31656409996362983,-.46457074137596094,.46457074137596094,-.600545304661681,.600545304661681,-.7209661773352294,.7209661773352294,-.8227146565371428,.8227146565371428,-.9031559036148179,.9031559036148179,-.96020815213483,.96020815213483,-.9924068438435844,.9924068438435844],[-.07652652113349734,.07652652113349734,-.22778585114164507,.22778585114164507,-.37370608871541955,.37370608871541955,-.5108670019508271,.5108670019508271,-.636053680726515,.636053680726515,-.7463319064601508,.7463319064601508,-.8391169718222188,.8391169718222188,-.912234428251326,.912234428251326,-.9639719272779138,.9639719272779138,-.9931285991850949,.9931285991850949],[0,-.1455618541608951,.1455618541608951,-.2880213168024011,.2880213168024011,-.4243421202074388,.4243421202074388,-.5516188358872198,.5516188358872198,-.6671388041974123,.6671388041974123,-.7684399634756779,.7684399634756779,-.8533633645833173,.8533633645833173,-.9200993341504008,.9200993341504008,-.9672268385663063,.9672268385663063,-.9937521706203895,.9937521706203895],[-.06973927331972223,.06973927331972223,-.20786042668822127,.20786042668822127,-.34193582089208424,.34193582089208424,-.469355837986757,.469355837986757,-.5876404035069116,.5876404035069116,-.6944872631866827,.6944872631866827,-.7878168059792081,.7878168059792081,-.8658125777203002,.8658125777203002,-.926956772187174,.926956772187174,-.9700604978354287,.9700604978354287,-.9942945854823992,.9942945854823992],[0,-.1332568242984661,.1332568242984661,-.26413568097034495,.26413568097034495,-.3903010380302908,.3903010380302908,-.5095014778460075,.5095014778460075,-.6196098757636461,.6196098757636461,-.7186613631319502,.7186613631319502,-.8048884016188399,.8048884016188399,-.8767523582704416,.8767523582704416,-.9329710868260161,.9329710868260161,-.9725424712181152,.9725424712181152,-.9947693349975522,.9947693349975522],[-.06405689286260563,.06405689286260563,-.1911188674736163,.1911188674736163,-.3150426796961634,.3150426796961634,-.4337935076260451,.4337935076260451,-.5454214713888396,.5454214713888396,-.6480936519369755,.6480936519369755,-.7401241915785544,.7401241915785544,-.820001985973903,.820001985973903,-.8864155270044011,.8864155270044011,-.9382745520027328,.9382745520027328,-.9747285559713095,.9747285559713095,-.9951872199970213,.9951872199970213]],v=[[],[],[1,1],[.8888888888888888,.5555555555555556,.5555555555555556],[.6521451548625461,.6521451548625461,.34785484513745385,.34785484513745385],[.5688888888888889,.47862867049936647,.47862867049936647,.23692688505618908,.23692688505618908],[.3607615730481386,.3607615730481386,.46791393457269104,.46791393457269104,.17132449237917036,.17132449237917036],[.4179591836734694,.3818300505051189,.3818300505051189,.27970539148927664,.27970539148927664,.1294849661688697,.1294849661688697],[.362683783378362,.362683783378362,.31370664587788727,.31370664587788727,.22238103445337448,.22238103445337448,.10122853629037626,.10122853629037626],[.3302393550012598,.1806481606948574,.1806481606948574,.08127438836157441,.08127438836157441,.31234707704000286,.31234707704000286,.26061069640293544,.26061069640293544],[.29552422471475287,.29552422471475287,.26926671930999635,.26926671930999635,.21908636251598204,.21908636251598204,.1494513491505806,.1494513491505806,.06667134430868814,.06667134430868814],[.2729250867779006,.26280454451024665,.26280454451024665,.23319376459199048,.23319376459199048,.18629021092773426,.18629021092773426,.1255803694649046,.1255803694649046,.05566856711617366,.05566856711617366],[.24914704581340277,.24914704581340277,.2334925365383548,.2334925365383548,.20316742672306592,.20316742672306592,.16007832854334622,.16007832854334622,.10693932599531843,.10693932599531843,.04717533638651183,.04717533638651183],[.2325515532308739,.22628318026289723,.22628318026289723,.2078160475368885,.2078160475368885,.17814598076194574,.17814598076194574,.13887351021978725,.13887351021978725,.09212149983772845,.09212149983772845,.04048400476531588,.04048400476531588],[.2152638534631578,.2152638534631578,.2051984637212956,.2051984637212956,.18553839747793782,.18553839747793782,.15720316715819355,.15720316715819355,.12151857068790319,.12151857068790319,.08015808715976021,.08015808715976021,.03511946033175186,.03511946033175186],[.2025782419255613,.19843148532711158,.19843148532711158,.1861610000155622,.1861610000155622,.16626920581699392,.16626920581699392,.13957067792615432,.13957067792615432,.10715922046717194,.10715922046717194,.07036604748810812,.07036604748810812,.03075324199611727,.03075324199611727],[.1894506104550685,.1894506104550685,.18260341504492358,.18260341504492358,.16915651939500254,.16915651939500254,.14959598881657674,.14959598881657674,.12462897125553388,.12462897125553388,.09515851168249279,.09515851168249279,.062253523938647894,.062253523938647894,.027152459411754096,.027152459411754096],[.17944647035620653,.17656270536699264,.17656270536699264,.16800410215645004,.16800410215645004,.15404576107681028,.15404576107681028,.13513636846852548,.13513636846852548,.11188384719340397,.11188384719340397,.08503614831717918,.08503614831717918,.0554595293739872,.0554595293739872,.02414830286854793,.02414830286854793],[.1691423829631436,.1691423829631436,.16427648374583273,.16427648374583273,.15468467512626524,.15468467512626524,.14064291467065065,.14064291467065065,.12255520671147846,.12255520671147846,.10094204410628717,.10094204410628717,.07642573025488905,.07642573025488905,.0497145488949698,.0497145488949698,.02161601352648331,.02161601352648331],[.1610544498487837,.15896884339395434,.15896884339395434,.15276604206585967,.15276604206585967,.1426067021736066,.1426067021736066,.12875396253933621,.12875396253933621,.11156664554733399,.11156664554733399,.09149002162245,.09149002162245,.06904454273764123,.06904454273764123,.0448142267656996,.0448142267656996,.019461788229726478,.019461788229726478],[.15275338713072584,.15275338713072584,.14917298647260374,.14917298647260374,.14209610931838204,.14209610931838204,.13168863844917664,.13168863844917664,.11819453196151841,.11819453196151841,.10193011981724044,.10193011981724044,.08327674157670475,.08327674157670475,.06267204833410907,.06267204833410907,.04060142980038694,.04060142980038694,.017614007139152118,.017614007139152118],[.14608113364969041,.14452440398997005,.14452440398997005,.13988739479107315,.13988739479107315,.13226893863333747,.13226893863333747,.12183141605372853,.12183141605372853,.10879729916714838,.10879729916714838,.09344442345603386,.09344442345603386,.0761001136283793,.0761001136283793,.057134425426857205,.057134425426857205,.036953789770852494,.036953789770852494,.016017228257774335,.016017228257774335],[.13925187285563198,.13925187285563198,.13654149834601517,.13654149834601517,.13117350478706238,.13117350478706238,.12325237681051242,.12325237681051242,.11293229608053922,.11293229608053922,.10041414444288096,.10041414444288096,.08594160621706773,.08594160621706773,.06979646842452049,.06979646842452049,.052293335152683286,.052293335152683286,.03377490158481415,.03377490158481415,.0146279952982722,.0146279952982722],[.13365457218610619,.1324620394046966,.1324620394046966,.12890572218808216,.12890572218808216,.12304908430672953,.12304908430672953,.11499664022241136,.11499664022241136,.10489209146454141,.10489209146454141,.09291576606003515,.09291576606003515,.07928141177671895,.07928141177671895,.06423242140852585,.06423242140852585,.04803767173108467,.04803767173108467,.030988005856979445,.030988005856979445,.013411859487141771,.013411859487141771],[.12793819534675216,.12793819534675216,.1258374563468283,.1258374563468283,.12167047292780339,.12167047292780339,.1155056680537256,.1155056680537256,.10744427011596563,.10744427011596563,.09761865210411388,.09761865210411388,.08619016153195327,.08619016153195327,.0733464814110803,.0733464814110803,.05929858491543678,.05929858491543678,.04427743881741981,.04427743881741981,.028531388628933663,.028531388628933663,.0123412297999872,.0123412297999872]],M=[[1],[1,1],[1,2,1],[1,3,3,1]],L=function(t,n,e){return{x:(1-e)*(1-e)*(1-e)*t[0]+3*(1-e)*(1-e)*e*t[1]+3*(1-e)*e*e*t[2]+e*e*e*t[3],y:(1-e)*(1-e)*(1-e)*n[0]+3*(1-e)*(1-e)*e*n[1]+3*(1-e)*e*e*n[2]+e*e*e*n[3]}},w=function(t,n,e){return d([3*(t[1]-t[0]),3*(t[2]-t[1]),3*(t[3]-t[2])],[3*(n[1]-n[0]),3*(n[2]-n[1]),3*(n[3]-n[2])],e)},A=function(t,n,e){var i,h,r;i=e/2,h=0;for(var s=0;s<20;s++)r=i*p[20][s]+i,h+=v[20][s]*T(t,n,r);return i*h},d=function(t,n,e){return{x:(1-e)*(1-e)*t[0]+2*(1-e)*e*t[1]+e*e*t[2],y:(1-e)*(1-e)*n[0]+2*(1-e)*e*n[1]+e*e*n[2]}},P=function(t,n,e){void 0===e&&(e=1);var i=t[0]-2*t[1]+t[2],h=n[0]-2*n[1]+n[2],r=2*t[1]-2*t[0],s=2*n[1]-2*n[0],a=4*(i*i+h*h),o=4*(i*r+h*s),g=r*r+s*s;if(0===a)return e*Math.sqrt(Math.pow(t[2]-t[0],2)+Math.pow(n[2]-n[0],2));var u=o/(2*a),l=e+u,c=g/a-u*u,f=l*l+c>0?Math.sqrt(l*l+c):0,y=u*u+c>0?Math.sqrt(u*u+c):0,x=u+Math.sqrt(u*u+c)!==0?c*Math.log(Math.abs((l+f)/(u+y))):0;return Math.sqrt(a)/2*(l*f-u*y+x)},b=function(t,n,e){return{x:2*(1-e)*(t[1]-t[0])+2*e*(t[2]-t[1]),y:2*(1-e)*(n[1]-n[0])+2*e*(n[2]-n[1])}};function T(t,n,e){var i=m(1,e,t),h=m(1,e,n),r=i*i+h*h;return Math.sqrt(r)}var m=function t(n,e,i){var h,r,s=i.length-1;if(0===s)return 0;if(0===n){r=0;for(var a=0;a<=s;a++)r+=M[s][a]*Math.pow(1-e,s-a)*Math.pow(e,a)*i[a];return r}h=new Array(s);for(var o=0;o<s;o++)h[o]=s*(i[o+1]-i[o]);return t(n-1,e,h)},q=function(t,n,e){for(var i=1,h=t/n,r=(t-e(h))/n,s=0;i>.001;){var a=e(h+r),o=Math.abs(t-a)/n;if(o<i)i=o,h+=r;else{var g=e(h-r),u=Math.abs(t-g)/n;u<i?(i=u,h-=r):r/=2}if(++s>500)break}return h},_=function(n,e,i,h,r,s,a,o){var g=this;t(this,"a",void 0),t(this,"b",void 0),t(this,"c",void 0),t(this,"d",void 0),t(this,"length",void 0),t(this,"getArcLength",void 0),t(this,"getPoint",void 0),t(this,"getDerivative",void 0),t(this,"getTotalLength",(function(){return g.length})),t(this,"getPointAtLength",(function(t){var n=[g.a.x,g.b.x,g.c.x,g.d.x],e=[g.a.y,g.b.y,g.c.y,g.d.y],i=q(t,g.length,(function(t){return g.getArcLength(n,e,t)}));return g.getPoint(n,e,i)})),t(this,"getTangentAtLength",(function(t){var n=[g.a.x,g.b.x,g.c.x,g.d.x],e=[g.a.y,g.b.y,g.c.y,g.d.y],i=q(t,g.length,(function(t){return g.getArcLength(n,e,t)})),h=g.getDerivative(n,e,i),r=Math.sqrt(h.x*h.x+h.y*h.y);return r>0?{x:h.x/r,y:h.y/r}:{x:0,y:0}})),t(this,"getPropertiesAtLength",(function(t){var n,e=[g.a.x,g.b.x,g.c.x,g.d.x],i=[g.a.y,g.b.y,g.c.y,g.d.y],h=q(t,g.length,(function(t){return g.getArcLength(e,i,t)})),r=g.getDerivative(e,i,h),s=Math.sqrt(r.x*r.x+r.y*r.y);n=s>0?{x:r.x/s,y:r.y/s}:{x:0,y:0};var a=g.getPoint(e,i,h);return{x:a.x,y:a.y,tangentX:n.x,tangentY:n.y}})),t(this,"getC",(function(){return g.c})),t(this,"getD",(function(){return g.d})),this.a={x:n,y:e},this.b={x:i,y:h},this.c={x:r,y:s},void 0!==a&&void 0!==o?(this.getArcLength=A,this.getPoint=L,this.getDerivative=w,this.d={x:a,y:o}):(this.getArcLength=P,this.getPoint=d,this.getDerivative=b,this.d={x:0,y:0}),this.length=this.getArcLength([this.a.x,this.b.x,this.c.x,this.d.x],[this.a.y,this.b.y,this.c.y,this.d.y],1)},S=function(e){var r=this;t(this,"length",0),t(this,"partial_lengths",[]),t(this,"functions",[]),t(this,"initial_point",null),t(this,"getPartAtLength",(function(t){t<0?t=0:t>r.length&&(t=r.length);for(var n=r.partial_lengths.length-1;r.partial_lengths[n]>=t&&n>0;)n--;return n++,{fraction:t-r.partial_lengths[n-1],i:n}})),t(this,"getTotalLength",(function(){return r.length})),t(this,"getPointAtLength",(function(t){var n=r.getPartAtLength(t),e=r.functions[n.i];if(e)return e.getPointAtLength(n.fraction);if(r.initial_point)return r.initial_point;throw new Error("Wrong function at this part.")})),t(this,"getTangentAtLength",(function(t){var n=r.getPartAtLength(t),e=r.functions[n.i];if(e)return e.getTangentAtLength(n.fraction);if(r.initial_point)return{x:0,y:0};throw new Error("Wrong function at this part.")})),t(this,"getPropertiesAtLength",(function(t){var n=r.getPartAtLength(t),e=r.functions[n.i];if(e)return e.getPropertiesAtLength(n.fraction);if(r.initial_point)return{x:r.initial_point.x,y:r.initial_point.y,tangentX:0,tangentY:0};throw new Error("Wrong function at this part.")})),t(this,"getParts",(function(){for(var t=[],n=0;n<r.functions.length;n++)if(null!==r.functions[n]){r.functions[n]=r.functions[n];var e={start:r.functions[n].getPointAtLength(0),end:r.functions[n].getPointAtLength(r.partial_lengths[n]-r.partial_lengths[n-1]),length:r.partial_lengths[n]-r.partial_lengths[n-1],getPointAtLength:r.functions[n].getPointAtLength,getTangentAtLength:r.functions[n].getTangentAtLength,getPropertiesAtLength:r.functions[n].getPropertiesAtLength};t.push(e)}return t}));for(var g,u=Array.isArray(e)?e:function(t){var e=(t&&t.length>0?t:"M0,0").match(h);if(!e)throw new Error("No path elements found in string ".concat(t));return e.reduce((function(t,e){var h=e.charAt(0),r=h.toLowerCase(),a=s(e.substr(1));for("m"===r&&a.length>2&&(t.push([h].concat(n(a.splice(0,2)))),r="l",h="m"===h?"l":"L");a.length>=0;){if(a.length===i[r]){t.push([h].concat(n(a.splice(0,i[r]))));break}if(a.length<i[r])throw new Error('Malformed path data: "'.concat(h,'" must have ').concat(i[r]," elements and has ").concat(a.length,": ").concat(e));t.push([h].concat(n(a.splice(0,i[r]))))}return t}),[])}(e),l=[0,0],c=[0,0],f=[0,0],y=0;y<u.length;y++){if("M"===u[y][0])f=[(l=[u[y][1],u[y][2]])[0],l[1]],this.functions.push(null),0===y&&(this.initial_point={x:u[y][1],y:u[y][2]});else if("m"===u[y][0])f=[(l=[u[y][1]+l[0],u[y][2]+l[1]])[0],l[1]],this.functions.push(null);else if("L"===u[y][0])this.length+=Math.sqrt(Math.pow(l[0]-u[y][1],2)+Math.pow(l[1]-u[y][2],2)),this.functions.push(new a(l[0],u[y][1],l[1],u[y][2])),l=[u[y][1],u[y][2]];else if("l"===u[y][0])this.length+=Math.sqrt(Math.pow(u[y][1],2)+Math.pow(u[y][2],2)),this.functions.push(new a(l[0],u[y][1]+l[0],l[1],u[y][2]+l[1])),l=[u[y][1]+l[0],u[y][2]+l[1]];else if("H"===u[y][0])this.length+=Math.abs(l[0]-u[y][1]),this.functions.push(new a(l[0],u[y][1],l[1],l[1])),l[0]=u[y][1];else if("h"===u[y][0])this.length+=Math.abs(u[y][1]),this.functions.push(new a(l[0],l[0]+u[y][1],l[1],l[1])),l[0]=u[y][1]+l[0];else if("V"===u[y][0])this.length+=Math.abs(l[1]-u[y][1]),this.functions.push(new a(l[0],l[0],l[1],u[y][1])),l[1]=u[y][1];else if("v"===u[y][0])this.length+=Math.abs(u[y][1]),this.functions.push(new a(l[0],l[0],l[1],l[1]+u[y][1])),l[1]=u[y][1]+l[1];else if("z"===u[y][0]||"Z"===u[y][0])this.length+=Math.sqrt(Math.pow(f[0]-l[0],2)+Math.pow(f[1]-l[1],2)),this.functions.push(new a(l[0],f[0],l[1],f[1])),l=[f[0],f[1]];else if("C"===u[y][0])g=new _(l[0],l[1],u[y][1],u[y][2],u[y][3],u[y][4],u[y][5],u[y][6]),this.length+=g.getTotalLength(),l=[u[y][5],u[y][6]],this.functions.push(g);else if("c"===u[y][0])(g=new _(l[0],l[1],l[0]+u[y][1],l[1]+u[y][2],l[0]+u[y][3],l[1]+u[y][4],l[0]+u[y][5],l[1]+u[y][6])).getTotalLength()>0?(this.length+=g.getTotalLength(),this.functions.push(g),l=[u[y][5]+l[0],u[y][6]+l[1]]):this.functions.push(new a(l[0],l[0],l[1],l[1]));else if("S"===u[y][0]){if(y>0&&["C","c","S","s"].indexOf(u[y-1][0])>-1){if(g){var x=g.getC();g=new _(l[0],l[1],2*l[0]-x.x,2*l[1]-x.y,u[y][1],u[y][2],u[y][3],u[y][4])}}else g=new _(l[0],l[1],l[0],l[1],u[y][1],u[y][2],u[y][3],u[y][4]);g&&(this.length+=g.getTotalLength(),l=[u[y][3],u[y][4]],this.functions.push(g))}else if("s"===u[y][0]){if(y>0&&["C","c","S","s"].indexOf(u[y-1][0])>-1){if(g){var p=g.getC(),v=g.getD();g=new _(l[0],l[1],l[0]+v.x-p.x,l[1]+v.y-p.y,l[0]+u[y][1],l[1]+u[y][2],l[0]+u[y][3],l[1]+u[y][4])}}else g=new _(l[0],l[1],l[0],l[1],l[0]+u[y][1],l[1]+u[y][2],l[0]+u[y][3],l[1]+u[y][4]);g&&(this.length+=g.getTotalLength(),l=[u[y][3]+l[0],u[y][4]+l[1]],this.functions.push(g))}else if("Q"===u[y][0]){if(l[0]==u[y][1]&&l[1]==u[y][2]){var M=new a(u[y][1],u[y][3],u[y][2],u[y][4]);this.length+=M.getTotalLength(),this.functions.push(M)}else g=new _(l[0],l[1],u[y][1],u[y][2],u[y][3],u[y][4],void 0,void 0),this.length+=g.getTotalLength(),this.functions.push(g);l=[u[y][3],u[y][4]],c=[u[y][1],u[y][2]]}else if("q"===u[y][0]){if(0!=u[y][1]||0!=u[y][2])g=new _(l[0],l[1],l[0]+u[y][1],l[1]+u[y][2],l[0]+u[y][3],l[1]+u[y][4],void 0,void 0),this.length+=g.getTotalLength(),this.functions.push(g);else{var L=new a(l[0]+u[y][1],l[0]+u[y][3],l[1]+u[y][2],l[1]+u[y][4]);this.length+=L.getTotalLength(),this.functions.push(L)}c=[l[0]+u[y][1],l[1]+u[y][2]],l=[u[y][3]+l[0],u[y][4]+l[1]]}else if("T"===u[y][0]){if(y>0&&["Q","q","T","t"].indexOf(u[y-1][0])>-1)g=new _(l[0],l[1],2*l[0]-c[0],2*l[1]-c[1],u[y][1],u[y][2],void 0,void 0),this.functions.push(g),this.length+=g.getTotalLength();else{var w=new a(l[0],u[y][1],l[1],u[y][2]);this.functions.push(w),this.length+=w.getTotalLength()}c=[2*l[0]-c[0],2*l[1]-c[1]],l=[u[y][1],u[y][2]]}else if("t"===u[y][0]){if(y>0&&["Q","q","T","t"].indexOf(u[y-1][0])>-1)g=new _(l[0],l[1],2*l[0]-c[0],2*l[1]-c[1],l[0]+u[y][1],l[1]+u[y][2],void 0,void 0),this.length+=g.getTotalLength(),this.functions.push(g);else{var A=new a(l[0],l[0]+u[y][1],l[1],l[1]+u[y][2]);this.length+=A.getTotalLength(),this.functions.push(A)}c=[2*l[0]-c[0],2*l[1]-c[1]],l=[u[y][1]+l[0],u[y][2]+l[1]]}else if("A"===u[y][0]){var d=new o(l[0],l[1],u[y][1],u[y][2],u[y][3],1===u[y][4],1===u[y][5],u[y][6],u[y][7]);this.length+=d.getTotalLength(),l=[u[y][6],u[y][7]],this.functions.push(d)}else if("a"===u[y][0]){var P=new o(l[0],l[1],u[y][1],u[y][2],u[y][3],1===u[y][4],1===u[y][5],l[0]+u[y][6],l[1]+u[y][7]);this.length+=P.getTotalLength(),l=[l[0]+u[y][6],l[1]+u[y][7]],this.functions.push(P)}this.partial_lengths.push(this.length)}},C=function(n){var e=this;if(t(this,"inst",void 0),t(this,"getTotalLength",(function(){return e.inst.getTotalLength()})),t(this,"getPointAtLength",(function(t){return e.inst.getPointAtLength(t)})),t(this,"getTangentAtLength",(function(t){return e.inst.getTangentAtLength(t)})),t(this,"getPropertiesAtLength",(function(t){return e.inst.getPropertiesAtLength(t)})),t(this,"getParts",(function(){return e.inst.getParts()})),this.inst=new S(n),!(this instanceof C))return new C(n)};exports.svgPathProperties=C;

},{}],3:[function(require,module,exports){
!function(t,r){"object"==typeof exports&&"undefined"!=typeof module?r(exports):"function"==typeof define&&define.amd?define(["exports"],r):r((t="undefined"!=typeof globalThis?globalThis:t||self).svgpathdata={})}(this,(function(t){"use strict";
/*! *****************************************************************************
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
    ***************************************************************************** */var r=function(t,e){return(r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,r){t.__proto__=r}||function(t,r){for(var e in r)Object.prototype.hasOwnProperty.call(r,e)&&(t[e]=r[e])})(t,e)};function e(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Class extends value "+String(e)+" is not a constructor or null");function a(){this.constructor=t}r(t,e),t.prototype=null===e?Object.create(e):(a.prototype=e.prototype,new a)}var a=" ";function i(t){var r="";Array.isArray(t)||(t=[t]);for(var e=0;e<t.length;e++){var i=t[e];if(i.type===N.CLOSE_PATH)r+="z";else if(i.type===N.HORIZ_LINE_TO)r+=(i.relative?"h":"H")+i.x;else if(i.type===N.VERT_LINE_TO)r+=(i.relative?"v":"V")+i.y;else if(i.type===N.MOVE_TO)r+=(i.relative?"m":"M")+i.x+a+i.y;else if(i.type===N.LINE_TO)r+=(i.relative?"l":"L")+i.x+a+i.y;else if(i.type===N.CURVE_TO)r+=(i.relative?"c":"C")+i.x1+a+i.y1+a+i.x2+a+i.y2+a+i.x+a+i.y;else if(i.type===N.SMOOTH_CURVE_TO)r+=(i.relative?"s":"S")+i.x2+a+i.y2+a+i.x+a+i.y;else if(i.type===N.QUAD_TO)r+=(i.relative?"q":"Q")+i.x1+a+i.y1+a+i.x+a+i.y;else if(i.type===N.SMOOTH_QUAD_TO)r+=(i.relative?"t":"T")+i.x+a+i.y;else{if(i.type!==N.ARC)throw new Error('Unexpected command type "'+i.type+'" at index '+e+".");r+=(i.relative?"a":"A")+i.rX+a+i.rY+a+i.xRot+a+ +i.lArcFlag+a+ +i.sweepFlag+a+i.x+a+i.y}}return r}function n(t,r){var e=t[0],a=t[1];return[e*Math.cos(r)-a*Math.sin(r),e*Math.sin(r)+a*Math.cos(r)]}function o(){for(var t=[],r=0;r<arguments.length;r++)t[r]=arguments[r];for(var e=0;e<t.length;e++)if("number"!=typeof t[e])throw new Error("assertNumbers arguments["+e+"] is not a number. "+typeof t[e]+" == typeof "+t[e]);return!0}var s=Math.PI;function u(t,r,e){t.lArcFlag=0===t.lArcFlag?0:1,t.sweepFlag=0===t.sweepFlag?0:1;var a=t.rX,i=t.rY,o=t.x,u=t.y;a=Math.abs(t.rX),i=Math.abs(t.rY);var h=n([(r-o)/2,(e-u)/2],-t.xRot/180*s),c=h[0],m=h[1],y=Math.pow(c,2)/Math.pow(a,2)+Math.pow(m,2)/Math.pow(i,2);1<y&&(a*=Math.sqrt(y),i*=Math.sqrt(y)),t.rX=a,t.rY=i;var p=Math.pow(a,2)*Math.pow(m,2)+Math.pow(i,2)*Math.pow(c,2),f=(t.lArcFlag!==t.sweepFlag?1:-1)*Math.sqrt(Math.max(0,(Math.pow(a,2)*Math.pow(i,2)-p)/p)),T=a*m/i*f,O=-i*c/a*f,l=n([T,O],t.xRot/180*s);t.cX=l[0]+(r+o)/2,t.cY=l[1]+(e+u)/2,t.phi1=Math.atan2((m-O)/i,(c-T)/a),t.phi2=Math.atan2((-m-O)/i,(-c-T)/a),0===t.sweepFlag&&t.phi2>t.phi1&&(t.phi2-=2*s),1===t.sweepFlag&&t.phi2<t.phi1&&(t.phi2+=2*s),t.phi1*=180/s,t.phi2*=180/s}function h(t,r,e){o(t,r,e);var a=t*t+r*r-e*e;if(0>a)return[];if(0===a)return[[t*e/(t*t+r*r),r*e/(t*t+r*r)]];var i=Math.sqrt(a);return[[(t*e+r*i)/(t*t+r*r),(r*e-t*i)/(t*t+r*r)],[(t*e-r*i)/(t*t+r*r),(r*e+t*i)/(t*t+r*r)]]}var c=Math.PI/180;function m(t,r,e){return(1-e)*t+e*r}function y(t,r,e,a){return t+Math.cos(a/180*s)*r+Math.sin(a/180*s)*e}function p(t,r,e,a){var i=1e-6,n=r-t,o=e-r,s=3*n+3*(a-e)-6*o,u=6*(o-n),h=3*n;return Math.abs(s)<i?[-h/u]:function(t,r,e){void 0===e&&(e=1e-6);var a=t*t/4-r;if(a<-e)return[];if(a<=e)return[-t/2];var i=Math.sqrt(a);return[-t/2-i,-t/2+i]}(u/s,h/s,i)}function f(t,r,e,a,i){var n=1-i;return t*(n*n*n)+r*(3*n*n*i)+e*(3*n*i*i)+a*(i*i*i)}t.SVGPathDataTransformer=void 0,function(t){function r(){return i((function(t,r,e){return t.relative&&(void 0!==t.x1&&(t.x1+=r),void 0!==t.y1&&(t.y1+=e),void 0!==t.x2&&(t.x2+=r),void 0!==t.y2&&(t.y2+=e),void 0!==t.x&&(t.x+=r),void 0!==t.y&&(t.y+=e),t.relative=!1),t}))}function e(){var t=NaN,r=NaN,e=NaN,a=NaN;return i((function(i,n,o){return i.type&N.SMOOTH_CURVE_TO&&(i.type=N.CURVE_TO,t=isNaN(t)?n:t,r=isNaN(r)?o:r,i.x1=i.relative?n-t:2*n-t,i.y1=i.relative?o-r:2*o-r),i.type&N.CURVE_TO?(t=i.relative?n+i.x2:i.x2,r=i.relative?o+i.y2:i.y2):(t=NaN,r=NaN),i.type&N.SMOOTH_QUAD_TO&&(i.type=N.QUAD_TO,e=isNaN(e)?n:e,a=isNaN(a)?o:a,i.x1=i.relative?n-e:2*n-e,i.y1=i.relative?o-a:2*o-a),i.type&N.QUAD_TO?(e=i.relative?n+i.x1:i.x1,a=i.relative?o+i.y1:i.y1):(e=NaN,a=NaN),i}))}function a(){var t=NaN,r=NaN;return i((function(e,a,i){if(e.type&N.SMOOTH_QUAD_TO&&(e.type=N.QUAD_TO,t=isNaN(t)?a:t,r=isNaN(r)?i:r,e.x1=e.relative?a-t:2*a-t,e.y1=e.relative?i-r:2*i-r),e.type&N.QUAD_TO){t=e.relative?a+e.x1:e.x1,r=e.relative?i+e.y1:e.y1;var n=e.x1,o=e.y1;e.type=N.CURVE_TO,e.x1=((e.relative?0:a)+2*n)/3,e.y1=((e.relative?0:i)+2*o)/3,e.x2=(e.x+2*n)/3,e.y2=(e.y+2*o)/3}else t=NaN,r=NaN;return e}))}function i(t){var r=0,e=0,a=NaN,i=NaN;return function(n){if(isNaN(a)&&!(n.type&N.MOVE_TO))throw new Error("path must start with moveto");var o=t(n,r,e,a,i);return n.type&N.CLOSE_PATH&&(r=a,e=i),void 0!==n.x&&(r=n.relative?r+n.x:n.x),void 0!==n.y&&(e=n.relative?e+n.y:n.y),n.type&N.MOVE_TO&&(a=r,i=e),o}}function s(t,r,e,a,n,s){return o(t,r,e,a,n,s),i((function(i,o,u,h){var c=i.x1,m=i.x2,y=i.relative&&!isNaN(h),p=void 0!==i.x?i.x:y?0:o,f=void 0!==i.y?i.y:y?0:u;function T(t){return t*t}i.type&N.HORIZ_LINE_TO&&0!==r&&(i.type=N.LINE_TO,i.y=i.relative?0:u),i.type&N.VERT_LINE_TO&&0!==e&&(i.type=N.LINE_TO,i.x=i.relative?0:o),void 0!==i.x&&(i.x=i.x*t+f*e+(y?0:n)),void 0!==i.y&&(i.y=p*r+i.y*a+(y?0:s)),void 0!==i.x1&&(i.x1=i.x1*t+i.y1*e+(y?0:n)),void 0!==i.y1&&(i.y1=c*r+i.y1*a+(y?0:s)),void 0!==i.x2&&(i.x2=i.x2*t+i.y2*e+(y?0:n)),void 0!==i.y2&&(i.y2=m*r+i.y2*a+(y?0:s));var O=t*a-r*e;if(void 0!==i.xRot&&(1!==t||0!==r||0!==e||1!==a))if(0===O)delete i.rX,delete i.rY,delete i.xRot,delete i.lArcFlag,delete i.sweepFlag,i.type=N.LINE_TO;else{var l=i.xRot*Math.PI/180,v=Math.sin(l),_=Math.cos(l),d=1/T(i.rX),x=1/T(i.rY),A=T(_)*d+T(v)*x,E=2*v*_*(d-x),C=T(v)*d+T(_)*x,M=A*a*a-E*r*a+C*r*r,R=E*(t*a+r*e)-2*(A*e*a+C*t*r),S=A*e*e-E*t*e+C*t*t,g=(Math.atan2(R,M-S)+Math.PI)%Math.PI/2,I=Math.sin(g),V=Math.cos(g);i.rX=Math.abs(O)/Math.sqrt(M*T(V)+R*I*V+S*T(I)),i.rY=Math.abs(O)/Math.sqrt(M*T(I)-R*I*V+S*T(V)),i.xRot=180*g/Math.PI}return void 0!==i.sweepFlag&&0>O&&(i.sweepFlag=+!i.sweepFlag),i}))}function T(){return function(t){var r={};for(var e in t)r[e]=t[e];return r}}t.ROUND=function(t){function r(r){return Math.round(r*t)/t}return void 0===t&&(t=1e13),o(t),function(t){return void 0!==t.x1&&(t.x1=r(t.x1)),void 0!==t.y1&&(t.y1=r(t.y1)),void 0!==t.x2&&(t.x2=r(t.x2)),void 0!==t.y2&&(t.y2=r(t.y2)),void 0!==t.x&&(t.x=r(t.x)),void 0!==t.y&&(t.y=r(t.y)),void 0!==t.rX&&(t.rX=r(t.rX)),void 0!==t.rY&&(t.rY=r(t.rY)),t}},t.TO_ABS=r,t.TO_REL=function(){return i((function(t,r,e){return t.relative||(void 0!==t.x1&&(t.x1-=r),void 0!==t.y1&&(t.y1-=e),void 0!==t.x2&&(t.x2-=r),void 0!==t.y2&&(t.y2-=e),void 0!==t.x&&(t.x-=r),void 0!==t.y&&(t.y-=e),t.relative=!0),t}))},t.NORMALIZE_HVZ=function(t,r,e){return void 0===t&&(t=!0),void 0===r&&(r=!0),void 0===e&&(e=!0),i((function(a,i,n,o,s){if(isNaN(o)&&!(a.type&N.MOVE_TO))throw new Error("path must start with moveto");return r&&a.type&N.HORIZ_LINE_TO&&(a.type=N.LINE_TO,a.y=a.relative?0:n),e&&a.type&N.VERT_LINE_TO&&(a.type=N.LINE_TO,a.x=a.relative?0:i),t&&a.type&N.CLOSE_PATH&&(a.type=N.LINE_TO,a.x=a.relative?o-i:o,a.y=a.relative?s-n:s),a.type&N.ARC&&(0===a.rX||0===a.rY)&&(a.type=N.LINE_TO,delete a.rX,delete a.rY,delete a.xRot,delete a.lArcFlag,delete a.sweepFlag),a}))},t.NORMALIZE_ST=e,t.QT_TO_C=a,t.INFO=i,t.SANITIZE=function(t){void 0===t&&(t=0),o(t);var r=NaN,e=NaN,a=NaN,n=NaN;return i((function(i,o,s,u,h){var c=Math.abs,m=!1,y=0,p=0;if(i.type&N.SMOOTH_CURVE_TO&&(y=isNaN(r)?0:o-r,p=isNaN(e)?0:s-e),i.type&(N.CURVE_TO|N.SMOOTH_CURVE_TO)?(r=i.relative?o+i.x2:i.x2,e=i.relative?s+i.y2:i.y2):(r=NaN,e=NaN),i.type&N.SMOOTH_QUAD_TO?(a=isNaN(a)?o:2*o-a,n=isNaN(n)?s:2*s-n):i.type&N.QUAD_TO?(a=i.relative?o+i.x1:i.x1,n=i.relative?s+i.y1:i.y2):(a=NaN,n=NaN),i.type&N.LINE_COMMANDS||i.type&N.ARC&&(0===i.rX||0===i.rY||!i.lArcFlag)||i.type&N.CURVE_TO||i.type&N.SMOOTH_CURVE_TO||i.type&N.QUAD_TO||i.type&N.SMOOTH_QUAD_TO){var f=void 0===i.x?0:i.relative?i.x:i.x-o,T=void 0===i.y?0:i.relative?i.y:i.y-s;y=isNaN(a)?void 0===i.x1?y:i.relative?i.x:i.x1-o:a-o,p=isNaN(n)?void 0===i.y1?p:i.relative?i.y:i.y1-s:n-s;var O=void 0===i.x2?0:i.relative?i.x:i.x2-o,l=void 0===i.y2?0:i.relative?i.y:i.y2-s;c(f)<=t&&c(T)<=t&&c(y)<=t&&c(p)<=t&&c(O)<=t&&c(l)<=t&&(m=!0)}return i.type&N.CLOSE_PATH&&c(o-u)<=t&&c(s-h)<=t&&(m=!0),m?[]:i}))},t.MATRIX=s,t.ROTATE=function(t,r,e){void 0===r&&(r=0),void 0===e&&(e=0),o(t,r,e);var a=Math.sin(t),i=Math.cos(t);return s(i,a,-a,i,r-r*i+e*a,e-r*a-e*i)},t.TRANSLATE=function(t,r){return void 0===r&&(r=0),o(t,r),s(1,0,0,1,t,r)},t.SCALE=function(t,r){return void 0===r&&(r=t),o(t,r),s(t,0,0,r,0,0)},t.SKEW_X=function(t){return o(t),s(1,0,Math.atan(t),1,0,0)},t.SKEW_Y=function(t){return o(t),s(1,Math.atan(t),0,1,0,0)},t.X_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),o(t),s(-1,0,0,1,t,0)},t.Y_AXIS_SYMMETRY=function(t){return void 0===t&&(t=0),o(t),s(1,0,0,-1,0,t)},t.A_TO_C=function(){return i((function(t,r,e){return N.ARC===t.type?function(t,r,e){var a,i,o,s;t.cX||u(t,r,e);for(var h=Math.min(t.phi1,t.phi2),y=Math.max(t.phi1,t.phi2)-h,p=Math.ceil(y/90),f=new Array(p),T=r,O=e,l=0;l<p;l++){var v=m(t.phi1,t.phi2,l/p),_=m(t.phi1,t.phi2,(l+1)/p),d=_-v,x=4/3*Math.tan(d*c/4),A=[Math.cos(v*c)-x*Math.sin(v*c),Math.sin(v*c)+x*Math.cos(v*c)],E=A[0],C=A[1],M=[Math.cos(_*c),Math.sin(_*c)],R=M[0],S=M[1],g=[R+x*Math.sin(_*c),S-x*Math.cos(_*c)],I=g[0],V=g[1];f[l]={relative:t.relative,type:N.CURVE_TO};var D=function(r,e){var a=n([r*t.rX,e*t.rY],t.xRot),i=a[0],o=a[1];return[t.cX+i,t.cY+o]};a=D(E,C),f[l].x1=a[0],f[l].y1=a[1],i=D(I,V),f[l].x2=i[0],f[l].y2=i[1],o=D(R,S),f[l].x=o[0],f[l].y=o[1],t.relative&&(f[l].x1-=T,f[l].y1-=O,f[l].x2-=T,f[l].y2-=O,f[l].x-=T,f[l].y-=O),T=(s=[f[l].x,f[l].y])[0],O=s[1]}return f}(t,t.relative?0:r,t.relative?0:e):t}))},t.ANNOTATE_ARCS=function(){return i((function(t,r,e){return t.relative&&(r=0,e=0),N.ARC===t.type&&u(t,r,e),t}))},t.CLONE=T,t.CALCULATE_BOUNDS=function(){var t=function(t){var r={};for(var e in t)r[e]=t[e];return r},n=r(),o=a(),s=e(),c=i((function(r,e,a){var i=s(o(n(t(r))));function m(t){t>c.maxX&&(c.maxX=t),t<c.minX&&(c.minX=t)}function T(t){t>c.maxY&&(c.maxY=t),t<c.minY&&(c.minY=t)}if(i.type&N.DRAWING_COMMANDS&&(m(e),T(a)),i.type&N.HORIZ_LINE_TO&&m(i.x),i.type&N.VERT_LINE_TO&&T(i.y),i.type&N.LINE_TO&&(m(i.x),T(i.y)),i.type&N.CURVE_TO){m(i.x),T(i.y);for(var O=0,l=p(e,i.x1,i.x2,i.x);O<l.length;O++){0<(H=l[O])&&1>H&&m(f(e,i.x1,i.x2,i.x,H))}for(var v=0,_=p(a,i.y1,i.y2,i.y);v<_.length;v++){0<(H=_[v])&&1>H&&T(f(a,i.y1,i.y2,i.y,H))}}if(i.type&N.ARC){m(i.x),T(i.y),u(i,e,a);for(var d=i.xRot/180*Math.PI,x=Math.cos(d)*i.rX,A=Math.sin(d)*i.rX,E=-Math.sin(d)*i.rY,C=Math.cos(d)*i.rY,M=i.phi1<i.phi2?[i.phi1,i.phi2]:-180>i.phi2?[i.phi2+360,i.phi1+360]:[i.phi2,i.phi1],R=M[0],S=M[1],g=function(t){var r=t[0],e=t[1],a=180*Math.atan2(e,r)/Math.PI;return a<R?a+360:a},I=0,V=h(E,-x,0).map(g);I<V.length;I++){(H=V[I])>R&&H<S&&m(y(i.cX,x,E,H))}for(var D=0,L=h(C,-A,0).map(g);D<L.length;D++){var H;(H=L[D])>R&&H<S&&T(y(i.cY,A,C,H))}}return r}));return c.minX=1/0,c.maxX=-1/0,c.minY=1/0,c.maxY=-1/0,c}}(t.SVGPathDataTransformer||(t.SVGPathDataTransformer={}));var T,O=function(){function r(){}return r.prototype.round=function(r){return this.transform(t.SVGPathDataTransformer.ROUND(r))},r.prototype.toAbs=function(){return this.transform(t.SVGPathDataTransformer.TO_ABS())},r.prototype.toRel=function(){return this.transform(t.SVGPathDataTransformer.TO_REL())},r.prototype.normalizeHVZ=function(r,e,a){return this.transform(t.SVGPathDataTransformer.NORMALIZE_HVZ(r,e,a))},r.prototype.normalizeST=function(){return this.transform(t.SVGPathDataTransformer.NORMALIZE_ST())},r.prototype.qtToC=function(){return this.transform(t.SVGPathDataTransformer.QT_TO_C())},r.prototype.aToC=function(){return this.transform(t.SVGPathDataTransformer.A_TO_C())},r.prototype.sanitize=function(r){return this.transform(t.SVGPathDataTransformer.SANITIZE(r))},r.prototype.translate=function(r,e){return this.transform(t.SVGPathDataTransformer.TRANSLATE(r,e))},r.prototype.scale=function(r,e){return this.transform(t.SVGPathDataTransformer.SCALE(r,e))},r.prototype.rotate=function(r,e,a){return this.transform(t.SVGPathDataTransformer.ROTATE(r,e,a))},r.prototype.matrix=function(r,e,a,i,n,o){return this.transform(t.SVGPathDataTransformer.MATRIX(r,e,a,i,n,o))},r.prototype.skewX=function(r){return this.transform(t.SVGPathDataTransformer.SKEW_X(r))},r.prototype.skewY=function(r){return this.transform(t.SVGPathDataTransformer.SKEW_Y(r))},r.prototype.xSymmetry=function(r){return this.transform(t.SVGPathDataTransformer.X_AXIS_SYMMETRY(r))},r.prototype.ySymmetry=function(r){return this.transform(t.SVGPathDataTransformer.Y_AXIS_SYMMETRY(r))},r.prototype.annotateArcs=function(){return this.transform(t.SVGPathDataTransformer.ANNOTATE_ARCS())},r}(),l=function(t){return" "===t||"\t"===t||"\r"===t||"\n"===t},v=function(t){return"0".charCodeAt(0)<=t.charCodeAt(0)&&t.charCodeAt(0)<="9".charCodeAt(0)},_=function(t){function r(){var r=t.call(this)||this;return r.curNumber="",r.curCommandType=-1,r.curCommandRelative=!1,r.canParseCommandOrComma=!0,r.curNumberHasExp=!1,r.curNumberHasExpDigits=!1,r.curNumberHasDecimal=!1,r.curArgs=[],r}return e(r,t),r.prototype.finish=function(t){if(void 0===t&&(t=[]),this.parse(" ",t),0!==this.curArgs.length||!this.canParseCommandOrComma)throw new SyntaxError("Unterminated command at the path end.");return t},r.prototype.parse=function(t,r){var e=this;void 0===r&&(r=[]);for(var a=function(t){r.push(t),e.curArgs.length=0,e.canParseCommandOrComma=!0},i=0;i<t.length;i++){var n=t[i],o=!(this.curCommandType!==N.ARC||3!==this.curArgs.length&&4!==this.curArgs.length||1!==this.curNumber.length||"0"!==this.curNumber&&"1"!==this.curNumber),s=v(n)&&("0"===this.curNumber&&"0"===n||o);if(!v(n)||s)if("e"!==n&&"E"!==n)if("-"!==n&&"+"!==n||!this.curNumberHasExp||this.curNumberHasExpDigits)if("."!==n||this.curNumberHasExp||this.curNumberHasDecimal||o){if(this.curNumber&&-1!==this.curCommandType){var u=Number(this.curNumber);if(isNaN(u))throw new SyntaxError("Invalid number ending at "+i);if(this.curCommandType===N.ARC)if(0===this.curArgs.length||1===this.curArgs.length){if(0>u)throw new SyntaxError('Expected positive number, got "'+u+'" at index "'+i+'"')}else if((3===this.curArgs.length||4===this.curArgs.length)&&"0"!==this.curNumber&&"1"!==this.curNumber)throw new SyntaxError('Expected a flag, got "'+this.curNumber+'" at index "'+i+'"');this.curArgs.push(u),this.curArgs.length===d[this.curCommandType]&&(N.HORIZ_LINE_TO===this.curCommandType?a({type:N.HORIZ_LINE_TO,relative:this.curCommandRelative,x:u}):N.VERT_LINE_TO===this.curCommandType?a({type:N.VERT_LINE_TO,relative:this.curCommandRelative,y:u}):this.curCommandType===N.MOVE_TO||this.curCommandType===N.LINE_TO||this.curCommandType===N.SMOOTH_QUAD_TO?(a({type:this.curCommandType,relative:this.curCommandRelative,x:this.curArgs[0],y:this.curArgs[1]}),N.MOVE_TO===this.curCommandType&&(this.curCommandType=N.LINE_TO)):this.curCommandType===N.CURVE_TO?a({type:N.CURVE_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x2:this.curArgs[2],y2:this.curArgs[3],x:this.curArgs[4],y:this.curArgs[5]}):this.curCommandType===N.SMOOTH_CURVE_TO?a({type:N.SMOOTH_CURVE_TO,relative:this.curCommandRelative,x2:this.curArgs[0],y2:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===N.QUAD_TO?a({type:N.QUAD_TO,relative:this.curCommandRelative,x1:this.curArgs[0],y1:this.curArgs[1],x:this.curArgs[2],y:this.curArgs[3]}):this.curCommandType===N.ARC&&a({type:N.ARC,relative:this.curCommandRelative,rX:this.curArgs[0],rY:this.curArgs[1],xRot:this.curArgs[2],lArcFlag:this.curArgs[3],sweepFlag:this.curArgs[4],x:this.curArgs[5],y:this.curArgs[6]})),this.curNumber="",this.curNumberHasExpDigits=!1,this.curNumberHasExp=!1,this.curNumberHasDecimal=!1,this.canParseCommandOrComma=!0}if(!l(n))if(","===n&&this.canParseCommandOrComma)this.canParseCommandOrComma=!1;else if("+"!==n&&"-"!==n&&"."!==n)if(s)this.curNumber=n,this.curNumberHasDecimal=!1;else{if(0!==this.curArgs.length)throw new SyntaxError("Unterminated command at index "+i+".");if(!this.canParseCommandOrComma)throw new SyntaxError('Unexpected character "'+n+'" at index '+i+". Command cannot follow comma");if(this.canParseCommandOrComma=!1,"z"!==n&&"Z"!==n)if("h"===n||"H"===n)this.curCommandType=N.HORIZ_LINE_TO,this.curCommandRelative="h"===n;else if("v"===n||"V"===n)this.curCommandType=N.VERT_LINE_TO,this.curCommandRelative="v"===n;else if("m"===n||"M"===n)this.curCommandType=N.MOVE_TO,this.curCommandRelative="m"===n;else if("l"===n||"L"===n)this.curCommandType=N.LINE_TO,this.curCommandRelative="l"===n;else if("c"===n||"C"===n)this.curCommandType=N.CURVE_TO,this.curCommandRelative="c"===n;else if("s"===n||"S"===n)this.curCommandType=N.SMOOTH_CURVE_TO,this.curCommandRelative="s"===n;else if("q"===n||"Q"===n)this.curCommandType=N.QUAD_TO,this.curCommandRelative="q"===n;else if("t"===n||"T"===n)this.curCommandType=N.SMOOTH_QUAD_TO,this.curCommandRelative="t"===n;else{if("a"!==n&&"A"!==n)throw new SyntaxError('Unexpected character "'+n+'" at index '+i+".");this.curCommandType=N.ARC,this.curCommandRelative="a"===n}else r.push({type:N.CLOSE_PATH}),this.canParseCommandOrComma=!0,this.curCommandType=-1}else this.curNumber=n,this.curNumberHasDecimal="."===n}else this.curNumber+=n,this.curNumberHasDecimal=!0;else this.curNumber+=n;else this.curNumber+=n,this.curNumberHasExp=!0;else this.curNumber+=n,this.curNumberHasExpDigits=this.curNumberHasExp}return r},r.prototype.transform=function(t){return Object.create(this,{parse:{value:function(r,e){void 0===e&&(e=[]);for(var a=0,i=Object.getPrototypeOf(this).parse.call(this,r);a<i.length;a++){var n=i[a],o=t(n);Array.isArray(o)?e.push.apply(e,o):e.push(o)}return e}}})},r}(O),N=function(r){function a(t){var e=r.call(this)||this;return e.commands="string"==typeof t?a.parse(t):t,e}return e(a,r),a.prototype.encode=function(){return a.encode(this.commands)},a.prototype.getBounds=function(){var r=t.SVGPathDataTransformer.CALCULATE_BOUNDS();return this.transform(r),r},a.prototype.transform=function(t){for(var r=[],e=0,a=this.commands;e<a.length;e++){var i=t(a[e]);Array.isArray(i)?r.push.apply(r,i):r.push(i)}return this.commands=r,this},a.encode=function(t){return i(t)},a.parse=function(t){var r=new _,e=[];return r.parse(t,e),r.finish(e),e},a.CLOSE_PATH=1,a.MOVE_TO=2,a.HORIZ_LINE_TO=4,a.VERT_LINE_TO=8,a.LINE_TO=16,a.CURVE_TO=32,a.SMOOTH_CURVE_TO=64,a.QUAD_TO=128,a.SMOOTH_QUAD_TO=256,a.ARC=512,a.LINE_COMMANDS=a.LINE_TO|a.HORIZ_LINE_TO|a.VERT_LINE_TO,a.DRAWING_COMMANDS=a.HORIZ_LINE_TO|a.VERT_LINE_TO|a.LINE_TO|a.CURVE_TO|a.SMOOTH_CURVE_TO|a.QUAD_TO|a.SMOOTH_QUAD_TO|a.ARC,a}(O),d=((T={})[N.MOVE_TO]=2,T[N.LINE_TO]=2,T[N.HORIZ_LINE_TO]=1,T[N.VERT_LINE_TO]=1,T[N.CLOSE_PATH]=0,T[N.QUAD_TO]=4,T[N.SMOOTH_QUAD_TO]=2,T[N.CURVE_TO]=6,T[N.SMOOTH_CURVE_TO]=4,T[N.ARC]=7,T);t.COMMAND_ARG_COUNTS=d,t.SVGPathData=N,t.SVGPathDataParser=_,t.encodeSVGPath=i,Object.defineProperty(t,"__esModule",{value:!0})}));


},{}],4:[function(require,module,exports){
const intersect = require("path-intersection")
const {SVGPathData, SVGPathDataTransformer, SVGPathDataEncoder, SVGPathDataParse, encodeSVGPath} = require('svg-pathdata');
const svg_properties = require('svg-path-properties')

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
                    P0 = getInitialPoint(intersection['segment' + path_no], paths[index[path_no - 1]])
                    // P0 = P1 = P2 = [0, 0]
                    // prev_segment = (intersection['segment' + path_no] > 0) ? paths[index[path_no - 1]].segments[intersection['segment' + path_no] - 1] : null
                    // if( prev_segment ) {
                    //     switch( prev_segment.type ) {
                    //         case SVGPathData.MOVE_TO:
                    //         case SVGPathData.LINE_TO:
                    //         case SVGPathData.QUAD_TO:
                    //             P0 = [prev_segment.x, prev_segment.y]
                    //         break;
                    //     }
                    // }
        
                    curr_segment = paths[index[path_no - 1]].segments[intersection['segment' + path_no]]
        
                    new_segments = splitSegment(curr_segment, P0, intersection, paths[index[path_no - 1]], path_no)
        
                    // switch( curr_segment.type ) {
                    //     case SVGPathData.LINE_TO:
                    //         new_segments = new SVGPathData(`
                    //                             L${intersection.x} ${intersection.y}
                    //                             L${curr_segment.x} ${curr_segment.y}`).commands
                    //     break;
                    //     case SVGPathData.QUAD_TO:
                    //         P1 = [curr_segment.x1, curr_segment.y1]
                    //         P2 = [curr_segment.x, curr_segment.y]
                    //         var [left, right] = splitQCurve([P0, P1, P2], intersection['t' + path_no])
        
                    //         segment_string = (left.length == 3) ? `Q${left[1][0]} ${left[1][1]} ${left[2][0]} ${left[2][1]}` : ""
                    //         segment_string += (right.length == 3) ? `Q${right[1][0]} ${right[1][1]} ${right[2][0]} ${right[2][1]}` : ""
        
                    //         new_segments = new SVGPathData(segment_string).commands
                    //     break;
                    //     case SVGPathData.CLOSE_PATH:
                    //         new_segments = new SVGPathData(`
                    //                             L${intersection.x} ${intersection.y}
                    //                             L${paths[index[path_no - 1]].segments[0].x} ${paths[index[path_no - 1]].segments[0].y}`).commands
                    //     break;
                    // }

                    // Assuming there are 2 new segments
                    new_segments = new_segments.map( (segment, segment_index) => {
                        segment.intersectee = (path_no == 1) ? index[1] : index[0] // OR segment.intersectee = index[path_no % 2]
                        // To know if intersection is after the segment or before
                        segment.is_intersection_ahead = (segment_index == 0)
                        segment.intersection_coords = {
                            x: intersection.x,
                            y: intersection.y
                        }

                        return segment
                    } )
        
                    if( new_segments ) {
                        // console.log( index[path_no - 1], segmented_paths[index[path_no - 1]])
                        segmented_paths[index[path_no - 1]].push({
                            segment_no: intersection['segment' + path_no],
                            new_segments: new_segments,
                            // Assuming that there are 2 new segments
                            // intersectee: (path_no == 1) ? index[1] : index[0],
                            // intersection_coord: {
                            //     x: intersection.x,
                            //     y: intersection.y
                            // }
                        })
                        // segmented_paths[index[path_no - 1]].segments.splice(intersection['segment' + path_no], 1, ...new_segments)
                    }
                }
    
                // return intersection
                // Create Two segments at the intersection
            })
        }
    }

    segmented_paths = segmented_paths.map( (segmented_path, index) => {
        overlaping_segment_list = segmented_path.filter( segment => {
            return segmented_path.filter( segment_1 => segment.segment_no == segment_1.segment_no ).length > 1
        }).reduce( (prev, current) => {
            prev[current.segment_no] = [...(prev[current.segment_no] ? prev[current.segment_no] : []), current.new_segments]
            return prev
        }, {})

        // We have some Segments which overlap each other due to multiple intersections on same original segment
        // - is segment
        // * is intersection
        // ----*----- s1
        // --*------- s2
        // -------*-- s{n}
        // Final Segments should look like following segments
        // --*-*--*--

        let new_segmented_path = Object.keys(overlaping_segment_list).map( segment_no => {
            overlaping_segments = overlaping_segment_list[segment_no]
            let new_segments = []
            let P0 = getInitialPoint(segment_no, paths[index])

            if( P0 )
            {
                while( overlaping_segments.find( sub_segments => (sub_segments.length == 0) ) == undefined )
                {
                    initial_segments = overlaping_segments.map( sub_segments => sub_segments[0] )
                    smallest_segment = initial_segments.reduce( (prev, current) => {
                        if( getSegmentLength(P0, prev) > getSegmentLength(P0, current) )
                        {
                            return current
                        }

                        return prev
                    }, initial_segments[0])

                    new_segments.push(smallest_segment)

                    overlaping_segments = overlaping_segments.map( sub_segments => {
                        if( (sub_segments[0].x == smallest_segment.x) && (sub_segments[0].y == smallest_segment.y) )
                        {
                            sub_segments.shift()
                        }
                        else
                        {
                            path_1 = getPathString(P0, sub_segments[0])
                            // A line around the end point of smallest segment to intersect other segments
                            path_2 = `M${smallest_segment.x - 1} ${smallest_segment.y - 1}L${smallest_segment.x + 1} ${smallest_segment.y + 1}`
                            intersections = intersect(path_1, path_2)
                            if( intersections.lenght > 0 )
                            {
                                [left, right] = splitSegment(sub_segments[0], P0, intersections[0], paths[index], 1)
                                sub_segments[0] = right
                            }
                        }

                        return sub_segments
                    } )

                    P0 = [smallest_segment.x, smallest_segment.y]
                }
            }

            return {
                segment_no: segment_no,
                new_segments: new_segments.map( (segment, s_index) => {
                    segment.is_intersection_ahead = true

                    if( s_index == (new_segments.length - 1) ) {
                        segment.is_intersection_ahead = false
                    }

                    return segment
                })
            }
        })

        segmented_path = segmented_path.filter( segment => !Object.keys(overlaping_segment_list).includes(segment.segment_no.toString()) )
        segmented_path = [...segmented_path, ...new_segmented_path]
        return segmented_path
    })
    
    // Creating new Segments around the intersections
    segmented_paths.forEach( (path_segments, index) => {
        path_segments = path_segments.sort( (a, b) => ( a.segment_no - b.segment_no ) )
        var new_path_segments = []
        var start = 0
        // var intersections = []
    
        path_segments.forEach( segment => {
            new_path_segments = new_path_segments.concat(paths[index].segments.slice(start, segment.segment_no))
            new_path_segments = new_path_segments.concat(segment.new_segments)

            // total_segments = new_path_segments.length
            // intersections.push({
            //     left: total_segments - 2,
            //     right: total_segments - 1,
            //     intersectee: segment.intersectee,
            //     coord: segment.intersection_coord
            // })

            start = parseInt(segment.segment_no) + segment.new_segments.length - 1
        })
    
        new_path_segments = new_path_segments.concat(paths[index].segments.slice(start))

        // new_path_segments.reduce()
    
        paths[index] = {
            path: encodeSVGPath(new_path_segments),
            segments: new_path_segments,
            // intersections: intersections
        }
    })

    // Creating new paths based on Greiner???Hormann clipping algorithm
    var new_paths = []
    var visited_paths = []

    paths.forEach( (path, index) => {
        if( !visited_paths.includes(index) ) {
            // Storing the segments in an Object to remeber their original locations
            path_segments = paths.map( path => path.segments.map( segment => segment ) )
            new_path_segments = [...path.segments]
            path_segments[index][path.segments.length - 1].is_end_segment = true
            current_path = index
            fixed_path_length = 0
            visited_paths.push(index)

            for( var segment_index = 0; segment_index < new_path_segments.length; segment_index++ )
            {
                // Delelting the segments from temporarity list to avoid reusing them
                // delete path_segments[current_path][segment_index - fixed_path_length]
                path_segments[current_path].shift()

                segment = new_path_segments[segment_index]
                if( segment.is_end_segment )
                {
                    new_path_segments = new_path_segments.slice(0, segment_index + 1);
                    break;
                }
                else if( segment.is_intersection_ahead === true )
                {
                    next_path = path_segments[segment.intersectee]
                    next_segment_index = next_path.findIndex( next_path_segment => (
                        next_path_segment.intersection_coords?.x == segment.intersection_coords.x &&
                        next_path_segment.intersection_coords?.y == segment.intersection_coords.y &&
                        next_path_segment.is_intersection_ahead === false
                    ))

                    if( next_segment_index > -1 )
                    {
                        next_segments = [...next_path.slice(next_segment_index), ...next_path.slice(0, next_segment_index)]
                        path_segments[segment.intersectee] = [...next_segments]
                        // console.log(next_segments.length, next_segment_index, current_path, segment.intersectee, segment_index)
                        new_path_segments = [...new_path_segments.slice(0, segment_index + 1), ...next_segments]
                        // fixed_path_length = segment_index + 1
                        visited_paths.push(segment.intersectee)
                        current_path = segment.intersectee
                    }
                }
                else if(
                    segment.type == SVGPathData.CLOSE_PATH ||
                    (
                        segment.type == SVGPathData.MOVE_TO &&
                        segment.x == new_path_segments[segment_index - 1]?.x &&
                        segment.y == new_path_segments[segment_index - 1]?.y
                    )
                )
                {
                    new_path_segments.splice(segment_index, 1)
                    segment_index--
                }
            }

            new_paths.push({
                segments: new_path_segments,
                path: encodeSVGPath(new_path_segments)
            })
        }
    })
    
    // function generateNewPathSegments(initial_path, start_path, start_segment = 0) {
    //     var path = paths[start_path];
    //     var available_intersections = path.intersections.filter( (intersection, index) => !visited_path_intersections[start_path].includes(index) )

    //     var regional_segments = []

    //     if( available_intersections.length > 0 ) {
    //         // check if available intersection lenght > 0
    //         var next_intersection = available_intersections.reduce( (prev, current, index) => {
    //             if( current.left >= start_segment && prev.left > current.left ) {
    //                 return current
    //             }

    //             return prev
    //         }, available_intersections[0])

    //         if( next_intersection.left < start_segment ) {
    //             if( initial_path == start_path ) {
    //                 regional_segments = path.segments.slice(start_segment)
    //                 return regional_segments;
    //             }
    //             else {
    //                 // Assuming that last element in the path in ClosePath Z
    //                 regional_segments = path.segments.slice(start_segment, path.segments.length - 1)
    //                 console.log(path.segments[0])
    //                 regional_segments.concat(new SVGPathData(`L${path.segments[0].x} ${path.segments[0].y}`).commands)
    //                 regional_segments.concat(path.segments.slice(1, next_intersection.left + 1))
    //             }
    //         }
    //         else {
    //             regional_segments = path.segments.slice(start_segment, next_intersection.left + 1)
    //         }

    //         var {right: next_start_segment} =  paths[next_intersection.intersectee].intersections.find( intersection_a => ((next_intersection.coord.x == intersection_a.coord.x) && (next_intersection.coord.y == intersection_a.coord.y)) )

    //         return regional_segments.concat( generateNewPathSegments(initial_path, next_intersection.intersectee, next_start_segment))
    //     }

    //     return regional_segments;

    // }
    // Removing the Segments inside the Union of the Paths
    // paths = paths.map( (path, index) => {
    //     if( segmented_paths[index].length == 0 ) {
    //         return path
    //     }
    
    //     var segments = path.segments.map( (segment, s_index) => {
    //         if( s_index > 0 ) {
    //             var P0 = P1 = P2 = [0, 0]
    //             var midpoint = null
    //             prev_segment = path.segments[s_index - 1]
    //             if( prev_segment ) {
    //                 switch( prev_segment.type ) {
    //                     case SVGPathData.MOVE_TO:
    //                     case SVGPathData.LINE_TO:
    //                     case SVGPathData.QUAD_TO:
    //                         P0 = [prev_segment.x, prev_segment.y]
    //                     break;
    //                 }
    //             }
    
    //             switch(segment.type) {
    //                 case SVGPathData.LINE_TO:
    //                     P2 = [segment.x, segment.y]
    //                     midpoint = [
    //                         (P0[0] + segment.x) / 2,
    //                         (P0[1] + segment.y) / 2
    //                     ]
    //                 break;
    //                 case SVGPathData.QUAD_TO:
    //                     P2 = [segment.x, segment.y]
    //                     var [{2: midpoint}, right] = splitQCurve([P0, [segment.x1, segment.y1], [segment.x, segment.y]], 0.5)
    //                 break;
    //                 case SVGPathData.CLOSE_PATH:
    //                     P2 = [path.segments[0].x, path.segments[0].y]
    //                     midpoint = [
    //                         (P0[0] + P2[0]) / 2,
    //                         (P0[1] + P2[1]) / 2
    //                     ]
    //             }
    
    //             if( midpoint ) {
    //                 other_paths = paths.reduce( (prev, current, p_index) => prev + (( p_index != index ) ? current.path : ""), "" )
    //                 y_perpendicular_path = `M${midpoint[0]} ${midpoint[1]}L0 ${midpoint[1]}`
    //                 x_perpendicular_path = `M${midpoint[0]} ${midpoint[1]}L${midpoint[0]} 0`
    //                 y_intersection_count = intersect(other_paths, y_perpendicular_path, true)
    //                 x_intersection_count = intersect(other_paths, x_perpendicular_path, true)
    //                 if( (y_intersection_count % 2 == 1) && (x_intersection_count % 2 == 1) ) {
    //                     return new SVGPathData(`M${P2[0]} ${P2[1]}`).commands[0]
    //                     // console.log(new SVGPathData(`M${P2[0]} ${P2[1]}`).commands[0])
    //                     // return
    //                 }
    //             }
    
    //             if( (s_index == (path.segments.length - 1)) && (segment.type == SVGPathData.CLOSE_PATH) ) {
    //                 return new SVGPathData(`L${path.segments[0].x} ${path.segments[0].y}`).commands[0]
    //             }
    //         }
    
    //         return segment
    //     })
    
    //     // segments = segments.filter( segment => segment )
    
    //     return {
    //         path: encodeSVGPath(segments),
    //         segments: segments
    //     }
    // })
    
    return new_paths.reduce( (prev, current) => ( prev + current.path ), "" )
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

function splitSegment(curr_segment, P0, intersection, path, path_no)
{
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
                                L${path.segments[0].x} ${path.segments[0].y}`).commands
        break;
    }

    return new_segments
}


function getInitialPoint(segment_no, path)
{
    prev_segment = (segment_no > 0) ? path.segments[segment_no - 1] : null
    if( prev_segment ) {
        switch( prev_segment.type ) {
            case SVGPathData.MOVE_TO:
            case SVGPathData.LINE_TO:
            case SVGPathData.QUAD_TO:
                P0 = [prev_segment.x, prev_segment.y]
            break;
            default:
                P0 = [0,0]
        }
    }

    return P0
}


function getSegmentLength(P0, segment)
{
    path_string = getPathString(P0, segment)
    properties = svg_properties.svgPathProperties(path_string)
    return properties.getTotalLength()
}

function getPathString(P0, segment)
{
    return `M${P0[0]} ${P0[1]}` + encodeSVGPath([segment])
}

function getTangent(P0, segment, lenght)
{
    path_string = getPathString(P0, segment)
    properties = svg_properties.svgPathProperties(path_string)
    return properties.getTangentAtLength(lenght)
}

module.exports = union

window.union = union
},{"path-intersection":1,"svg-path-properties":2,"svg-pathdata":3}]},{},[4]);
