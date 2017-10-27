/* esri-leaflet-webmap - v0.4.0 - Fri Oct 27 2017 15:08:37 GMT-0400 (Eastern Daylight Time)
 * Copyright (c) 2017 Yusuke Nunokawa <ynunokawa.dev@gmail.com>
 * MIT */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('leaflet'), require('leaflet-omnivore')) :
	typeof define === 'function' && define.amd ? define(['exports', 'leaflet', 'leaflet-omnivore'], factory) :
	(factory((global.L = global.L || {}, global.L.esri = global.L.esri || {}),global.L,global.omnivore));
}(this, function (exports,L,omnivore) { 'use strict';

	L = 'default' in L ? L['default'] : L;
	omnivore = 'default' in omnivore ? omnivore['default'] : omnivore;

	var version = "0.4.0";

	/*
	 * Copyright 2017 Esri
	 *
	 * Licensed under the Apache License, Version 2.0 (the "License");
	 * you may not use this file except in compliance with the License.
	 * You may obtain a copy of the License at
	 *
	 *     http://www.apache.org/licenses/LICENSE-2.0
	 *
	 * Unless required by applicable law or agreed to in writing, software
	 * distributed under the License is distributed on an "AS IS" BASIS,
	 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	 * See the License for the specific language governing permissions and
	 * limitations under the License.
	 */

	// checks if 2 x,y points are equal
	function pointsEqual (a, b) {
	  for (var i = 0; i < a.length; i++) {
	    if (a[i] !== b[i]) {
	      return false;
	    }
	  }
	  return true;
	}

	// checks if the first and last points of a ring are equal and closes the ring
	function closeRing (coordinates) {
	  if (!pointsEqual(coordinates[0], coordinates[coordinates.length - 1])) {
	    coordinates.push(coordinates[0]);
	  }
	  return coordinates;
	}

	// determine if polygon ring coordinates are clockwise. clockwise signifies outer ring, counter-clockwise an inner ring
	// or hole. this logic was found at http://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-
	// points-are-in-clockwise-order
	function ringIsClockwise (ringToTest) {
	  var total = 0;
	  var i = 0;
	  var rLength = ringToTest.length;
	  var pt1 = ringToTest[i];
	  var pt2;
	  for (i; i < rLength - 1; i++) {
	    pt2 = ringToTest[i + 1];
	    total += (pt2[0] - pt1[0]) * (pt2[1] + pt1[1]);
	    pt1 = pt2;
	  }
	  return (total >= 0);
	}

	// ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L504-L519
	function vertexIntersectsVertex (a1, a2, b1, b2) {
	  var uaT = ((b2[0] - b1[0]) * (a1[1] - b1[1])) - ((b2[1] - b1[1]) * (a1[0] - b1[0]));
	  var ubT = ((a2[0] - a1[0]) * (a1[1] - b1[1])) - ((a2[1] - a1[1]) * (a1[0] - b1[0]));
	  var uB = ((b2[1] - b1[1]) * (a2[0] - a1[0])) - ((b2[0] - b1[0]) * (a2[1] - a1[1]));

	  if (uB !== 0) {
	    var ua = uaT / uB;
	    var ub = ubT / uB;

	    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
	      return true;
	    }
	  }

	  return false;
	}

	// ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L521-L531
	function arrayIntersectsArray (a, b) {
	  for (var i = 0; i < a.length - 1; i++) {
	    for (var j = 0; j < b.length - 1; j++) {
	      if (vertexIntersectsVertex(a[i], a[i + 1], b[j], b[j + 1])) {
	        return true;
	      }
	    }
	  }

	  return false;
	}

	// ported from terraformer.js https://github.com/Esri/Terraformer/blob/master/terraformer.js#L470-L480
	function coordinatesContainPoint (coordinates, point) {
	  var contains = false;
	  for (var i = -1, l = coordinates.length, j = l - 1; ++i < l; j = i) {
	    if (((coordinates[i][1] <= point[1] && point[1] < coordinates[j][1]) ||
	         (coordinates[j][1] <= point[1] && point[1] < coordinates[i][1])) &&
	        (point[0] < (((coordinates[j][0] - coordinates[i][0]) * (point[1] - coordinates[i][1])) / (coordinates[j][1] - coordinates[i][1])) + coordinates[i][0])) {
	      contains = !contains;
	    }
	  }
	  return contains;
	}

	// ported from terraformer-arcgis-parser.js https://github.com/Esri/terraformer-arcgis-parser/blob/master/terraformer-arcgis-parser.js#L106-L113
	function coordinatesContainCoordinates (outer, inner) {
	  var intersects = arrayIntersectsArray(outer, inner);
	  var contains = coordinatesContainPoint(outer, inner[0]);
	  if (!intersects && contains) {
	    return true;
	  }
	  return false;
	}

	// do any polygons in this array contain any other polygons in this array?
	// used for checking for holes in arcgis rings
	// ported from terraformer-arcgis-parser.js https://github.com/Esri/terraformer-arcgis-parser/blob/master/terraformer-arcgis-parser.js#L117-L172
	function convertRingsToGeoJSON (rings) {
	  var outerRings = [];
	  var holes = [];
	  var x; // iterator
	  var outerRing; // current outer ring being evaluated
	  var hole; // current hole being evaluated

	  // for each ring
	  for (var r = 0; r < rings.length; r++) {
	    var ring = closeRing(rings[r].slice(0));
	    if (ring.length < 4) {
	      continue;
	    }
	    // is this ring an outer ring? is it clockwise?
	    if (ringIsClockwise(ring)) {
	      var polygon = [ ring ];
	      outerRings.push(polygon); // push to outer rings
	    } else {
	      holes.push(ring); // counterclockwise push to holes
	    }
	  }

	  var uncontainedHoles = [];

	  // while there are holes left...
	  while (holes.length) {
	    // pop a hole off out stack
	    hole = holes.pop();

	    // loop over all outer rings and see if they contain our hole.
	    var contained = false;
	    for (x = outerRings.length - 1; x >= 0; x--) {
	      outerRing = outerRings[x][0];
	      if (coordinatesContainCoordinates(outerRing, hole)) {
	        // the hole is contained push it into our polygon
	        outerRings[x].push(hole);
	        contained = true;
	        break;
	      }
	    }

	    // ring is not contained in any outer ring
	    // sometimes this happens https://github.com/Esri/esri-leaflet/issues/320
	    if (!contained) {
	      uncontainedHoles.push(hole);
	    }
	  }

	  // if we couldn't match any holes using contains we can try intersects...
	  while (uncontainedHoles.length) {
	    // pop a hole off out stack
	    hole = uncontainedHoles.pop();

	    // loop over all outer rings and see if any intersect our hole.
	    var intersects = false;

	    for (x = outerRings.length - 1; x >= 0; x--) {
	      outerRing = outerRings[x][0];
	      if (arrayIntersectsArray(outerRing, hole)) {
	        // the hole is contained push it into our polygon
	        outerRings[x].push(hole);
	        intersects = true;
	        break;
	      }
	    }

	    if (!intersects) {
	      outerRings.push([hole.reverse()]);
	    }
	  }

	  if (outerRings.length === 1) {
	    return {
	      type: 'Polygon',
	      coordinates: outerRings[0]
	    };
	  } else {
	    return {
	      type: 'MultiPolygon',
	      coordinates: outerRings
	    };
	  }
	}

	// shallow object clone for feature properties and attributes
	// from http://jsperf.com/cloning-an-object/2
	function shallowClone (obj) {
	  var target = {};
	  for (var i in obj) {
	    if (obj.hasOwnProperty(i)) {
	      target[i] = obj[i];
	    }
	  }
	  return target;
	}

	function arcgisToGeoJSON (arcgis, idAttribute) {
	  var geojson = {};

	  if (typeof arcgis.x === 'number' && typeof arcgis.y === 'number') {
	    geojson.type = 'Point';
	    geojson.coordinates = [arcgis.x, arcgis.y];
	  }

	  if (arcgis.points) {
	    geojson.type = 'MultiPoint';
	    geojson.coordinates = arcgis.points.slice(0);
	  }

	  if (arcgis.paths) {
	    if (arcgis.paths.length === 1) {
	      geojson.type = 'LineString';
	      geojson.coordinates = arcgis.paths[0].slice(0);
	    } else {
	      geojson.type = 'MultiLineString';
	      geojson.coordinates = arcgis.paths.slice(0);
	    }
	  }

	  if (arcgis.rings) {
	    geojson = convertRingsToGeoJSON(arcgis.rings.slice(0));
	  }

	  if (arcgis.geometry || arcgis.attributes) {
	    geojson.type = 'Feature';
	    geojson.geometry = (arcgis.geometry) ? arcgisToGeoJSON(arcgis.geometry) : null;
	    geojson.properties = (arcgis.attributes) ? shallowClone(arcgis.attributes) : null;
	    if (arcgis.attributes) {
	      geojson.id = arcgis.attributes[idAttribute] || arcgis.attributes.OBJECTID || arcgis.attributes.FID;
	    }
	  }

	  // if no valid geometry was encountered
	  if (JSON.stringify(geojson.geometry) === JSON.stringify({})) {
	    geojson.geometry = null;
	  }

	  return geojson;
	}

	var Symbol = L.Class.extend({
	  initialize: function (symbolJson, options) {
	    this._symbolJson = symbolJson;
	    this.val = null;
	    this._styles = {};
	    this._isDefault = false;
	    this._layerTransparency = 1;
	    if (options && options.layerTransparency) {
	      this._layerTransparency = 1 - (options.layerTransparency / 100.0);
	    }
	  },

	  // the geojson values returned are in points
	  pixelValue: function (pointValue) {
	    return pointValue * 1.333;
	  },

	  // color is an array [r,g,b,a]
	  colorValue: function (color) {
	    return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
	  },

	  alphaValue: function (color) {
	    var alpha = color[3] / 255.0;
	    return alpha * this._layerTransparency;
	  },

	  getSize: function (feature, sizeInfo) {
	    var attr = feature.properties;
	    var field = sizeInfo.field;
	    var size = 0;
	    var featureValue = null;

	    if (field) {
	      featureValue = attr[field];
	      var minSize = sizeInfo.minSize;
	      var maxSize = sizeInfo.maxSize;
	      var minDataValue = sizeInfo.minDataValue;
	      var maxDataValue = sizeInfo.maxDataValue;
	      var featureRatio;
	      var normField = sizeInfo.normalizationField;
	      var normValue = attr ? parseFloat(attr[normField]) : undefined;

	      if (featureValue === null || (normField && ((isNaN(normValue) || normValue === 0)))) {
	        return null;
	      }

	      if (!isNaN(normValue)) {
	        featureValue /= normValue;
	      }

	      if (minSize !== null && maxSize !== null && minDataValue !== null && maxDataValue !== null) {
	        if (featureValue <= minDataValue) {
	          size = minSize;
	        } else if (featureValue >= maxDataValue) {
	          size = maxSize;
	        } else {
	          featureRatio = (featureValue - minDataValue) / (maxDataValue - minDataValue);
	          size = minSize + (featureRatio * (maxSize - minSize));
	        }
	      }
	      size = isNaN(size) ? 0 : size;
	    }
	    return size;
	  },

	  getColor: function (feature, colorInfo) {
	    // required information to get color
	    if (!(feature.properties && colorInfo && colorInfo.field && colorInfo.stops)) {
	      return null;
	    }

	    var attr = feature.properties;
	    var featureValue = attr[colorInfo.field];
	    var lowerBoundColor, upperBoundColor, lowerBound, upperBound;
	    var normField = colorInfo.normalizationField;
	    var normValue = attr ? parseFloat(attr[normField]) : undefined;
	    if (featureValue === null || (normField && ((isNaN(normValue) || normValue === 0)))) {
	      return null;
	    }

	    if (!isNaN(normValue)) {
	      featureValue /= normValue;
	    }

	    if (featureValue <= colorInfo.stops[0].value) {
	      return colorInfo.stops[0].color;
	    }
	    var lastStop = colorInfo.stops[colorInfo.stops.length - 1];
	    if (featureValue >= lastStop.value) {
	      return lastStop.color;
	    }

	    // go through the stops to find min and max
	    for (var i = 0; i < colorInfo.stops.length; i++) {
	      var stopInfo = colorInfo.stops[i];

	      if (stopInfo.value <= featureValue) {
	        lowerBoundColor = stopInfo.color;
	        lowerBound = stopInfo.value;
	      } else if (stopInfo.value > featureValue) {
	        upperBoundColor = stopInfo.color;
	        upperBound = stopInfo.value;
	        break;
	      }
	    }

	    // feature falls between two stops, interplate the colors
	    if (!isNaN(lowerBound) && !isNaN(upperBound)) {
	      var range = upperBound - lowerBound;
	      if (range > 0) {
	        // more weight the further it is from the lower bound
	        var upperBoundColorWeight = (featureValue - lowerBound) / range;
	        if (upperBoundColorWeight) {
	          // more weight the further it is from the upper bound
	          var lowerBoundColorWeight = (upperBound - featureValue) / range;
	          if (lowerBoundColorWeight) {
	            // interpolate the lower and upper bound color by applying the
	            // weights to each of the rgba colors and adding them together
	            var interpolatedColor = [];
	            for (var j = 0; j < 4; j++) {
	              interpolatedColor[j] = Math.round((lowerBoundColor[j] * lowerBoundColorWeight) + (upperBoundColor[j] * upperBoundColorWeight));
	            }
	            return interpolatedColor;
	          } else {
	            // no difference between featureValue and upperBound, 100% of upperBoundColor
	            return upperBoundColor;
	          }
	        } else {
	          // no difference between featureValue and lowerBound, 100% of lowerBoundColor
	          return lowerBoundColor;
	        }
	      }
	    }
	    // if we get to here, none of the cases apply so return null
	    return null;
	  }
	});

	var ShapeMarker = L.Path.extend({

	  initialize: function (latlng, size, options) {
	    L.setOptions(this, options);
	    this._size = size;
	    this._latlng = L.latLng(latlng);
	    this._svgCanvasIncludes();
	  },

	  toGeoJSON: function () {
	    return L.GeoJSON.getFeature(this, {
	      type: 'Point',
	      coordinates: L.GeoJSON.latLngToCoords(this.getLatLng())
	    });
	  },

	  _svgCanvasIncludes: function () {
	    // implement in sub class
	  },

	  _project: function () {
	    this._point = this._map.latLngToLayerPoint(this._latlng);
	  },

	  _update: function () {
	    if (this._map) {
	      this._updatePath();
	    }
	  },

	  _updatePath: function () {
	    // implement in sub class
	  },

	  setLatLng: function (latlng) {
	    this._latlng = L.latLng(latlng);
	    this.redraw();
	    return this.fire('move', {latlng: this._latlng});
	  },

	  getLatLng: function () {
	    return this._latlng;
	  },

	  setSize: function (size) {
	    this._size = size;
	    return this.redraw();
	  },

	  getSize: function () {
	    return this._size;
	  }
	});

	var CrossMarker = ShapeMarker.extend({

	  initialize: function (latlng, size, options) {
	    ShapeMarker.prototype.initialize.call(this, latlng, size, options);
	  },

	  _updatePath: function () {
	    this._renderer._updateCrossMarker(this);
	  },

	  _svgCanvasIncludes: function () {
	    L.Canvas.include({
	      _updateCrossMarker: function (layer) {
	        var latlng = layer._point;
	        var offset = layer._size / 2.0;
	        var ctx = this._ctx;

	        ctx.beginPath();
	        ctx.moveTo(latlng.x, latlng.y + offset);
	        ctx.lineTo(latlng.x, latlng.y - offset);
	        this._fillStroke(ctx, layer);

	        ctx.moveTo(latlng.x - offset, latlng.y);
	        ctx.lineTo(latlng.x + offset, latlng.y);
	        this._fillStroke(ctx, layer);
	      }
	    });

	    L.SVG.include({
	      _updateCrossMarker: function (layer) {
	        var latlng = layer._point;
	        var offset = layer._size / 2.0;

	        if (L.Browser.vml) {
	          latlng._round();
	          offset = Math.round(offset);
	        }

	        var str = 'M' + latlng.x + ',' + (latlng.y + offset) +
	          'L' + latlng.x + ',' + (latlng.y - offset) +
	          'M' + (latlng.x - offset) + ',' + latlng.y +
	          'L' + (latlng.x + offset) + ',' + latlng.y;

	        this._setPath(layer, str);
	      }
	    });
	  }
	});

	var crossMarker = function (latlng, size, options) {
	  return new CrossMarker(latlng, size, options);
	};

	var XMarker = ShapeMarker.extend({

	  initialize: function (latlng, size, options) {
	    ShapeMarker.prototype.initialize.call(this, latlng, size, options);
	  },

	  _updatePath: function () {
	    this._renderer._updateXMarker(this);
	  },

	  _svgCanvasIncludes: function () {
	    L.Canvas.include({
	      _updateXMarker: function (layer) {
	        var latlng = layer._point;
	        var offset = layer._size / 2.0;
	        var ctx = this._ctx;

	        ctx.beginPath();

	        ctx.moveTo(latlng.x + offset, latlng.y + offset);
	        ctx.lineTo(latlng.x - offset, latlng.y - offset);
	        this._fillStroke(ctx, layer);
	      }
	    });

	    L.SVG.include({
	      _updateXMarker: function (layer) {
	        var latlng = layer._point;
	        var offset = layer._size / 2.0;

	        if (L.Browser.vml) {
	          latlng._round();
	          offset = Math.round(offset);
	        }

	        var str = 'M' + (latlng.x + offset) + ',' + (latlng.y + offset) +
	          'L' + (latlng.x - offset) + ',' + (latlng.y - offset) +
	          'M' + (latlng.x - offset) + ',' + (latlng.y + offset) +
	          'L' + (latlng.x + offset) + ',' + (latlng.y - offset);

	        this._setPath(layer, str);
	      }
	    });
	  }
	});

	var xMarker = function (latlng, size, options) {
	  return new XMarker(latlng, size, options);
	};

	var SquareMarker = ShapeMarker.extend({
	  options: {
	    fill: true
	  },

	  initialize: function (latlng, size, options) {
	    ShapeMarker.prototype.initialize.call(this, latlng, size, options);
	  },

	  _updatePath: function () {
	    this._renderer._updateSquareMarker(this);
	  },

	  _svgCanvasIncludes: function () {
	    L.Canvas.include({
	      _updateSquareMarker: function (layer) {
	        var latlng = layer._point;
	        var offset = layer._size / 2.0;
	        var ctx = this._ctx;

	        ctx.beginPath();

	        ctx.moveTo(latlng.x + offset, latlng.y + offset);
	        ctx.lineTo(latlng.x - offset, latlng.y + offset);
	        ctx.lineTo(latlng.x - offset, latlng.y - offset);
	        ctx.lineTo(latlng.x + offset, latlng.y - offset);

	        ctx.closePath();

	        this._fillStroke(ctx, layer);
	      }
	    });

	    L.SVG.include({
	      _updateSquareMarker: function (layer) {
	        var latlng = layer._point;
	        var offset = layer._size / 2.0;

	        if (L.Browser.vml) {
	          latlng._round();
	          offset = Math.round(offset);
	        }

	        var str = 'M' + (latlng.x + offset) + ',' + (latlng.y + offset) +
	          'L' + (latlng.x - offset) + ',' + (latlng.y + offset) +
	          'L' + (latlng.x - offset) + ',' + (latlng.y - offset) +
	          'L' + (latlng.x + offset) + ',' + (latlng.y - offset);

	        str = str + (L.Browser.svg ? 'z' : 'x');

	        this._setPath(layer, str);
	      }
	    });
	  }
	});

	var squareMarker = function (latlng, size, options) {
	  return new SquareMarker(latlng, size, options);
	};

	var DiamondMarker = ShapeMarker.extend({
	  options: {
	    fill: true
	  },

	  initialize: function (latlng, size, options) {
	    ShapeMarker.prototype.initialize.call(this, latlng, size, options);
	  },

	  _updatePath: function () {
	    this._renderer._updateDiamondMarker(this);
	  },

	  _svgCanvasIncludes: function () {
	    L.Canvas.include({
	      _updateDiamondMarker: function (layer) {
	        var latlng = layer._point;
	        var offset = layer._size / 2.0;
	        var ctx = this._ctx;

	        ctx.beginPath();

	        ctx.moveTo(latlng.x, latlng.y + offset);
	        ctx.lineTo(latlng.x - offset, latlng.y);
	        ctx.lineTo(latlng.x, latlng.y - offset);
	        ctx.lineTo(latlng.x + offset, latlng.y);

	        ctx.closePath();

	        this._fillStroke(ctx, layer);
	      }
	    });

	    L.SVG.include({
	      _updateDiamondMarker: function (layer) {
	        var latlng = layer._point;
	        var offset = layer._size / 2.0;

	        if (L.Browser.vml) {
	          latlng._round();
	          offset = Math.round(offset);
	        }

	        var str = 'M' + latlng.x + ',' + (latlng.y + offset) +
	          'L' + (latlng.x - offset) + ',' + latlng.y +
	          'L' + latlng.x + ',' + (latlng.y - offset) +
	          'L' + (latlng.x + offset) + ',' + latlng.y;

	        str = str + (L.Browser.svg ? 'z' : 'x');

	        this._setPath(layer, str);
	      }
	    });
	  }
	});

	var diamondMarker = function (latlng, size, options) {
	  return new DiamondMarker(latlng, size, options);
	};

	var PointSymbol = Symbol.extend({

	  statics: {
	    MARKERTYPES: ['esriSMSCircle', 'esriSMSCross', 'esriSMSDiamond', 'esriSMSSquare', 'esriSMSX', 'esriPMS']
	  },

	  initialize: function (symbolJson, options) {
	    var url;
	    Symbol.prototype.initialize.call(this, symbolJson, options);
	    if (options) {
	      this.serviceUrl = options.url;
	    }
	    if (symbolJson) {
	      if (symbolJson.type === 'esriPMS') {
	        var imageUrl = this._symbolJson.url;
	        if ((imageUrl && imageUrl.substr(0, 7) === 'http://') || (imageUrl.substr(0, 8) === 'https://')) {
	          // web image
	          url = this.sanitize(imageUrl);
	          this._iconUrl = url;
	        } else {
	          url = this.serviceUrl + 'images/' + imageUrl;
	          this._iconUrl = options && options.token ? url + '?token=' + options.token : url;
	        }
	        if (symbolJson.imageData) {
	          this._iconUrl = 'data:' + symbolJson.contentType + ';base64,' + symbolJson.imageData;
	        }
	        // leaflet does not allow resizing icons so keep a hash of different
	        // icon sizes to try and keep down on the number of icons created
	        this._icons = {};
	        // create base icon
	        this.icon = this._createIcon(this._symbolJson);
	      } else {
	        this._fillStyles();
	      }
	    }
	  },

	  // prevent html injection in strings
	  sanitize: function (str) {
	    if (!str) {
	      return '';
	    }
	    var text;
	    try {
	      // removes html but leaves url link text
	      text = str.replace(/<br>/gi, '\n');
	      text = text.replace(/<p.*>/gi, '\n');
	      text = text.replace(/<a.*href='(.*?)'.*>(.*?)<\/a>/gi, ' $2 ($1) ');
	      text = text.replace(/<(?:.|\s)*?>/g, '');
	    } catch (ex) {
	      text = null;
	    }
	    return text;
	  },

	  _fillStyles: function () {
	    if (this._symbolJson.outline && this._symbolJson.size > 0 && this._symbolJson.outline.style !== 'esriSLSNull') {
	      this._styles.stroke = true;
	      this._styles.weight = this.pixelValue(this._symbolJson.outline.width);
	      this._styles.color = this.colorValue(this._symbolJson.outline.color);
	      this._styles.opacity = this.alphaValue(this._symbolJson.outline.color);
	    } else {
	      this._styles.stroke = false;
	    }
	    if (this._symbolJson.color) {
	      this._styles.fillColor = this.colorValue(this._symbolJson.color);
	      this._styles.fillOpacity = this.alphaValue(this._symbolJson.color);
	    } else {
	      this._styles.fillOpacity = 0;
	    }

	    if (this._symbolJson.style === 'esriSMSCircle') {
	      this._styles.radius = this.pixelValue(this._symbolJson.size) / 2.0;
	    }
	  },

	  _createIcon: function (options) {
	    var width = this.pixelValue(options.width);
	    var height = width;
	    if (options.height) {
	      height = this.pixelValue(options.height);
	    }
	    var xOffset = width / 2.0;
	    var yOffset = height / 2.0;

	    if (options.xoffset) {
	      xOffset += this.pixelValue(options.xoffset);
	    }
	    if (options.yoffset) {
	      yOffset += this.pixelValue(options.yoffset);
	    }

	    var icon = L.icon({
	      iconUrl: this._iconUrl,
	      iconSize: [width, height],
	      iconAnchor: [xOffset, yOffset]
	    });
	    this._icons[options.width.toString()] = icon;
	    return icon;
	  },

	  _getIcon: function (size) {
	    // check to see if it is already created by size
	    var icon = this._icons[size.toString()];
	    if (!icon) {
	      icon = this._createIcon({width: size});
	    }
	    return icon;
	  },

	  pointToLayer: function (geojson, latlng, visualVariables, options) {
	    var size = this._symbolJson.size || this._symbolJson.width;
	    if (!this._isDefault) {
	      if (visualVariables.sizeInfo) {
	        var calculatedSize = this.getSize(geojson, visualVariables.sizeInfo);
	        if (calculatedSize) {
	          size = calculatedSize;
	        }
	      }
	      if (visualVariables.colorInfo) {
	        var color = this.getColor(geojson, visualVariables.colorInfo);
	        if (color) {
	          this._styles.fillColor = this.colorValue(color);
	          this._styles.fillOpacity = this.alphaValue(color);
	        }
	      }
	    }

	    if (this._symbolJson.type === 'esriPMS') {
	      var layerOptions = L.extend({}, {icon: this._getIcon(size)}, options);
	      return L.marker(latlng, layerOptions);
	    }
	    size = this.pixelValue(size);

	    switch (this._symbolJson.style) {
	      case 'esriSMSSquare':
	        return squareMarker(latlng, size, L.extend({}, this._styles, options));
	      case 'esriSMSDiamond':
	        return diamondMarker(latlng, size, L.extend({}, this._styles, options));
	      case 'esriSMSCross':
	        return crossMarker(latlng, size, L.extend({}, this._styles, options));
	      case 'esriSMSX':
	        return xMarker(latlng, size, L.extend({}, this._styles, options));
	    }
	    this._styles.radius = size / 2.0;
	    return L.circleMarker(latlng, L.extend({}, this._styles, options));
	  }
	});

	function pointSymbol (symbolJson, options) {
	  return new PointSymbol(symbolJson, options);
	}

	var LineSymbol = Symbol.extend({
	  statics: {
	    // Not implemented 'esriSLSNull'
	    LINETYPES: ['esriSLSDash', 'esriSLSDot', 'esriSLSDashDotDot', 'esriSLSDashDot', 'esriSLSSolid']
	  },
	  initialize: function (symbolJson, options) {
	    Symbol.prototype.initialize.call(this, symbolJson, options);
	    this._fillStyles();
	  },

	  _fillStyles: function () {
	    // set the defaults that show up on arcgis online
	    this._styles.lineCap = 'butt';
	    this._styles.lineJoin = 'miter';
	    this._styles.fill = false;
	    this._styles.weight = 0;

	    if (!this._symbolJson) {
	      return this._styles;
	    }

	    if (this._symbolJson.color) {
	      this._styles.color = this.colorValue(this._symbolJson.color);
	      this._styles.opacity = this.alphaValue(this._symbolJson.color);
	    }

	    if (!isNaN(this._symbolJson.width)) {
	      this._styles.weight = this.pixelValue(this._symbolJson.width);

	      var dashValues = [];

	      switch (this._symbolJson.style) {
	        case 'esriSLSDash':
	          dashValues = [4, 3];
	          break;
	        case 'esriSLSDot':
	          dashValues = [1, 3];
	          break;
	        case 'esriSLSDashDot':
	          dashValues = [8, 3, 1, 3];
	          break;
	        case 'esriSLSDashDotDot':
	          dashValues = [8, 3, 1, 3, 1, 3];
	          break;
	      }

	      // use the dash values and the line weight to set dash array
	      if (dashValues.length > 0) {
	        for (var i = 0; i < dashValues.length; i++) {
	          dashValues[i] *= this._styles.weight;
	        }

	        this._styles.dashArray = dashValues.join(',');
	      }
	    }
	  },

	  style: function (feature, visualVariables) {
	    if (!this._isDefault && visualVariables) {
	      if (visualVariables.sizeInfo) {
	        var calculatedSize = this.pixelValue(this.getSize(feature, visualVariables.sizeInfo));
	        if (calculatedSize) {
	          this._styles.weight = calculatedSize;
	        }
	      }
	      if (visualVariables.colorInfo) {
	        var color = this.getColor(feature, visualVariables.colorInfo);
	        if (color) {
	          this._styles.color = this.colorValue(color);
	          this._styles.opacity = this.alphaValue(color);
	        }
	      }
	    }
	    return this._styles;
	  }
	});

	function lineSymbol (symbolJson, options) {
	  return new LineSymbol(symbolJson, options);
	}

	var PolygonSymbol = Symbol.extend({
	  statics: {
	    // not implemented: 'esriSFSBackwardDiagonal','esriSFSCross','esriSFSDiagonalCross','esriSFSForwardDiagonal','esriSFSHorizontal','esriSFSNull','esriSFSVertical'
	    POLYGONTYPES: ['esriSFSSolid']
	  },
	  initialize: function (symbolJson, options) {
	    Symbol.prototype.initialize.call(this, symbolJson, options);
	    if (symbolJson) {
	      if (symbolJson.outline && symbolJson.outline.style === 'esriSLSNull') {
	        this._lineStyles = { weight: 0 };
	      } else {
	        this._lineStyles = lineSymbol(symbolJson.outline, options).style();
	      }
	      this._fillStyles();
	    }
	  },

	  _fillStyles: function () {
	    if (this._lineStyles) {
	      if (this._lineStyles.weight === 0) {
	        // when weight is 0, setting the stroke to false can still look bad
	        // (gaps between the polygons)
	        this._styles.stroke = false;
	      } else {
	        // copy the line symbol styles into this symbol's styles
	        for (var styleAttr in this._lineStyles) {
	          this._styles[styleAttr] = this._lineStyles[styleAttr];
	        }
	      }
	    }

	    // set the fill for the polygon
	    if (this._symbolJson) {
	      if (this._symbolJson.color &&
	          // don't fill polygon if type is not supported
	          PolygonSymbol.POLYGONTYPES.indexOf(this._symbolJson.style >= 0)) {
	        this._styles.fill = true;
	        this._styles.fillColor = this.colorValue(this._symbolJson.color);
	        this._styles.fillOpacity = this.alphaValue(this._symbolJson.color);
	      } else {
	        this._styles.fill = false;
	        this._styles.fillOpacity = 0;
	      }
	    }
	  },

	  style: function (feature, visualVariables) {
	    if (!this._isDefault && visualVariables && visualVariables.colorInfo) {
	      var color = this.getColor(feature, visualVariables.colorInfo);
	      if (color) {
	        this._styles.fillColor = this.colorValue(color);
	        this._styles.fillOpacity = this.alphaValue(color);
	      }
	    }
	    return this._styles;
	  }
	});

	function polygonSymbol (symbolJson, options) {
	  return new PolygonSymbol(symbolJson, options);
	}

	var Renderer$1 = L.Class.extend({
	  options: {
	    proportionalPolygon: false,
	    clickable: true
	  },

	  initialize: function (rendererJson, options) {
	    this._rendererJson = rendererJson;
	    this._pointSymbols = false;
	    this._symbols = [];
	    this._visualVariables = this._parseVisualVariables(rendererJson.visualVariables);
	    L.Util.setOptions(this, options);
	  },

	  _parseVisualVariables: function (visualVariables) {
	    var visVars = {};
	    if (visualVariables) {
	      for (var i = 0; i < visualVariables.length; i++) {
	        visVars[visualVariables[i].type] = visualVariables[i];
	      }
	    }
	    return visVars;
	  },

	  _createDefaultSymbol: function () {
	    if (this._rendererJson.defaultSymbol) {
	      this._defaultSymbol = this._newSymbol(this._rendererJson.defaultSymbol);
	      this._defaultSymbol._isDefault = true;
	    }
	  },

	  _newSymbol: function (symbolJson) {
	    if (symbolJson.type === 'esriSMS' || symbolJson.type === 'esriPMS') {
	      this._pointSymbols = true;
	      return pointSymbol(symbolJson, this.options);
	    }
	    if (symbolJson.type === 'esriSLS') {
	      return lineSymbol(symbolJson, this.options);
	    }
	    if (symbolJson.type === 'esriSFS') {
	      return polygonSymbol(symbolJson, this.options);
	    }
	  },

	  _getSymbol: function () {
	    // override
	  },

	  attachStylesToLayer: function (layer) {
	    if (this._pointSymbols) {
	      layer.options.pointToLayer = L.Util.bind(this.pointToLayer, this);
	    } else {
	      layer.options.style = L.Util.bind(this.style, this);
	      layer._originalStyle = layer.options.style;
	    }
	  },

	  pointToLayer: function (geojson, latlng) {
	    var sym = this._getSymbol(geojson);
	    if (sym && sym.pointToLayer) {
	      // right now custom panes are the only option pushed through
	      return sym.pointToLayer(geojson, latlng, this._visualVariables, this.options);
	    }
	    // invisible symbology
	    return L.circleMarker(latlng, {radius: 0, opacity: 0});
	  },

	  style: function (feature) {
	    var userStyles;
	    if (this.options.userDefinedStyle) {
	      userStyles = this.options.userDefinedStyle(feature);
	    }
	    // find the symbol to represent this feature
	    var sym = this._getSymbol(feature);
	    if (sym) {
	      return this.mergeStyles(sym.style(feature, this._visualVariables), userStyles);
	    } else {
	      // invisible symbology
	      return this.mergeStyles({opacity: 0, fillOpacity: 0}, userStyles);
	    }
	  },

	  mergeStyles: function (styles, userStyles) {
	    var mergedStyles = {};
	    var attr;
	    // copy renderer style attributes
	    for (attr in styles) {
	      if (styles.hasOwnProperty(attr)) {
	        mergedStyles[attr] = styles[attr];
	      }
	    }
	    // override with user defined style attributes
	    if (userStyles) {
	      for (attr in userStyles) {
	        if (userStyles.hasOwnProperty(attr)) {
	          mergedStyles[attr] = userStyles[attr];
	        }
	      }
	    }
	    return mergedStyles;
	  }
	});

	var ClassBreaksRenderer = Renderer$1.extend({
	  initialize: function (rendererJson, options) {
	    Renderer$1.prototype.initialize.call(this, rendererJson, options);
	    this._field = this._rendererJson.field;
	    if (this._rendererJson.normalizationType && this._rendererJson.normalizationType === 'esriNormalizeByField') {
	      this._normalizationField = this._rendererJson.normalizationField;
	    }
	    this._createSymbols();
	  },

	  _createSymbols: function () {
	    var symbol;
	    var classbreaks = this._rendererJson.classBreakInfos;

	    this._symbols = [];

	    // create a symbol for each class break
	    for (var i = classbreaks.length - 1; i >= 0; i--) {
	      if (this.options.proportionalPolygon && this._rendererJson.backgroundFillSymbol) {
	        symbol = this._newSymbol(this._rendererJson.backgroundFillSymbol);
	      } else {
	        symbol = this._newSymbol(classbreaks[i].symbol);
	      }
	      symbol.val = classbreaks[i].classMaxValue;
	      this._symbols.push(symbol);
	    }
	    // sort the symbols in ascending value
	    this._symbols.sort(function (a, b) {
	      return a.val > b.val ? 1 : -1;
	    });
	    this._createDefaultSymbol();
	    this._maxValue = this._symbols[this._symbols.length - 1].val;
	  },

	  _getSymbol: function (feature) {
	    var val = feature.properties[this._field];
	    if (this._normalizationField) {
	      var normValue = feature.properties[this._normalizationField];
	      if (!isNaN(normValue) && normValue !== 0) {
	        val = val / normValue;
	      } else {
	        return this._defaultSymbol;
	      }
	    }

	    if (val > this._maxValue) {
	      return this._defaultSymbol;
	    }
	    var symbol = this._symbols[0];
	    for (var i = this._symbols.length - 1; i >= 0; i--) {
	      if (val > this._symbols[i].val) {
	        break;
	      }
	      symbol = this._symbols[i];
	    }
	    return symbol;
	  }
	});

	function classBreaksRenderer (rendererJson, options) {
	  return new ClassBreaksRenderer(rendererJson, options);
	}

	var UniqueValueRenderer = Renderer$1.extend({
	  initialize: function (rendererJson, options) {
	    Renderer$1.prototype.initialize.call(this, rendererJson, options);
	    this._field = this._rendererJson.field1;
	    this._createSymbols();
	  },

	  _createSymbols: function () {
	    var symbol;
	    var uniques = this._rendererJson.uniqueValueInfos;

	    // create a symbol for each unique value
	    for (var i = uniques.length - 1; i >= 0; i--) {
	      symbol = this._newSymbol(uniques[i].symbol);
	      symbol.val = uniques[i].value;
	      this._symbols.push(symbol);
	    }
	    this._createDefaultSymbol();
	  },

	  _getSymbol: function (feature) {
	    var val = feature.properties[this._field];
	    // accumulate values if there is more than one field defined
	    if (this._rendererJson.fieldDelimiter && this._rendererJson.field2) {
	      var val2 = feature.properties[this._rendererJson.field2];
	      if (val2) {
	        val += this._rendererJson.fieldDelimiter + val2;
	        var val3 = feature.properties[this._rendererJson.field3];
	        if (val3) {
	          val += this._rendererJson.fieldDelimiter + val3;
	        }
	      }
	    }

	    var symbol = this._defaultSymbol;
	    for (var i = this._symbols.length - 1; i >= 0; i--) {
	      // using the === operator does not work if the field
	      // of the unique renderer is not a string
	      /*eslint-disable */
	      if (this._symbols[i].val == val) {
	        symbol = this._symbols[i];
	      }
	      /*eslint-enable */
	    }
	    return symbol;
	  }
	});

	function uniqueValueRenderer (rendererJson, options) {
	  return new UniqueValueRenderer(rendererJson, options);
	}

	var SimpleRenderer = Renderer$1.extend({
	  initialize: function (rendererJson, options) {
	    Renderer$1.prototype.initialize.call(this, rendererJson, options);
	    this._createSymbol();
	  },

	  _createSymbol: function () {
	    if (this._rendererJson.symbol) {
	      this._symbols.push(this._newSymbol(this._rendererJson.symbol));
	    }
	  },

	  _getSymbol: function () {
	    return this._symbols[0];
	  }
	});

	function simpleRenderer (rendererJson, options) {
	  return new SimpleRenderer(rendererJson, options);
	}

	function setRenderer (layerDefinition, layer) {
	  var rend;
	  var rendererInfo = layerDefinition.drawingInfo.renderer;

	  var options = {};

	  if (layer.options.pane) {
	    options.pane = layer.options.pane;
	  }
	  if (layerDefinition.drawingInfo.transparency) {
	    options.layerTransparency = layerDefinition.drawingInfo.transparency;
	  }
	  if (layer.options.style) {
	    options.userDefinedStyle = layer.options.style;
	  }

	  switch (rendererInfo.type) {
	    case 'classBreaks':
	      checkForProportionalSymbols(layerDefinition.geometryType, rendererInfo, layer);
	      if (layer._hasProportionalSymbols) {
	        layer._createPointLayer();
	        var pRend = classBreaksRenderer(rendererInfo, options);
	        pRend.attachStylesToLayer(layer._pointLayer);
	        options.proportionalPolygon = true;
	      }
	      rend = classBreaksRenderer(rendererInfo, options);
	      break;
	    case 'uniqueValue':
	      console.log(rendererInfo, options);
	      rend = uniqueValueRenderer(rendererInfo, options);
	      break;
	    default:
	      rend = simpleRenderer(rendererInfo, options);
	  }
	  rend.attachStylesToLayer(layer);
	}

	function checkForProportionalSymbols (geometryType, renderer, layer) {
	  layer._hasProportionalSymbols = false;
	  if (geometryType === 'esriGeometryPolygon') {
	    if (renderer.backgroundFillSymbol) {
	      layer._hasProportionalSymbols = true;
	    }
	    // check to see if the first symbol in the classbreaks is a marker symbol
	    if (renderer.classBreakInfos && renderer.classBreakInfos.length) {
	      var sym = renderer.classBreakInfos[0].symbol;
	      if (sym && (sym.type === 'esriSMS' || sym.type === 'esriPMS')) {
	        layer._hasProportionalSymbols = true;
	      }
	    }
	  }
	}

	var FeatureCollection = L.GeoJSON.extend({
	  options: {
	    data: {}, // Esri Feature Collection JSON or Item ID
	    opacity: 1
	  },

	  initialize: function (layers, options) {
	    L.setOptions(this, options);

	    this.data = this.options.data;
	    this.opacity = this.options.opacity;
	    this.popupInfo = null;
	    this.labelingInfo = null;
	    this._layers = {};

	    var i, len;

	    if (layers) {
	      for (i = 0, len = layers.length; i < len; i++) {
	        this.addLayer(layers[i]);
	      }
	    }

	    if (typeof this.data === 'string') {
	      this._getFeatureCollection(this.data);
	    } else {
	      this._parseFeatureCollection(this.data);
	    }
	  },

	  _getFeatureCollection: function (itemId) {
	    var url = 'https://www.arcgis.com/sharing/rest/content/items/' + itemId + '/data';
	    L.esri.request(url, {}, function (err, res) {
	      if (err) {
	        console.log(err);
	      } else {
	        this._parseFeatureCollection(res);
	      }
	    }, this);
	  },

	  _parseFeatureCollection: function (data) {
	    var i, len;
	    var index = 0;
	    for (i = 0, len = data.layers.length; i < len; i++) {
	      if (data.layers[i].featureSet.features.length > 0) {
	        index = i;
	      }
	    }
	    var features = data.layers[index].featureSet.features;
	    var geometryType = data.layers[index].layerDefinition.geometryType; // 'esriGeometryPoint' | 'esriGeometryMultipoint' | 'esriGeometryPolyline' | 'esriGeometryPolygon' | 'esriGeometryEnvelope'
	    var objectIdField = data.layers[index].layerDefinition.objectIdField;
	    var layerDefinition = data.layers[index].layerDefinition || null;

	    if (data.layers[index].layerDefinition.extent.spatialReference.wkid !== 4326) {
	      if (data.layers[index].layerDefinition.extent.spatialReference.wkid !== 102100) {
	        console.error('[L.esri.WebMap] this wkid (' + data.layers[index].layerDefinition.extent.spatialReference.wkid + ') is not supported.');
	      }
	      features = this._projTo4326(features, geometryType);
	    }
	    if (data.layers[index].popupInfo !== undefined) {
	      this.popupInfo = data.layers[index].popupInfo;
	    }
	    if (data.layers[index].layerDefinition.drawingInfo.labelingInfo !== undefined) {
	      this.labelingInfo = data.layers[index].layerDefinition.drawingInfo.labelingInfo;
	    }
	    console.log(data);

	    var geojson = this._featureCollectionToGeoJSON(features, objectIdField);

	    if (layerDefinition !== null) {
	      setRenderer(layerDefinition, this);
	    }
	    console.log(geojson);
	    this.addData(geojson);
	  },

	  _projTo4326: function (features, geometryType) {
	    console.log('_project!');
	    var i, len;
	    var projFeatures = [];

	    for (i = 0, len = features.length; i < len; i++) {
	      var f = features[i];
	      var mercatorToLatlng;
	      var j, k;

	      if (geometryType === 'esriGeometryPoint') {
	        mercatorToLatlng = L.Projection.SphericalMercator.unproject(L.point(f.geometry.x, f.geometry.y));
	        f.geometry.x = mercatorToLatlng.lng;
	        f.geometry.y = mercatorToLatlng.lat;
	      } else if (geometryType === 'esriGeometryMultipoint') {
	        var plen;

	        for (j = 0, plen = f.geometry.points.length; j < plen; j++) {
	          mercatorToLatlng = L.Projection.SphericalMercator.unproject(L.point(f.geometry.points[j][0], f.geometry.points[j][1]));
	          f.geometry.points[j][0] = mercatorToLatlng.lng;
	          f.geometry.points[j][1] = mercatorToLatlng.lat;
	        }
	      } else if (geometryType === 'esriGeometryPolyline') {
	        var pathlen, pathslen;

	        for (j = 0, pathslen = f.geometry.paths.length; j < pathslen; j++) {
	          for (k = 0, pathlen = f.geometry.paths[j].length; k < pathlen; k++) {
	            mercatorToLatlng = L.Projection.SphericalMercator.unproject(L.point(f.geometry.paths[j][k][0], f.geometry.paths[j][k][1]));
	            f.geometry.paths[j][k][0] = mercatorToLatlng.lng;
	            f.geometry.paths[j][k][1] = mercatorToLatlng.lat;
	          }
	        }
	      } else if (geometryType === 'esriGeometryPolygon') {
	        var ringlen, ringslen;

	        for (j = 0, ringslen = f.geometry.rings.length; j < ringslen; j++) {
	          for (k = 0, ringlen = f.geometry.rings[j].length; k < ringlen; k++) {
	            mercatorToLatlng = L.Projection.SphericalMercator.unproject(L.point(f.geometry.rings[j][k][0], f.geometry.rings[j][k][1]));
	            f.geometry.rings[j][k][0] = mercatorToLatlng.lng;
	            f.geometry.rings[j][k][1] = mercatorToLatlng.lat;
	          }
	        }
	      }
	      projFeatures.push(f);
	    }

	    return projFeatures;
	  },

	  _featureCollectionToGeoJSON: function (features, objectIdField) {
	    var geojsonFeatureCollection = {
	      type: 'FeatureCollection',
	      features: []
	    };
	    var featuresArray = [];
	    var i, len;

	    for (i = 0, len = features.length; i < len; i++) {
	      var geojson = arcgisToGeoJSON(features[i], objectIdField);
	      featuresArray.push(geojson);
	    }

	    geojsonFeatureCollection.features = featuresArray;

	    return geojsonFeatureCollection;
	  }
	});

	function featureCollection (geojson, options) {
	  return new FeatureCollection(geojson, options);
	}

	var CSVLayer = L.GeoJSON.extend({
	  options: {
	    url: '',
	    data: {}, // Esri Feature Collection JSON or Item ID
	    opacity: 1
	  },

	  initialize: function (layers, options) {
	    L.setOptions(this, options);

	    this.url = this.options.url;
	    this.layerDefinition = this.options.layerDefinition;
	    this.locationInfo = this.options.locationInfo;
	    this.opacity = this.options.opacity;
	    this._layers = {};

	    var i, len;

	    if (layers) {
	      for (i = 0, len = layers.length; i < len; i++) {
	        this.addLayer(layers[i]);
	      }
	    }

	    this._parseCSV(this.url, this.layerDefinition, this.locationInfo);
	  },

	  _parseCSV: function (url, layerDefinition, locationInfo) {
	    omnivore.csv(url, {
	      latfield: locationInfo.latitudeFieldName,
	      lonfield: locationInfo.longitudeFieldName
	    }, this);

	    setRenderer(layerDefinition, this);
	  }
	});

	function csvLayer (geojson, options) {
	  return new CSVLayer(geojson, options);
	}

	var KMLLayer = L.GeoJSON.extend({
	  options: {
	    opacity: 1,
	    url: ''
	  },

	  initialize: function (layers, options) {
	    L.setOptions(this, options);

	    this.url = this.options.url;
	    this.opacity = this.options.opacity;
	    this.popupInfo = null;
	    this.labelingInfo = null;
	    this._layers = {};

	    var i, len;

	    if (layers) {
	      for (i = 0, len = layers.length; i < len; i++) {
	        this.addLayer(layers[i]);
	      }
	    }

	    this._getKML(this.url);
	  },

	  _getKML: function (url) {
	    var requestUrl = 'http://utility.arcgis.com/sharing/kml?url=' + url + '&model=simple&folders=&outSR=%7B"wkid"%3A4326%7D';
	    L.esri.request(requestUrl, {}, function (err, res) {
	      if (err) {
	        console.log(err);
	      } else {
	        console.log(res);
	        this._parseFeatureCollection(res.featureCollection);
	      }
	    }, this);
	  },

	  _parseFeatureCollection: function (featureCollection) {
	    console.log('_parseFeatureCollection');
	    var i;
	    for (i = 0; i < 3; i++) {
	      if (featureCollection.layers[i].featureSet.features.length > 0) {
	        console.log(i);
	        var features = featureCollection.layers[i].featureSet.features;
	        var objectIdField = featureCollection.layers[i].layerDefinition.objectIdField;

	        var geojson = this._featureCollectionToGeoJSON(features, objectIdField);

	        if (featureCollection.layers[i].popupInfo !== undefined) {
	          this.popupInfo = featureCollection.layers[i].popupInfo;
	        }
	        if (featureCollection.layers[i].layerDefinition.drawingInfo.labelingInfo !== undefined) {
	          this.labelingInfo = featureCollection.layers[i].layerDefinition.drawingInfo.labelingInfo;
	        }

	        setRenderer(featureCollection.layers[i].layerDefinition, this);
	        console.log(geojson);
	        this.addData(geojson);
	      }
	    }
	  },

	  _featureCollectionToGeoJSON: function (features, objectIdField) {
	    var geojsonFeatureCollection = {
	      type: 'FeatureCollection',
	      features: []
	    };
	    var featuresArray = [];
	    var i, len;

	    for (i = 0, len = features.length; i < len; i++) {
	      var geojson = arcgisToGeoJSON(features[i], objectIdField);
	      featuresArray.push(geojson);
	    }

	    geojsonFeatureCollection.features = featuresArray;

	    return geojsonFeatureCollection;
	  }
	});

	function kmlLayer (geojson, options) {
	  return new KMLLayer(geojson, options);
	}

	var LabelIcon = L.DivIcon.extend({
	  options: {
	    iconSize: null,
	    className: 'esri-leaflet-webmap-labels',
	    text: ''
	  },

	  createIcon: function (oldIcon) {
	    var div = (oldIcon && oldIcon.tagName === 'DIV') ? oldIcon : document.createElement('div');
	    var options = this.options;

	    div.innerHTML = '<div style="position: relative; left: -50%; text-shadow: 1px 1px 0px #fff, -1px 1px 0px #fff, 1px -1px 0px #fff, -1px -1px 0px #fff;">' + options.text + '</div>';

	    // label.css
	    div.style.fontSize = '1em';
	    div.style.fontWeight = 'bold';
	    div.style.textTransform = 'uppercase';
	    div.style.textAlign = 'center';
	    div.style.whiteSpace = 'nowrap';

	    if (options.bgPos) {
	      var bgPos = L.point(options.bgPos);
	      div.style.backgroundPosition = (-bgPos.x) + 'px ' + (-bgPos.y) + 'px';
	    }
	    this._setIconStyles(div, 'icon');

	    return div;
	  }
	});

	function labelIcon (options) {
	  return new LabelIcon(options);
	}

	var LabelMarker = L.Marker.extend({
	  options: {
	    properties: {},
	    labelingInfo: {},
	    offset: [0, 0]
	  },

	  initialize: function (latlng, options) {
	    L.setOptions(this, options);
	    this._latlng = L.latLng(latlng);

	    var labelText = this._createLabelText(this.options.properties, this.options.labelingInfo);
	    this._setLabelIcon(labelText, this.options.offset);
	  },

	  _createLabelText: function (properties, labelingInfo) {
	    var r = /\[([^\]]*)\]/g;
	    var labelText = labelingInfo[0].labelExpression;

	    labelText = labelText.replace(r, function (s) {
	      var m = r.exec(s);
	      return properties[m[1]];
	    });

	    return labelText;
	  },

	  _setLabelIcon: function (text, offset) {
	    var icon = labelIcon({
	      text: text,
	      iconAnchor: offset
	    });

	    this.setIcon(icon);
	  }
	});

	function labelMarker (latlng, options) {
	  return new LabelMarker(latlng, options);
	}

	function pointLabelPos (coordinates) {
	  var labelPos = { position: [], offset: [] };

	  labelPos.position = coordinates.reverse();
	  labelPos.offset = [20, 20];

	  return labelPos;
	}

	function polylineLabelPos (coordinates) {
	  var labelPos = { position: [], offset: [] };
	  var centralKey;

	  centralKey = Math.round(coordinates.length / 2);
	  labelPos.position = coordinates[centralKey].reverse();
	  labelPos.offset = [0, 0];

	  return labelPos;
	}

	function polygonLabelPos (layer, coordinates) {
	  var labelPos = { position: [], offset: [] };

	  labelPos.position = layer.getBounds().getCenter();
	  labelPos.offset = [0, 0];

	  return labelPos;
	}

	function transformPhoneNumber(value) {
	  var s2 = (""+value).replace(/\D/g, '');
	  var m = s2.match(/^(\d{3})(\d{3})(\d{4})$/);
	  return (!m) ? null : "(" + m[1] + ") " + m[2] + "-" + m[3];
	}

	function transformDate(value) {
	  // var moment = globals.moment;
	  return moment(value).format('MM/DD/YYYY');
	}

	function createPopupContent (popupInfo, properties) {
	  // console.log('popupInfo:', popupInfo);
	  // console.log('popup properties:', properties);
	  var r = /\{([^\]]*)\}/g;
	  var titleText = '';
	  var content = '';

	  if (popupInfo.title !== undefined) {
	    titleText = popupInfo.title;
	  }

	  titleText = titleText.replace(r, function (s) {
	    var m = r.exec(s);
	    return properties[m[1]];
	  });

	  content = '<div class="leaflet-popup-content-title"><h4>' + titleText + '</h4></div><div class="leaflet-popup-content-description" style="max-height:200px;overflow:auto;">';

	  var contentStart = '<div style="font-weight:bold;color:#999;margin-top:5px;word-break:break-all;">'
	  var contentMiddle = '</div><p style="margin-top:0;margin-bottom:5px;word-break:break-all;">'
	  var aTagStart = '<a target="_blank" href="'
	  var emailTagStart = '<a href="mailto:'

	  if (popupInfo.fieldInfos !== undefined) {
	    for (var i = 0; i < popupInfo.fieldInfos.length; i++) {
	      if (popupInfo.fieldInfos[i].visible === true) {
	        // if the info is a URL
	        if (popupInfo.fieldInfos[i].fieldName === 'URL') {
	          content += contentStart
	                  + popupInfo.fieldInfos[i].label
	                  + contentMiddle
	                  + aTagStart
	                  + properties[popupInfo.fieldInfos[i].fieldName]
	                  + '">'
	                  + properties[popupInfo.fieldInfos[i].fieldName]
	                  + '</a></p>';
	        // if the info is an email address
	        } else if (popupInfo.fieldInfos[i].fieldName.includes('EMAIL')) {
	          content += contentStart
	                  + popupInfo.fieldInfos[i].label
	                  + contentMiddle
	                  + emailTagStart
	                  + properties[popupInfo.fieldInfos[i].fieldName]
	                  + '">'
	                  + properties[popupInfo.fieldInfos[i].fieldName]
	                  + '</a></p>';
	        // if the info is a phone number
	        } else if (popupInfo.fieldInfos[i].fieldName.includes('PHONE')) {
	          content += contentStart
	                  + popupInfo.fieldInfos[i].label
	                  + contentMiddle
	                  + transformPhoneNumber(properties[popupInfo.fieldInfos[i].fieldName])
	                  + '</p>';
	        // if the info is a date
	      } else if (popupInfo.fieldInfos[i].fieldName.includes('DATE')) {
	          content += contentStart
	                  + popupInfo.fieldInfos[i].label
	                  + contentMiddle
	                  + transformDate(properties[popupInfo.fieldInfos[i].fieldName])
	                  + '</p>';
	        } else {
	          content += contentStart
	                  + popupInfo.fieldInfos[i].label
	                  + contentMiddle
	                  + properties[popupInfo.fieldInfos[i].fieldName]
	                  + '</p>';
	        }
	      }
	    }
	    content += '</div>';

	  } else if (popupInfo.description !== undefined) {
	    // KMLLayer popup
	    var descriptionText = popupInfo.description.replace(r, function (s) {
	      var m = r.exec(s);
	      return properties[m[1]];
	    });
	    content += descriptionText + '</div>';
	  }

	  // if (popupInfo.mediaInfos.length > 0) {
	    // It does not support mediaInfos for popup contents.
	  // }

	  return content;
	}

	function operationalLayer (layer, layers, map, params, paneName) {
	  return _generateEsriLayer(layer, layers, map, params, paneName);
	}

	function _generateEsriLayer (layer, layers, map, params, paneName) {
	  console.log('generateEsriLayer: ', layer.title, layer);
	  var lyr;
	  var labels = [];
	  var labelsLayer;
	  var labelPaneName = paneName + '-label';
	  var i, len;

	  if (layer.type === 'Feature Collection' || layer.featureCollection !== undefined) {
	    console.log('create FeatureCollection');

	    map.createPane(labelPaneName);

	    var popupInfo, labelingInfo;
	    if (layer.itemId === undefined) {
	      for (i = 0, len = layer.featureCollection.layers.length; i < len; i++) {
	        if (layer.featureCollection.layers[i].featureSet.features.length > 0) {
	          if (layer.featureCollection.layers[i].popupInfo !== undefined && layer.featureCollection.layers[i].popupInfo !== null) {
	            popupInfo = layer.featureCollection.layers[i].popupInfo;
	          }
	          if (layer.featureCollection.layers[i].layerDefinition.drawingInfo.labelingInfo !== undefined && layer.featureCollection.layers[i].layerDefinition.drawingInfo.labelingInfo !== null) {
	            labelingInfo = layer.featureCollection.layers[i].layerDefinition.drawingInfo.labelingInfo;
	          }
	        }
	      }
	    }

	    labelsLayer = L.featureGroup(labels);
	    var fc = featureCollection(null, {
	      data: layer.itemId || layer.featureCollection,
	      opacity: layer.opacity,
	      pane: paneName,
	      onEachFeature: function (geojson, l) {
	        if (fc !== undefined) {
	          popupInfo = fc.popupInfo;
	          labelingInfo = fc.labelingInfo;
	        }
	        if (popupInfo !== undefined && popupInfo !== null) {
	          var popupContent = createPopupContent(popupInfo, geojson.properties);
	          // l.bindPopup(popupContent);
	        }
	        if (labelingInfo !== undefined && labelingInfo !== null) {
	          var coordinates = l.feature.geometry.coordinates;
	          var labelPos;

	          if (l.feature.geometry.type === 'Point') {
	            labelPos = pointLabelPos(coordinates);
	          } else if (l.feature.geometry.type === 'LineString') {
	            labelPos = polylineLabelPos(coordinates);
	          } else if (l.feature.geometry.type === 'MultiLineString') {
	            labelPos = polylineLabelPos(coordinates[Math.round(coordinates.length / 2)]);
	          } else {
	            labelPos = polygonLabelPos(l);
	          }

	          var label = labelMarker(labelPos.position, {
	            zIndexOffset: 1,
	            properties: geojson.properties,
	            labelingInfo: labelingInfo,
	            offset: labelPos.offset,
	            pane: labelPaneName
	          });

	          labelsLayer.addLayer(label);
	        }
	      }
	    });

	    lyr = L.layerGroup([fc, labelsLayer]);

	    layers.push({ type: 'FC', title: layer.title || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'ArcGISFeatureLayer' && layer.layerDefinition !== undefined) {
	    var where = '1=1';
	    if (layer.layerDefinition.drawingInfo !== undefined) {
	      if (layer.layerDefinition.drawingInfo.renderer.type === 'heatmap') {
	        console.log('create HeatmapLayer');
	        var gradient = {};

	        layer.layerDefinition.drawingInfo.renderer.colorStops.map(function (stop) {
	          // gradient[stop.ratio] = 'rgba(' + stop.color[0] + ',' + stop.color[1] + ',' + stop.color[2] + ',' + (stop.color[3]/255) + ')';
	          // gradient[Math.round(stop.ratio*100)/100] = 'rgb(' + stop.color[0] + ',' + stop.color[1] + ',' + stop.color[2] + ')';
	          gradient[(Math.round(stop.ratio * 100) / 100 + 6) / 7] = 'rgb(' + stop.color[0] + ',' + stop.color[1] + ',' + stop.color[2] + ')';
	        });

	        lyr = L.esri.Heat.heatmapFeatureLayer({ // Esri Leaflet 2.0
	        // lyr = L.esri.heatmapFeatureLayer({ // Esri Leaflet 1.0
	          url: layer.url,
	          token: params.token || null,
	          minOpacity: 0.5,
	          max: layer.layerDefinition.drawingInfo.renderer.maxPixelIntensity,
	          blur: layer.layerDefinition.drawingInfo.renderer.blurRadius,
	          radius: layer.layerDefinition.drawingInfo.renderer.blurRadius * 1.3,
	          gradient: gradient,
	          pane: paneName
	        });

	        layers.push({ type: 'HL', title: layer.title || '', layer: lyr });

	        return lyr;
	      } else {
	        console.log('create ArcGISFeatureLayer (with layerDefinition.drawingInfo)');
	        var drawingInfo = layer.layerDefinition.drawingInfo;
	        drawingInfo.transparency = 100 - (layer.opacity * 100);
	        console.log(drawingInfo.transparency);

	        if (layer.layerDefinition.definitionExpression !== undefined) {
	          where = layer.layerDefinition.definitionExpression;
	        }

	        map.createPane(labelPaneName);

	        labelsLayer = L.featureGroup(labels);

	        lyr = L.esri.featureLayer({
	          url: layer.url,
	          where: where,
	          token: params.token || null,
	          drawingInfo: drawingInfo,
	          pane: paneName,
	          onEachFeature: function (geojson, l) {
	            if (layer.popupInfo !== undefined) {
	              var popupContent = createPopupContent(layer.popupInfo, geojson.properties);
	              // l.bindPopup(popupContent);
	            }
	            if (layer.layerDefinition.drawingInfo.labelingInfo !== undefined && layer.layerDefinition.drawingInfo.labelingInfo !== null) {
	              var labelingInfo = layer.layerDefinition.drawingInfo.labelingInfo;
	              var coordinates = l.feature.geometry.coordinates;
	              var labelPos;

	              if (l.feature.geometry.type === 'Point') {
	                labelPos = pointLabelPos(coordinates);
	              } else if (l.feature.geometry.type === 'LineString') {
	                labelPos = polylineLabelPos(coordinates);
	              } else if (l.feature.geometry.type === 'MultiLineString') {
	                labelPos = polylineLabelPos(coordinates[Math.round(coordinates.length / 2)]);
	              } else {
	                labelPos = polygonLabelPos(l);
	              }

	              var label = labelMarker(labelPos.position, {
	                zIndexOffset: 1,
	                properties: geojson.properties,
	                labelingInfo: labelingInfo,
	                offset: labelPos.offset,
	                pane: labelPaneName
	              });

	              labelsLayer.addLayer(label);
	            }
	          }
	        });

	        lyr = L.layerGroup([lyr, labelsLayer]);

	        layers.push({ type: 'FL', title: layer.title || '', layer: lyr });

	        return lyr;
	      }
	    } else {
	      console.log('create ArcGISFeatureLayer (without layerDefinition.drawingInfo)');

	      if (layer.layerDefinition.definitionExpression !== undefined) {
	        where = layer.layerDefinition.definitionExpression;
	      }

	      lyr = L.esri.featureLayer({
	        url: layer.url,
	        token: params.token || null,
	        where: where,
	        pane: paneName,
	        onEachFeature: function (geojson, l) {
	          if (layer.popupInfo !== undefined) {
	            var popupContent = createPopupContent(layer.popupInfo, geojson.properties);
	            // l.bindPopup(popupContent);
	          }
	        }
	      });

	      layers.push({ type: 'FL', title: layer.title || '', layer: lyr });

	      return lyr;
	    }
	  } else if (layer.layerType === 'ArcGISFeatureLayer') {
	    console.log('create ArcGISFeatureLayer');
	    lyr = L.esri.featureLayer({
	      url: layer.url,
	      token: params.token || null,
	      pane: paneName,
	      onEachFeature: function (geojson, l) {
	        if (layer.popupInfo !== undefined) {
	          var popupContent = createPopupContent(layer.popupInfo, geojson.properties);
	          // l.bindPopup(popupContent);
	        }
	      }
	    });

	    layers.push({ type: 'FL', title: layer.title || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'CSV') {
	    labelsLayer = L.featureGroup(labels);
	    lyr = csvLayer(null, {
	      url: layer.url,
	      layerDefinition: layer.layerDefinition,
	      locationInfo: layer.locationInfo,
	      opacity: layer.opacity,
	      pane: paneName,
	      onEachFeature: function (geojson, l) {
	        if (layer.popupInfo !== undefined) {
	          var popupContent = createPopupContent(layer.popupInfo, geojson.properties);
	          // l.bindPopup(popupContent);
	        }
	        if (layer.layerDefinition.drawingInfo.labelingInfo !== undefined && layer.layerDefinition.drawingInfo.labelingInfo !== null) {
	          var labelingInfo = layer.layerDefinition.drawingInfo.labelingInfo;
	          var coordinates = l.feature.geometry.coordinates;
	          var labelPos;

	          if (l.feature.geometry.type === 'Point') {
	            labelPos = pointLabelPos(coordinates);
	          } else if (l.feature.geometry.type === 'LineString') {
	            labelPos = polylineLabelPos(coordinates);
	          } else if (l.feature.geometry.type === 'MultiLineString') {
	            labelPos = polylineLabelPos(coordinates[Math.round(coordinates.length / 2)]);
	          } else {
	            labelPos = polygonLabelPos(l);
	          }

	          var label = labelMarker(labelPos.position, {
	            zIndexOffset: 1,
	            properties: geojson.properties,
	            labelingInfo: labelingInfo,
	            offset: labelPos.offset,
	            pane: labelPaneName
	          });

	          labelsLayer.addLayer(label);
	        }
	      }
	    });

	    lyr = L.layerGroup([lyr, labelsLayer]);

	    layers.push({ type: 'CSV', title: layer.title || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'KML') {
	    labelsLayer = L.featureGroup(labels);
	    var kml = kmlLayer(null, {
	      url: layer.url,
	      opacity: layer.opacity,
	      pane: paneName,
	      onEachFeature: function (geojson, l) {
	        if (kml.popupInfo !== undefined && kml.popupInfo !== null) {
	          console.log(kml.popupInfo);
	          var popupContent = createPopupContent(kml.popupInfo, geojson.properties);
	          // l.bindPopup(popupContent);
	        }
	        if (kml.labelingInfo !== undefined && kml.labelingInfo !== null) {
	          var labelingInfo = kml.labelingInfo;
	          var coordinates = l.feature.geometry.coordinates;
	          var labelPos;

	          if (l.feature.geometry.type === 'Point') {
	            labelPos = pointLabelPos(coordinates);
	          } else if (l.feature.geometry.type === 'LineString') {
	            labelPos = polylineLabelPos(coordinates);
	          } else if (l.feature.geometry.type === 'MultiLineString') {
	            labelPos = polylineLabelPos(coordinates[Math.round(coordinates.length / 2)]);
	          } else {
	            labelPos = polygonLabelPos(l);
	          }

	          var label = labelMarker(labelPos.position, {
	            zIndexOffset: 1,
	            properties: geojson.properties,
	            labelingInfo: labelingInfo,
	            offset: labelPos.offset,
	            pane: labelPaneName
	          });

	          labelsLayer.addLayer(label);
	        }
	      }
	    });

	    lyr = L.layerGroup([kml, labelsLayer]);

	    layers.push({ type: 'KML', title: layer.title || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'ArcGISImageServiceLayer') {
	    console.log('create ArcGISImageServiceLayer');
	    lyr = L.esri.imageMapLayer({
	      url: layer.url,
	      token: params.token || null,
	      pane: paneName,
	      opacity: layer.opacity || 1
	    });

	    layers.push({ type: 'IML', title: layer.title || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'ArcGISMapServiceLayer') {
	    lyr = L.esri.dynamicMapLayer({
	      url: layer.url,
	      token: params.token || null,
	      pane: paneName,
	      opacity: layer.opacity || 1
	    });

	    layers.push({ type: 'DML', title: layer.title || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'ArcGISTiledMapServiceLayer') {
	    try {
	      lyr = L.esri.basemapLayer(layer.title);
	    } catch (e) {
	      lyr = L.esri.tiledMapLayer({
	        url: layer.url,
	        token: params.token || null
	      });

	      L.esri.request(layer.url, {}, function (err, res) {
	        if (err) {
	          console.log(err);
	        } else {
	          var maxWidth = (map.getSize().x - 55);
	          var tiledAttribution = '<span class="esri-attributions" style="line-height:14px; vertical-align: -3px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden; display:inline-block; max-width:' + maxWidth + 'px;">' + res.copyrightText + '</span>';
	          map.attributionControl.addAttribution(tiledAttribution);
	        }
	      });
	    }

	    document.getElementsByClassName('leaflet-tile-pane')[0].style.opacity = layer.opacity || 1;

	    layers.push({ type: 'TML', title: layer.title || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'VectorTileLayer') {
	    var keys = {
	      'World Street Map (with Relief)': 'StreetsRelief',
	      'World Street Map (with Relief) (Mature Support)': 'StreetsRelief',
	      'Hybrid Reference Layer': 'Hybrid',
	      'Hybrid Reference Layer (Mature Support)': 'Hybrid',
	      'World Street Map': 'Streets',
	      'World Street Map (Mature Support)': 'Streets',
	      'World Street Map (Night)': 'StreetsNight',
	      'World Street Map (Night) (Mature Support)': 'StreetsNight',
	      'Dark Gray Canvas': 'DarkGray',
	      'Dark Gray Canvas (Mature Support)': 'DarkGray',
	      'World Topographic Map': 'Topographic',
	      'World Topographic Map (Mature Support)': 'Topographic',
	      'World Navigation Map': 'Navigation',
	      'World Navigation Map (Mature Support)': 'Navigation',
	      'Light Gray Canvas': 'Gray',
	      'Light Gray Canvas (Mature Support)': 'Gray'
	      //'Terrain with Labels': '',
	      //'World Terrain with Labels': '',
	      //'Light Gray Canvas Reference': '',
	      //'Dark Gray Canvas Reference': '',
	      //'Dark Gray Canvas Base': '',
	      //'Light Gray Canvas Base': ''
	    };

	    if (keys[layer.title]) {
	      lyr = L.esri.Vector.basemap(keys[layer.title]);
	    } else {
	      console.error('Unsupported Vector Tile Layer: ', layer);
	      lyr = L.featureGroup([]);
	    }

	    layers.push({ type: 'VTL', title: layer.title || layer.id || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'OpenStreetMap') {
	    lyr = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
	      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
	    });

	    layers.push({ type: 'TL', title: layer.title || layer.id || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'WebTiledLayer') {
	    var lyrUrl = _esriWTLUrlTemplateToLeaflet(layer.templateUrl);
	    lyr = L.tileLayer(lyrUrl, {
	      attribution: layer.copyright
	    });
	    document.getElementsByClassName('leaflet-tile-pane')[0].style.opacity = layer.opacity || 1;

	    layers.push({ type: 'TL', title: layer.title || layer.id || '', layer: lyr });

	    return lyr;
	  } else if (layer.layerType === 'WMS') {
	    var layerNames = '';
	    for (i = 0, len = layer.visibleLayers.length; i < len; i++) {
	      layerNames += layer.visibleLayers[i];
	      if (i < len - 1) {
	        layerNames += ',';
	      }
	    }

	    lyr = L.tileLayer.wms(layer.url, {
	      layers: String(layerNames),
	      format: 'image/png',
	      transparent: true,
	      attribution: layer.copyright
	    });

	    layers.push({ type: 'WMS', title: layer.title || layer.id || '', layer: lyr });

	    return lyr;
	  } else {
	    lyr = L.featureGroup([]);
	    console.log('Unsupported Layer: ', layer);
	    return lyr;
	  }
	}

	function _esriWTLUrlTemplateToLeaflet (url) {
	  var newUrl = url;

	  newUrl = newUrl.replace(/\{level}/g, '{z}');
	  newUrl = newUrl.replace(/\{col}/g, '{x}');
	  newUrl = newUrl.replace(/\{row}/g, '{y}');

	  return newUrl;
	}

	var WebMap = L.Evented.extend({
	  options: {
	    // L.Map
	    map: {},
	    // access token for secure contents on ArcGIS Online
	    token: null,
	    // server domain name (default= 'www.arcgis.com')
	    server: 'www.arcgis.com'
	  },

	  initialize: function (webmapId, options) {
	    L.setOptions(this, options);

	    this._map = this.options.map;
	    this._token = this.options.token;
	    this._server = this.options.server;
	    this._webmapId = webmapId;
	    this._loaded = false;
	    this._metadataLoaded = false;
	    this._loadedLayersNum = 0;
	    this._layersNum = 0;

	    this.layers = []; // Check the layer types here -> https://github.com/ynunokawa/L.esri.WebMap/wiki/Layer-types
	    this.title = ''; // Web Map Title
	    this.bookmarks = []; // Web Map Bookmarks -> [{ name: 'Bookmark name', bounds: <L.latLngBounds> }]
	    this.portalItem = {}; // Web Map Metadata

	    this.VERSION = version;

	    this._loadWebMapMetaData(webmapId);
	    this._loadWebMap(webmapId);
	  },

	  _checkLoaded: function () {
	    this._loadedLayersNum++;
	    if (this._loadedLayersNum === this._layersNum) {
	      this._loaded = true;
	      this.fire('load');
	    }
	  },

	  _operationalLayer: function (layer, layers, map, params, paneName) {
	    var lyr = operationalLayer(layer, layers, map, params);
	    if (lyr !== undefined && layer.visibility === true) {
	      lyr.addTo(map);
	    }
	  },

	  _loadWebMapMetaData: function (id) {
	    var params = {};
	    var map = this._map;
	    var webmap = this;
	    var webmapMetaDataRequestUrl = 'https://' + this._server + '/sharing/rest/content/items/' + id;
	    if (this._token && this._token.length > 0) {
	      params.token = this._token;
	    }

	    L.esri.request(webmapMetaDataRequestUrl, params, function (error, response) {
	      if (error) {
	        console.log(error);
	      } else {
	        console.log('WebMap MetaData: ', response);
	        webmap.portalItem = response;
	        webmap.title = response.title;
	        webmap._metadataLoaded = true;
	        webmap.fire('metadataLoad');
	        map.fitBounds([response.extent[0].reverse(), response.extent[1].reverse()]);
	      }
	    });
	  },

	  _loadWebMap: function (id) {
	    var map = this._map;
	    var layers = this.layers;
	    var server = this._server;
	    var params = {};
	    var webmapRequestUrl = 'https://' + server + '/sharing/rest/content/items/' + id + '/data';
	    if (this._token && this._token.length > 0) {
	      params.token = this._token;
	    }

	    L.esri.request(webmapRequestUrl, params, function (error, response) {
	      if (error) {
	        console.log(error);
	      } else {
	        console.log('WebMap: ', response);
	        this._layersNum = response.baseMap.baseMapLayers.length + response.operationalLayers.length;

	        // Add Basemap
	        response.baseMap.baseMapLayers.map(function (baseMapLayer) {
	          if (baseMapLayer.itemId !== undefined) {
	            var itemRequestUrl = 'https://' + server + '/sharing/rest/content/items/' + baseMapLayer.itemId;
	            L.esri.request(itemRequestUrl, params, function (err, res) {
	              if (err) {
	                console.error(error);
	              } else {
	                console.log(res.access);
	                if (res.access !== 'public') {
	                  this._operationalLayer(baseMapLayer, layers, map, params);
	                } else {
	                  this._operationalLayer(baseMapLayer, layers, map, {});
	                }
	              }
	              this._checkLoaded();
	            }, this);
	          } else {
	            this._operationalLayer(baseMapLayer, layers, map, {});
	            this._checkLoaded();
	          }
	        }.bind(this));

	        // Add Operational Layers
	        response.operationalLayers.map(function (layer, i) {
	          var paneName = 'esri-webmap-layer' + i;
	          map.createPane(paneName);
	          if (layer.itemId !== undefined) {
	            var itemRequestUrl = 'https://' + server + '/sharing/rest/content/items/' + layer.itemId;
	            L.esri.request(itemRequestUrl, params, function (err, res) {
	              if (err) {
	                console.error(error);
	              } else {
	                console.log(res.access);
	                if (res.access !== 'public') {
	                  this._operationalLayer(layer, layers, map, params, paneName);
	                } else {
	                  this._operationalLayer(layer, layers, map, {}, paneName);
	                }
	              }
	              this._checkLoaded();
	            }, this);
	          } else {
	            this._operationalLayer(layer, layers, map, {}, paneName);
	            this._checkLoaded();
	          }
	        }.bind(this));

	        // Add Bookmarks
	        if (response.bookmarks !== undefined && response.bookmarks.length > 0) {
	          response.bookmarks.map(function (bookmark) {
	            // Esri Extent Geometry to L.latLngBounds
	            var northEast = L.Projection.SphericalMercator.unproject(L.point(bookmark.extent.xmax, bookmark.extent.ymax));
	            var southWest = L.Projection.SphericalMercator.unproject(L.point(bookmark.extent.xmin, bookmark.extent.ymin));
	            var bounds = L.latLngBounds(southWest, northEast);
	            this.bookmarks.push({ name: bookmark.name, bounds: bounds });
	          }.bind(this));
	        }

	        //this._loaded = true;
	        //this.fire('load');
	      }
	    }.bind(this));
	  }
	});

	function webMap (webmapId, options) {
	  return new WebMap(webmapId, options);
	}

	exports.WebMap = WebMap;
	exports.webMap = webMap;
	exports.operationalLayer = operationalLayer;
	exports.FeatureCollection = FeatureCollection;
	exports.featureCollection = featureCollection;
	exports.LabelMarker = LabelMarker;
	exports.labelMarker = labelMarker;
	exports.LabelIcon = LabelIcon;
	exports.labelIcon = labelIcon;
	exports.createPopupContent = createPopupContent;

	Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbIi4uL25vZGVfbW9kdWxlcy9hcmNnaXMtdG8tZ2VvanNvbi11dGlscy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lc3JpLWxlYWZsZXQtcmVuZGVyZXJzL3NyYy9TeW1ib2xzL1N5bWJvbC5qcyIsIi4uL25vZGVfbW9kdWxlcy9sZWFmbGV0LXNoYXBlLW1hcmtlcnMvc3JjL1NoYXBlTWFya2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xlYWZsZXQtc2hhcGUtbWFya2Vycy9zcmMvQ3Jvc3NNYXJrZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvbGVhZmxldC1zaGFwZS1tYXJrZXJzL3NyYy9YTWFya2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xlYWZsZXQtc2hhcGUtbWFya2Vycy9zcmMvU3F1YXJlTWFya2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2xlYWZsZXQtc2hhcGUtbWFya2Vycy9zcmMvRGlhbW9uZE1hcmtlci5qcyIsIi4uL25vZGVfbW9kdWxlcy9lc3JpLWxlYWZsZXQtcmVuZGVyZXJzL3NyYy9TeW1ib2xzL1BvaW50U3ltYm9sLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VzcmktbGVhZmxldC1yZW5kZXJlcnMvc3JjL1N5bWJvbHMvTGluZVN5bWJvbC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lc3JpLWxlYWZsZXQtcmVuZGVyZXJzL3NyYy9TeW1ib2xzL1BvbHlnb25TeW1ib2wuanMiLCIuLi9ub2RlX21vZHVsZXMvZXNyaS1sZWFmbGV0LXJlbmRlcmVycy9zcmMvUmVuZGVyZXJzL1JlbmRlcmVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VzcmktbGVhZmxldC1yZW5kZXJlcnMvc3JjL1JlbmRlcmVycy9DbGFzc0JyZWFrc1JlbmRlcmVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VzcmktbGVhZmxldC1yZW5kZXJlcnMvc3JjL1JlbmRlcmVycy9VbmlxdWVWYWx1ZVJlbmRlcmVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VzcmktbGVhZmxldC1yZW5kZXJlcnMvc3JjL1JlbmRlcmVycy9TaW1wbGVSZW5kZXJlci5qcyIsIi4uL3NyYy9GZWF0dXJlQ29sbGVjdGlvbi9SZW5kZXJlci5qcyIsIi4uL3NyYy9GZWF0dXJlQ29sbGVjdGlvbi9GZWF0dXJlQ29sbGVjdGlvbi5qcyIsIi4uL3NyYy9GZWF0dXJlQ29sbGVjdGlvbi9DU1ZMYXllci5qcyIsIi4uL3NyYy9GZWF0dXJlQ29sbGVjdGlvbi9LTUxMYXllci5qcyIsIi4uL3NyYy9MYWJlbC9MYWJlbEljb24uanMiLCIuLi9zcmMvTGFiZWwvTGFiZWxNYXJrZXIuanMiLCIuLi9zcmMvTGFiZWwvUG9pbnRMYWJlbC5qcyIsIi4uL3NyYy9MYWJlbC9Qb2x5bGluZUxhYmVsLmpzIiwiLi4vc3JjL0xhYmVsL1BvbHlnb25MYWJlbC5qcyIsIi4uL3NyYy9Qb3B1cC9Qb3B1cC5qcyIsIi4uL3NyYy9PcGVyYXRpb25hbExheWVyLmpzIiwiLi4vc3JjL1dlYk1hcExvYWRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTcgRXNyaVxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBjaGVja3MgaWYgMiB4LHkgcG9pbnRzIGFyZSBlcXVhbFxuZnVuY3Rpb24gcG9pbnRzRXF1YWwgKGEsIGIpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIGNoZWNrcyBpZiB0aGUgZmlyc3QgYW5kIGxhc3QgcG9pbnRzIG9mIGEgcmluZyBhcmUgZXF1YWwgYW5kIGNsb3NlcyB0aGUgcmluZ1xuZnVuY3Rpb24gY2xvc2VSaW5nIChjb29yZGluYXRlcykge1xuICBpZiAoIXBvaW50c0VxdWFsKGNvb3JkaW5hdGVzWzBdLCBjb29yZGluYXRlc1tjb29yZGluYXRlcy5sZW5ndGggLSAxXSkpIHtcbiAgICBjb29yZGluYXRlcy5wdXNoKGNvb3JkaW5hdGVzWzBdKTtcbiAgfVxuICByZXR1cm4gY29vcmRpbmF0ZXM7XG59XG5cbi8vIGRldGVybWluZSBpZiBwb2x5Z29uIHJpbmcgY29vcmRpbmF0ZXMgYXJlIGNsb2Nrd2lzZS4gY2xvY2t3aXNlIHNpZ25pZmllcyBvdXRlciByaW5nLCBjb3VudGVyLWNsb2Nrd2lzZSBhbiBpbm5lciByaW5nXG4vLyBvciBob2xlLiB0aGlzIGxvZ2ljIHdhcyBmb3VuZCBhdCBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzExNjU2NDcvaG93LXRvLWRldGVybWluZS1pZi1hLWxpc3Qtb2YtcG9seWdvbi1cbi8vIHBvaW50cy1hcmUtaW4tY2xvY2t3aXNlLW9yZGVyXG5mdW5jdGlvbiByaW5nSXNDbG9ja3dpc2UgKHJpbmdUb1Rlc3QpIHtcbiAgdmFyIHRvdGFsID0gMDtcbiAgdmFyIGkgPSAwO1xuICB2YXIgckxlbmd0aCA9IHJpbmdUb1Rlc3QubGVuZ3RoO1xuICB2YXIgcHQxID0gcmluZ1RvVGVzdFtpXTtcbiAgdmFyIHB0MjtcbiAgZm9yIChpOyBpIDwgckxlbmd0aCAtIDE7IGkrKykge1xuICAgIHB0MiA9IHJpbmdUb1Rlc3RbaSArIDFdO1xuICAgIHRvdGFsICs9IChwdDJbMF0gLSBwdDFbMF0pICogKHB0MlsxXSArIHB0MVsxXSk7XG4gICAgcHQxID0gcHQyO1xuICB9XG4gIHJldHVybiAodG90YWwgPj0gMCk7XG59XG5cbi8vIHBvcnRlZCBmcm9tIHRlcnJhZm9ybWVyLmpzIGh0dHBzOi8vZ2l0aHViLmNvbS9Fc3JpL1RlcnJhZm9ybWVyL2Jsb2IvbWFzdGVyL3RlcnJhZm9ybWVyLmpzI0w1MDQtTDUxOVxuZnVuY3Rpb24gdmVydGV4SW50ZXJzZWN0c1ZlcnRleCAoYTEsIGEyLCBiMSwgYjIpIHtcbiAgdmFyIHVhVCA9ICgoYjJbMF0gLSBiMVswXSkgKiAoYTFbMV0gLSBiMVsxXSkpIC0gKChiMlsxXSAtIGIxWzFdKSAqIChhMVswXSAtIGIxWzBdKSk7XG4gIHZhciB1YlQgPSAoKGEyWzBdIC0gYTFbMF0pICogKGExWzFdIC0gYjFbMV0pKSAtICgoYTJbMV0gLSBhMVsxXSkgKiAoYTFbMF0gLSBiMVswXSkpO1xuICB2YXIgdUIgPSAoKGIyWzFdIC0gYjFbMV0pICogKGEyWzBdIC0gYTFbMF0pKSAtICgoYjJbMF0gLSBiMVswXSkgKiAoYTJbMV0gLSBhMVsxXSkpO1xuXG4gIGlmICh1QiAhPT0gMCkge1xuICAgIHZhciB1YSA9IHVhVCAvIHVCO1xuICAgIHZhciB1YiA9IHViVCAvIHVCO1xuXG4gICAgaWYgKHVhID49IDAgJiYgdWEgPD0gMSAmJiB1YiA+PSAwICYmIHViIDw9IDEpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gcG9ydGVkIGZyb20gdGVycmFmb3JtZXIuanMgaHR0cHM6Ly9naXRodWIuY29tL0VzcmkvVGVycmFmb3JtZXIvYmxvYi9tYXN0ZXIvdGVycmFmb3JtZXIuanMjTDUyMS1MNTMxXG5mdW5jdGlvbiBhcnJheUludGVyc2VjdHNBcnJheSAoYSwgYikge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBiLmxlbmd0aCAtIDE7IGorKykge1xuICAgICAgaWYgKHZlcnRleEludGVyc2VjdHNWZXJ0ZXgoYVtpXSwgYVtpICsgMV0sIGJbal0sIGJbaiArIDFdKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIHBvcnRlZCBmcm9tIHRlcnJhZm9ybWVyLmpzIGh0dHBzOi8vZ2l0aHViLmNvbS9Fc3JpL1RlcnJhZm9ybWVyL2Jsb2IvbWFzdGVyL3RlcnJhZm9ybWVyLmpzI0w0NzAtTDQ4MFxuZnVuY3Rpb24gY29vcmRpbmF0ZXNDb250YWluUG9pbnQgKGNvb3JkaW5hdGVzLCBwb2ludCkge1xuICB2YXIgY29udGFpbnMgPSBmYWxzZTtcbiAgZm9yICh2YXIgaSA9IC0xLCBsID0gY29vcmRpbmF0ZXMubGVuZ3RoLCBqID0gbCAtIDE7ICsraSA8IGw7IGogPSBpKSB7XG4gICAgaWYgKCgoY29vcmRpbmF0ZXNbaV1bMV0gPD0gcG9pbnRbMV0gJiYgcG9pbnRbMV0gPCBjb29yZGluYXRlc1tqXVsxXSkgfHxcbiAgICAgICAgIChjb29yZGluYXRlc1tqXVsxXSA8PSBwb2ludFsxXSAmJiBwb2ludFsxXSA8IGNvb3JkaW5hdGVzW2ldWzFdKSkgJiZcbiAgICAgICAgKHBvaW50WzBdIDwgKCgoY29vcmRpbmF0ZXNbal1bMF0gLSBjb29yZGluYXRlc1tpXVswXSkgKiAocG9pbnRbMV0gLSBjb29yZGluYXRlc1tpXVsxXSkpIC8gKGNvb3JkaW5hdGVzW2pdWzFdIC0gY29vcmRpbmF0ZXNbaV1bMV0pKSArIGNvb3JkaW5hdGVzW2ldWzBdKSkge1xuICAgICAgY29udGFpbnMgPSAhY29udGFpbnM7XG4gICAgfVxuICB9XG4gIHJldHVybiBjb250YWlucztcbn1cblxuLy8gcG9ydGVkIGZyb20gdGVycmFmb3JtZXItYXJjZ2lzLXBhcnNlci5qcyBodHRwczovL2dpdGh1Yi5jb20vRXNyaS90ZXJyYWZvcm1lci1hcmNnaXMtcGFyc2VyL2Jsb2IvbWFzdGVyL3RlcnJhZm9ybWVyLWFyY2dpcy1wYXJzZXIuanMjTDEwNi1MMTEzXG5mdW5jdGlvbiBjb29yZGluYXRlc0NvbnRhaW5Db29yZGluYXRlcyAob3V0ZXIsIGlubmVyKSB7XG4gIHZhciBpbnRlcnNlY3RzID0gYXJyYXlJbnRlcnNlY3RzQXJyYXkob3V0ZXIsIGlubmVyKTtcbiAgdmFyIGNvbnRhaW5zID0gY29vcmRpbmF0ZXNDb250YWluUG9pbnQob3V0ZXIsIGlubmVyWzBdKTtcbiAgaWYgKCFpbnRlcnNlY3RzICYmIGNvbnRhaW5zKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBkbyBhbnkgcG9seWdvbnMgaW4gdGhpcyBhcnJheSBjb250YWluIGFueSBvdGhlciBwb2x5Z29ucyBpbiB0aGlzIGFycmF5P1xuLy8gdXNlZCBmb3IgY2hlY2tpbmcgZm9yIGhvbGVzIGluIGFyY2dpcyByaW5nc1xuLy8gcG9ydGVkIGZyb20gdGVycmFmb3JtZXItYXJjZ2lzLXBhcnNlci5qcyBodHRwczovL2dpdGh1Yi5jb20vRXNyaS90ZXJyYWZvcm1lci1hcmNnaXMtcGFyc2VyL2Jsb2IvbWFzdGVyL3RlcnJhZm9ybWVyLWFyY2dpcy1wYXJzZXIuanMjTDExNy1MMTcyXG5mdW5jdGlvbiBjb252ZXJ0UmluZ3NUb0dlb0pTT04gKHJpbmdzKSB7XG4gIHZhciBvdXRlclJpbmdzID0gW107XG4gIHZhciBob2xlcyA9IFtdO1xuICB2YXIgeDsgLy8gaXRlcmF0b3JcbiAgdmFyIG91dGVyUmluZzsgLy8gY3VycmVudCBvdXRlciByaW5nIGJlaW5nIGV2YWx1YXRlZFxuICB2YXIgaG9sZTsgLy8gY3VycmVudCBob2xlIGJlaW5nIGV2YWx1YXRlZFxuXG4gIC8vIGZvciBlYWNoIHJpbmdcbiAgZm9yICh2YXIgciA9IDA7IHIgPCByaW5ncy5sZW5ndGg7IHIrKykge1xuICAgIHZhciByaW5nID0gY2xvc2VSaW5nKHJpbmdzW3JdLnNsaWNlKDApKTtcbiAgICBpZiAocmluZy5sZW5ndGggPCA0KSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgLy8gaXMgdGhpcyByaW5nIGFuIG91dGVyIHJpbmc/IGlzIGl0IGNsb2Nrd2lzZT9cbiAgICBpZiAocmluZ0lzQ2xvY2t3aXNlKHJpbmcpKSB7XG4gICAgICB2YXIgcG9seWdvbiA9IFsgcmluZyBdO1xuICAgICAgb3V0ZXJSaW5ncy5wdXNoKHBvbHlnb24pOyAvLyBwdXNoIHRvIG91dGVyIHJpbmdzXG4gICAgfSBlbHNlIHtcbiAgICAgIGhvbGVzLnB1c2gocmluZyk7IC8vIGNvdW50ZXJjbG9ja3dpc2UgcHVzaCB0byBob2xlc1xuICAgIH1cbiAgfVxuXG4gIHZhciB1bmNvbnRhaW5lZEhvbGVzID0gW107XG5cbiAgLy8gd2hpbGUgdGhlcmUgYXJlIGhvbGVzIGxlZnQuLi5cbiAgd2hpbGUgKGhvbGVzLmxlbmd0aCkge1xuICAgIC8vIHBvcCBhIGhvbGUgb2ZmIG91dCBzdGFja1xuICAgIGhvbGUgPSBob2xlcy5wb3AoKTtcblxuICAgIC8vIGxvb3Agb3ZlciBhbGwgb3V0ZXIgcmluZ3MgYW5kIHNlZSBpZiB0aGV5IGNvbnRhaW4gb3VyIGhvbGUuXG4gICAgdmFyIGNvbnRhaW5lZCA9IGZhbHNlO1xuICAgIGZvciAoeCA9IG91dGVyUmluZ3MubGVuZ3RoIC0gMTsgeCA+PSAwOyB4LS0pIHtcbiAgICAgIG91dGVyUmluZyA9IG91dGVyUmluZ3NbeF1bMF07XG4gICAgICBpZiAoY29vcmRpbmF0ZXNDb250YWluQ29vcmRpbmF0ZXMob3V0ZXJSaW5nLCBob2xlKSkge1xuICAgICAgICAvLyB0aGUgaG9sZSBpcyBjb250YWluZWQgcHVzaCBpdCBpbnRvIG91ciBwb2x5Z29uXG4gICAgICAgIG91dGVyUmluZ3NbeF0ucHVzaChob2xlKTtcbiAgICAgICAgY29udGFpbmVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gcmluZyBpcyBub3QgY29udGFpbmVkIGluIGFueSBvdXRlciByaW5nXG4gICAgLy8gc29tZXRpbWVzIHRoaXMgaGFwcGVucyBodHRwczovL2dpdGh1Yi5jb20vRXNyaS9lc3JpLWxlYWZsZXQvaXNzdWVzLzMyMFxuICAgIGlmICghY29udGFpbmVkKSB7XG4gICAgICB1bmNvbnRhaW5lZEhvbGVzLnB1c2goaG9sZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgd2UgY291bGRuJ3QgbWF0Y2ggYW55IGhvbGVzIHVzaW5nIGNvbnRhaW5zIHdlIGNhbiB0cnkgaW50ZXJzZWN0cy4uLlxuICB3aGlsZSAodW5jb250YWluZWRIb2xlcy5sZW5ndGgpIHtcbiAgICAvLyBwb3AgYSBob2xlIG9mZiBvdXQgc3RhY2tcbiAgICBob2xlID0gdW5jb250YWluZWRIb2xlcy5wb3AoKTtcblxuICAgIC8vIGxvb3Agb3ZlciBhbGwgb3V0ZXIgcmluZ3MgYW5kIHNlZSBpZiBhbnkgaW50ZXJzZWN0IG91ciBob2xlLlxuICAgIHZhciBpbnRlcnNlY3RzID0gZmFsc2U7XG5cbiAgICBmb3IgKHggPSBvdXRlclJpbmdzLmxlbmd0aCAtIDE7IHggPj0gMDsgeC0tKSB7XG4gICAgICBvdXRlclJpbmcgPSBvdXRlclJpbmdzW3hdWzBdO1xuICAgICAgaWYgKGFycmF5SW50ZXJzZWN0c0FycmF5KG91dGVyUmluZywgaG9sZSkpIHtcbiAgICAgICAgLy8gdGhlIGhvbGUgaXMgY29udGFpbmVkIHB1c2ggaXQgaW50byBvdXIgcG9seWdvblxuICAgICAgICBvdXRlclJpbmdzW3hdLnB1c2goaG9sZSk7XG4gICAgICAgIGludGVyc2VjdHMgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWludGVyc2VjdHMpIHtcbiAgICAgIG91dGVyUmluZ3MucHVzaChbaG9sZS5yZXZlcnNlKCldKTtcbiAgICB9XG4gIH1cblxuICBpZiAob3V0ZXJSaW5ncy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ1BvbHlnb24nLFxuICAgICAgY29vcmRpbmF0ZXM6IG91dGVyUmluZ3NbMF1cbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiAnTXVsdGlQb2x5Z29uJyxcbiAgICAgIGNvb3JkaW5hdGVzOiBvdXRlclJpbmdzXG4gICAgfTtcbiAgfVxufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGVuc3VyZXMgdGhhdCByaW5ncyBhcmUgb3JpZW50ZWQgaW4gdGhlIHJpZ2h0IGRpcmVjdGlvbnNcbi8vIG91dGVyIHJpbmdzIGFyZSBjbG9ja3dpc2UsIGhvbGVzIGFyZSBjb3VudGVyY2xvY2t3aXNlXG4vLyB1c2VkIGZvciBjb252ZXJ0aW5nIEdlb0pTT04gUG9seWdvbnMgdG8gQXJjR0lTIFBvbHlnb25zXG5mdW5jdGlvbiBvcmllbnRSaW5ncyAocG9seSkge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIHZhciBwb2x5Z29uID0gcG9seS5zbGljZSgwKTtcbiAgdmFyIG91dGVyUmluZyA9IGNsb3NlUmluZyhwb2x5Z29uLnNoaWZ0KCkuc2xpY2UoMCkpO1xuICBpZiAob3V0ZXJSaW5nLmxlbmd0aCA+PSA0KSB7XG4gICAgaWYgKCFyaW5nSXNDbG9ja3dpc2Uob3V0ZXJSaW5nKSkge1xuICAgICAgb3V0ZXJSaW5nLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICBvdXRwdXQucHVzaChvdXRlclJpbmcpO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwb2x5Z29uLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgaG9sZSA9IGNsb3NlUmluZyhwb2x5Z29uW2ldLnNsaWNlKDApKTtcbiAgICAgIGlmIChob2xlLmxlbmd0aCA+PSA0KSB7XG4gICAgICAgIGlmIChyaW5nSXNDbG9ja3dpc2UoaG9sZSkpIHtcbiAgICAgICAgICBob2xlLnJldmVyc2UoKTtcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXQucHVzaChob2xlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGZsYXR0ZW5zIGhvbGVzIGluIG11bHRpcG9seWdvbnMgdG8gb25lIGFycmF5IG9mIHBvbHlnb25zXG4vLyB1c2VkIGZvciBjb252ZXJ0aW5nIEdlb0pTT04gUG9seWdvbnMgdG8gQXJjR0lTIFBvbHlnb25zXG5mdW5jdGlvbiBmbGF0dGVuTXVsdGlQb2x5Z29uUmluZ3MgKHJpbmdzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCByaW5ncy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBwb2x5Z29uID0gb3JpZW50UmluZ3MocmluZ3NbaV0pO1xuICAgIGZvciAodmFyIHggPSBwb2x5Z29uLmxlbmd0aCAtIDE7IHggPj0gMDsgeC0tKSB7XG4gICAgICB2YXIgcmluZyA9IHBvbHlnb25beF0uc2xpY2UoMCk7XG4gICAgICBvdXRwdXQucHVzaChyaW5nKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuLy8gc2hhbGxvdyBvYmplY3QgY2xvbmUgZm9yIGZlYXR1cmUgcHJvcGVydGllcyBhbmQgYXR0cmlidXRlc1xuLy8gZnJvbSBodHRwOi8vanNwZXJmLmNvbS9jbG9uaW5nLWFuLW9iamVjdC8yXG5mdW5jdGlvbiBzaGFsbG93Q2xvbmUgKG9iaikge1xuICB2YXIgdGFyZ2V0ID0ge307XG4gIGZvciAodmFyIGkgaW4gb2JqKSB7XG4gICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgdGFyZ2V0W2ldID0gb2JqW2ldO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdGFyZ2V0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXJjZ2lzVG9HZW9KU09OIChhcmNnaXMsIGlkQXR0cmlidXRlKSB7XG4gIHZhciBnZW9qc29uID0ge307XG5cbiAgaWYgKHR5cGVvZiBhcmNnaXMueCA9PT0gJ251bWJlcicgJiYgdHlwZW9mIGFyY2dpcy55ID09PSAnbnVtYmVyJykge1xuICAgIGdlb2pzb24udHlwZSA9ICdQb2ludCc7XG4gICAgZ2VvanNvbi5jb29yZGluYXRlcyA9IFthcmNnaXMueCwgYXJjZ2lzLnldO1xuICB9XG5cbiAgaWYgKGFyY2dpcy5wb2ludHMpIHtcbiAgICBnZW9qc29uLnR5cGUgPSAnTXVsdGlQb2ludCc7XG4gICAgZ2VvanNvbi5jb29yZGluYXRlcyA9IGFyY2dpcy5wb2ludHMuc2xpY2UoMCk7XG4gIH1cblxuICBpZiAoYXJjZ2lzLnBhdGhzKSB7XG4gICAgaWYgKGFyY2dpcy5wYXRocy5sZW5ndGggPT09IDEpIHtcbiAgICAgIGdlb2pzb24udHlwZSA9ICdMaW5lU3RyaW5nJztcbiAgICAgIGdlb2pzb24uY29vcmRpbmF0ZXMgPSBhcmNnaXMucGF0aHNbMF0uc2xpY2UoMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGdlb2pzb24udHlwZSA9ICdNdWx0aUxpbmVTdHJpbmcnO1xuICAgICAgZ2VvanNvbi5jb29yZGluYXRlcyA9IGFyY2dpcy5wYXRocy5zbGljZSgwKTtcbiAgICB9XG4gIH1cblxuICBpZiAoYXJjZ2lzLnJpbmdzKSB7XG4gICAgZ2VvanNvbiA9IGNvbnZlcnRSaW5nc1RvR2VvSlNPTihhcmNnaXMucmluZ3Muc2xpY2UoMCkpO1xuICB9XG5cbiAgaWYgKGFyY2dpcy5nZW9tZXRyeSB8fCBhcmNnaXMuYXR0cmlidXRlcykge1xuICAgIGdlb2pzb24udHlwZSA9ICdGZWF0dXJlJztcbiAgICBnZW9qc29uLmdlb21ldHJ5ID0gKGFyY2dpcy5nZW9tZXRyeSkgPyBhcmNnaXNUb0dlb0pTT04oYXJjZ2lzLmdlb21ldHJ5KSA6IG51bGw7XG4gICAgZ2VvanNvbi5wcm9wZXJ0aWVzID0gKGFyY2dpcy5hdHRyaWJ1dGVzKSA/IHNoYWxsb3dDbG9uZShhcmNnaXMuYXR0cmlidXRlcykgOiBudWxsO1xuICAgIGlmIChhcmNnaXMuYXR0cmlidXRlcykge1xuICAgICAgZ2VvanNvbi5pZCA9IGFyY2dpcy5hdHRyaWJ1dGVzW2lkQXR0cmlidXRlXSB8fCBhcmNnaXMuYXR0cmlidXRlcy5PQkpFQ1RJRCB8fCBhcmNnaXMuYXR0cmlidXRlcy5GSUQ7XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgbm8gdmFsaWQgZ2VvbWV0cnkgd2FzIGVuY291bnRlcmVkXG4gIGlmIChKU09OLnN0cmluZ2lmeShnZW9qc29uLmdlb21ldHJ5KSA9PT0gSlNPTi5zdHJpbmdpZnkoe30pKSB7XG4gICAgZ2VvanNvbi5nZW9tZXRyeSA9IG51bGw7XG4gIH1cblxuICByZXR1cm4gZ2VvanNvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlb2pzb25Ub0FyY0dJUyAoZ2VvanNvbiwgaWRBdHRyaWJ1dGUpIHtcbiAgaWRBdHRyaWJ1dGUgPSBpZEF0dHJpYnV0ZSB8fCAnT0JKRUNUSUQnO1xuICB2YXIgc3BhdGlhbFJlZmVyZW5jZSA9IHsgd2tpZDogNDMyNiB9O1xuICB2YXIgcmVzdWx0ID0ge307XG4gIHZhciBpO1xuXG4gIHN3aXRjaCAoZ2VvanNvbi50eXBlKSB7XG4gICAgY2FzZSAnUG9pbnQnOlxuICAgICAgcmVzdWx0LnggPSBnZW9qc29uLmNvb3JkaW5hdGVzWzBdO1xuICAgICAgcmVzdWx0LnkgPSBnZW9qc29uLmNvb3JkaW5hdGVzWzFdO1xuICAgICAgcmVzdWx0LnNwYXRpYWxSZWZlcmVuY2UgPSBzcGF0aWFsUmVmZXJlbmNlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnTXVsdGlQb2ludCc6XG4gICAgICByZXN1bHQucG9pbnRzID0gZ2VvanNvbi5jb29yZGluYXRlcy5zbGljZSgwKTtcbiAgICAgIHJlc3VsdC5zcGF0aWFsUmVmZXJlbmNlID0gc3BhdGlhbFJlZmVyZW5jZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ0xpbmVTdHJpbmcnOlxuICAgICAgcmVzdWx0LnBhdGhzID0gW2dlb2pzb24uY29vcmRpbmF0ZXMuc2xpY2UoMCldO1xuICAgICAgcmVzdWx0LnNwYXRpYWxSZWZlcmVuY2UgPSBzcGF0aWFsUmVmZXJlbmNlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnTXVsdGlMaW5lU3RyaW5nJzpcbiAgICAgIHJlc3VsdC5wYXRocyA9IGdlb2pzb24uY29vcmRpbmF0ZXMuc2xpY2UoMCk7XG4gICAgICByZXN1bHQuc3BhdGlhbFJlZmVyZW5jZSA9IHNwYXRpYWxSZWZlcmVuY2U7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdQb2x5Z29uJzpcbiAgICAgIHJlc3VsdC5yaW5ncyA9IG9yaWVudFJpbmdzKGdlb2pzb24uY29vcmRpbmF0ZXMuc2xpY2UoMCkpO1xuICAgICAgcmVzdWx0LnNwYXRpYWxSZWZlcmVuY2UgPSBzcGF0aWFsUmVmZXJlbmNlO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnTXVsdGlQb2x5Z29uJzpcbiAgICAgIHJlc3VsdC5yaW5ncyA9IGZsYXR0ZW5NdWx0aVBvbHlnb25SaW5ncyhnZW9qc29uLmNvb3JkaW5hdGVzLnNsaWNlKDApKTtcbiAgICAgIHJlc3VsdC5zcGF0aWFsUmVmZXJlbmNlID0gc3BhdGlhbFJlZmVyZW5jZTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ0ZlYXR1cmUnOlxuICAgICAgaWYgKGdlb2pzb24uZ2VvbWV0cnkpIHtcbiAgICAgICAgcmVzdWx0Lmdlb21ldHJ5ID0gZ2VvanNvblRvQXJjR0lTKGdlb2pzb24uZ2VvbWV0cnksIGlkQXR0cmlidXRlKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5hdHRyaWJ1dGVzID0gKGdlb2pzb24ucHJvcGVydGllcykgPyBzaGFsbG93Q2xvbmUoZ2VvanNvbi5wcm9wZXJ0aWVzKSA6IHt9O1xuICAgICAgaWYgKGdlb2pzb24uaWQpIHtcbiAgICAgICAgcmVzdWx0LmF0dHJpYnV0ZXNbaWRBdHRyaWJ1dGVdID0gZ2VvanNvbi5pZDtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ0ZlYXR1cmVDb2xsZWN0aW9uJzpcbiAgICAgIHJlc3VsdCA9IFtdO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGdlb2pzb24uZmVhdHVyZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcmVzdWx0LnB1c2goZ2VvanNvblRvQXJjR0lTKGdlb2pzb24uZmVhdHVyZXNbaV0sIGlkQXR0cmlidXRlKSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdHZW9tZXRyeUNvbGxlY3Rpb24nOlxuICAgICAgcmVzdWx0ID0gW107XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgZ2VvanNvbi5nZW9tZXRyaWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKGdlb2pzb25Ub0FyY0dJUyhnZW9qc29uLmdlb21ldHJpZXNbaV0sIGlkQXR0cmlidXRlKSk7XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgYXJjZ2lzVG9HZW9KU09OLCBnZW9qc29uVG9BcmNHSVMgfTtcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xuXG5leHBvcnQgdmFyIFN5bWJvbCA9IEwuQ2xhc3MuZXh0ZW5kKHtcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKHN5bWJvbEpzb24sIG9wdGlvbnMpIHtcbiAgICB0aGlzLl9zeW1ib2xKc29uID0gc3ltYm9sSnNvbjtcbiAgICB0aGlzLnZhbCA9IG51bGw7XG4gICAgdGhpcy5fc3R5bGVzID0ge307XG4gICAgdGhpcy5faXNEZWZhdWx0ID0gZmFsc2U7XG4gICAgdGhpcy5fbGF5ZXJUcmFuc3BhcmVuY3kgPSAxO1xuICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMubGF5ZXJUcmFuc3BhcmVuY3kpIHtcbiAgICAgIHRoaXMuX2xheWVyVHJhbnNwYXJlbmN5ID0gMSAtIChvcHRpb25zLmxheWVyVHJhbnNwYXJlbmN5IC8gMTAwLjApO1xuICAgIH1cbiAgfSxcblxuICAvLyB0aGUgZ2VvanNvbiB2YWx1ZXMgcmV0dXJuZWQgYXJlIGluIHBvaW50c1xuICBwaXhlbFZhbHVlOiBmdW5jdGlvbiAocG9pbnRWYWx1ZSkge1xuICAgIHJldHVybiBwb2ludFZhbHVlICogMS4zMzM7XG4gIH0sXG5cbiAgLy8gY29sb3IgaXMgYW4gYXJyYXkgW3IsZyxiLGFdXG4gIGNvbG9yVmFsdWU6IGZ1bmN0aW9uIChjb2xvcikge1xuICAgIHJldHVybiAncmdiKCcgKyBjb2xvclswXSArICcsJyArIGNvbG9yWzFdICsgJywnICsgY29sb3JbMl0gKyAnKSc7XG4gIH0sXG5cbiAgYWxwaGFWYWx1ZTogZnVuY3Rpb24gKGNvbG9yKSB7XG4gICAgdmFyIGFscGhhID0gY29sb3JbM10gLyAyNTUuMDtcbiAgICByZXR1cm4gYWxwaGEgKiB0aGlzLl9sYXllclRyYW5zcGFyZW5jeTtcbiAgfSxcblxuICBnZXRTaXplOiBmdW5jdGlvbiAoZmVhdHVyZSwgc2l6ZUluZm8pIHtcbiAgICB2YXIgYXR0ciA9IGZlYXR1cmUucHJvcGVydGllcztcbiAgICB2YXIgZmllbGQgPSBzaXplSW5mby5maWVsZDtcbiAgICB2YXIgc2l6ZSA9IDA7XG4gICAgdmFyIGZlYXR1cmVWYWx1ZSA9IG51bGw7XG5cbiAgICBpZiAoZmllbGQpIHtcbiAgICAgIGZlYXR1cmVWYWx1ZSA9IGF0dHJbZmllbGRdO1xuICAgICAgdmFyIG1pblNpemUgPSBzaXplSW5mby5taW5TaXplO1xuICAgICAgdmFyIG1heFNpemUgPSBzaXplSW5mby5tYXhTaXplO1xuICAgICAgdmFyIG1pbkRhdGFWYWx1ZSA9IHNpemVJbmZvLm1pbkRhdGFWYWx1ZTtcbiAgICAgIHZhciBtYXhEYXRhVmFsdWUgPSBzaXplSW5mby5tYXhEYXRhVmFsdWU7XG4gICAgICB2YXIgZmVhdHVyZVJhdGlvO1xuICAgICAgdmFyIG5vcm1GaWVsZCA9IHNpemVJbmZvLm5vcm1hbGl6YXRpb25GaWVsZDtcbiAgICAgIHZhciBub3JtVmFsdWUgPSBhdHRyID8gcGFyc2VGbG9hdChhdHRyW25vcm1GaWVsZF0pIDogdW5kZWZpbmVkO1xuXG4gICAgICBpZiAoZmVhdHVyZVZhbHVlID09PSBudWxsIHx8IChub3JtRmllbGQgJiYgKChpc05hTihub3JtVmFsdWUpIHx8IG5vcm1WYWx1ZSA9PT0gMCkpKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgaWYgKCFpc05hTihub3JtVmFsdWUpKSB7XG4gICAgICAgIGZlYXR1cmVWYWx1ZSAvPSBub3JtVmFsdWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChtaW5TaXplICE9PSBudWxsICYmIG1heFNpemUgIT09IG51bGwgJiYgbWluRGF0YVZhbHVlICE9PSBudWxsICYmIG1heERhdGFWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoZmVhdHVyZVZhbHVlIDw9IG1pbkRhdGFWYWx1ZSkge1xuICAgICAgICAgIHNpemUgPSBtaW5TaXplO1xuICAgICAgICB9IGVsc2UgaWYgKGZlYXR1cmVWYWx1ZSA+PSBtYXhEYXRhVmFsdWUpIHtcbiAgICAgICAgICBzaXplID0gbWF4U2l6ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmZWF0dXJlUmF0aW8gPSAoZmVhdHVyZVZhbHVlIC0gbWluRGF0YVZhbHVlKSAvIChtYXhEYXRhVmFsdWUgLSBtaW5EYXRhVmFsdWUpO1xuICAgICAgICAgIHNpemUgPSBtaW5TaXplICsgKGZlYXR1cmVSYXRpbyAqIChtYXhTaXplIC0gbWluU2l6ZSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzaXplID0gaXNOYU4oc2l6ZSkgPyAwIDogc2l6ZTtcbiAgICB9XG4gICAgcmV0dXJuIHNpemU7XG4gIH0sXG5cbiAgZ2V0Q29sb3I6IGZ1bmN0aW9uIChmZWF0dXJlLCBjb2xvckluZm8pIHtcbiAgICAvLyByZXF1aXJlZCBpbmZvcm1hdGlvbiB0byBnZXQgY29sb3JcbiAgICBpZiAoIShmZWF0dXJlLnByb3BlcnRpZXMgJiYgY29sb3JJbmZvICYmIGNvbG9ySW5mby5maWVsZCAmJiBjb2xvckluZm8uc3RvcHMpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgYXR0ciA9IGZlYXR1cmUucHJvcGVydGllcztcbiAgICB2YXIgZmVhdHVyZVZhbHVlID0gYXR0cltjb2xvckluZm8uZmllbGRdO1xuICAgIHZhciBsb3dlckJvdW5kQ29sb3IsIHVwcGVyQm91bmRDb2xvciwgbG93ZXJCb3VuZCwgdXBwZXJCb3VuZDtcbiAgICB2YXIgbm9ybUZpZWxkID0gY29sb3JJbmZvLm5vcm1hbGl6YXRpb25GaWVsZDtcbiAgICB2YXIgbm9ybVZhbHVlID0gYXR0ciA/IHBhcnNlRmxvYXQoYXR0cltub3JtRmllbGRdKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoZmVhdHVyZVZhbHVlID09PSBudWxsIHx8IChub3JtRmllbGQgJiYgKChpc05hTihub3JtVmFsdWUpIHx8IG5vcm1WYWx1ZSA9PT0gMCkpKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgaWYgKCFpc05hTihub3JtVmFsdWUpKSB7XG4gICAgICBmZWF0dXJlVmFsdWUgLz0gbm9ybVZhbHVlO1xuICAgIH1cblxuICAgIGlmIChmZWF0dXJlVmFsdWUgPD0gY29sb3JJbmZvLnN0b3BzWzBdLnZhbHVlKSB7XG4gICAgICByZXR1cm4gY29sb3JJbmZvLnN0b3BzWzBdLmNvbG9yO1xuICAgIH1cbiAgICB2YXIgbGFzdFN0b3AgPSBjb2xvckluZm8uc3RvcHNbY29sb3JJbmZvLnN0b3BzLmxlbmd0aCAtIDFdO1xuICAgIGlmIChmZWF0dXJlVmFsdWUgPj0gbGFzdFN0b3AudmFsdWUpIHtcbiAgICAgIHJldHVybiBsYXN0U3RvcC5jb2xvcjtcbiAgICB9XG5cbiAgICAvLyBnbyB0aHJvdWdoIHRoZSBzdG9wcyB0byBmaW5kIG1pbiBhbmQgbWF4XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb2xvckluZm8uc3RvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBzdG9wSW5mbyA9IGNvbG9ySW5mby5zdG9wc1tpXTtcblxuICAgICAgaWYgKHN0b3BJbmZvLnZhbHVlIDw9IGZlYXR1cmVWYWx1ZSkge1xuICAgICAgICBsb3dlckJvdW5kQ29sb3IgPSBzdG9wSW5mby5jb2xvcjtcbiAgICAgICAgbG93ZXJCb3VuZCA9IHN0b3BJbmZvLnZhbHVlO1xuICAgICAgfSBlbHNlIGlmIChzdG9wSW5mby52YWx1ZSA+IGZlYXR1cmVWYWx1ZSkge1xuICAgICAgICB1cHBlckJvdW5kQ29sb3IgPSBzdG9wSW5mby5jb2xvcjtcbiAgICAgICAgdXBwZXJCb3VuZCA9IHN0b3BJbmZvLnZhbHVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBmZWF0dXJlIGZhbGxzIGJldHdlZW4gdHdvIHN0b3BzLCBpbnRlcnBsYXRlIHRoZSBjb2xvcnNcbiAgICBpZiAoIWlzTmFOKGxvd2VyQm91bmQpICYmICFpc05hTih1cHBlckJvdW5kKSkge1xuICAgICAgdmFyIHJhbmdlID0gdXBwZXJCb3VuZCAtIGxvd2VyQm91bmQ7XG4gICAgICBpZiAocmFuZ2UgPiAwKSB7XG4gICAgICAgIC8vIG1vcmUgd2VpZ2h0IHRoZSBmdXJ0aGVyIGl0IGlzIGZyb20gdGhlIGxvd2VyIGJvdW5kXG4gICAgICAgIHZhciB1cHBlckJvdW5kQ29sb3JXZWlnaHQgPSAoZmVhdHVyZVZhbHVlIC0gbG93ZXJCb3VuZCkgLyByYW5nZTtcbiAgICAgICAgaWYgKHVwcGVyQm91bmRDb2xvcldlaWdodCkge1xuICAgICAgICAgIC8vIG1vcmUgd2VpZ2h0IHRoZSBmdXJ0aGVyIGl0IGlzIGZyb20gdGhlIHVwcGVyIGJvdW5kXG4gICAgICAgICAgdmFyIGxvd2VyQm91bmRDb2xvcldlaWdodCA9ICh1cHBlckJvdW5kIC0gZmVhdHVyZVZhbHVlKSAvIHJhbmdlO1xuICAgICAgICAgIGlmIChsb3dlckJvdW5kQ29sb3JXZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIGludGVycG9sYXRlIHRoZSBsb3dlciBhbmQgdXBwZXIgYm91bmQgY29sb3IgYnkgYXBwbHlpbmcgdGhlXG4gICAgICAgICAgICAvLyB3ZWlnaHRzIHRvIGVhY2ggb2YgdGhlIHJnYmEgY29sb3JzIGFuZCBhZGRpbmcgdGhlbSB0b2dldGhlclxuICAgICAgICAgICAgdmFyIGludGVycG9sYXRlZENvbG9yID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDQ7IGorKykge1xuICAgICAgICAgICAgICBpbnRlcnBvbGF0ZWRDb2xvcltqXSA9IE1hdGgucm91bmQoKGxvd2VyQm91bmRDb2xvcltqXSAqIGxvd2VyQm91bmRDb2xvcldlaWdodCkgKyAodXBwZXJCb3VuZENvbG9yW2pdICogdXBwZXJCb3VuZENvbG9yV2VpZ2h0KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW50ZXJwb2xhdGVkQ29sb3I7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vIGRpZmZlcmVuY2UgYmV0d2VlbiBmZWF0dXJlVmFsdWUgYW5kIHVwcGVyQm91bmQsIDEwMCUgb2YgdXBwZXJCb3VuZENvbG9yXG4gICAgICAgICAgICByZXR1cm4gdXBwZXJCb3VuZENvbG9yO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBubyBkaWZmZXJlbmNlIGJldHdlZW4gZmVhdHVyZVZhbHVlIGFuZCBsb3dlckJvdW5kLCAxMDAlIG9mIGxvd2VyQm91bmRDb2xvclxuICAgICAgICAgIHJldHVybiBsb3dlckJvdW5kQ29sb3I7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gaWYgd2UgZ2V0IHRvIGhlcmUsIG5vbmUgb2YgdGhlIGNhc2VzIGFwcGx5IHNvIHJldHVybiBudWxsXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbn0pO1xuXG4vLyBleHBvcnQgZnVuY3Rpb24gc3ltYm9sIChzeW1ib2xKc29uKSB7XG4vLyAgIHJldHVybiBuZXcgU3ltYm9sKHN5bWJvbEpzb24pO1xuLy8gfVxuXG5leHBvcnQgZGVmYXVsdCBTeW1ib2w7XG4iLCJpbXBvcnQgTCBmcm9tICdsZWFmbGV0JztcblxuZXhwb3J0IHZhciBTaGFwZU1hcmtlciA9IEwuUGF0aC5leHRlbmQoe1xuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXRsbmcsIHNpemUsIG9wdGlvbnMpIHtcbiAgICBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XG4gICAgdGhpcy5fc2l6ZSA9IHNpemU7XG4gICAgdGhpcy5fbGF0bG5nID0gTC5sYXRMbmcobGF0bG5nKTtcbiAgICB0aGlzLl9zdmdDYW52YXNJbmNsdWRlcygpO1xuICB9LFxuXG4gIHRvR2VvSlNPTjogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBMLkdlb0pTT04uZ2V0RmVhdHVyZSh0aGlzLCB7XG4gICAgICB0eXBlOiAnUG9pbnQnLFxuICAgICAgY29vcmRpbmF0ZXM6IEwuR2VvSlNPTi5sYXRMbmdUb0Nvb3Jkcyh0aGlzLmdldExhdExuZygpKVxuICAgIH0pO1xuICB9LFxuXG4gIF9zdmdDYW52YXNJbmNsdWRlczogZnVuY3Rpb24gKCkge1xuICAgIC8vIGltcGxlbWVudCBpbiBzdWIgY2xhc3NcbiAgfSxcblxuICBfcHJvamVjdDogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuX3BvaW50ID0gdGhpcy5fbWFwLmxhdExuZ1RvTGF5ZXJQb2ludCh0aGlzLl9sYXRsbmcpO1xuICB9LFxuXG4gIF91cGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fbWFwKSB7XG4gICAgICB0aGlzLl91cGRhdGVQYXRoKCk7XG4gICAgfVxuICB9LFxuXG4gIF91cGRhdGVQYXRoOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gaW1wbGVtZW50IGluIHN1YiBjbGFzc1xuICB9LFxuXG4gIHNldExhdExuZzogZnVuY3Rpb24gKGxhdGxuZykge1xuICAgIHRoaXMuX2xhdGxuZyA9IEwubGF0TG5nKGxhdGxuZyk7XG4gICAgdGhpcy5yZWRyYXcoKTtcbiAgICByZXR1cm4gdGhpcy5maXJlKCdtb3ZlJywge2xhdGxuZzogdGhpcy5fbGF0bG5nfSk7XG4gIH0sXG5cbiAgZ2V0TGF0TG5nOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xhdGxuZztcbiAgfSxcblxuICBzZXRTaXplOiBmdW5jdGlvbiAoc2l6ZSkge1xuICAgIHRoaXMuX3NpemUgPSBzaXplO1xuICAgIHJldHVybiB0aGlzLnJlZHJhdygpO1xuICB9LFxuXG4gIGdldFNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5fc2l6ZTtcbiAgfVxufSk7XG4iLCJpbXBvcnQgTCBmcm9tICdsZWFmbGV0JztcbmltcG9ydCB7IFNoYXBlTWFya2VyIH0gZnJvbSAnLi9TaGFwZU1hcmtlcic7XG5cbmV4cG9ydCB2YXIgQ3Jvc3NNYXJrZXIgPSBTaGFwZU1hcmtlci5leHRlbmQoe1xuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXRsbmcsIHNpemUsIG9wdGlvbnMpIHtcbiAgICBTaGFwZU1hcmtlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIGxhdGxuZywgc2l6ZSwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgX3VwZGF0ZVBhdGg6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW5kZXJlci5fdXBkYXRlQ3Jvc3NNYXJrZXIodGhpcyk7XG4gIH0sXG5cbiAgX3N2Z0NhbnZhc0luY2x1ZGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgTC5DYW52YXMuaW5jbHVkZSh7XG4gICAgICBfdXBkYXRlQ3Jvc3NNYXJrZXI6IGZ1bmN0aW9uIChsYXllcikge1xuICAgICAgICB2YXIgbGF0bG5nID0gbGF5ZXIuX3BvaW50O1xuICAgICAgICB2YXIgb2Zmc2V0ID0gbGF5ZXIuX3NpemUgLyAyLjA7XG4gICAgICAgIHZhciBjdHggPSB0aGlzLl9jdHg7XG5cbiAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjdHgubW92ZVRvKGxhdGxuZy54LCBsYXRsbmcueSArIG9mZnNldCk7XG4gICAgICAgIGN0eC5saW5lVG8obGF0bG5nLngsIGxhdGxuZy55IC0gb2Zmc2V0KTtcbiAgICAgICAgdGhpcy5fZmlsbFN0cm9rZShjdHgsIGxheWVyKTtcblxuICAgICAgICBjdHgubW92ZVRvKGxhdGxuZy54IC0gb2Zmc2V0LCBsYXRsbmcueSk7XG4gICAgICAgIGN0eC5saW5lVG8obGF0bG5nLnggKyBvZmZzZXQsIGxhdGxuZy55KTtcbiAgICAgICAgdGhpcy5fZmlsbFN0cm9rZShjdHgsIGxheWVyKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIEwuU1ZHLmluY2x1ZGUoe1xuICAgICAgX3VwZGF0ZUNyb3NzTWFya2VyOiBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICAgICAgdmFyIGxhdGxuZyA9IGxheWVyLl9wb2ludDtcbiAgICAgICAgdmFyIG9mZnNldCA9IGxheWVyLl9zaXplIC8gMi4wO1xuXG4gICAgICAgIGlmIChMLkJyb3dzZXIudm1sKSB7XG4gICAgICAgICAgbGF0bG5nLl9yb3VuZCgpO1xuICAgICAgICAgIG9mZnNldCA9IE1hdGgucm91bmQob2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdHIgPSAnTScgKyBsYXRsbmcueCArICcsJyArIChsYXRsbmcueSArIG9mZnNldCkgK1xuICAgICAgICAgICdMJyArIGxhdGxuZy54ICsgJywnICsgKGxhdGxuZy55IC0gb2Zmc2V0KSArXG4gICAgICAgICAgJ00nICsgKGxhdGxuZy54IC0gb2Zmc2V0KSArICcsJyArIGxhdGxuZy55ICtcbiAgICAgICAgICAnTCcgKyAobGF0bG5nLnggKyBvZmZzZXQpICsgJywnICsgbGF0bG5nLnk7XG5cbiAgICAgICAgdGhpcy5fc2V0UGF0aChsYXllciwgc3RyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufSk7XG5cbmV4cG9ydCB2YXIgY3Jvc3NNYXJrZXIgPSBmdW5jdGlvbiAobGF0bG5nLCBzaXplLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgQ3Jvc3NNYXJrZXIobGF0bG5nLCBzaXplLCBvcHRpb25zKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNyb3NzTWFya2VyO1xuIiwiaW1wb3J0IEwgZnJvbSAnbGVhZmxldCc7XG5pbXBvcnQgeyBTaGFwZU1hcmtlciB9IGZyb20gJy4vU2hhcGVNYXJrZXInO1xuXG5leHBvcnQgdmFyIFhNYXJrZXIgPSBTaGFwZU1hcmtlci5leHRlbmQoe1xuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXRsbmcsIHNpemUsIG9wdGlvbnMpIHtcbiAgICBTaGFwZU1hcmtlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIGxhdGxuZywgc2l6ZSwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgX3VwZGF0ZVBhdGg6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW5kZXJlci5fdXBkYXRlWE1hcmtlcih0aGlzKTtcbiAgfSxcblxuICBfc3ZnQ2FudmFzSW5jbHVkZXM6IGZ1bmN0aW9uICgpIHtcbiAgICBMLkNhbnZhcy5pbmNsdWRlKHtcbiAgICAgIF91cGRhdGVYTWFya2VyOiBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICAgICAgdmFyIGxhdGxuZyA9IGxheWVyLl9wb2ludDtcbiAgICAgICAgdmFyIG9mZnNldCA9IGxheWVyLl9zaXplIC8gMi4wO1xuICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcblxuICAgICAgICBjdHgubW92ZVRvKGxhdGxuZy54ICsgb2Zmc2V0LCBsYXRsbmcueSArIG9mZnNldCk7XG4gICAgICAgIGN0eC5saW5lVG8obGF0bG5nLnggLSBvZmZzZXQsIGxhdGxuZy55IC0gb2Zmc2V0KTtcbiAgICAgICAgdGhpcy5fZmlsbFN0cm9rZShjdHgsIGxheWVyKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIEwuU1ZHLmluY2x1ZGUoe1xuICAgICAgX3VwZGF0ZVhNYXJrZXI6IGZ1bmN0aW9uIChsYXllcikge1xuICAgICAgICB2YXIgbGF0bG5nID0gbGF5ZXIuX3BvaW50O1xuICAgICAgICB2YXIgb2Zmc2V0ID0gbGF5ZXIuX3NpemUgLyAyLjA7XG5cbiAgICAgICAgaWYgKEwuQnJvd3Nlci52bWwpIHtcbiAgICAgICAgICBsYXRsbmcuX3JvdW5kKCk7XG4gICAgICAgICAgb2Zmc2V0ID0gTWF0aC5yb3VuZChvZmZzZXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0ciA9ICdNJyArIChsYXRsbmcueCArIG9mZnNldCkgKyAnLCcgKyAobGF0bG5nLnkgKyBvZmZzZXQpICtcbiAgICAgICAgICAnTCcgKyAobGF0bG5nLnggLSBvZmZzZXQpICsgJywnICsgKGxhdGxuZy55IC0gb2Zmc2V0KSArXG4gICAgICAgICAgJ00nICsgKGxhdGxuZy54IC0gb2Zmc2V0KSArICcsJyArIChsYXRsbmcueSArIG9mZnNldCkgK1xuICAgICAgICAgICdMJyArIChsYXRsbmcueCArIG9mZnNldCkgKyAnLCcgKyAobGF0bG5nLnkgLSBvZmZzZXQpO1xuXG4gICAgICAgIHRoaXMuX3NldFBhdGgobGF5ZXIsIHN0cik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0pO1xuXG5leHBvcnQgdmFyIHhNYXJrZXIgPSBmdW5jdGlvbiAobGF0bG5nLCBzaXplLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgWE1hcmtlcihsYXRsbmcsIHNpemUsIG9wdGlvbnMpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgeE1hcmtlcjtcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xuaW1wb3J0IHsgU2hhcGVNYXJrZXIgfSBmcm9tICcuL1NoYXBlTWFya2VyJztcblxuZXhwb3J0IHZhciBTcXVhcmVNYXJrZXIgPSBTaGFwZU1hcmtlci5leHRlbmQoe1xuICBvcHRpb25zOiB7XG4gICAgZmlsbDogdHJ1ZVxuICB9LFxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXRsbmcsIHNpemUsIG9wdGlvbnMpIHtcbiAgICBTaGFwZU1hcmtlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIGxhdGxuZywgc2l6ZSwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgX3VwZGF0ZVBhdGg6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW5kZXJlci5fdXBkYXRlU3F1YXJlTWFya2VyKHRoaXMpO1xuICB9LFxuXG4gIF9zdmdDYW52YXNJbmNsdWRlczogZnVuY3Rpb24gKCkge1xuICAgIEwuQ2FudmFzLmluY2x1ZGUoe1xuICAgICAgX3VwZGF0ZVNxdWFyZU1hcmtlcjogZnVuY3Rpb24gKGxheWVyKSB7XG4gICAgICAgIHZhciBsYXRsbmcgPSBsYXllci5fcG9pbnQ7XG4gICAgICAgIHZhciBvZmZzZXQgPSBsYXllci5fc2l6ZSAvIDIuMDtcbiAgICAgICAgdmFyIGN0eCA9IHRoaXMuX2N0eDtcblxuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG5cbiAgICAgICAgY3R4Lm1vdmVUbyhsYXRsbmcueCArIG9mZnNldCwgbGF0bG5nLnkgKyBvZmZzZXQpO1xuICAgICAgICBjdHgubGluZVRvKGxhdGxuZy54IC0gb2Zmc2V0LCBsYXRsbmcueSArIG9mZnNldCk7XG4gICAgICAgIGN0eC5saW5lVG8obGF0bG5nLnggLSBvZmZzZXQsIGxhdGxuZy55IC0gb2Zmc2V0KTtcbiAgICAgICAgY3R4LmxpbmVUbyhsYXRsbmcueCArIG9mZnNldCwgbGF0bG5nLnkgLSBvZmZzZXQpO1xuXG4gICAgICAgIGN0eC5jbG9zZVBhdGgoKTtcblxuICAgICAgICB0aGlzLl9maWxsU3Ryb2tlKGN0eCwgbGF5ZXIpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgTC5TVkcuaW5jbHVkZSh7XG4gICAgICBfdXBkYXRlU3F1YXJlTWFya2VyOiBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICAgICAgdmFyIGxhdGxuZyA9IGxheWVyLl9wb2ludDtcbiAgICAgICAgdmFyIG9mZnNldCA9IGxheWVyLl9zaXplIC8gMi4wO1xuXG4gICAgICAgIGlmIChMLkJyb3dzZXIudm1sKSB7XG4gICAgICAgICAgbGF0bG5nLl9yb3VuZCgpO1xuICAgICAgICAgIG9mZnNldCA9IE1hdGgucm91bmQob2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdHIgPSAnTScgKyAobGF0bG5nLnggKyBvZmZzZXQpICsgJywnICsgKGxhdGxuZy55ICsgb2Zmc2V0KSArXG4gICAgICAgICAgJ0wnICsgKGxhdGxuZy54IC0gb2Zmc2V0KSArICcsJyArIChsYXRsbmcueSArIG9mZnNldCkgK1xuICAgICAgICAgICdMJyArIChsYXRsbmcueCAtIG9mZnNldCkgKyAnLCcgKyAobGF0bG5nLnkgLSBvZmZzZXQpICtcbiAgICAgICAgICAnTCcgKyAobGF0bG5nLnggKyBvZmZzZXQpICsgJywnICsgKGxhdGxuZy55IC0gb2Zmc2V0KTtcblxuICAgICAgICBzdHIgPSBzdHIgKyAoTC5Ccm93c2VyLnN2ZyA/ICd6JyA6ICd4Jyk7XG5cbiAgICAgICAgdGhpcy5fc2V0UGF0aChsYXllciwgc3RyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufSk7XG5cbmV4cG9ydCB2YXIgc3F1YXJlTWFya2VyID0gZnVuY3Rpb24gKGxhdGxuZywgc2l6ZSwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFNxdWFyZU1hcmtlcihsYXRsbmcsIHNpemUsIG9wdGlvbnMpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgc3F1YXJlTWFya2VyO1xuIiwiaW1wb3J0IEwgZnJvbSAnbGVhZmxldCc7XG5pbXBvcnQgeyBTaGFwZU1hcmtlciB9IGZyb20gJy4vU2hhcGVNYXJrZXInO1xuXG5leHBvcnQgdmFyIERpYW1vbmRNYXJrZXIgPSBTaGFwZU1hcmtlci5leHRlbmQoe1xuICBvcHRpb25zOiB7XG4gICAgZmlsbDogdHJ1ZVxuICB9LFxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXRsbmcsIHNpemUsIG9wdGlvbnMpIHtcbiAgICBTaGFwZU1hcmtlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIGxhdGxuZywgc2l6ZSwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgX3VwZGF0ZVBhdGg6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLl9yZW5kZXJlci5fdXBkYXRlRGlhbW9uZE1hcmtlcih0aGlzKTtcbiAgfSxcblxuICBfc3ZnQ2FudmFzSW5jbHVkZXM6IGZ1bmN0aW9uICgpIHtcbiAgICBMLkNhbnZhcy5pbmNsdWRlKHtcbiAgICAgIF91cGRhdGVEaWFtb25kTWFya2VyOiBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICAgICAgdmFyIGxhdGxuZyA9IGxheWVyLl9wb2ludDtcbiAgICAgICAgdmFyIG9mZnNldCA9IGxheWVyLl9zaXplIC8gMi4wO1xuICAgICAgICB2YXIgY3R4ID0gdGhpcy5fY3R4O1xuXG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcblxuICAgICAgICBjdHgubW92ZVRvKGxhdGxuZy54LCBsYXRsbmcueSArIG9mZnNldCk7XG4gICAgICAgIGN0eC5saW5lVG8obGF0bG5nLnggLSBvZmZzZXQsIGxhdGxuZy55KTtcbiAgICAgICAgY3R4LmxpbmVUbyhsYXRsbmcueCwgbGF0bG5nLnkgLSBvZmZzZXQpO1xuICAgICAgICBjdHgubGluZVRvKGxhdGxuZy54ICsgb2Zmc2V0LCBsYXRsbmcueSk7XG5cbiAgICAgICAgY3R4LmNsb3NlUGF0aCgpO1xuXG4gICAgICAgIHRoaXMuX2ZpbGxTdHJva2UoY3R4LCBsYXllcik7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBMLlNWRy5pbmNsdWRlKHtcbiAgICAgIF91cGRhdGVEaWFtb25kTWFya2VyOiBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICAgICAgdmFyIGxhdGxuZyA9IGxheWVyLl9wb2ludDtcbiAgICAgICAgdmFyIG9mZnNldCA9IGxheWVyLl9zaXplIC8gMi4wO1xuXG4gICAgICAgIGlmIChMLkJyb3dzZXIudm1sKSB7XG4gICAgICAgICAgbGF0bG5nLl9yb3VuZCgpO1xuICAgICAgICAgIG9mZnNldCA9IE1hdGgucm91bmQob2Zmc2V0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdHIgPSAnTScgKyBsYXRsbmcueCArICcsJyArIChsYXRsbmcueSArIG9mZnNldCkgK1xuICAgICAgICAgICdMJyArIChsYXRsbmcueCAtIG9mZnNldCkgKyAnLCcgKyBsYXRsbmcueSArXG4gICAgICAgICAgJ0wnICsgbGF0bG5nLnggKyAnLCcgKyAobGF0bG5nLnkgLSBvZmZzZXQpICtcbiAgICAgICAgICAnTCcgKyAobGF0bG5nLnggKyBvZmZzZXQpICsgJywnICsgbGF0bG5nLnk7XG5cbiAgICAgICAgc3RyID0gc3RyICsgKEwuQnJvd3Nlci5zdmcgPyAneicgOiAneCcpO1xuXG4gICAgICAgIHRoaXMuX3NldFBhdGgobGF5ZXIsIHN0cik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0pO1xuXG5leHBvcnQgdmFyIGRpYW1vbmRNYXJrZXIgPSBmdW5jdGlvbiAobGF0bG5nLCBzaXplLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgRGlhbW9uZE1hcmtlcihsYXRsbmcsIHNpemUsIG9wdGlvbnMpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZGlhbW9uZE1hcmtlcjtcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xuaW1wb3J0IFN5bWJvbCBmcm9tICcuL1N5bWJvbCc7XG5pbXBvcnQge3NxdWFyZU1hcmtlciwgeE1hcmtlciwgY3Jvc3NNYXJrZXIsIGRpYW1vbmRNYXJrZXJ9IGZyb20gJ2xlYWZsZXQtc2hhcGUtbWFya2Vycyc7XG5cbmV4cG9ydCB2YXIgUG9pbnRTeW1ib2wgPSBTeW1ib2wuZXh0ZW5kKHtcblxuICBzdGF0aWNzOiB7XG4gICAgTUFSS0VSVFlQRVM6IFsnZXNyaVNNU0NpcmNsZScsICdlc3JpU01TQ3Jvc3MnLCAnZXNyaVNNU0RpYW1vbmQnLCAnZXNyaVNNU1NxdWFyZScsICdlc3JpU01TWCcsICdlc3JpUE1TJ11cbiAgfSxcblxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAoc3ltYm9sSnNvbiwgb3B0aW9ucykge1xuICAgIHZhciB1cmw7XG4gICAgU3ltYm9sLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgc3ltYm9sSnNvbiwgb3B0aW9ucyk7XG4gICAgaWYgKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuc2VydmljZVVybCA9IG9wdGlvbnMudXJsO1xuICAgIH1cbiAgICBpZiAoc3ltYm9sSnNvbikge1xuICAgICAgaWYgKHN5bWJvbEpzb24udHlwZSA9PT0gJ2VzcmlQTVMnKSB7XG4gICAgICAgIHZhciBpbWFnZVVybCA9IHRoaXMuX3N5bWJvbEpzb24udXJsO1xuICAgICAgICBpZiAoKGltYWdlVXJsICYmIGltYWdlVXJsLnN1YnN0cigwLCA3KSA9PT0gJ2h0dHA6Ly8nKSB8fCAoaW1hZ2VVcmwuc3Vic3RyKDAsIDgpID09PSAnaHR0cHM6Ly8nKSkge1xuICAgICAgICAgIC8vIHdlYiBpbWFnZVxuICAgICAgICAgIHVybCA9IHRoaXMuc2FuaXRpemUoaW1hZ2VVcmwpO1xuICAgICAgICAgIHRoaXMuX2ljb25VcmwgPSB1cmw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXJsID0gdGhpcy5zZXJ2aWNlVXJsICsgJ2ltYWdlcy8nICsgaW1hZ2VVcmw7XG4gICAgICAgICAgdGhpcy5faWNvblVybCA9IG9wdGlvbnMgJiYgb3B0aW9ucy50b2tlbiA/IHVybCArICc/dG9rZW49JyArIG9wdGlvbnMudG9rZW4gOiB1cmw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN5bWJvbEpzb24uaW1hZ2VEYXRhKSB7XG4gICAgICAgICAgdGhpcy5faWNvblVybCA9ICdkYXRhOicgKyBzeW1ib2xKc29uLmNvbnRlbnRUeXBlICsgJztiYXNlNjQsJyArIHN5bWJvbEpzb24uaW1hZ2VEYXRhO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxlYWZsZXQgZG9lcyBub3QgYWxsb3cgcmVzaXppbmcgaWNvbnMgc28ga2VlcCBhIGhhc2ggb2YgZGlmZmVyZW50XG4gICAgICAgIC8vIGljb24gc2l6ZXMgdG8gdHJ5IGFuZCBrZWVwIGRvd24gb24gdGhlIG51bWJlciBvZiBpY29ucyBjcmVhdGVkXG4gICAgICAgIHRoaXMuX2ljb25zID0ge307XG4gICAgICAgIC8vIGNyZWF0ZSBiYXNlIGljb25cbiAgICAgICAgdGhpcy5pY29uID0gdGhpcy5fY3JlYXRlSWNvbih0aGlzLl9zeW1ib2xKc29uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2ZpbGxTdHlsZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gcHJldmVudCBodG1sIGluamVjdGlvbiBpbiBzdHJpbmdzXG4gIHNhbml0aXplOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgaWYgKCFzdHIpIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gICAgdmFyIHRleHQ7XG4gICAgdHJ5IHtcbiAgICAgIC8vIHJlbW92ZXMgaHRtbCBidXQgbGVhdmVzIHVybCBsaW5rIHRleHRcbiAgICAgIHRleHQgPSBzdHIucmVwbGFjZSgvPGJyPi9naSwgJ1xcbicpO1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvPHAuKj4vZ2ksICdcXG4nKTtcbiAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLzxhLipocmVmPScoLio/KScuKj4oLio/KTxcXC9hPi9naSwgJyAkMiAoJDEpICcpO1xuICAgICAgdGV4dCA9IHRleHQucmVwbGFjZSgvPCg/Oi58XFxzKSo/Pi9nLCAnJyk7XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIHRleHQgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gdGV4dDtcbiAgfSxcblxuICBfZmlsbFN0eWxlczogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9zeW1ib2xKc29uLm91dGxpbmUgJiYgdGhpcy5fc3ltYm9sSnNvbi5zaXplID4gMCAmJiB0aGlzLl9zeW1ib2xKc29uLm91dGxpbmUuc3R5bGUgIT09ICdlc3JpU0xTTnVsbCcpIHtcbiAgICAgIHRoaXMuX3N0eWxlcy5zdHJva2UgPSB0cnVlO1xuICAgICAgdGhpcy5fc3R5bGVzLndlaWdodCA9IHRoaXMucGl4ZWxWYWx1ZSh0aGlzLl9zeW1ib2xKc29uLm91dGxpbmUud2lkdGgpO1xuICAgICAgdGhpcy5fc3R5bGVzLmNvbG9yID0gdGhpcy5jb2xvclZhbHVlKHRoaXMuX3N5bWJvbEpzb24ub3V0bGluZS5jb2xvcik7XG4gICAgICB0aGlzLl9zdHlsZXMub3BhY2l0eSA9IHRoaXMuYWxwaGFWYWx1ZSh0aGlzLl9zeW1ib2xKc29uLm91dGxpbmUuY29sb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdHlsZXMuc3Ryb2tlID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zeW1ib2xKc29uLmNvbG9yKSB7XG4gICAgICB0aGlzLl9zdHlsZXMuZmlsbENvbG9yID0gdGhpcy5jb2xvclZhbHVlKHRoaXMuX3N5bWJvbEpzb24uY29sb3IpO1xuICAgICAgdGhpcy5fc3R5bGVzLmZpbGxPcGFjaXR5ID0gdGhpcy5hbHBoYVZhbHVlKHRoaXMuX3N5bWJvbEpzb24uY29sb3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdHlsZXMuZmlsbE9wYWNpdHkgPSAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9zeW1ib2xKc29uLnN0eWxlID09PSAnZXNyaVNNU0NpcmNsZScpIHtcbiAgICAgIHRoaXMuX3N0eWxlcy5yYWRpdXMgPSB0aGlzLnBpeGVsVmFsdWUodGhpcy5fc3ltYm9sSnNvbi5zaXplKSAvIDIuMDtcbiAgICB9XG4gIH0sXG5cbiAgX2NyZWF0ZUljb246IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdmFyIHdpZHRoID0gdGhpcy5waXhlbFZhbHVlKG9wdGlvbnMud2lkdGgpO1xuICAgIHZhciBoZWlnaHQgPSB3aWR0aDtcbiAgICBpZiAob3B0aW9ucy5oZWlnaHQpIHtcbiAgICAgIGhlaWdodCA9IHRoaXMucGl4ZWxWYWx1ZShvcHRpb25zLmhlaWdodCk7XG4gICAgfVxuICAgIHZhciB4T2Zmc2V0ID0gd2lkdGggLyAyLjA7XG4gICAgdmFyIHlPZmZzZXQgPSBoZWlnaHQgLyAyLjA7XG5cbiAgICBpZiAob3B0aW9ucy54b2Zmc2V0KSB7XG4gICAgICB4T2Zmc2V0ICs9IHRoaXMucGl4ZWxWYWx1ZShvcHRpb25zLnhvZmZzZXQpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy55b2Zmc2V0KSB7XG4gICAgICB5T2Zmc2V0ICs9IHRoaXMucGl4ZWxWYWx1ZShvcHRpb25zLnlvZmZzZXQpO1xuICAgIH1cblxuICAgIHZhciBpY29uID0gTC5pY29uKHtcbiAgICAgIGljb25Vcmw6IHRoaXMuX2ljb25VcmwsXG4gICAgICBpY29uU2l6ZTogW3dpZHRoLCBoZWlnaHRdLFxuICAgICAgaWNvbkFuY2hvcjogW3hPZmZzZXQsIHlPZmZzZXRdXG4gICAgfSk7XG4gICAgdGhpcy5faWNvbnNbb3B0aW9ucy53aWR0aC50b1N0cmluZygpXSA9IGljb247XG4gICAgcmV0dXJuIGljb247XG4gIH0sXG5cbiAgX2dldEljb246IGZ1bmN0aW9uIChzaXplKSB7XG4gICAgLy8gY2hlY2sgdG8gc2VlIGlmIGl0IGlzIGFscmVhZHkgY3JlYXRlZCBieSBzaXplXG4gICAgdmFyIGljb24gPSB0aGlzLl9pY29uc1tzaXplLnRvU3RyaW5nKCldO1xuICAgIGlmICghaWNvbikge1xuICAgICAgaWNvbiA9IHRoaXMuX2NyZWF0ZUljb24oe3dpZHRoOiBzaXplfSk7XG4gICAgfVxuICAgIHJldHVybiBpY29uO1xuICB9LFxuXG4gIHBvaW50VG9MYXllcjogZnVuY3Rpb24gKGdlb2pzb24sIGxhdGxuZywgdmlzdWFsVmFyaWFibGVzLCBvcHRpb25zKSB7XG4gICAgdmFyIHNpemUgPSB0aGlzLl9zeW1ib2xKc29uLnNpemUgfHwgdGhpcy5fc3ltYm9sSnNvbi53aWR0aDtcbiAgICBpZiAoIXRoaXMuX2lzRGVmYXVsdCkge1xuICAgICAgaWYgKHZpc3VhbFZhcmlhYmxlcy5zaXplSW5mbykge1xuICAgICAgICB2YXIgY2FsY3VsYXRlZFNpemUgPSB0aGlzLmdldFNpemUoZ2VvanNvbiwgdmlzdWFsVmFyaWFibGVzLnNpemVJbmZvKTtcbiAgICAgICAgaWYgKGNhbGN1bGF0ZWRTaXplKSB7XG4gICAgICAgICAgc2l6ZSA9IGNhbGN1bGF0ZWRTaXplO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodmlzdWFsVmFyaWFibGVzLmNvbG9ySW5mbykge1xuICAgICAgICB2YXIgY29sb3IgPSB0aGlzLmdldENvbG9yKGdlb2pzb24sIHZpc3VhbFZhcmlhYmxlcy5jb2xvckluZm8pO1xuICAgICAgICBpZiAoY29sb3IpIHtcbiAgICAgICAgICB0aGlzLl9zdHlsZXMuZmlsbENvbG9yID0gdGhpcy5jb2xvclZhbHVlKGNvbG9yKTtcbiAgICAgICAgICB0aGlzLl9zdHlsZXMuZmlsbE9wYWNpdHkgPSB0aGlzLmFscGhhVmFsdWUoY29sb3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX3N5bWJvbEpzb24udHlwZSA9PT0gJ2VzcmlQTVMnKSB7XG4gICAgICB2YXIgbGF5ZXJPcHRpb25zID0gTC5leHRlbmQoe30sIHtpY29uOiB0aGlzLl9nZXRJY29uKHNpemUpfSwgb3B0aW9ucyk7XG4gICAgICByZXR1cm4gTC5tYXJrZXIobGF0bG5nLCBsYXllck9wdGlvbnMpO1xuICAgIH1cbiAgICBzaXplID0gdGhpcy5waXhlbFZhbHVlKHNpemUpO1xuXG4gICAgc3dpdGNoICh0aGlzLl9zeW1ib2xKc29uLnN0eWxlKSB7XG4gICAgICBjYXNlICdlc3JpU01TU3F1YXJlJzpcbiAgICAgICAgcmV0dXJuIHNxdWFyZU1hcmtlcihsYXRsbmcsIHNpemUsIEwuZXh0ZW5kKHt9LCB0aGlzLl9zdHlsZXMsIG9wdGlvbnMpKTtcbiAgICAgIGNhc2UgJ2VzcmlTTVNEaWFtb25kJzpcbiAgICAgICAgcmV0dXJuIGRpYW1vbmRNYXJrZXIobGF0bG5nLCBzaXplLCBMLmV4dGVuZCh7fSwgdGhpcy5fc3R5bGVzLCBvcHRpb25zKSk7XG4gICAgICBjYXNlICdlc3JpU01TQ3Jvc3MnOlxuICAgICAgICByZXR1cm4gY3Jvc3NNYXJrZXIobGF0bG5nLCBzaXplLCBMLmV4dGVuZCh7fSwgdGhpcy5fc3R5bGVzLCBvcHRpb25zKSk7XG4gICAgICBjYXNlICdlc3JpU01TWCc6XG4gICAgICAgIHJldHVybiB4TWFya2VyKGxhdGxuZywgc2l6ZSwgTC5leHRlbmQoe30sIHRoaXMuX3N0eWxlcywgb3B0aW9ucykpO1xuICAgIH1cbiAgICB0aGlzLl9zdHlsZXMucmFkaXVzID0gc2l6ZSAvIDIuMDtcbiAgICByZXR1cm4gTC5jaXJjbGVNYXJrZXIobGF0bG5nLCBMLmV4dGVuZCh7fSwgdGhpcy5fc3R5bGVzLCBvcHRpb25zKSk7XG4gIH1cbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gcG9pbnRTeW1ib2wgKHN5bWJvbEpzb24sIG9wdGlvbnMpIHtcbiAgcmV0dXJuIG5ldyBQb2ludFN5bWJvbChzeW1ib2xKc29uLCBvcHRpb25zKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgcG9pbnRTeW1ib2w7XG4iLCJpbXBvcnQgU3ltYm9sIGZyb20gJy4vU3ltYm9sJztcblxuZXhwb3J0IHZhciBMaW5lU3ltYm9sID0gU3ltYm9sLmV4dGVuZCh7XG4gIHN0YXRpY3M6IHtcbiAgICAvLyBOb3QgaW1wbGVtZW50ZWQgJ2VzcmlTTFNOdWxsJ1xuICAgIExJTkVUWVBFUzogWydlc3JpU0xTRGFzaCcsICdlc3JpU0xTRG90JywgJ2VzcmlTTFNEYXNoRG90RG90JywgJ2VzcmlTTFNEYXNoRG90JywgJ2VzcmlTTFNTb2xpZCddXG4gIH0sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChzeW1ib2xKc29uLCBvcHRpb25zKSB7XG4gICAgU3ltYm9sLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgc3ltYm9sSnNvbiwgb3B0aW9ucyk7XG4gICAgdGhpcy5fZmlsbFN0eWxlcygpO1xuICB9LFxuXG4gIF9maWxsU3R5bGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gc2V0IHRoZSBkZWZhdWx0cyB0aGF0IHNob3cgdXAgb24gYXJjZ2lzIG9ubGluZVxuICAgIHRoaXMuX3N0eWxlcy5saW5lQ2FwID0gJ2J1dHQnO1xuICAgIHRoaXMuX3N0eWxlcy5saW5lSm9pbiA9ICdtaXRlcic7XG4gICAgdGhpcy5fc3R5bGVzLmZpbGwgPSBmYWxzZTtcbiAgICB0aGlzLl9zdHlsZXMud2VpZ2h0ID0gMDtcblxuICAgIGlmICghdGhpcy5fc3ltYm9sSnNvbikge1xuICAgICAgcmV0dXJuIHRoaXMuX3N0eWxlcztcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fc3ltYm9sSnNvbi5jb2xvcikge1xuICAgICAgdGhpcy5fc3R5bGVzLmNvbG9yID0gdGhpcy5jb2xvclZhbHVlKHRoaXMuX3N5bWJvbEpzb24uY29sb3IpO1xuICAgICAgdGhpcy5fc3R5bGVzLm9wYWNpdHkgPSB0aGlzLmFscGhhVmFsdWUodGhpcy5fc3ltYm9sSnNvbi5jb2xvcik7XG4gICAgfVxuXG4gICAgaWYgKCFpc05hTih0aGlzLl9zeW1ib2xKc29uLndpZHRoKSkge1xuICAgICAgdGhpcy5fc3R5bGVzLndlaWdodCA9IHRoaXMucGl4ZWxWYWx1ZSh0aGlzLl9zeW1ib2xKc29uLndpZHRoKTtcblxuICAgICAgdmFyIGRhc2hWYWx1ZXMgPSBbXTtcblxuICAgICAgc3dpdGNoICh0aGlzLl9zeW1ib2xKc29uLnN0eWxlKSB7XG4gICAgICAgIGNhc2UgJ2VzcmlTTFNEYXNoJzpcbiAgICAgICAgICBkYXNoVmFsdWVzID0gWzQsIDNdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdlc3JpU0xTRG90JzpcbiAgICAgICAgICBkYXNoVmFsdWVzID0gWzEsIDNdO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdlc3JpU0xTRGFzaERvdCc6XG4gICAgICAgICAgZGFzaFZhbHVlcyA9IFs4LCAzLCAxLCAzXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZXNyaVNMU0Rhc2hEb3REb3QnOlxuICAgICAgICAgIGRhc2hWYWx1ZXMgPSBbOCwgMywgMSwgMywgMSwgM107XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIHVzZSB0aGUgZGFzaCB2YWx1ZXMgYW5kIHRoZSBsaW5lIHdlaWdodCB0byBzZXQgZGFzaCBhcnJheVxuICAgICAgaWYgKGRhc2hWYWx1ZXMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhc2hWYWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBkYXNoVmFsdWVzW2ldICo9IHRoaXMuX3N0eWxlcy53ZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9zdHlsZXMuZGFzaEFycmF5ID0gZGFzaFZhbHVlcy5qb2luKCcsJyk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHN0eWxlOiBmdW5jdGlvbiAoZmVhdHVyZSwgdmlzdWFsVmFyaWFibGVzKSB7XG4gICAgaWYgKCF0aGlzLl9pc0RlZmF1bHQgJiYgdmlzdWFsVmFyaWFibGVzKSB7XG4gICAgICBpZiAodmlzdWFsVmFyaWFibGVzLnNpemVJbmZvKSB7XG4gICAgICAgIHZhciBjYWxjdWxhdGVkU2l6ZSA9IHRoaXMucGl4ZWxWYWx1ZSh0aGlzLmdldFNpemUoZmVhdHVyZSwgdmlzdWFsVmFyaWFibGVzLnNpemVJbmZvKSk7XG4gICAgICAgIGlmIChjYWxjdWxhdGVkU2l6ZSkge1xuICAgICAgICAgIHRoaXMuX3N0eWxlcy53ZWlnaHQgPSBjYWxjdWxhdGVkU2l6ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHZpc3VhbFZhcmlhYmxlcy5jb2xvckluZm8pIHtcbiAgICAgICAgdmFyIGNvbG9yID0gdGhpcy5nZXRDb2xvcihmZWF0dXJlLCB2aXN1YWxWYXJpYWJsZXMuY29sb3JJbmZvKTtcbiAgICAgICAgaWYgKGNvbG9yKSB7XG4gICAgICAgICAgdGhpcy5fc3R5bGVzLmNvbG9yID0gdGhpcy5jb2xvclZhbHVlKGNvbG9yKTtcbiAgICAgICAgICB0aGlzLl9zdHlsZXMub3BhY2l0eSA9IHRoaXMuYWxwaGFWYWx1ZShjb2xvcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3N0eWxlcztcbiAgfVxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBsaW5lU3ltYm9sIChzeW1ib2xKc29uLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgTGluZVN5bWJvbChzeW1ib2xKc29uLCBvcHRpb25zKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgbGluZVN5bWJvbDtcbiIsImltcG9ydCBTeW1ib2wgZnJvbSAnLi9TeW1ib2wnO1xuaW1wb3J0IGxpbmVTeW1ib2wgZnJvbSAnLi9MaW5lU3ltYm9sJztcblxuZXhwb3J0IHZhciBQb2x5Z29uU3ltYm9sID0gU3ltYm9sLmV4dGVuZCh7XG4gIHN0YXRpY3M6IHtcbiAgICAvLyBub3QgaW1wbGVtZW50ZWQ6ICdlc3JpU0ZTQmFja3dhcmREaWFnb25hbCcsJ2VzcmlTRlNDcm9zcycsJ2VzcmlTRlNEaWFnb25hbENyb3NzJywnZXNyaVNGU0ZvcndhcmREaWFnb25hbCcsJ2VzcmlTRlNIb3Jpem9udGFsJywnZXNyaVNGU051bGwnLCdlc3JpU0ZTVmVydGljYWwnXG4gICAgUE9MWUdPTlRZUEVTOiBbJ2VzcmlTRlNTb2xpZCddXG4gIH0sXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChzeW1ib2xKc29uLCBvcHRpb25zKSB7XG4gICAgU3ltYm9sLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgc3ltYm9sSnNvbiwgb3B0aW9ucyk7XG4gICAgaWYgKHN5bWJvbEpzb24pIHtcbiAgICAgIGlmIChzeW1ib2xKc29uLm91dGxpbmUgJiYgc3ltYm9sSnNvbi5vdXRsaW5lLnN0eWxlID09PSAnZXNyaVNMU051bGwnKSB7XG4gICAgICAgIHRoaXMuX2xpbmVTdHlsZXMgPSB7IHdlaWdodDogMCB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fbGluZVN0eWxlcyA9IGxpbmVTeW1ib2woc3ltYm9sSnNvbi5vdXRsaW5lLCBvcHRpb25zKS5zdHlsZSgpO1xuICAgICAgfVxuICAgICAgdGhpcy5fZmlsbFN0eWxlcygpO1xuICAgIH1cbiAgfSxcblxuICBfZmlsbFN0eWxlczogZnVuY3Rpb24gKCkge1xuICAgIGlmICh0aGlzLl9saW5lU3R5bGVzKSB7XG4gICAgICBpZiAodGhpcy5fbGluZVN0eWxlcy53ZWlnaHQgPT09IDApIHtcbiAgICAgICAgLy8gd2hlbiB3ZWlnaHQgaXMgMCwgc2V0dGluZyB0aGUgc3Ryb2tlIHRvIGZhbHNlIGNhbiBzdGlsbCBsb29rIGJhZFxuICAgICAgICAvLyAoZ2FwcyBiZXR3ZWVuIHRoZSBwb2x5Z29ucylcbiAgICAgICAgdGhpcy5fc3R5bGVzLnN0cm9rZSA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gY29weSB0aGUgbGluZSBzeW1ib2wgc3R5bGVzIGludG8gdGhpcyBzeW1ib2wncyBzdHlsZXNcbiAgICAgICAgZm9yICh2YXIgc3R5bGVBdHRyIGluIHRoaXMuX2xpbmVTdHlsZXMpIHtcbiAgICAgICAgICB0aGlzLl9zdHlsZXNbc3R5bGVBdHRyXSA9IHRoaXMuX2xpbmVTdHlsZXNbc3R5bGVBdHRyXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHNldCB0aGUgZmlsbCBmb3IgdGhlIHBvbHlnb25cbiAgICBpZiAodGhpcy5fc3ltYm9sSnNvbikge1xuICAgICAgaWYgKHRoaXMuX3N5bWJvbEpzb24uY29sb3IgJiZcbiAgICAgICAgICAvLyBkb24ndCBmaWxsIHBvbHlnb24gaWYgdHlwZSBpcyBub3Qgc3VwcG9ydGVkXG4gICAgICAgICAgUG9seWdvblN5bWJvbC5QT0xZR09OVFlQRVMuaW5kZXhPZih0aGlzLl9zeW1ib2xKc29uLnN0eWxlID49IDApKSB7XG4gICAgICAgIHRoaXMuX3N0eWxlcy5maWxsID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fc3R5bGVzLmZpbGxDb2xvciA9IHRoaXMuY29sb3JWYWx1ZSh0aGlzLl9zeW1ib2xKc29uLmNvbG9yKTtcbiAgICAgICAgdGhpcy5fc3R5bGVzLmZpbGxPcGFjaXR5ID0gdGhpcy5hbHBoYVZhbHVlKHRoaXMuX3N5bWJvbEpzb24uY29sb3IpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5fc3R5bGVzLmZpbGwgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5fc3R5bGVzLmZpbGxPcGFjaXR5ID0gMDtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgc3R5bGU6IGZ1bmN0aW9uIChmZWF0dXJlLCB2aXN1YWxWYXJpYWJsZXMpIHtcbiAgICBpZiAoIXRoaXMuX2lzRGVmYXVsdCAmJiB2aXN1YWxWYXJpYWJsZXMgJiYgdmlzdWFsVmFyaWFibGVzLmNvbG9ySW5mbykge1xuICAgICAgdmFyIGNvbG9yID0gdGhpcy5nZXRDb2xvcihmZWF0dXJlLCB2aXN1YWxWYXJpYWJsZXMuY29sb3JJbmZvKTtcbiAgICAgIGlmIChjb2xvcikge1xuICAgICAgICB0aGlzLl9zdHlsZXMuZmlsbENvbG9yID0gdGhpcy5jb2xvclZhbHVlKGNvbG9yKTtcbiAgICAgICAgdGhpcy5fc3R5bGVzLmZpbGxPcGFjaXR5ID0gdGhpcy5hbHBoYVZhbHVlKGNvbG9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3N0eWxlcztcbiAgfVxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBwb2x5Z29uU3ltYm9sIChzeW1ib2xKc29uLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgUG9seWdvblN5bWJvbChzeW1ib2xKc29uLCBvcHRpb25zKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgcG9seWdvblN5bWJvbDtcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xuXG5pbXBvcnQgcG9pbnRTeW1ib2wgZnJvbSAnLi4vU3ltYm9scy9Qb2ludFN5bWJvbCc7XG5pbXBvcnQgbGluZVN5bWJvbCBmcm9tICcuLi9TeW1ib2xzL0xpbmVTeW1ib2wnO1xuaW1wb3J0IHBvbHlnb25TeW1ib2wgZnJvbSAnLi4vU3ltYm9scy9Qb2x5Z29uU3ltYm9sJztcblxuZXhwb3J0IHZhciBSZW5kZXJlciA9IEwuQ2xhc3MuZXh0ZW5kKHtcbiAgb3B0aW9uczoge1xuICAgIHByb3BvcnRpb25hbFBvbHlnb246IGZhbHNlLFxuICAgIGNsaWNrYWJsZTogdHJ1ZVxuICB9LFxuXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChyZW5kZXJlckpzb24sIG9wdGlvbnMpIHtcbiAgICB0aGlzLl9yZW5kZXJlckpzb24gPSByZW5kZXJlckpzb247XG4gICAgdGhpcy5fcG9pbnRTeW1ib2xzID0gZmFsc2U7XG4gICAgdGhpcy5fc3ltYm9scyA9IFtdO1xuICAgIHRoaXMuX3Zpc3VhbFZhcmlhYmxlcyA9IHRoaXMuX3BhcnNlVmlzdWFsVmFyaWFibGVzKHJlbmRlcmVySnNvbi52aXN1YWxWYXJpYWJsZXMpO1xuICAgIEwuVXRpbC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xuICB9LFxuXG4gIF9wYXJzZVZpc3VhbFZhcmlhYmxlczogZnVuY3Rpb24gKHZpc3VhbFZhcmlhYmxlcykge1xuICAgIHZhciB2aXNWYXJzID0ge307XG4gICAgaWYgKHZpc3VhbFZhcmlhYmxlcykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aXN1YWxWYXJpYWJsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlzVmFyc1t2aXN1YWxWYXJpYWJsZXNbaV0udHlwZV0gPSB2aXN1YWxWYXJpYWJsZXNbaV07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2aXNWYXJzO1xuICB9LFxuXG4gIF9jcmVhdGVEZWZhdWx0U3ltYm9sOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVySnNvbi5kZWZhdWx0U3ltYm9sKSB7XG4gICAgICB0aGlzLl9kZWZhdWx0U3ltYm9sID0gdGhpcy5fbmV3U3ltYm9sKHRoaXMuX3JlbmRlcmVySnNvbi5kZWZhdWx0U3ltYm9sKTtcbiAgICAgIHRoaXMuX2RlZmF1bHRTeW1ib2wuX2lzRGVmYXVsdCA9IHRydWU7XG4gICAgfVxuICB9LFxuXG4gIF9uZXdTeW1ib2w6IGZ1bmN0aW9uIChzeW1ib2xKc29uKSB7XG4gICAgaWYgKHN5bWJvbEpzb24udHlwZSA9PT0gJ2VzcmlTTVMnIHx8IHN5bWJvbEpzb24udHlwZSA9PT0gJ2VzcmlQTVMnKSB7XG4gICAgICB0aGlzLl9wb2ludFN5bWJvbHMgPSB0cnVlO1xuICAgICAgcmV0dXJuIHBvaW50U3ltYm9sKHN5bWJvbEpzb24sIHRoaXMub3B0aW9ucyk7XG4gICAgfVxuICAgIGlmIChzeW1ib2xKc29uLnR5cGUgPT09ICdlc3JpU0xTJykge1xuICAgICAgcmV0dXJuIGxpbmVTeW1ib2woc3ltYm9sSnNvbiwgdGhpcy5vcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKHN5bWJvbEpzb24udHlwZSA9PT0gJ2VzcmlTRlMnKSB7XG4gICAgICByZXR1cm4gcG9seWdvblN5bWJvbChzeW1ib2xKc29uLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cbiAgfSxcblxuICBfZ2V0U3ltYm9sOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gb3ZlcnJpZGVcbiAgfSxcblxuICBhdHRhY2hTdHlsZXNUb0xheWVyOiBmdW5jdGlvbiAobGF5ZXIpIHtcbiAgICBpZiAodGhpcy5fcG9pbnRTeW1ib2xzKSB7XG4gICAgICBsYXllci5vcHRpb25zLnBvaW50VG9MYXllciA9IEwuVXRpbC5iaW5kKHRoaXMucG9pbnRUb0xheWVyLCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGF5ZXIub3B0aW9ucy5zdHlsZSA9IEwuVXRpbC5iaW5kKHRoaXMuc3R5bGUsIHRoaXMpO1xuICAgICAgbGF5ZXIuX29yaWdpbmFsU3R5bGUgPSBsYXllci5vcHRpb25zLnN0eWxlO1xuICAgIH1cbiAgfSxcblxuICBwb2ludFRvTGF5ZXI6IGZ1bmN0aW9uIChnZW9qc29uLCBsYXRsbmcpIHtcbiAgICB2YXIgc3ltID0gdGhpcy5fZ2V0U3ltYm9sKGdlb2pzb24pO1xuICAgIGlmIChzeW0gJiYgc3ltLnBvaW50VG9MYXllcikge1xuICAgICAgLy8gcmlnaHQgbm93IGN1c3RvbSBwYW5lcyBhcmUgdGhlIG9ubHkgb3B0aW9uIHB1c2hlZCB0aHJvdWdoXG4gICAgICByZXR1cm4gc3ltLnBvaW50VG9MYXllcihnZW9qc29uLCBsYXRsbmcsIHRoaXMuX3Zpc3VhbFZhcmlhYmxlcywgdGhpcy5vcHRpb25zKTtcbiAgICB9XG4gICAgLy8gaW52aXNpYmxlIHN5bWJvbG9neVxuICAgIHJldHVybiBMLmNpcmNsZU1hcmtlcihsYXRsbmcsIHtyYWRpdXM6IDAsIG9wYWNpdHk6IDB9KTtcbiAgfSxcblxuICBzdHlsZTogZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICB2YXIgdXNlclN0eWxlcztcbiAgICBpZiAodGhpcy5vcHRpb25zLnVzZXJEZWZpbmVkU3R5bGUpIHtcbiAgICAgIHVzZXJTdHlsZXMgPSB0aGlzLm9wdGlvbnMudXNlckRlZmluZWRTdHlsZShmZWF0dXJlKTtcbiAgICB9XG4gICAgLy8gZmluZCB0aGUgc3ltYm9sIHRvIHJlcHJlc2VudCB0aGlzIGZlYXR1cmVcbiAgICB2YXIgc3ltID0gdGhpcy5fZ2V0U3ltYm9sKGZlYXR1cmUpO1xuICAgIGlmIChzeW0pIHtcbiAgICAgIHJldHVybiB0aGlzLm1lcmdlU3R5bGVzKHN5bS5zdHlsZShmZWF0dXJlLCB0aGlzLl92aXN1YWxWYXJpYWJsZXMpLCB1c2VyU3R5bGVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gaW52aXNpYmxlIHN5bWJvbG9neVxuICAgICAgcmV0dXJuIHRoaXMubWVyZ2VTdHlsZXMoe29wYWNpdHk6IDAsIGZpbGxPcGFjaXR5OiAwfSwgdXNlclN0eWxlcyk7XG4gICAgfVxuICB9LFxuXG4gIG1lcmdlU3R5bGVzOiBmdW5jdGlvbiAoc3R5bGVzLCB1c2VyU3R5bGVzKSB7XG4gICAgdmFyIG1lcmdlZFN0eWxlcyA9IHt9O1xuICAgIHZhciBhdHRyO1xuICAgIC8vIGNvcHkgcmVuZGVyZXIgc3R5bGUgYXR0cmlidXRlc1xuICAgIGZvciAoYXR0ciBpbiBzdHlsZXMpIHtcbiAgICAgIGlmIChzdHlsZXMuaGFzT3duUHJvcGVydHkoYXR0cikpIHtcbiAgICAgICAgbWVyZ2VkU3R5bGVzW2F0dHJdID0gc3R5bGVzW2F0dHJdO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBvdmVycmlkZSB3aXRoIHVzZXIgZGVmaW5lZCBzdHlsZSBhdHRyaWJ1dGVzXG4gICAgaWYgKHVzZXJTdHlsZXMpIHtcbiAgICAgIGZvciAoYXR0ciBpbiB1c2VyU3R5bGVzKSB7XG4gICAgICAgIGlmICh1c2VyU3R5bGVzLmhhc093blByb3BlcnR5KGF0dHIpKSB7XG4gICAgICAgICAgbWVyZ2VkU3R5bGVzW2F0dHJdID0gdXNlclN0eWxlc1thdHRyXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWVyZ2VkU3R5bGVzO1xuICB9XG59KTtcblxuZXhwb3J0IGRlZmF1bHQgUmVuZGVyZXI7XG4iLCJpbXBvcnQgUmVuZGVyZXIgZnJvbSAnLi9SZW5kZXJlcic7XG5cbmV4cG9ydCB2YXIgQ2xhc3NCcmVha3NSZW5kZXJlciA9IFJlbmRlcmVyLmV4dGVuZCh7XG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChyZW5kZXJlckpzb24sIG9wdGlvbnMpIHtcbiAgICBSZW5kZXJlci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIHJlbmRlcmVySnNvbiwgb3B0aW9ucyk7XG4gICAgdGhpcy5fZmllbGQgPSB0aGlzLl9yZW5kZXJlckpzb24uZmllbGQ7XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVySnNvbi5ub3JtYWxpemF0aW9uVHlwZSAmJiB0aGlzLl9yZW5kZXJlckpzb24ubm9ybWFsaXphdGlvblR5cGUgPT09ICdlc3JpTm9ybWFsaXplQnlGaWVsZCcpIHtcbiAgICAgIHRoaXMuX25vcm1hbGl6YXRpb25GaWVsZCA9IHRoaXMuX3JlbmRlcmVySnNvbi5ub3JtYWxpemF0aW9uRmllbGQ7XG4gICAgfVxuICAgIHRoaXMuX2NyZWF0ZVN5bWJvbHMoKTtcbiAgfSxcblxuICBfY3JlYXRlU3ltYm9sczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzeW1ib2w7XG4gICAgdmFyIGNsYXNzYnJlYWtzID0gdGhpcy5fcmVuZGVyZXJKc29uLmNsYXNzQnJlYWtJbmZvcztcblxuICAgIHRoaXMuX3N5bWJvbHMgPSBbXTtcblxuICAgIC8vIGNyZWF0ZSBhIHN5bWJvbCBmb3IgZWFjaCBjbGFzcyBicmVha1xuICAgIGZvciAodmFyIGkgPSBjbGFzc2JyZWFrcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKHRoaXMub3B0aW9ucy5wcm9wb3J0aW9uYWxQb2x5Z29uICYmIHRoaXMuX3JlbmRlcmVySnNvbi5iYWNrZ3JvdW5kRmlsbFN5bWJvbCkge1xuICAgICAgICBzeW1ib2wgPSB0aGlzLl9uZXdTeW1ib2wodGhpcy5fcmVuZGVyZXJKc29uLmJhY2tncm91bmRGaWxsU3ltYm9sKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN5bWJvbCA9IHRoaXMuX25ld1N5bWJvbChjbGFzc2JyZWFrc1tpXS5zeW1ib2wpO1xuICAgICAgfVxuICAgICAgc3ltYm9sLnZhbCA9IGNsYXNzYnJlYWtzW2ldLmNsYXNzTWF4VmFsdWU7XG4gICAgICB0aGlzLl9zeW1ib2xzLnB1c2goc3ltYm9sKTtcbiAgICB9XG4gICAgLy8gc29ydCB0aGUgc3ltYm9scyBpbiBhc2NlbmRpbmcgdmFsdWVcbiAgICB0aGlzLl9zeW1ib2xzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgIHJldHVybiBhLnZhbCA+IGIudmFsID8gMSA6IC0xO1xuICAgIH0pO1xuICAgIHRoaXMuX2NyZWF0ZURlZmF1bHRTeW1ib2woKTtcbiAgICB0aGlzLl9tYXhWYWx1ZSA9IHRoaXMuX3N5bWJvbHNbdGhpcy5fc3ltYm9scy5sZW5ndGggLSAxXS52YWw7XG4gIH0sXG5cbiAgX2dldFN5bWJvbDogZnVuY3Rpb24gKGZlYXR1cmUpIHtcbiAgICB2YXIgdmFsID0gZmVhdHVyZS5wcm9wZXJ0aWVzW3RoaXMuX2ZpZWxkXTtcbiAgICBpZiAodGhpcy5fbm9ybWFsaXphdGlvbkZpZWxkKSB7XG4gICAgICB2YXIgbm9ybVZhbHVlID0gZmVhdHVyZS5wcm9wZXJ0aWVzW3RoaXMuX25vcm1hbGl6YXRpb25GaWVsZF07XG4gICAgICBpZiAoIWlzTmFOKG5vcm1WYWx1ZSkgJiYgbm9ybVZhbHVlICE9PSAwKSB7XG4gICAgICAgIHZhbCA9IHZhbCAvIG5vcm1WYWx1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWZhdWx0U3ltYm9sO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh2YWwgPiB0aGlzLl9tYXhWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2RlZmF1bHRTeW1ib2w7XG4gICAgfVxuICAgIHZhciBzeW1ib2wgPSB0aGlzLl9zeW1ib2xzWzBdO1xuICAgIGZvciAodmFyIGkgPSB0aGlzLl9zeW1ib2xzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAodmFsID4gdGhpcy5fc3ltYm9sc1tpXS52YWwpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBzeW1ib2wgPSB0aGlzLl9zeW1ib2xzW2ldO1xuICAgIH1cbiAgICByZXR1cm4gc3ltYm9sO1xuICB9XG59KTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNsYXNzQnJlYWtzUmVuZGVyZXIgKHJlbmRlcmVySnNvbiwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IENsYXNzQnJlYWtzUmVuZGVyZXIocmVuZGVyZXJKc29uLCBvcHRpb25zKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3NCcmVha3NSZW5kZXJlcjtcbiIsImltcG9ydCBSZW5kZXJlciBmcm9tICcuL1JlbmRlcmVyJztcblxuZXhwb3J0IHZhciBVbmlxdWVWYWx1ZVJlbmRlcmVyID0gUmVuZGVyZXIuZXh0ZW5kKHtcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKHJlbmRlcmVySnNvbiwgb3B0aW9ucykge1xuICAgIFJlbmRlcmVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgcmVuZGVyZXJKc29uLCBvcHRpb25zKTtcbiAgICB0aGlzLl9maWVsZCA9IHRoaXMuX3JlbmRlcmVySnNvbi5maWVsZDE7XG4gICAgdGhpcy5fY3JlYXRlU3ltYm9scygpO1xuICB9LFxuXG4gIF9jcmVhdGVTeW1ib2xzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHN5bWJvbDtcbiAgICB2YXIgdW5pcXVlcyA9IHRoaXMuX3JlbmRlcmVySnNvbi51bmlxdWVWYWx1ZUluZm9zO1xuXG4gICAgLy8gY3JlYXRlIGEgc3ltYm9sIGZvciBlYWNoIHVuaXF1ZSB2YWx1ZVxuICAgIGZvciAodmFyIGkgPSB1bmlxdWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBzeW1ib2wgPSB0aGlzLl9uZXdTeW1ib2wodW5pcXVlc1tpXS5zeW1ib2wpO1xuICAgICAgc3ltYm9sLnZhbCA9IHVuaXF1ZXNbaV0udmFsdWU7XG4gICAgICB0aGlzLl9zeW1ib2xzLnB1c2goc3ltYm9sKTtcbiAgICB9XG4gICAgdGhpcy5fY3JlYXRlRGVmYXVsdFN5bWJvbCgpO1xuICB9LFxuXG4gIF9nZXRTeW1ib2w6IGZ1bmN0aW9uIChmZWF0dXJlKSB7XG4gICAgdmFyIHZhbCA9IGZlYXR1cmUucHJvcGVydGllc1t0aGlzLl9maWVsZF07XG4gICAgLy8gYWNjdW11bGF0ZSB2YWx1ZXMgaWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSBmaWVsZCBkZWZpbmVkXG4gICAgaWYgKHRoaXMuX3JlbmRlcmVySnNvbi5maWVsZERlbGltaXRlciAmJiB0aGlzLl9yZW5kZXJlckpzb24uZmllbGQyKSB7XG4gICAgICB2YXIgdmFsMiA9IGZlYXR1cmUucHJvcGVydGllc1t0aGlzLl9yZW5kZXJlckpzb24uZmllbGQyXTtcbiAgICAgIGlmICh2YWwyKSB7XG4gICAgICAgIHZhbCArPSB0aGlzLl9yZW5kZXJlckpzb24uZmllbGREZWxpbWl0ZXIgKyB2YWwyO1xuICAgICAgICB2YXIgdmFsMyA9IGZlYXR1cmUucHJvcGVydGllc1t0aGlzLl9yZW5kZXJlckpzb24uZmllbGQzXTtcbiAgICAgICAgaWYgKHZhbDMpIHtcbiAgICAgICAgICB2YWwgKz0gdGhpcy5fcmVuZGVyZXJKc29uLmZpZWxkRGVsaW1pdGVyICsgdmFsMztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBzeW1ib2wgPSB0aGlzLl9kZWZhdWx0U3ltYm9sO1xuICAgIGZvciAodmFyIGkgPSB0aGlzLl9zeW1ib2xzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAvLyB1c2luZyB0aGUgPT09IG9wZXJhdG9yIGRvZXMgbm90IHdvcmsgaWYgdGhlIGZpZWxkXG4gICAgICAvLyBvZiB0aGUgdW5pcXVlIHJlbmRlcmVyIGlzIG5vdCBhIHN0cmluZ1xuICAgICAgLyplc2xpbnQtZGlzYWJsZSAqL1xuICAgICAgaWYgKHRoaXMuX3N5bWJvbHNbaV0udmFsID09IHZhbCkge1xuICAgICAgICBzeW1ib2wgPSB0aGlzLl9zeW1ib2xzW2ldO1xuICAgICAgfVxuICAgICAgLyplc2xpbnQtZW5hYmxlICovXG4gICAgfVxuICAgIHJldHVybiBzeW1ib2w7XG4gIH1cbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gdW5pcXVlVmFsdWVSZW5kZXJlciAocmVuZGVyZXJKc29uLCBvcHRpb25zKSB7XG4gIHJldHVybiBuZXcgVW5pcXVlVmFsdWVSZW5kZXJlcihyZW5kZXJlckpzb24sIG9wdGlvbnMpO1xufVxuXG5leHBvcnQgZGVmYXVsdCB1bmlxdWVWYWx1ZVJlbmRlcmVyO1xuIiwiaW1wb3J0IFJlbmRlcmVyIGZyb20gJy4vUmVuZGVyZXInO1xuXG5leHBvcnQgdmFyIFNpbXBsZVJlbmRlcmVyID0gUmVuZGVyZXIuZXh0ZW5kKHtcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKHJlbmRlcmVySnNvbiwgb3B0aW9ucykge1xuICAgIFJlbmRlcmVyLnByb3RvdHlwZS5pbml0aWFsaXplLmNhbGwodGhpcywgcmVuZGVyZXJKc29uLCBvcHRpb25zKTtcbiAgICB0aGlzLl9jcmVhdGVTeW1ib2woKTtcbiAgfSxcblxuICBfY3JlYXRlU3ltYm9sOiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHRoaXMuX3JlbmRlcmVySnNvbi5zeW1ib2wpIHtcbiAgICAgIHRoaXMuX3N5bWJvbHMucHVzaCh0aGlzLl9uZXdTeW1ib2wodGhpcy5fcmVuZGVyZXJKc29uLnN5bWJvbCkpO1xuICAgIH1cbiAgfSxcblxuICBfZ2V0U3ltYm9sOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3N5bWJvbHNbMF07XG4gIH1cbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gc2ltcGxlUmVuZGVyZXIgKHJlbmRlcmVySnNvbiwgb3B0aW9ucykge1xuICByZXR1cm4gbmV3IFNpbXBsZVJlbmRlcmVyKHJlbmRlcmVySnNvbiwgb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHNpbXBsZVJlbmRlcmVyO1xuIiwiaW1wb3J0IHsgY2xhc3NCcmVha3NSZW5kZXJlciB9IGZyb20gJ2VzcmktbGVhZmxldC1yZW5kZXJlcnMvc3JjL1JlbmRlcmVycy9DbGFzc0JyZWFrc1JlbmRlcmVyJztcclxuaW1wb3J0IHsgdW5pcXVlVmFsdWVSZW5kZXJlciB9IGZyb20gJ2VzcmktbGVhZmxldC1yZW5kZXJlcnMvc3JjL1JlbmRlcmVycy9VbmlxdWVWYWx1ZVJlbmRlcmVyJztcclxuaW1wb3J0IHsgc2ltcGxlUmVuZGVyZXIgfSBmcm9tICdlc3JpLWxlYWZsZXQtcmVuZGVyZXJzL3NyYy9SZW5kZXJlcnMvU2ltcGxlUmVuZGVyZXInO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFJlbmRlcmVyIChsYXllckRlZmluaXRpb24sIGxheWVyKSB7XHJcbiAgdmFyIHJlbmQ7XHJcbiAgdmFyIHJlbmRlcmVySW5mbyA9IGxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mby5yZW5kZXJlcjtcclxuXHJcbiAgdmFyIG9wdGlvbnMgPSB7fTtcclxuXHJcbiAgaWYgKGxheWVyLm9wdGlvbnMucGFuZSkge1xyXG4gICAgb3B0aW9ucy5wYW5lID0gbGF5ZXIub3B0aW9ucy5wYW5lO1xyXG4gIH1cclxuICBpZiAobGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLnRyYW5zcGFyZW5jeSkge1xyXG4gICAgb3B0aW9ucy5sYXllclRyYW5zcGFyZW5jeSA9IGxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mby50cmFuc3BhcmVuY3k7XHJcbiAgfVxyXG4gIGlmIChsYXllci5vcHRpb25zLnN0eWxlKSB7XHJcbiAgICBvcHRpb25zLnVzZXJEZWZpbmVkU3R5bGUgPSBsYXllci5vcHRpb25zLnN0eWxlO1xyXG4gIH1cclxuXHJcbiAgc3dpdGNoIChyZW5kZXJlckluZm8udHlwZSkge1xyXG4gICAgY2FzZSAnY2xhc3NCcmVha3MnOlxyXG4gICAgICBjaGVja0ZvclByb3BvcnRpb25hbFN5bWJvbHMobGF5ZXJEZWZpbml0aW9uLmdlb21ldHJ5VHlwZSwgcmVuZGVyZXJJbmZvLCBsYXllcik7XHJcbiAgICAgIGlmIChsYXllci5faGFzUHJvcG9ydGlvbmFsU3ltYm9scykge1xyXG4gICAgICAgIGxheWVyLl9jcmVhdGVQb2ludExheWVyKCk7XHJcbiAgICAgICAgdmFyIHBSZW5kID0gY2xhc3NCcmVha3NSZW5kZXJlcihyZW5kZXJlckluZm8sIG9wdGlvbnMpO1xyXG4gICAgICAgIHBSZW5kLmF0dGFjaFN0eWxlc1RvTGF5ZXIobGF5ZXIuX3BvaW50TGF5ZXIpO1xyXG4gICAgICAgIG9wdGlvbnMucHJvcG9ydGlvbmFsUG9seWdvbiA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgcmVuZCA9IGNsYXNzQnJlYWtzUmVuZGVyZXIocmVuZGVyZXJJbmZvLCBvcHRpb25zKTtcclxuICAgICAgYnJlYWs7XHJcbiAgICBjYXNlICd1bmlxdWVWYWx1ZSc6XHJcbiAgICAgIGNvbnNvbGUubG9nKHJlbmRlcmVySW5mbywgb3B0aW9ucyk7XHJcbiAgICAgIHJlbmQgPSB1bmlxdWVWYWx1ZVJlbmRlcmVyKHJlbmRlcmVySW5mbywgb3B0aW9ucyk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgZGVmYXVsdDpcclxuICAgICAgcmVuZCA9IHNpbXBsZVJlbmRlcmVyKHJlbmRlcmVySW5mbywgb3B0aW9ucyk7XHJcbiAgfVxyXG4gIHJlbmQuYXR0YWNoU3R5bGVzVG9MYXllcihsYXllcik7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjaGVja0ZvclByb3BvcnRpb25hbFN5bWJvbHMgKGdlb21ldHJ5VHlwZSwgcmVuZGVyZXIsIGxheWVyKSB7XHJcbiAgbGF5ZXIuX2hhc1Byb3BvcnRpb25hbFN5bWJvbHMgPSBmYWxzZTtcclxuICBpZiAoZ2VvbWV0cnlUeXBlID09PSAnZXNyaUdlb21ldHJ5UG9seWdvbicpIHtcclxuICAgIGlmIChyZW5kZXJlci5iYWNrZ3JvdW5kRmlsbFN5bWJvbCkge1xyXG4gICAgICBsYXllci5faGFzUHJvcG9ydGlvbmFsU3ltYm9scyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICAvLyBjaGVjayB0byBzZWUgaWYgdGhlIGZpcnN0IHN5bWJvbCBpbiB0aGUgY2xhc3NicmVha3MgaXMgYSBtYXJrZXIgc3ltYm9sXHJcbiAgICBpZiAocmVuZGVyZXIuY2xhc3NCcmVha0luZm9zICYmIHJlbmRlcmVyLmNsYXNzQnJlYWtJbmZvcy5sZW5ndGgpIHtcclxuICAgICAgdmFyIHN5bSA9IHJlbmRlcmVyLmNsYXNzQnJlYWtJbmZvc1swXS5zeW1ib2w7XHJcbiAgICAgIGlmIChzeW0gJiYgKHN5bS50eXBlID09PSAnZXNyaVNNUycgfHwgc3ltLnR5cGUgPT09ICdlc3JpUE1TJykpIHtcclxuICAgICAgICBsYXllci5faGFzUHJvcG9ydGlvbmFsU3ltYm9scyA9IHRydWU7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgUmVuZGVyZXIgPSB7XHJcbiAgc2V0UmVuZGVyZXI6IHNldFJlbmRlcmVyLFxyXG4gIGNoZWNrRm9yUHJvcG9ydGlvbmFsU3ltYm9sczogY2hlY2tGb3JQcm9wb3J0aW9uYWxTeW1ib2xzXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBSZW5kZXJlcjtcclxuIiwiaW1wb3J0IEwgZnJvbSAnbGVhZmxldCc7XHJcblxyXG5pbXBvcnQgeyBhcmNnaXNUb0dlb0pTT04gfSBmcm9tICdhcmNnaXMtdG8tZ2VvanNvbi11dGlscyc7XHJcbmltcG9ydCB7IHNldFJlbmRlcmVyIH0gZnJvbSAnLi9SZW5kZXJlcic7XHJcblxyXG5leHBvcnQgdmFyIEZlYXR1cmVDb2xsZWN0aW9uID0gTC5HZW9KU09OLmV4dGVuZCh7XHJcbiAgb3B0aW9uczoge1xyXG4gICAgZGF0YToge30sIC8vIEVzcmkgRmVhdHVyZSBDb2xsZWN0aW9uIEpTT04gb3IgSXRlbSBJRFxyXG4gICAgb3BhY2l0eTogMVxyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXllcnMsIG9wdGlvbnMpIHtcclxuICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLmRhdGEgPSB0aGlzLm9wdGlvbnMuZGF0YTtcclxuICAgIHRoaXMub3BhY2l0eSA9IHRoaXMub3B0aW9ucy5vcGFjaXR5O1xyXG4gICAgdGhpcy5wb3B1cEluZm8gPSBudWxsO1xyXG4gICAgdGhpcy5sYWJlbGluZ0luZm8gPSBudWxsO1xyXG4gICAgdGhpcy5fbGF5ZXJzID0ge307XHJcblxyXG4gICAgdmFyIGksIGxlbjtcclxuXHJcbiAgICBpZiAobGF5ZXJzKSB7XHJcbiAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGxheWVycy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgIHRoaXMuYWRkTGF5ZXIobGF5ZXJzW2ldKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgdGhpcy5kYXRhID09PSAnc3RyaW5nJykge1xyXG4gICAgICB0aGlzLl9nZXRGZWF0dXJlQ29sbGVjdGlvbih0aGlzLmRhdGEpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgdGhpcy5fcGFyc2VGZWF0dXJlQ29sbGVjdGlvbih0aGlzLmRhdGEpO1xyXG4gICAgfVxyXG4gIH0sXHJcblxyXG4gIF9nZXRGZWF0dXJlQ29sbGVjdGlvbjogZnVuY3Rpb24gKGl0ZW1JZCkge1xyXG4gICAgdmFyIHVybCA9ICdodHRwczovL3d3dy5hcmNnaXMuY29tL3NoYXJpbmcvcmVzdC9jb250ZW50L2l0ZW1zLycgKyBpdGVtSWQgKyAnL2RhdGEnO1xyXG4gICAgTC5lc3JpLnJlcXVlc3QodXJsLCB7fSwgZnVuY3Rpb24gKGVyciwgcmVzKSB7XHJcbiAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX3BhcnNlRmVhdHVyZUNvbGxlY3Rpb24ocmVzKTtcclxuICAgICAgfVxyXG4gICAgfSwgdGhpcyk7XHJcbiAgfSxcclxuXHJcbiAgX3BhcnNlRmVhdHVyZUNvbGxlY3Rpb246IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICB2YXIgaSwgbGVuO1xyXG4gICAgdmFyIGluZGV4ID0gMDtcclxuICAgIGZvciAoaSA9IDAsIGxlbiA9IGRhdGEubGF5ZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgIGlmIChkYXRhLmxheWVyc1tpXS5mZWF0dXJlU2V0LmZlYXR1cmVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBpbmRleCA9IGk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBmZWF0dXJlcyA9IGRhdGEubGF5ZXJzW2luZGV4XS5mZWF0dXJlU2V0LmZlYXR1cmVzO1xyXG4gICAgdmFyIGdlb21ldHJ5VHlwZSA9IGRhdGEubGF5ZXJzW2luZGV4XS5sYXllckRlZmluaXRpb24uZ2VvbWV0cnlUeXBlOyAvLyAnZXNyaUdlb21ldHJ5UG9pbnQnIHwgJ2VzcmlHZW9tZXRyeU11bHRpcG9pbnQnIHwgJ2VzcmlHZW9tZXRyeVBvbHlsaW5lJyB8ICdlc3JpR2VvbWV0cnlQb2x5Z29uJyB8ICdlc3JpR2VvbWV0cnlFbnZlbG9wZSdcclxuICAgIHZhciBvYmplY3RJZEZpZWxkID0gZGF0YS5sYXllcnNbaW5kZXhdLmxheWVyRGVmaW5pdGlvbi5vYmplY3RJZEZpZWxkO1xyXG4gICAgdmFyIGxheWVyRGVmaW5pdGlvbiA9IGRhdGEubGF5ZXJzW2luZGV4XS5sYXllckRlZmluaXRpb24gfHwgbnVsbDtcclxuXHJcbiAgICBpZiAoZGF0YS5sYXllcnNbaW5kZXhdLmxheWVyRGVmaW5pdGlvbi5leHRlbnQuc3BhdGlhbFJlZmVyZW5jZS53a2lkICE9PSA0MzI2KSB7XHJcbiAgICAgIGlmIChkYXRhLmxheWVyc1tpbmRleF0ubGF5ZXJEZWZpbml0aW9uLmV4dGVudC5zcGF0aWFsUmVmZXJlbmNlLndraWQgIT09IDEwMjEwMCkge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1tMLmVzcmkuV2ViTWFwXSB0aGlzIHdraWQgKCcgKyBkYXRhLmxheWVyc1tpbmRleF0ubGF5ZXJEZWZpbml0aW9uLmV4dGVudC5zcGF0aWFsUmVmZXJlbmNlLndraWQgKyAnKSBpcyBub3Qgc3VwcG9ydGVkLicpO1xyXG4gICAgICB9XHJcbiAgICAgIGZlYXR1cmVzID0gdGhpcy5fcHJvalRvNDMyNihmZWF0dXJlcywgZ2VvbWV0cnlUeXBlKTtcclxuICAgIH1cclxuICAgIGlmIChkYXRhLmxheWVyc1tpbmRleF0ucG9wdXBJbmZvICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5wb3B1cEluZm8gPSBkYXRhLmxheWVyc1tpbmRleF0ucG9wdXBJbmZvO1xyXG4gICAgfVxyXG4gICAgaWYgKGRhdGEubGF5ZXJzW2luZGV4XS5sYXllckRlZmluaXRpb24uZHJhd2luZ0luZm8ubGFiZWxpbmdJbmZvICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5sYWJlbGluZ0luZm8gPSBkYXRhLmxheWVyc1tpbmRleF0ubGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLmxhYmVsaW5nSW5mbztcclxuICAgIH1cclxuICAgIGNvbnNvbGUubG9nKGRhdGEpO1xyXG5cclxuICAgIHZhciBnZW9qc29uID0gdGhpcy5fZmVhdHVyZUNvbGxlY3Rpb25Ub0dlb0pTT04oZmVhdHVyZXMsIG9iamVjdElkRmllbGQpO1xyXG5cclxuICAgIGlmIChsYXllckRlZmluaXRpb24gIT09IG51bGwpIHtcclxuICAgICAgc2V0UmVuZGVyZXIobGF5ZXJEZWZpbml0aW9uLCB0aGlzKTtcclxuICAgIH1cclxuICAgIGNvbnNvbGUubG9nKGdlb2pzb24pO1xyXG4gICAgdGhpcy5hZGREYXRhKGdlb2pzb24pO1xyXG4gIH0sXHJcblxyXG4gIF9wcm9qVG80MzI2OiBmdW5jdGlvbiAoZmVhdHVyZXMsIGdlb21ldHJ5VHlwZSkge1xyXG4gICAgY29uc29sZS5sb2coJ19wcm9qZWN0IScpO1xyXG4gICAgdmFyIGksIGxlbjtcclxuICAgIHZhciBwcm9qRmVhdHVyZXMgPSBbXTtcclxuXHJcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSBmZWF0dXJlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICB2YXIgZiA9IGZlYXR1cmVzW2ldO1xyXG4gICAgICB2YXIgbWVyY2F0b3JUb0xhdGxuZztcclxuICAgICAgdmFyIGosIGs7XHJcblxyXG4gICAgICBpZiAoZ2VvbWV0cnlUeXBlID09PSAnZXNyaUdlb21ldHJ5UG9pbnQnKSB7XHJcbiAgICAgICAgbWVyY2F0b3JUb0xhdGxuZyA9IEwuUHJvamVjdGlvbi5TcGhlcmljYWxNZXJjYXRvci51bnByb2plY3QoTC5wb2ludChmLmdlb21ldHJ5LngsIGYuZ2VvbWV0cnkueSkpO1xyXG4gICAgICAgIGYuZ2VvbWV0cnkueCA9IG1lcmNhdG9yVG9MYXRsbmcubG5nO1xyXG4gICAgICAgIGYuZ2VvbWV0cnkueSA9IG1lcmNhdG9yVG9MYXRsbmcubGF0O1xyXG4gICAgICB9IGVsc2UgaWYgKGdlb21ldHJ5VHlwZSA9PT0gJ2VzcmlHZW9tZXRyeU11bHRpcG9pbnQnKSB7XHJcbiAgICAgICAgdmFyIHBsZW47XHJcblxyXG4gICAgICAgIGZvciAoaiA9IDAsIHBsZW4gPSBmLmdlb21ldHJ5LnBvaW50cy5sZW5ndGg7IGogPCBwbGVuOyBqKyspIHtcclxuICAgICAgICAgIG1lcmNhdG9yVG9MYXRsbmcgPSBMLlByb2plY3Rpb24uU3BoZXJpY2FsTWVyY2F0b3IudW5wcm9qZWN0KEwucG9pbnQoZi5nZW9tZXRyeS5wb2ludHNbal1bMF0sIGYuZ2VvbWV0cnkucG9pbnRzW2pdWzFdKSk7XHJcbiAgICAgICAgICBmLmdlb21ldHJ5LnBvaW50c1tqXVswXSA9IG1lcmNhdG9yVG9MYXRsbmcubG5nO1xyXG4gICAgICAgICAgZi5nZW9tZXRyeS5wb2ludHNbal1bMV0gPSBtZXJjYXRvclRvTGF0bG5nLmxhdDtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoZ2VvbWV0cnlUeXBlID09PSAnZXNyaUdlb21ldHJ5UG9seWxpbmUnKSB7XHJcbiAgICAgICAgdmFyIHBhdGhsZW4sIHBhdGhzbGVuO1xyXG5cclxuICAgICAgICBmb3IgKGogPSAwLCBwYXRoc2xlbiA9IGYuZ2VvbWV0cnkucGF0aHMubGVuZ3RoOyBqIDwgcGF0aHNsZW47IGorKykge1xyXG4gICAgICAgICAgZm9yIChrID0gMCwgcGF0aGxlbiA9IGYuZ2VvbWV0cnkucGF0aHNbal0ubGVuZ3RoOyBrIDwgcGF0aGxlbjsgaysrKSB7XHJcbiAgICAgICAgICAgIG1lcmNhdG9yVG9MYXRsbmcgPSBMLlByb2plY3Rpb24uU3BoZXJpY2FsTWVyY2F0b3IudW5wcm9qZWN0KEwucG9pbnQoZi5nZW9tZXRyeS5wYXRoc1tqXVtrXVswXSwgZi5nZW9tZXRyeS5wYXRoc1tqXVtrXVsxXSkpO1xyXG4gICAgICAgICAgICBmLmdlb21ldHJ5LnBhdGhzW2pdW2tdWzBdID0gbWVyY2F0b3JUb0xhdGxuZy5sbmc7XHJcbiAgICAgICAgICAgIGYuZ2VvbWV0cnkucGF0aHNbal1ba11bMV0gPSBtZXJjYXRvclRvTGF0bG5nLmxhdDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAoZ2VvbWV0cnlUeXBlID09PSAnZXNyaUdlb21ldHJ5UG9seWdvbicpIHtcclxuICAgICAgICB2YXIgcmluZ2xlbiwgcmluZ3NsZW47XHJcblxyXG4gICAgICAgIGZvciAoaiA9IDAsIHJpbmdzbGVuID0gZi5nZW9tZXRyeS5yaW5ncy5sZW5ndGg7IGogPCByaW5nc2xlbjsgaisrKSB7XHJcbiAgICAgICAgICBmb3IgKGsgPSAwLCByaW5nbGVuID0gZi5nZW9tZXRyeS5yaW5nc1tqXS5sZW5ndGg7IGsgPCByaW5nbGVuOyBrKyspIHtcclxuICAgICAgICAgICAgbWVyY2F0b3JUb0xhdGxuZyA9IEwuUHJvamVjdGlvbi5TcGhlcmljYWxNZXJjYXRvci51bnByb2plY3QoTC5wb2ludChmLmdlb21ldHJ5LnJpbmdzW2pdW2tdWzBdLCBmLmdlb21ldHJ5LnJpbmdzW2pdW2tdWzFdKSk7XHJcbiAgICAgICAgICAgIGYuZ2VvbWV0cnkucmluZ3Nbal1ba11bMF0gPSBtZXJjYXRvclRvTGF0bG5nLmxuZztcclxuICAgICAgICAgICAgZi5nZW9tZXRyeS5yaW5nc1tqXVtrXVsxXSA9IG1lcmNhdG9yVG9MYXRsbmcubGF0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBwcm9qRmVhdHVyZXMucHVzaChmKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcHJvakZlYXR1cmVzO1xyXG4gIH0sXHJcblxyXG4gIF9mZWF0dXJlQ29sbGVjdGlvblRvR2VvSlNPTjogZnVuY3Rpb24gKGZlYXR1cmVzLCBvYmplY3RJZEZpZWxkKSB7XHJcbiAgICB2YXIgZ2VvanNvbkZlYXR1cmVDb2xsZWN0aW9uID0ge1xyXG4gICAgICB0eXBlOiAnRmVhdHVyZUNvbGxlY3Rpb24nLFxyXG4gICAgICBmZWF0dXJlczogW11cclxuICAgIH07XHJcbiAgICB2YXIgZmVhdHVyZXNBcnJheSA9IFtdO1xyXG4gICAgdmFyIGksIGxlbjtcclxuXHJcbiAgICBmb3IgKGkgPSAwLCBsZW4gPSBmZWF0dXJlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICB2YXIgZ2VvanNvbiA9IGFyY2dpc1RvR2VvSlNPTihmZWF0dXJlc1tpXSwgb2JqZWN0SWRGaWVsZCk7XHJcbiAgICAgIGZlYXR1cmVzQXJyYXkucHVzaChnZW9qc29uKTtcclxuICAgIH1cclxuXHJcbiAgICBnZW9qc29uRmVhdHVyZUNvbGxlY3Rpb24uZmVhdHVyZXMgPSBmZWF0dXJlc0FycmF5O1xyXG5cclxuICAgIHJldHVybiBnZW9qc29uRmVhdHVyZUNvbGxlY3Rpb247XHJcbiAgfVxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBmZWF0dXJlQ29sbGVjdGlvbiAoZ2VvanNvbiwgb3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgRmVhdHVyZUNvbGxlY3Rpb24oZ2VvanNvbiwgb3B0aW9ucyk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZlYXR1cmVDb2xsZWN0aW9uO1xyXG4iLCJpbXBvcnQgTCBmcm9tICdsZWFmbGV0JztcclxuXHJcbmltcG9ydCBvbW5pdm9yZSBmcm9tICdsZWFmbGV0LW9tbml2b3JlJztcclxuaW1wb3J0IHsgc2V0UmVuZGVyZXIgfSBmcm9tICcuL1JlbmRlcmVyJztcclxuXHJcbmV4cG9ydCB2YXIgQ1NWTGF5ZXIgPSBMLkdlb0pTT04uZXh0ZW5kKHtcclxuICBvcHRpb25zOiB7XHJcbiAgICB1cmw6ICcnLFxyXG4gICAgZGF0YToge30sIC8vIEVzcmkgRmVhdHVyZSBDb2xsZWN0aW9uIEpTT04gb3IgSXRlbSBJRFxyXG4gICAgb3BhY2l0eTogMVxyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uIChsYXllcnMsIG9wdGlvbnMpIHtcclxuICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLnVybCA9IHRoaXMub3B0aW9ucy51cmw7XHJcbiAgICB0aGlzLmxheWVyRGVmaW5pdGlvbiA9IHRoaXMub3B0aW9ucy5sYXllckRlZmluaXRpb247XHJcbiAgICB0aGlzLmxvY2F0aW9uSW5mbyA9IHRoaXMub3B0aW9ucy5sb2NhdGlvbkluZm87XHJcbiAgICB0aGlzLm9wYWNpdHkgPSB0aGlzLm9wdGlvbnMub3BhY2l0eTtcclxuICAgIHRoaXMuX2xheWVycyA9IHt9O1xyXG5cclxuICAgIHZhciBpLCBsZW47XHJcblxyXG4gICAgaWYgKGxheWVycykge1xyXG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsYXllcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICB0aGlzLmFkZExheWVyKGxheWVyc1tpXSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9wYXJzZUNTVih0aGlzLnVybCwgdGhpcy5sYXllckRlZmluaXRpb24sIHRoaXMubG9jYXRpb25JbmZvKTtcclxuICB9LFxyXG5cclxuICBfcGFyc2VDU1Y6IGZ1bmN0aW9uICh1cmwsIGxheWVyRGVmaW5pdGlvbiwgbG9jYXRpb25JbmZvKSB7XHJcbiAgICBvbW5pdm9yZS5jc3YodXJsLCB7XHJcbiAgICAgIGxhdGZpZWxkOiBsb2NhdGlvbkluZm8ubGF0aXR1ZGVGaWVsZE5hbWUsXHJcbiAgICAgIGxvbmZpZWxkOiBsb2NhdGlvbkluZm8ubG9uZ2l0dWRlRmllbGROYW1lXHJcbiAgICB9LCB0aGlzKTtcclxuXHJcbiAgICBzZXRSZW5kZXJlcihsYXllckRlZmluaXRpb24sIHRoaXMpO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3N2TGF5ZXIgKGdlb2pzb24sIG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IENTVkxheWVyKGdlb2pzb24sIG9wdGlvbnMpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBDU1ZMYXllcjtcclxuIiwiaW1wb3J0IEwgZnJvbSAnbGVhZmxldCc7XHJcblxyXG5pbXBvcnQgeyBhcmNnaXNUb0dlb0pTT04gfSBmcm9tICdhcmNnaXMtdG8tZ2VvanNvbi11dGlscyc7XHJcbmltcG9ydCB7IHNldFJlbmRlcmVyIH0gZnJvbSAnLi9SZW5kZXJlcic7XHJcblxyXG5leHBvcnQgdmFyIEtNTExheWVyID0gTC5HZW9KU09OLmV4dGVuZCh7XHJcbiAgb3B0aW9uczoge1xyXG4gICAgb3BhY2l0eTogMSxcclxuICAgIHVybDogJydcclxuICB9LFxyXG5cclxuICBpbml0aWFsaXplOiBmdW5jdGlvbiAobGF5ZXJzLCBvcHRpb25zKSB7XHJcbiAgICBMLnNldE9wdGlvbnModGhpcywgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy51cmwgPSB0aGlzLm9wdGlvbnMudXJsO1xyXG4gICAgdGhpcy5vcGFjaXR5ID0gdGhpcy5vcHRpb25zLm9wYWNpdHk7XHJcbiAgICB0aGlzLnBvcHVwSW5mbyA9IG51bGw7XHJcbiAgICB0aGlzLmxhYmVsaW5nSW5mbyA9IG51bGw7XHJcbiAgICB0aGlzLl9sYXllcnMgPSB7fTtcclxuXHJcbiAgICB2YXIgaSwgbGVuO1xyXG5cclxuICAgIGlmIChsYXllcnMpIHtcclxuICAgICAgZm9yIChpID0gMCwgbGVuID0gbGF5ZXJzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5hZGRMYXllcihsYXllcnNbaV0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZ2V0S01MKHRoaXMudXJsKTtcclxuICB9LFxyXG5cclxuICBfZ2V0S01MOiBmdW5jdGlvbiAodXJsKSB7XHJcbiAgICB2YXIgcmVxdWVzdFVybCA9ICdodHRwOi8vdXRpbGl0eS5hcmNnaXMuY29tL3NoYXJpbmcva21sP3VybD0nICsgdXJsICsgJyZtb2RlbD1zaW1wbGUmZm9sZGVycz0mb3V0U1I9JTdCXCJ3a2lkXCIlM0E0MzI2JTdEJztcclxuICAgIEwuZXNyaS5yZXF1ZXN0KHJlcXVlc3RVcmwsIHt9LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcclxuICAgICAgaWYgKGVycikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVycik7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2cocmVzKTtcclxuICAgICAgICB0aGlzLl9wYXJzZUZlYXR1cmVDb2xsZWN0aW9uKHJlcy5mZWF0dXJlQ29sbGVjdGlvbik7XHJcbiAgICAgIH1cclxuICAgIH0sIHRoaXMpO1xyXG4gIH0sXHJcblxyXG4gIF9wYXJzZUZlYXR1cmVDb2xsZWN0aW9uOiBmdW5jdGlvbiAoZmVhdHVyZUNvbGxlY3Rpb24pIHtcclxuICAgIGNvbnNvbGUubG9nKCdfcGFyc2VGZWF0dXJlQ29sbGVjdGlvbicpO1xyXG4gICAgdmFyIGk7XHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgMzsgaSsrKSB7XHJcbiAgICAgIGlmIChmZWF0dXJlQ29sbGVjdGlvbi5sYXllcnNbaV0uZmVhdHVyZVNldC5mZWF0dXJlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coaSk7XHJcbiAgICAgICAgdmFyIGZlYXR1cmVzID0gZmVhdHVyZUNvbGxlY3Rpb24ubGF5ZXJzW2ldLmZlYXR1cmVTZXQuZmVhdHVyZXM7XHJcbiAgICAgICAgdmFyIG9iamVjdElkRmllbGQgPSBmZWF0dXJlQ29sbGVjdGlvbi5sYXllcnNbaV0ubGF5ZXJEZWZpbml0aW9uLm9iamVjdElkRmllbGQ7XHJcblxyXG4gICAgICAgIHZhciBnZW9qc29uID0gdGhpcy5fZmVhdHVyZUNvbGxlY3Rpb25Ub0dlb0pTT04oZmVhdHVyZXMsIG9iamVjdElkRmllbGQpO1xyXG5cclxuICAgICAgICBpZiAoZmVhdHVyZUNvbGxlY3Rpb24ubGF5ZXJzW2ldLnBvcHVwSW5mbyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICB0aGlzLnBvcHVwSW5mbyA9IGZlYXR1cmVDb2xsZWN0aW9uLmxheWVyc1tpXS5wb3B1cEluZm87XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmZWF0dXJlQ29sbGVjdGlvbi5sYXllcnNbaV0ubGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLmxhYmVsaW5nSW5mbyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICB0aGlzLmxhYmVsaW5nSW5mbyA9IGZlYXR1cmVDb2xsZWN0aW9uLmxheWVyc1tpXS5sYXllckRlZmluaXRpb24uZHJhd2luZ0luZm8ubGFiZWxpbmdJbmZvO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0UmVuZGVyZXIoZmVhdHVyZUNvbGxlY3Rpb24ubGF5ZXJzW2ldLmxheWVyRGVmaW5pdGlvbiwgdGhpcyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coZ2VvanNvbik7XHJcbiAgICAgICAgdGhpcy5hZGREYXRhKGdlb2pzb24pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgX2ZlYXR1cmVDb2xsZWN0aW9uVG9HZW9KU09OOiBmdW5jdGlvbiAoZmVhdHVyZXMsIG9iamVjdElkRmllbGQpIHtcclxuICAgIHZhciBnZW9qc29uRmVhdHVyZUNvbGxlY3Rpb24gPSB7XHJcbiAgICAgIHR5cGU6ICdGZWF0dXJlQ29sbGVjdGlvbicsXHJcbiAgICAgIGZlYXR1cmVzOiBbXVxyXG4gICAgfTtcclxuICAgIHZhciBmZWF0dXJlc0FycmF5ID0gW107XHJcbiAgICB2YXIgaSwgbGVuO1xyXG5cclxuICAgIGZvciAoaSA9IDAsIGxlbiA9IGZlYXR1cmVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgIHZhciBnZW9qc29uID0gYXJjZ2lzVG9HZW9KU09OKGZlYXR1cmVzW2ldLCBvYmplY3RJZEZpZWxkKTtcclxuICAgICAgZmVhdHVyZXNBcnJheS5wdXNoKGdlb2pzb24pO1xyXG4gICAgfVxyXG5cclxuICAgIGdlb2pzb25GZWF0dXJlQ29sbGVjdGlvbi5mZWF0dXJlcyA9IGZlYXR1cmVzQXJyYXk7XHJcblxyXG4gICAgcmV0dXJuIGdlb2pzb25GZWF0dXJlQ29sbGVjdGlvbjtcclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGttbExheWVyIChnZW9qc29uLCBvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBLTUxMYXllcihnZW9qc29uLCBvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgS01MTGF5ZXI7XHJcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xyXG5cclxuZXhwb3J0IHZhciBMYWJlbEljb24gPSBMLkRpdkljb24uZXh0ZW5kKHtcclxuICBvcHRpb25zOiB7XHJcbiAgICBpY29uU2l6ZTogbnVsbCxcclxuICAgIGNsYXNzTmFtZTogJ2VzcmktbGVhZmxldC13ZWJtYXAtbGFiZWxzJyxcclxuICAgIHRleHQ6ICcnXHJcbiAgfSxcclxuXHJcbiAgY3JlYXRlSWNvbjogZnVuY3Rpb24gKG9sZEljb24pIHtcclxuICAgIHZhciBkaXYgPSAob2xkSWNvbiAmJiBvbGRJY29uLnRhZ05hbWUgPT09ICdESVYnKSA/IG9sZEljb24gOiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xyXG5cclxuICAgIGRpdi5pbm5lckhUTUwgPSAnPGRpdiBzdHlsZT1cInBvc2l0aW9uOiByZWxhdGl2ZTsgbGVmdDogLTUwJTsgdGV4dC1zaGFkb3c6IDFweCAxcHggMHB4ICNmZmYsIC0xcHggMXB4IDBweCAjZmZmLCAxcHggLTFweCAwcHggI2ZmZiwgLTFweCAtMXB4IDBweCAjZmZmO1wiPicgKyBvcHRpb25zLnRleHQgKyAnPC9kaXY+JztcclxuXHJcbiAgICAvLyBsYWJlbC5jc3NcclxuICAgIGRpdi5zdHlsZS5mb250U2l6ZSA9ICcxZW0nO1xyXG4gICAgZGl2LnN0eWxlLmZvbnRXZWlnaHQgPSAnYm9sZCc7XHJcbiAgICBkaXYuc3R5bGUudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xyXG4gICAgZGl2LnN0eWxlLnRleHRBbGlnbiA9ICdjZW50ZXInO1xyXG4gICAgZGl2LnN0eWxlLndoaXRlU3BhY2UgPSAnbm93cmFwJztcclxuXHJcbiAgICBpZiAob3B0aW9ucy5iZ1Bvcykge1xyXG4gICAgICB2YXIgYmdQb3MgPSBMLnBvaW50KG9wdGlvbnMuYmdQb3MpO1xyXG4gICAgICBkaXYuc3R5bGUuYmFja2dyb3VuZFBvc2l0aW9uID0gKC1iZ1Bvcy54KSArICdweCAnICsgKC1iZ1Bvcy55KSArICdweCc7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9zZXRJY29uU3R5bGVzKGRpdiwgJ2ljb24nKTtcclxuXHJcbiAgICByZXR1cm4gZGl2O1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGFiZWxJY29uIChvcHRpb25zKSB7XHJcbiAgcmV0dXJuIG5ldyBMYWJlbEljb24ob3B0aW9ucyk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGxhYmVsSWNvbjtcclxuIiwiaW1wb3J0IEwgZnJvbSAnbGVhZmxldCc7XHJcbmltcG9ydCB7IGxhYmVsSWNvbiB9IGZyb20gJy4vTGFiZWxJY29uJztcclxuXHJcbmV4cG9ydCB2YXIgTGFiZWxNYXJrZXIgPSBMLk1hcmtlci5leHRlbmQoe1xyXG4gIG9wdGlvbnM6IHtcclxuICAgIHByb3BlcnRpZXM6IHt9LFxyXG4gICAgbGFiZWxpbmdJbmZvOiB7fSxcclxuICAgIG9mZnNldDogWzAsIDBdXHJcbiAgfSxcclxuXHJcbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKGxhdGxuZywgb3B0aW9ucykge1xyXG4gICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xyXG4gICAgdGhpcy5fbGF0bG5nID0gTC5sYXRMbmcobGF0bG5nKTtcclxuXHJcbiAgICB2YXIgbGFiZWxUZXh0ID0gdGhpcy5fY3JlYXRlTGFiZWxUZXh0KHRoaXMub3B0aW9ucy5wcm9wZXJ0aWVzLCB0aGlzLm9wdGlvbnMubGFiZWxpbmdJbmZvKTtcclxuICAgIHRoaXMuX3NldExhYmVsSWNvbihsYWJlbFRleHQsIHRoaXMub3B0aW9ucy5vZmZzZXQpO1xyXG4gIH0sXHJcblxyXG4gIF9jcmVhdGVMYWJlbFRleHQ6IGZ1bmN0aW9uIChwcm9wZXJ0aWVzLCBsYWJlbGluZ0luZm8pIHtcclxuICAgIHZhciByID0gL1xcWyhbXlxcXV0qKVxcXS9nO1xyXG4gICAgdmFyIGxhYmVsVGV4dCA9IGxhYmVsaW5nSW5mb1swXS5sYWJlbEV4cHJlc3Npb247XHJcblxyXG4gICAgbGFiZWxUZXh0ID0gbGFiZWxUZXh0LnJlcGxhY2UociwgZnVuY3Rpb24gKHMpIHtcclxuICAgICAgdmFyIG0gPSByLmV4ZWMocyk7XHJcbiAgICAgIHJldHVybiBwcm9wZXJ0aWVzW21bMV1dO1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmV0dXJuIGxhYmVsVGV4dDtcclxuICB9LFxyXG5cclxuICBfc2V0TGFiZWxJY29uOiBmdW5jdGlvbiAodGV4dCwgb2Zmc2V0KSB7XHJcbiAgICB2YXIgaWNvbiA9IGxhYmVsSWNvbih7XHJcbiAgICAgIHRleHQ6IHRleHQsXHJcbiAgICAgIGljb25BbmNob3I6IG9mZnNldFxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5zZXRJY29uKGljb24pO1xyXG4gIH1cclxufSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGFiZWxNYXJrZXIgKGxhdGxuZywgb3B0aW9ucykge1xyXG4gIHJldHVybiBuZXcgTGFiZWxNYXJrZXIobGF0bG5nLCBvcHRpb25zKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgbGFiZWxNYXJrZXI7XHJcbiIsImV4cG9ydCBmdW5jdGlvbiBwb2ludExhYmVsUG9zIChjb29yZGluYXRlcykge1xyXG4gIHZhciBsYWJlbFBvcyA9IHsgcG9zaXRpb246IFtdLCBvZmZzZXQ6IFtdIH07XHJcblxyXG4gIGxhYmVsUG9zLnBvc2l0aW9uID0gY29vcmRpbmF0ZXMucmV2ZXJzZSgpO1xyXG4gIGxhYmVsUG9zLm9mZnNldCA9IFsyMCwgMjBdO1xyXG5cclxuICByZXR1cm4gbGFiZWxQb3M7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgUG9pbnRMYWJlbCA9IHtcclxuICBwb2ludExhYmVsUG9zOiBwb2ludExhYmVsUG9zXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQb2ludExhYmVsO1xyXG4iLCJleHBvcnQgZnVuY3Rpb24gcG9seWxpbmVMYWJlbFBvcyAoY29vcmRpbmF0ZXMpIHtcclxuICB2YXIgbGFiZWxQb3MgPSB7IHBvc2l0aW9uOiBbXSwgb2Zmc2V0OiBbXSB9O1xyXG4gIHZhciBjZW50cmFsS2V5O1xyXG5cclxuICBjZW50cmFsS2V5ID0gTWF0aC5yb3VuZChjb29yZGluYXRlcy5sZW5ndGggLyAyKTtcclxuICBsYWJlbFBvcy5wb3NpdGlvbiA9IGNvb3JkaW5hdGVzW2NlbnRyYWxLZXldLnJldmVyc2UoKTtcclxuICBsYWJlbFBvcy5vZmZzZXQgPSBbMCwgMF07XHJcblxyXG4gIHJldHVybiBsYWJlbFBvcztcclxufVxyXG5cclxuZXhwb3J0IHZhciBQb2x5bGluZUxhYmVsID0ge1xyXG4gIHBvbHlsaW5lTGFiZWxQb3M6IHBvbHlsaW5lTGFiZWxQb3NcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IFBvbHlsaW5lTGFiZWw7XHJcbiIsImV4cG9ydCBmdW5jdGlvbiBwb2x5Z29uTGFiZWxQb3MgKGxheWVyLCBjb29yZGluYXRlcykge1xyXG4gIHZhciBsYWJlbFBvcyA9IHsgcG9zaXRpb246IFtdLCBvZmZzZXQ6IFtdIH07XHJcblxyXG4gIGxhYmVsUG9zLnBvc2l0aW9uID0gbGF5ZXIuZ2V0Qm91bmRzKCkuZ2V0Q2VudGVyKCk7XHJcbiAgbGFiZWxQb3Mub2Zmc2V0ID0gWzAsIDBdO1xyXG5cclxuICByZXR1cm4gbGFiZWxQb3M7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgUG9seWdvbkxhYmVsID0ge1xyXG4gIHBvbHlnb25MYWJlbFBvczogcG9seWdvbkxhYmVsUG9zXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBQb2x5Z29uTGFiZWw7XHJcbiIsIlxyXG5mdW5jdGlvbiB0cmFuc2Zvcm1QaG9uZU51bWJlcih2YWx1ZSkge1xyXG4gIHZhciBzMiA9IChcIlwiK3ZhbHVlKS5yZXBsYWNlKC9cXEQvZywgJycpO1xyXG4gIHZhciBtID0gczIubWF0Y2goL14oXFxkezN9KShcXGR7M30pKFxcZHs0fSkkLyk7XHJcbiAgcmV0dXJuICghbSkgPyBudWxsIDogXCIoXCIgKyBtWzFdICsgXCIpIFwiICsgbVsyXSArIFwiLVwiICsgbVszXTtcclxufVxyXG5cclxuZnVuY3Rpb24gdHJhbnNmb3JtRGF0ZSh2YWx1ZSkge1xyXG4gIC8vIHZhciBtb21lbnQgPSBnbG9iYWxzLm1vbWVudDtcclxuICByZXR1cm4gbW9tZW50KHZhbHVlKS5mb3JtYXQoJ01NL0REL1lZWVknKTtcclxufVxyXG5cclxuZnVuY3Rpb24gdHJhbnNmb3JtRGVjaW1hbFBsYWNlKHZhbHVlKSB7XHJcbiAgdmFyIG51bWJlciA9IFN0cmluZyh2YWx1ZSkubWF0Y2goL1xcZCsvKVswXS5yZXBsYWNlKC8oLikoPz0oXFxkezN9KSskKS9nLCckMSwnKTtcclxuICB2YXIgbGFiZWwgPSBTdHJpbmcodmFsdWUpLnJlcGxhY2UoL1swLTldL2csICcnKSB8fCAnJztcclxuICByZXR1cm4gbnVtYmVyICsgJyAnICsgbGFiZWw7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUG9wdXBDb250ZW50IChwb3B1cEluZm8sIHByb3BlcnRpZXMpIHtcclxuICAvLyBjb25zb2xlLmxvZygncG9wdXBJbmZvOicsIHBvcHVwSW5mbyk7XHJcbiAgLy8gY29uc29sZS5sb2coJ3BvcHVwIHByb3BlcnRpZXM6JywgcHJvcGVydGllcyk7XHJcbiAgdmFyIHIgPSAvXFx7KFteXFxdXSopXFx9L2c7XHJcbiAgdmFyIHRpdGxlVGV4dCA9ICcnO1xyXG4gIHZhciBjb250ZW50ID0gJyc7XHJcblxyXG4gIGlmIChwb3B1cEluZm8udGl0bGUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgdGl0bGVUZXh0ID0gcG9wdXBJbmZvLnRpdGxlO1xyXG4gIH1cclxuXHJcbiAgdGl0bGVUZXh0ID0gdGl0bGVUZXh0LnJlcGxhY2UociwgZnVuY3Rpb24gKHMpIHtcclxuICAgIHZhciBtID0gci5leGVjKHMpO1xyXG4gICAgcmV0dXJuIHByb3BlcnRpZXNbbVsxXV07XHJcbiAgfSk7XHJcblxyXG4gIGNvbnRlbnQgPSAnPGRpdiBjbGFzcz1cImxlYWZsZXQtcG9wdXAtY29udGVudC10aXRsZVwiPjxoND4nICsgdGl0bGVUZXh0ICsgJzwvaDQ+PC9kaXY+PGRpdiBjbGFzcz1cImxlYWZsZXQtcG9wdXAtY29udGVudC1kZXNjcmlwdGlvblwiIHN0eWxlPVwibWF4LWhlaWdodDoyMDBweDtvdmVyZmxvdzphdXRvO1wiPic7XHJcblxyXG4gIHZhciBjb250ZW50U3RhcnQgPSAnPGRpdiBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Izk5OTttYXJnaW4tdG9wOjVweDt3b3JkLWJyZWFrOmJyZWFrLWFsbDtcIj4nXHJcbiAgdmFyIGNvbnRlbnRNaWRkbGUgPSAnPC9kaXY+PHAgc3R5bGU9XCJtYXJnaW4tdG9wOjA7bWFyZ2luLWJvdHRvbTo1cHg7d29yZC1icmVhazpicmVhay1hbGw7XCI+J1xyXG4gIHZhciBhVGFnU3RhcnQgPSAnPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj1cIidcclxuICB2YXIgZW1haWxUYWdTdGFydCA9ICc8YSBocmVmPVwibWFpbHRvOidcclxuXHJcbiAgaWYgKHBvcHVwSW5mby5maWVsZEluZm9zICE9PSB1bmRlZmluZWQpIHtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcG9wdXBJbmZvLmZpZWxkSW5mb3MubGVuZ3RoOyBpKyspIHtcclxuICAgICAgaWYgKHBvcHVwSW5mby5maWVsZEluZm9zW2ldLnZpc2libGUgPT09IHRydWUpIHtcclxuICAgICAgICAvLyBpZiB0aGUgaW5mbyBpcyBhIFVSTFxyXG4gICAgICAgIGlmIChwb3B1cEluZm8uZmllbGRJbmZvc1tpXS5maWVsZE5hbWUgPT09ICdVUkwnKSB7XHJcbiAgICAgICAgICBjb250ZW50ICs9IGNvbnRlbnRTdGFydFxyXG4gICAgICAgICAgICAgICAgICArIHBvcHVwSW5mby5maWVsZEluZm9zW2ldLmxhYmVsXHJcbiAgICAgICAgICAgICAgICAgICsgY29udGVudE1pZGRsZVxyXG4gICAgICAgICAgICAgICAgICArIGFUYWdTdGFydFxyXG4gICAgICAgICAgICAgICAgICArIHByb3BlcnRpZXNbcG9wdXBJbmZvLmZpZWxkSW5mb3NbaV0uZmllbGROYW1lXVxyXG4gICAgICAgICAgICAgICAgICArICdcIj4nXHJcbiAgICAgICAgICAgICAgICAgICsgcHJvcGVydGllc1twb3B1cEluZm8uZmllbGRJbmZvc1tpXS5maWVsZE5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICsgJzwvYT48L3A+JztcclxuICAgICAgICAvLyBpZiB0aGUgaW5mbyBpcyBhbiBlbWFpbCBhZGRyZXNzXHJcbiAgICAgICAgfSBlbHNlIGlmIChwb3B1cEluZm8uZmllbGRJbmZvc1tpXS5maWVsZE5hbWUuaW5jbHVkZXMoJ0VNQUlMJykpIHtcclxuICAgICAgICAgIGNvbnRlbnQgKz0gY29udGVudFN0YXJ0XHJcbiAgICAgICAgICAgICAgICAgICsgcG9wdXBJbmZvLmZpZWxkSW5mb3NbaV0ubGFiZWxcclxuICAgICAgICAgICAgICAgICAgKyBjb250ZW50TWlkZGxlXHJcbiAgICAgICAgICAgICAgICAgICsgZW1haWxUYWdTdGFydFxyXG4gICAgICAgICAgICAgICAgICArIHByb3BlcnRpZXNbcG9wdXBJbmZvLmZpZWxkSW5mb3NbaV0uZmllbGROYW1lXVxyXG4gICAgICAgICAgICAgICAgICArICdcIj4nXHJcbiAgICAgICAgICAgICAgICAgICsgcHJvcGVydGllc1twb3B1cEluZm8uZmllbGRJbmZvc1tpXS5maWVsZE5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICsgJzwvYT48L3A+JztcclxuICAgICAgICAvLyBpZiB0aGUgaW5mbyBpcyBhIHBob25lIG51bWJlclxyXG4gICAgICAgIH0gZWxzZSBpZiAocG9wdXBJbmZvLmZpZWxkSW5mb3NbaV0uZmllbGROYW1lLmluY2x1ZGVzKCdQSE9ORScpKSB7XHJcbiAgICAgICAgICBjb250ZW50ICs9IGNvbnRlbnRTdGFydFxyXG4gICAgICAgICAgICAgICAgICArIHBvcHVwSW5mby5maWVsZEluZm9zW2ldLmxhYmVsXHJcbiAgICAgICAgICAgICAgICAgICsgY29udGVudE1pZGRsZVxyXG4gICAgICAgICAgICAgICAgICArIHRyYW5zZm9ybVBob25lTnVtYmVyKHByb3BlcnRpZXNbcG9wdXBJbmZvLmZpZWxkSW5mb3NbaV0uZmllbGROYW1lXSlcclxuICAgICAgICAgICAgICAgICAgKyAnPC9wPic7XHJcbiAgICAgICAgLy8gaWYgdGhlIGluZm8gaXMgYSBkYXRlXHJcbiAgICAgIH0gZWxzZSBpZiAocG9wdXBJbmZvLmZpZWxkSW5mb3NbaV0uZmllbGROYW1lLmluY2x1ZGVzKCdEQVRFJykpIHtcclxuICAgICAgICAgIGNvbnRlbnQgKz0gY29udGVudFN0YXJ0XHJcbiAgICAgICAgICAgICAgICAgICsgcG9wdXBJbmZvLmZpZWxkSW5mb3NbaV0ubGFiZWxcclxuICAgICAgICAgICAgICAgICAgKyBjb250ZW50TWlkZGxlXHJcbiAgICAgICAgICAgICAgICAgICsgdHJhbnNmb3JtRGF0ZShwcm9wZXJ0aWVzW3BvcHVwSW5mby5maWVsZEluZm9zW2ldLmZpZWxkTmFtZV0pXHJcbiAgICAgICAgICAgICAgICAgICsgJzwvcD4nO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb250ZW50ICs9IGNvbnRlbnRTdGFydFxyXG4gICAgICAgICAgICAgICAgICArIHBvcHVwSW5mby5maWVsZEluZm9zW2ldLmxhYmVsXHJcbiAgICAgICAgICAgICAgICAgICsgY29udGVudE1pZGRsZVxyXG4gICAgICAgICAgICAgICAgICArIHByb3BlcnRpZXNbcG9wdXBJbmZvLmZpZWxkSW5mb3NbaV0uZmllbGROYW1lXVxyXG4gICAgICAgICAgICAgICAgICArICc8L3A+JztcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGNvbnRlbnQgKz0gJzwvZGl2Pic7XHJcblxyXG4gIH0gZWxzZSBpZiAocG9wdXBJbmZvLmRlc2NyaXB0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgIC8vIEtNTExheWVyIHBvcHVwXHJcbiAgICB2YXIgZGVzY3JpcHRpb25UZXh0ID0gcG9wdXBJbmZvLmRlc2NyaXB0aW9uLnJlcGxhY2UociwgZnVuY3Rpb24gKHMpIHtcclxuICAgICAgdmFyIG0gPSByLmV4ZWMocyk7XHJcbiAgICAgIHJldHVybiBwcm9wZXJ0aWVzW21bMV1dO1xyXG4gICAgfSk7XHJcbiAgICBjb250ZW50ICs9IGRlc2NyaXB0aW9uVGV4dCArICc8L2Rpdj4nO1xyXG4gIH1cclxuXHJcbiAgLy8gaWYgKHBvcHVwSW5mby5tZWRpYUluZm9zLmxlbmd0aCA+IDApIHtcclxuICAgIC8vIEl0IGRvZXMgbm90IHN1cHBvcnQgbWVkaWFJbmZvcyBmb3IgcG9wdXAgY29udGVudHMuXHJcbiAgLy8gfVxyXG5cclxuICByZXR1cm4gY29udGVudDtcclxufVxyXG5cclxuZXhwb3J0IHZhciBQb3B1cCA9IHtcclxuICBjcmVhdGVQb3B1cENvbnRlbnQ6IGNyZWF0ZVBvcHVwQ29udGVudFxyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgUG9wdXA7XHJcbiIsImltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyBmZWF0dXJlQ29sbGVjdGlvbiB9IGZyb20gJy4vRmVhdHVyZUNvbGxlY3Rpb24vRmVhdHVyZUNvbGxlY3Rpb24nO1xyXG5pbXBvcnQgeyBjc3ZMYXllciB9IGZyb20gJy4vRmVhdHVyZUNvbGxlY3Rpb24vQ1NWTGF5ZXInO1xyXG5pbXBvcnQgeyBrbWxMYXllciB9IGZyb20gJy4vRmVhdHVyZUNvbGxlY3Rpb24vS01MTGF5ZXInO1xyXG5pbXBvcnQgeyBsYWJlbE1hcmtlciB9IGZyb20gJy4vTGFiZWwvTGFiZWxNYXJrZXInO1xyXG5pbXBvcnQgeyBwb2ludExhYmVsUG9zIH0gZnJvbSAnLi9MYWJlbC9Qb2ludExhYmVsJztcclxuaW1wb3J0IHsgcG9seWxpbmVMYWJlbFBvcyB9IGZyb20gJy4vTGFiZWwvUG9seWxpbmVMYWJlbCc7XHJcbmltcG9ydCB7IHBvbHlnb25MYWJlbFBvcyB9IGZyb20gJy4vTGFiZWwvUG9seWdvbkxhYmVsJztcclxuaW1wb3J0IHsgY3JlYXRlUG9wdXBDb250ZW50IH0gZnJvbSAnLi9Qb3B1cC9Qb3B1cCc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gb3BlcmF0aW9uYWxMYXllciAobGF5ZXIsIGxheWVycywgbWFwLCBwYXJhbXMsIHBhbmVOYW1lKSB7XHJcbiAgcmV0dXJuIF9nZW5lcmF0ZUVzcmlMYXllcihsYXllciwgbGF5ZXJzLCBtYXAsIHBhcmFtcywgcGFuZU5hbWUpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gX2dlbmVyYXRlRXNyaUxheWVyIChsYXllciwgbGF5ZXJzLCBtYXAsIHBhcmFtcywgcGFuZU5hbWUpIHtcclxuICBjb25zb2xlLmxvZygnZ2VuZXJhdGVFc3JpTGF5ZXI6ICcsIGxheWVyLnRpdGxlLCBsYXllcik7XHJcbiAgdmFyIGx5cjtcclxuICB2YXIgbGFiZWxzID0gW107XHJcbiAgdmFyIGxhYmVsc0xheWVyO1xyXG4gIHZhciBsYWJlbFBhbmVOYW1lID0gcGFuZU5hbWUgKyAnLWxhYmVsJztcclxuICB2YXIgaSwgbGVuO1xyXG5cclxuICBpZiAobGF5ZXIudHlwZSA9PT0gJ0ZlYXR1cmUgQ29sbGVjdGlvbicgfHwgbGF5ZXIuZmVhdHVyZUNvbGxlY3Rpb24gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgY29uc29sZS5sb2coJ2NyZWF0ZSBGZWF0dXJlQ29sbGVjdGlvbicpO1xyXG5cclxuICAgIG1hcC5jcmVhdGVQYW5lKGxhYmVsUGFuZU5hbWUpO1xyXG5cclxuICAgIHZhciBwb3B1cEluZm8sIGxhYmVsaW5nSW5mbztcclxuICAgIGlmIChsYXllci5pdGVtSWQgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBmb3IgKGkgPSAwLCBsZW4gPSBsYXllci5mZWF0dXJlQ29sbGVjdGlvbi5sYXllcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICBpZiAobGF5ZXIuZmVhdHVyZUNvbGxlY3Rpb24ubGF5ZXJzW2ldLmZlYXR1cmVTZXQuZmVhdHVyZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgaWYgKGxheWVyLmZlYXR1cmVDb2xsZWN0aW9uLmxheWVyc1tpXS5wb3B1cEluZm8gIT09IHVuZGVmaW5lZCAmJiBsYXllci5mZWF0dXJlQ29sbGVjdGlvbi5sYXllcnNbaV0ucG9wdXBJbmZvICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHBvcHVwSW5mbyA9IGxheWVyLmZlYXR1cmVDb2xsZWN0aW9uLmxheWVyc1tpXS5wb3B1cEluZm87XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAobGF5ZXIuZmVhdHVyZUNvbGxlY3Rpb24ubGF5ZXJzW2ldLmxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mby5sYWJlbGluZ0luZm8gIT09IHVuZGVmaW5lZCAmJiBsYXllci5mZWF0dXJlQ29sbGVjdGlvbi5sYXllcnNbaV0ubGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLmxhYmVsaW5nSW5mbyAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsYWJlbGluZ0luZm8gPSBsYXllci5mZWF0dXJlQ29sbGVjdGlvbi5sYXllcnNbaV0ubGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLmxhYmVsaW5nSW5mbztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBsYWJlbHNMYXllciA9IEwuZmVhdHVyZUdyb3VwKGxhYmVscyk7XHJcbiAgICB2YXIgZmMgPSBmZWF0dXJlQ29sbGVjdGlvbihudWxsLCB7XHJcbiAgICAgIGRhdGE6IGxheWVyLml0ZW1JZCB8fCBsYXllci5mZWF0dXJlQ29sbGVjdGlvbixcclxuICAgICAgb3BhY2l0eTogbGF5ZXIub3BhY2l0eSxcclxuICAgICAgcGFuZTogcGFuZU5hbWUsXHJcbiAgICAgIG9uRWFjaEZlYXR1cmU6IGZ1bmN0aW9uIChnZW9qc29uLCBsKSB7XHJcbiAgICAgICAgaWYgKGZjICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHBvcHVwSW5mbyA9IGZjLnBvcHVwSW5mbztcclxuICAgICAgICAgIGxhYmVsaW5nSW5mbyA9IGZjLmxhYmVsaW5nSW5mbztcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHBvcHVwSW5mbyAhPT0gdW5kZWZpbmVkICYmIHBvcHVwSW5mbyAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgdmFyIHBvcHVwQ29udGVudCA9IGNyZWF0ZVBvcHVwQ29udGVudChwb3B1cEluZm8sIGdlb2pzb24ucHJvcGVydGllcyk7XHJcbiAgICAgICAgICAvLyBsLmJpbmRQb3B1cChwb3B1cENvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGFiZWxpbmdJbmZvICE9PSB1bmRlZmluZWQgJiYgbGFiZWxpbmdJbmZvICE9PSBudWxsKSB7XHJcbiAgICAgICAgICB2YXIgY29vcmRpbmF0ZXMgPSBsLmZlYXR1cmUuZ2VvbWV0cnkuY29vcmRpbmF0ZXM7XHJcbiAgICAgICAgICB2YXIgbGFiZWxQb3M7XHJcblxyXG4gICAgICAgICAgaWYgKGwuZmVhdHVyZS5nZW9tZXRyeS50eXBlID09PSAnUG9pbnQnKSB7XHJcbiAgICAgICAgICAgIGxhYmVsUG9zID0gcG9pbnRMYWJlbFBvcyhjb29yZGluYXRlcyk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGwuZmVhdHVyZS5nZW9tZXRyeS50eXBlID09PSAnTGluZVN0cmluZycpIHtcclxuICAgICAgICAgICAgbGFiZWxQb3MgPSBwb2x5bGluZUxhYmVsUG9zKGNvb3JkaW5hdGVzKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAobC5mZWF0dXJlLmdlb21ldHJ5LnR5cGUgPT09ICdNdWx0aUxpbmVTdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGxhYmVsUG9zID0gcG9seWxpbmVMYWJlbFBvcyhjb29yZGluYXRlc1tNYXRoLnJvdW5kKGNvb3JkaW5hdGVzLmxlbmd0aCAvIDIpXSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYWJlbFBvcyA9IHBvbHlnb25MYWJlbFBvcyhsKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE1hcmtlcihsYWJlbFBvcy5wb3NpdGlvbiwge1xyXG4gICAgICAgICAgICB6SW5kZXhPZmZzZXQ6IDEsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IGdlb2pzb24ucHJvcGVydGllcyxcclxuICAgICAgICAgICAgbGFiZWxpbmdJbmZvOiBsYWJlbGluZ0luZm8sXHJcbiAgICAgICAgICAgIG9mZnNldDogbGFiZWxQb3Mub2Zmc2V0LFxyXG4gICAgICAgICAgICBwYW5lOiBsYWJlbFBhbmVOYW1lXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBsYWJlbHNMYXllci5hZGRMYXllcihsYWJlbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBseXIgPSBMLmxheWVyR3JvdXAoW2ZjLCBsYWJlbHNMYXllcl0pO1xyXG5cclxuICAgIGxheWVycy5wdXNoKHsgdHlwZTogJ0ZDJywgdGl0bGU6IGxheWVyLnRpdGxlIHx8ICcnLCBsYXllcjogbHlyIH0pO1xyXG5cclxuICAgIHJldHVybiBseXI7XHJcbiAgfSBlbHNlIGlmIChsYXllci5sYXllclR5cGUgPT09ICdBcmNHSVNGZWF0dXJlTGF5ZXInICYmIGxheWVyLmxheWVyRGVmaW5pdGlvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgd2hlcmUgPSAnMT0xJztcclxuICAgIGlmIChsYXllci5sYXllckRlZmluaXRpb24uZHJhd2luZ0luZm8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBpZiAobGF5ZXIubGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLnJlbmRlcmVyLnR5cGUgPT09ICdoZWF0bWFwJykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdjcmVhdGUgSGVhdG1hcExheWVyJyk7XHJcbiAgICAgICAgdmFyIGdyYWRpZW50ID0ge307XHJcblxyXG4gICAgICAgIGxheWVyLmxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mby5yZW5kZXJlci5jb2xvclN0b3BzLm1hcChmdW5jdGlvbiAoc3RvcCkge1xyXG4gICAgICAgICAgLy8gZ3JhZGllbnRbc3RvcC5yYXRpb10gPSAncmdiYSgnICsgc3RvcC5jb2xvclswXSArICcsJyArIHN0b3AuY29sb3JbMV0gKyAnLCcgKyBzdG9wLmNvbG9yWzJdICsgJywnICsgKHN0b3AuY29sb3JbM10vMjU1KSArICcpJztcclxuICAgICAgICAgIC8vIGdyYWRpZW50W01hdGgucm91bmQoc3RvcC5yYXRpbyoxMDApLzEwMF0gPSAncmdiKCcgKyBzdG9wLmNvbG9yWzBdICsgJywnICsgc3RvcC5jb2xvclsxXSArICcsJyArIHN0b3AuY29sb3JbMl0gKyAnKSc7XHJcbiAgICAgICAgICBncmFkaWVudFsoTWF0aC5yb3VuZChzdG9wLnJhdGlvICogMTAwKSAvIDEwMCArIDYpIC8gN10gPSAncmdiKCcgKyBzdG9wLmNvbG9yWzBdICsgJywnICsgc3RvcC5jb2xvclsxXSArICcsJyArIHN0b3AuY29sb3JbMl0gKyAnKSc7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGx5ciA9IEwuZXNyaS5IZWF0LmhlYXRtYXBGZWF0dXJlTGF5ZXIoeyAvLyBFc3JpIExlYWZsZXQgMi4wXHJcbiAgICAgICAgLy8gbHlyID0gTC5lc3JpLmhlYXRtYXBGZWF0dXJlTGF5ZXIoeyAvLyBFc3JpIExlYWZsZXQgMS4wXHJcbiAgICAgICAgICB1cmw6IGxheWVyLnVybCxcclxuICAgICAgICAgIHRva2VuOiBwYXJhbXMudG9rZW4gfHwgbnVsbCxcclxuICAgICAgICAgIG1pbk9wYWNpdHk6IDAuNSxcclxuICAgICAgICAgIG1heDogbGF5ZXIubGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLnJlbmRlcmVyLm1heFBpeGVsSW50ZW5zaXR5LFxyXG4gICAgICAgICAgYmx1cjogbGF5ZXIubGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLnJlbmRlcmVyLmJsdXJSYWRpdXMsXHJcbiAgICAgICAgICByYWRpdXM6IGxheWVyLmxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mby5yZW5kZXJlci5ibHVyUmFkaXVzICogMS4zLFxyXG4gICAgICAgICAgZ3JhZGllbnQ6IGdyYWRpZW50LFxyXG4gICAgICAgICAgcGFuZTogcGFuZU5hbWVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGF5ZXJzLnB1c2goeyB0eXBlOiAnSEwnLCB0aXRsZTogbGF5ZXIudGl0bGUgfHwgJycsIGxheWVyOiBseXIgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBseXI7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZSBBcmNHSVNGZWF0dXJlTGF5ZXIgKHdpdGggbGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvKScpO1xyXG4gICAgICAgIHZhciBkcmF3aW5nSW5mbyA9IGxheWVyLmxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mbztcclxuICAgICAgICBkcmF3aW5nSW5mby50cmFuc3BhcmVuY3kgPSAxMDAgLSAobGF5ZXIub3BhY2l0eSAqIDEwMCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coZHJhd2luZ0luZm8udHJhbnNwYXJlbmN5KTtcclxuXHJcbiAgICAgICAgaWYgKGxheWVyLmxheWVyRGVmaW5pdGlvbi5kZWZpbml0aW9uRXhwcmVzc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICB3aGVyZSA9IGxheWVyLmxheWVyRGVmaW5pdGlvbi5kZWZpbml0aW9uRXhwcmVzc2lvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1hcC5jcmVhdGVQYW5lKGxhYmVsUGFuZU5hbWUpO1xyXG5cclxuICAgICAgICBsYWJlbHNMYXllciA9IEwuZmVhdHVyZUdyb3VwKGxhYmVscyk7XHJcblxyXG4gICAgICAgIGx5ciA9IEwuZXNyaS5mZWF0dXJlTGF5ZXIoe1xyXG4gICAgICAgICAgdXJsOiBsYXllci51cmwsXHJcbiAgICAgICAgICB3aGVyZTogd2hlcmUsXHJcbiAgICAgICAgICB0b2tlbjogcGFyYW1zLnRva2VuIHx8IG51bGwsXHJcbiAgICAgICAgICBkcmF3aW5nSW5mbzogZHJhd2luZ0luZm8sXHJcbiAgICAgICAgICBwYW5lOiBwYW5lTmFtZSxcclxuICAgICAgICAgIG9uRWFjaEZlYXR1cmU6IGZ1bmN0aW9uIChnZW9qc29uLCBsKSB7XHJcbiAgICAgICAgICAgIGlmIChsYXllci5wb3B1cEluZm8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgIHZhciBwb3B1cENvbnRlbnQgPSBjcmVhdGVQb3B1cENvbnRlbnQobGF5ZXIucG9wdXBJbmZvLCBnZW9qc29uLnByb3BlcnRpZXMpO1xyXG4gICAgICAgICAgICAgIC8vIGwuYmluZFBvcHVwKHBvcHVwQ29udGVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGxheWVyLmxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mby5sYWJlbGluZ0luZm8gIT09IHVuZGVmaW5lZCAmJiBsYXllci5sYXllckRlZmluaXRpb24uZHJhd2luZ0luZm8ubGFiZWxpbmdJbmZvICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgdmFyIGxhYmVsaW5nSW5mbyA9IGxheWVyLmxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mby5sYWJlbGluZ0luZm87XHJcbiAgICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0gbC5mZWF0dXJlLmdlb21ldHJ5LmNvb3JkaW5hdGVzO1xyXG4gICAgICAgICAgICAgIHZhciBsYWJlbFBvcztcclxuXHJcbiAgICAgICAgICAgICAgaWYgKGwuZmVhdHVyZS5nZW9tZXRyeS50eXBlID09PSAnUG9pbnQnKSB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbFBvcyA9IHBvaW50TGFiZWxQb3MoY29vcmRpbmF0ZXMpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobC5mZWF0dXJlLmdlb21ldHJ5LnR5cGUgPT09ICdMaW5lU3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgbGFiZWxQb3MgPSBwb2x5bGluZUxhYmVsUG9zKGNvb3JkaW5hdGVzKTtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGwuZmVhdHVyZS5nZW9tZXRyeS50eXBlID09PSAnTXVsdGlMaW5lU3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgbGFiZWxQb3MgPSBwb2x5bGluZUxhYmVsUG9zKGNvb3JkaW5hdGVzW01hdGgucm91bmQoY29vcmRpbmF0ZXMubGVuZ3RoIC8gMildKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgbGFiZWxQb3MgPSBwb2x5Z29uTGFiZWxQb3MobCk7XHJcbiAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE1hcmtlcihsYWJlbFBvcy5wb3NpdGlvbiwge1xyXG4gICAgICAgICAgICAgICAgekluZGV4T2Zmc2V0OiAxLFxyXG4gICAgICAgICAgICAgICAgcHJvcGVydGllczogZ2VvanNvbi5wcm9wZXJ0aWVzLFxyXG4gICAgICAgICAgICAgICAgbGFiZWxpbmdJbmZvOiBsYWJlbGluZ0luZm8sXHJcbiAgICAgICAgICAgICAgICBvZmZzZXQ6IGxhYmVsUG9zLm9mZnNldCxcclxuICAgICAgICAgICAgICAgIHBhbmU6IGxhYmVsUGFuZU5hbWVcclxuICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgbGFiZWxzTGF5ZXIuYWRkTGF5ZXIobGFiZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGx5ciA9IEwubGF5ZXJHcm91cChbbHlyLCBsYWJlbHNMYXllcl0pO1xyXG5cclxuICAgICAgICBsYXllcnMucHVzaCh7IHR5cGU6ICdGTCcsIHRpdGxlOiBsYXllci50aXRsZSB8fCAnJywgbGF5ZXI6IGx5ciB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGx5cjtcclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coJ2NyZWF0ZSBBcmNHSVNGZWF0dXJlTGF5ZXIgKHdpdGhvdXQgbGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvKScpO1xyXG5cclxuICAgICAgaWYgKGxheWVyLmxheWVyRGVmaW5pdGlvbi5kZWZpbml0aW9uRXhwcmVzc2lvbiAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgd2hlcmUgPSBsYXllci5sYXllckRlZmluaXRpb24uZGVmaW5pdGlvbkV4cHJlc3Npb247XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGx5ciA9IEwuZXNyaS5mZWF0dXJlTGF5ZXIoe1xyXG4gICAgICAgIHVybDogbGF5ZXIudXJsLFxyXG4gICAgICAgIHRva2VuOiBwYXJhbXMudG9rZW4gfHwgbnVsbCxcclxuICAgICAgICB3aGVyZTogd2hlcmUsXHJcbiAgICAgICAgcGFuZTogcGFuZU5hbWUsXHJcbiAgICAgICAgb25FYWNoRmVhdHVyZTogZnVuY3Rpb24gKGdlb2pzb24sIGwpIHtcclxuICAgICAgICAgIGlmIChsYXllci5wb3B1cEluZm8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgcG9wdXBDb250ZW50ID0gY3JlYXRlUG9wdXBDb250ZW50KGxheWVyLnBvcHVwSW5mbywgZ2VvanNvbi5wcm9wZXJ0aWVzKTtcclxuICAgICAgICAgICAgLy8gbC5iaW5kUG9wdXAocG9wdXBDb250ZW50KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgbGF5ZXJzLnB1c2goeyB0eXBlOiAnRkwnLCB0aXRsZTogbGF5ZXIudGl0bGUgfHwgJycsIGxheWVyOiBseXIgfSk7XHJcblxyXG4gICAgICByZXR1cm4gbHlyO1xyXG4gICAgfVxyXG4gIH0gZWxzZSBpZiAobGF5ZXIubGF5ZXJUeXBlID09PSAnQXJjR0lTRmVhdHVyZUxheWVyJykge1xyXG4gICAgY29uc29sZS5sb2coJ2NyZWF0ZSBBcmNHSVNGZWF0dXJlTGF5ZXInKTtcclxuICAgIGx5ciA9IEwuZXNyaS5mZWF0dXJlTGF5ZXIoe1xyXG4gICAgICB1cmw6IGxheWVyLnVybCxcclxuICAgICAgdG9rZW46IHBhcmFtcy50b2tlbiB8fCBudWxsLFxyXG4gICAgICBwYW5lOiBwYW5lTmFtZSxcclxuICAgICAgb25FYWNoRmVhdHVyZTogZnVuY3Rpb24gKGdlb2pzb24sIGwpIHtcclxuICAgICAgICBpZiAobGF5ZXIucG9wdXBJbmZvICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgIHZhciBwb3B1cENvbnRlbnQgPSBjcmVhdGVQb3B1cENvbnRlbnQobGF5ZXIucG9wdXBJbmZvLCBnZW9qc29uLnByb3BlcnRpZXMpO1xyXG4gICAgICAgICAgLy8gbC5iaW5kUG9wdXAocG9wdXBDb250ZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGxheWVycy5wdXNoKHsgdHlwZTogJ0ZMJywgdGl0bGU6IGxheWVyLnRpdGxlIHx8ICcnLCBsYXllcjogbHlyIH0pO1xyXG5cclxuICAgIHJldHVybiBseXI7XHJcbiAgfSBlbHNlIGlmIChsYXllci5sYXllclR5cGUgPT09ICdDU1YnKSB7XHJcbiAgICBsYWJlbHNMYXllciA9IEwuZmVhdHVyZUdyb3VwKGxhYmVscyk7XHJcbiAgICBseXIgPSBjc3ZMYXllcihudWxsLCB7XHJcbiAgICAgIHVybDogbGF5ZXIudXJsLFxyXG4gICAgICBsYXllckRlZmluaXRpb246IGxheWVyLmxheWVyRGVmaW5pdGlvbixcclxuICAgICAgbG9jYXRpb25JbmZvOiBsYXllci5sb2NhdGlvbkluZm8sXHJcbiAgICAgIG9wYWNpdHk6IGxheWVyLm9wYWNpdHksXHJcbiAgICAgIHBhbmU6IHBhbmVOYW1lLFxyXG4gICAgICBvbkVhY2hGZWF0dXJlOiBmdW5jdGlvbiAoZ2VvanNvbiwgbCkge1xyXG4gICAgICAgIGlmIChsYXllci5wb3B1cEluZm8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgdmFyIHBvcHVwQ29udGVudCA9IGNyZWF0ZVBvcHVwQ29udGVudChsYXllci5wb3B1cEluZm8sIGdlb2pzb24ucHJvcGVydGllcyk7XHJcbiAgICAgICAgICAvLyBsLmJpbmRQb3B1cChwb3B1cENvbnRlbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobGF5ZXIubGF5ZXJEZWZpbml0aW9uLmRyYXdpbmdJbmZvLmxhYmVsaW5nSW5mbyAhPT0gdW5kZWZpbmVkICYmIGxheWVyLmxheWVyRGVmaW5pdGlvbi5kcmF3aW5nSW5mby5sYWJlbGluZ0luZm8gIT09IG51bGwpIHtcclxuICAgICAgICAgIHZhciBsYWJlbGluZ0luZm8gPSBsYXllci5sYXllckRlZmluaXRpb24uZHJhd2luZ0luZm8ubGFiZWxpbmdJbmZvO1xyXG4gICAgICAgICAgdmFyIGNvb3JkaW5hdGVzID0gbC5mZWF0dXJlLmdlb21ldHJ5LmNvb3JkaW5hdGVzO1xyXG4gICAgICAgICAgdmFyIGxhYmVsUG9zO1xyXG5cclxuICAgICAgICAgIGlmIChsLmZlYXR1cmUuZ2VvbWV0cnkudHlwZSA9PT0gJ1BvaW50Jykge1xyXG4gICAgICAgICAgICBsYWJlbFBvcyA9IHBvaW50TGFiZWxQb3MoY29vcmRpbmF0ZXMpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmIChsLmZlYXR1cmUuZ2VvbWV0cnkudHlwZSA9PT0gJ0xpbmVTdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGxhYmVsUG9zID0gcG9seWxpbmVMYWJlbFBvcyhjb29yZGluYXRlcyk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGwuZmVhdHVyZS5nZW9tZXRyeS50eXBlID09PSAnTXVsdGlMaW5lU3RyaW5nJykge1xyXG4gICAgICAgICAgICBsYWJlbFBvcyA9IHBvbHlsaW5lTGFiZWxQb3MoY29vcmRpbmF0ZXNbTWF0aC5yb3VuZChjb29yZGluYXRlcy5sZW5ndGggLyAyKV0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGFiZWxQb3MgPSBwb2x5Z29uTGFiZWxQb3MobCk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgdmFyIGxhYmVsID0gbGFiZWxNYXJrZXIobGFiZWxQb3MucG9zaXRpb24sIHtcclxuICAgICAgICAgICAgekluZGV4T2Zmc2V0OiAxLFxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBnZW9qc29uLnByb3BlcnRpZXMsXHJcbiAgICAgICAgICAgIGxhYmVsaW5nSW5mbzogbGFiZWxpbmdJbmZvLFxyXG4gICAgICAgICAgICBvZmZzZXQ6IGxhYmVsUG9zLm9mZnNldCxcclxuICAgICAgICAgICAgcGFuZTogbGFiZWxQYW5lTmFtZVxyXG4gICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgbGFiZWxzTGF5ZXIuYWRkTGF5ZXIobGFiZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgbHlyID0gTC5sYXllckdyb3VwKFtseXIsIGxhYmVsc0xheWVyXSk7XHJcblxyXG4gICAgbGF5ZXJzLnB1c2goeyB0eXBlOiAnQ1NWJywgdGl0bGU6IGxheWVyLnRpdGxlIHx8ICcnLCBsYXllcjogbHlyIH0pO1xyXG5cclxuICAgIHJldHVybiBseXI7XHJcbiAgfSBlbHNlIGlmIChsYXllci5sYXllclR5cGUgPT09ICdLTUwnKSB7XHJcbiAgICBsYWJlbHNMYXllciA9IEwuZmVhdHVyZUdyb3VwKGxhYmVscyk7XHJcbiAgICB2YXIga21sID0ga21sTGF5ZXIobnVsbCwge1xyXG4gICAgICB1cmw6IGxheWVyLnVybCxcclxuICAgICAgb3BhY2l0eTogbGF5ZXIub3BhY2l0eSxcclxuICAgICAgcGFuZTogcGFuZU5hbWUsXHJcbiAgICAgIG9uRWFjaEZlYXR1cmU6IGZ1bmN0aW9uIChnZW9qc29uLCBsKSB7XHJcbiAgICAgICAgaWYgKGttbC5wb3B1cEluZm8gIT09IHVuZGVmaW5lZCAmJiBrbWwucG9wdXBJbmZvICE9PSBudWxsKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhrbWwucG9wdXBJbmZvKTtcclxuICAgICAgICAgIHZhciBwb3B1cENvbnRlbnQgPSBjcmVhdGVQb3B1cENvbnRlbnQoa21sLnBvcHVwSW5mbywgZ2VvanNvbi5wcm9wZXJ0aWVzKTtcclxuICAgICAgICAgIC8vIGwuYmluZFBvcHVwKHBvcHVwQ29udGVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChrbWwubGFiZWxpbmdJbmZvICE9PSB1bmRlZmluZWQgJiYga21sLmxhYmVsaW5nSW5mbyAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgdmFyIGxhYmVsaW5nSW5mbyA9IGttbC5sYWJlbGluZ0luZm87XHJcbiAgICAgICAgICB2YXIgY29vcmRpbmF0ZXMgPSBsLmZlYXR1cmUuZ2VvbWV0cnkuY29vcmRpbmF0ZXM7XHJcbiAgICAgICAgICB2YXIgbGFiZWxQb3M7XHJcblxyXG4gICAgICAgICAgaWYgKGwuZmVhdHVyZS5nZW9tZXRyeS50eXBlID09PSAnUG9pbnQnKSB7XHJcbiAgICAgICAgICAgIGxhYmVsUG9zID0gcG9pbnRMYWJlbFBvcyhjb29yZGluYXRlcyk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGwuZmVhdHVyZS5nZW9tZXRyeS50eXBlID09PSAnTGluZVN0cmluZycpIHtcclxuICAgICAgICAgICAgbGFiZWxQb3MgPSBwb2x5bGluZUxhYmVsUG9zKGNvb3JkaW5hdGVzKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAobC5mZWF0dXJlLmdlb21ldHJ5LnR5cGUgPT09ICdNdWx0aUxpbmVTdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIGxhYmVsUG9zID0gcG9seWxpbmVMYWJlbFBvcyhjb29yZGluYXRlc1tNYXRoLnJvdW5kKGNvb3JkaW5hdGVzLmxlbmd0aCAvIDIpXSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsYWJlbFBvcyA9IHBvbHlnb25MYWJlbFBvcyhsKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICB2YXIgbGFiZWwgPSBsYWJlbE1hcmtlcihsYWJlbFBvcy5wb3NpdGlvbiwge1xyXG4gICAgICAgICAgICB6SW5kZXhPZmZzZXQ6IDEsXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXM6IGdlb2pzb24ucHJvcGVydGllcyxcclxuICAgICAgICAgICAgbGFiZWxpbmdJbmZvOiBsYWJlbGluZ0luZm8sXHJcbiAgICAgICAgICAgIG9mZnNldDogbGFiZWxQb3Mub2Zmc2V0LFxyXG4gICAgICAgICAgICBwYW5lOiBsYWJlbFBhbmVOYW1lXHJcbiAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICBsYWJlbHNMYXllci5hZGRMYXllcihsYWJlbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBseXIgPSBMLmxheWVyR3JvdXAoW2ttbCwgbGFiZWxzTGF5ZXJdKTtcclxuXHJcbiAgICBsYXllcnMucHVzaCh7IHR5cGU6ICdLTUwnLCB0aXRsZTogbGF5ZXIudGl0bGUgfHwgJycsIGxheWVyOiBseXIgfSk7XHJcblxyXG4gICAgcmV0dXJuIGx5cjtcclxuICB9IGVsc2UgaWYgKGxheWVyLmxheWVyVHlwZSA9PT0gJ0FyY0dJU0ltYWdlU2VydmljZUxheWVyJykge1xyXG4gICAgY29uc29sZS5sb2coJ2NyZWF0ZSBBcmNHSVNJbWFnZVNlcnZpY2VMYXllcicpO1xyXG4gICAgbHlyID0gTC5lc3JpLmltYWdlTWFwTGF5ZXIoe1xyXG4gICAgICB1cmw6IGxheWVyLnVybCxcclxuICAgICAgdG9rZW46IHBhcmFtcy50b2tlbiB8fCBudWxsLFxyXG4gICAgICBwYW5lOiBwYW5lTmFtZSxcclxuICAgICAgb3BhY2l0eTogbGF5ZXIub3BhY2l0eSB8fCAxXHJcbiAgICB9KTtcclxuXHJcbiAgICBsYXllcnMucHVzaCh7IHR5cGU6ICdJTUwnLCB0aXRsZTogbGF5ZXIudGl0bGUgfHwgJycsIGxheWVyOiBseXIgfSk7XHJcblxyXG4gICAgcmV0dXJuIGx5cjtcclxuICB9IGVsc2UgaWYgKGxheWVyLmxheWVyVHlwZSA9PT0gJ0FyY0dJU01hcFNlcnZpY2VMYXllcicpIHtcclxuICAgIGx5ciA9IEwuZXNyaS5keW5hbWljTWFwTGF5ZXIoe1xyXG4gICAgICB1cmw6IGxheWVyLnVybCxcclxuICAgICAgdG9rZW46IHBhcmFtcy50b2tlbiB8fCBudWxsLFxyXG4gICAgICBwYW5lOiBwYW5lTmFtZSxcclxuICAgICAgb3BhY2l0eTogbGF5ZXIub3BhY2l0eSB8fCAxXHJcbiAgICB9KTtcclxuXHJcbiAgICBsYXllcnMucHVzaCh7IHR5cGU6ICdETUwnLCB0aXRsZTogbGF5ZXIudGl0bGUgfHwgJycsIGxheWVyOiBseXIgfSk7XHJcblxyXG4gICAgcmV0dXJuIGx5cjtcclxuICB9IGVsc2UgaWYgKGxheWVyLmxheWVyVHlwZSA9PT0gJ0FyY0dJU1RpbGVkTWFwU2VydmljZUxheWVyJykge1xyXG4gICAgdHJ5IHtcclxuICAgICAgbHlyID0gTC5lc3JpLmJhc2VtYXBMYXllcihsYXllci50aXRsZSk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGx5ciA9IEwuZXNyaS50aWxlZE1hcExheWVyKHtcclxuICAgICAgICB1cmw6IGxheWVyLnVybCxcclxuICAgICAgICB0b2tlbjogcGFyYW1zLnRva2VuIHx8IG51bGxcclxuICAgICAgfSk7XHJcblxyXG4gICAgICBMLmVzcmkucmVxdWVzdChsYXllci51cmwsIHt9LCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICB2YXIgbWF4V2lkdGggPSAobWFwLmdldFNpemUoKS54IC0gNTUpO1xyXG4gICAgICAgICAgdmFyIHRpbGVkQXR0cmlidXRpb24gPSAnPHNwYW4gY2xhc3M9XCJlc3JpLWF0dHJpYnV0aW9uc1wiIHN0eWxlPVwibGluZS1oZWlnaHQ6MTRweDsgdmVydGljYWwtYWxpZ246IC0zcHg7IHRleHQtb3ZlcmZsb3c6ZWxsaXBzaXM7IHdoaXRlLXNwYWNlOm5vd3JhcDsgb3ZlcmZsb3c6aGlkZGVuOyBkaXNwbGF5OmlubGluZS1ibG9jazsgbWF4LXdpZHRoOicgKyBtYXhXaWR0aCArICdweDtcIj4nICsgcmVzLmNvcHlyaWdodFRleHQgKyAnPC9zcGFuPic7XHJcbiAgICAgICAgICBtYXAuYXR0cmlidXRpb25Db250cm9sLmFkZEF0dHJpYnV0aW9uKHRpbGVkQXR0cmlidXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnbGVhZmxldC10aWxlLXBhbmUnKVswXS5zdHlsZS5vcGFjaXR5ID0gbGF5ZXIub3BhY2l0eSB8fCAxO1xyXG5cclxuICAgIGxheWVycy5wdXNoKHsgdHlwZTogJ1RNTCcsIHRpdGxlOiBsYXllci50aXRsZSB8fCAnJywgbGF5ZXI6IGx5ciB9KTtcclxuXHJcbiAgICByZXR1cm4gbHlyO1xyXG4gIH0gZWxzZSBpZiAobGF5ZXIubGF5ZXJUeXBlID09PSAnVmVjdG9yVGlsZUxheWVyJykge1xyXG4gICAgdmFyIGtleXMgPSB7XHJcbiAgICAgICdXb3JsZCBTdHJlZXQgTWFwICh3aXRoIFJlbGllZiknOiAnU3RyZWV0c1JlbGllZicsXHJcbiAgICAgICdXb3JsZCBTdHJlZXQgTWFwICh3aXRoIFJlbGllZikgKE1hdHVyZSBTdXBwb3J0KSc6ICdTdHJlZXRzUmVsaWVmJyxcclxuICAgICAgJ0h5YnJpZCBSZWZlcmVuY2UgTGF5ZXInOiAnSHlicmlkJyxcclxuICAgICAgJ0h5YnJpZCBSZWZlcmVuY2UgTGF5ZXIgKE1hdHVyZSBTdXBwb3J0KSc6ICdIeWJyaWQnLFxyXG4gICAgICAnV29ybGQgU3RyZWV0IE1hcCc6ICdTdHJlZXRzJyxcclxuICAgICAgJ1dvcmxkIFN0cmVldCBNYXAgKE1hdHVyZSBTdXBwb3J0KSc6ICdTdHJlZXRzJyxcclxuICAgICAgJ1dvcmxkIFN0cmVldCBNYXAgKE5pZ2h0KSc6ICdTdHJlZXRzTmlnaHQnLFxyXG4gICAgICAnV29ybGQgU3RyZWV0IE1hcCAoTmlnaHQpIChNYXR1cmUgU3VwcG9ydCknOiAnU3RyZWV0c05pZ2h0JyxcclxuICAgICAgJ0RhcmsgR3JheSBDYW52YXMnOiAnRGFya0dyYXknLFxyXG4gICAgICAnRGFyayBHcmF5IENhbnZhcyAoTWF0dXJlIFN1cHBvcnQpJzogJ0RhcmtHcmF5JyxcclxuICAgICAgJ1dvcmxkIFRvcG9ncmFwaGljIE1hcCc6ICdUb3BvZ3JhcGhpYycsXHJcbiAgICAgICdXb3JsZCBUb3BvZ3JhcGhpYyBNYXAgKE1hdHVyZSBTdXBwb3J0KSc6ICdUb3BvZ3JhcGhpYycsXHJcbiAgICAgICdXb3JsZCBOYXZpZ2F0aW9uIE1hcCc6ICdOYXZpZ2F0aW9uJyxcclxuICAgICAgJ1dvcmxkIE5hdmlnYXRpb24gTWFwIChNYXR1cmUgU3VwcG9ydCknOiAnTmF2aWdhdGlvbicsXHJcbiAgICAgICdMaWdodCBHcmF5IENhbnZhcyc6ICdHcmF5JyxcclxuICAgICAgJ0xpZ2h0IEdyYXkgQ2FudmFzIChNYXR1cmUgU3VwcG9ydCknOiAnR3JheSdcclxuICAgICAgLy8nVGVycmFpbiB3aXRoIExhYmVscyc6ICcnLFxyXG4gICAgICAvLydXb3JsZCBUZXJyYWluIHdpdGggTGFiZWxzJzogJycsXHJcbiAgICAgIC8vJ0xpZ2h0IEdyYXkgQ2FudmFzIFJlZmVyZW5jZSc6ICcnLFxyXG4gICAgICAvLydEYXJrIEdyYXkgQ2FudmFzIFJlZmVyZW5jZSc6ICcnLFxyXG4gICAgICAvLydEYXJrIEdyYXkgQ2FudmFzIEJhc2UnOiAnJyxcclxuICAgICAgLy8nTGlnaHQgR3JheSBDYW52YXMgQmFzZSc6ICcnXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChrZXlzW2xheWVyLnRpdGxlXSkge1xyXG4gICAgICBseXIgPSBMLmVzcmkuVmVjdG9yLmJhc2VtYXAoa2V5c1tsYXllci50aXRsZV0pO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5lcnJvcignVW5zdXBwb3J0ZWQgVmVjdG9yIFRpbGUgTGF5ZXI6ICcsIGxheWVyKTtcclxuICAgICAgbHlyID0gTC5mZWF0dXJlR3JvdXAoW10pO1xyXG4gICAgfVxyXG5cclxuICAgIGxheWVycy5wdXNoKHsgdHlwZTogJ1ZUTCcsIHRpdGxlOiBsYXllci50aXRsZSB8fCBsYXllci5pZCB8fCAnJywgbGF5ZXI6IGx5ciB9KTtcclxuXHJcbiAgICByZXR1cm4gbHlyO1xyXG4gIH0gZWxzZSBpZiAobGF5ZXIubGF5ZXJUeXBlID09PSAnT3BlblN0cmVldE1hcCcpIHtcclxuICAgIGx5ciA9IEwudGlsZUxheWVyKCdodHRwOi8ve3N9LnRpbGUub3NtLm9yZy97en0ve3h9L3t5fS5wbmcnLCB7XHJcbiAgICAgIGF0dHJpYnV0aW9uOiAnJmNvcHk7IDxhIGhyZWY9XCJodHRwOi8vb3NtLm9yZy9jb3B5cmlnaHRcIj5PcGVuU3RyZWV0TWFwPC9hPiBjb250cmlidXRvcnMnXHJcbiAgICB9KTtcclxuXHJcbiAgICBsYXllcnMucHVzaCh7IHR5cGU6ICdUTCcsIHRpdGxlOiBsYXllci50aXRsZSB8fCBsYXllci5pZCB8fCAnJywgbGF5ZXI6IGx5ciB9KTtcclxuXHJcbiAgICByZXR1cm4gbHlyO1xyXG4gIH0gZWxzZSBpZiAobGF5ZXIubGF5ZXJUeXBlID09PSAnV2ViVGlsZWRMYXllcicpIHtcclxuICAgIHZhciBseXJVcmwgPSBfZXNyaVdUTFVybFRlbXBsYXRlVG9MZWFmbGV0KGxheWVyLnRlbXBsYXRlVXJsKTtcclxuICAgIGx5ciA9IEwudGlsZUxheWVyKGx5clVybCwge1xyXG4gICAgICBhdHRyaWJ1dGlvbjogbGF5ZXIuY29weXJpZ2h0XHJcbiAgICB9KTtcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2xlYWZsZXQtdGlsZS1wYW5lJylbMF0uc3R5bGUub3BhY2l0eSA9IGxheWVyLm9wYWNpdHkgfHwgMTtcclxuXHJcbiAgICBsYXllcnMucHVzaCh7IHR5cGU6ICdUTCcsIHRpdGxlOiBsYXllci50aXRsZSB8fCBsYXllci5pZCB8fCAnJywgbGF5ZXI6IGx5ciB9KTtcclxuXHJcbiAgICByZXR1cm4gbHlyO1xyXG4gIH0gZWxzZSBpZiAobGF5ZXIubGF5ZXJUeXBlID09PSAnV01TJykge1xyXG4gICAgdmFyIGxheWVyTmFtZXMgPSAnJztcclxuICAgIGZvciAoaSA9IDAsIGxlbiA9IGxheWVyLnZpc2libGVMYXllcnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgbGF5ZXJOYW1lcyArPSBsYXllci52aXNpYmxlTGF5ZXJzW2ldO1xyXG4gICAgICBpZiAoaSA8IGxlbiAtIDEpIHtcclxuICAgICAgICBsYXllck5hbWVzICs9ICcsJztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGx5ciA9IEwudGlsZUxheWVyLndtcyhsYXllci51cmwsIHtcclxuICAgICAgbGF5ZXJzOiBTdHJpbmcobGF5ZXJOYW1lcyksXHJcbiAgICAgIGZvcm1hdDogJ2ltYWdlL3BuZycsXHJcbiAgICAgIHRyYW5zcGFyZW50OiB0cnVlLFxyXG4gICAgICBhdHRyaWJ1dGlvbjogbGF5ZXIuY29weXJpZ2h0XHJcbiAgICB9KTtcclxuXHJcbiAgICBsYXllcnMucHVzaCh7IHR5cGU6ICdXTVMnLCB0aXRsZTogbGF5ZXIudGl0bGUgfHwgbGF5ZXIuaWQgfHwgJycsIGxheWVyOiBseXIgfSk7XHJcblxyXG4gICAgcmV0dXJuIGx5cjtcclxuICB9IGVsc2Uge1xyXG4gICAgbHlyID0gTC5mZWF0dXJlR3JvdXAoW10pO1xyXG4gICAgY29uc29sZS5sb2coJ1Vuc3VwcG9ydGVkIExheWVyOiAnLCBsYXllcik7XHJcbiAgICByZXR1cm4gbHlyO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIF9lc3JpV1RMVXJsVGVtcGxhdGVUb0xlYWZsZXQgKHVybCkge1xyXG4gIHZhciBuZXdVcmwgPSB1cmw7XHJcblxyXG4gIG5ld1VybCA9IG5ld1VybC5yZXBsYWNlKC9cXHtsZXZlbH0vZywgJ3t6fScpO1xyXG4gIG5ld1VybCA9IG5ld1VybC5yZXBsYWNlKC9cXHtjb2x9L2csICd7eH0nKTtcclxuICBuZXdVcmwgPSBuZXdVcmwucmVwbGFjZSgvXFx7cm93fS9nLCAne3l9Jyk7XHJcblxyXG4gIHJldHVybiBuZXdVcmw7XHJcbn1cclxuXHJcbmV4cG9ydCB2YXIgT3BlcmF0aW9uYWxMYXllciA9IHtcclxuICBvcGVyYXRpb25hbExheWVyOiBvcGVyYXRpb25hbExheWVyLFxyXG4gIF9nZW5lcmF0ZUVzcmlMYXllcjogX2dlbmVyYXRlRXNyaUxheWVyLFxyXG4gIF9lc3JpV1RMVXJsVGVtcGxhdGVUb0xlYWZsZXQ6IF9lc3JpV1RMVXJsVGVtcGxhdGVUb0xlYWZsZXRcclxufTtcclxuXHJcbmV4cG9ydCBkZWZhdWx0IE9wZXJhdGlvbmFsTGF5ZXI7XHJcbiIsIi8qXHJcbiAqIEwuZXNyaS5XZWJNYXBcclxuICogQSBsZWFmbGV0IHBsdWdpbiB0byBkaXNwbGF5IEFyY0dJUyBXZWIgTWFwLiBodHRwczovL2dpdGh1Yi5jb20veW51bm9rYXdhL0wuZXNyaS5XZWJNYXBcclxuICogKGMpIDIwMTYgWXVzdWtlIE51bm9rYXdhXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqXHJcbiAqIGBgYGpzXHJcbiAqIHZhciB3ZWJtYXAgPSBMLndlYm1hcCgnMjJjNTA0ZDIyOWYxNGM3ODljNWI0OWViZmYzOGI5NDEnLCB7IG1hcDogTC5tYXAoJ21hcCcpIH0pO1xyXG4gKiBgYGBcclxuICovXHJcblxyXG5pbXBvcnQgeyB2ZXJzaW9uIH0gZnJvbSAnLi4vcGFja2FnZS5qc29uJztcclxuXHJcbmltcG9ydCBMIGZyb20gJ2xlYWZsZXQnO1xyXG5pbXBvcnQgeyBvcGVyYXRpb25hbExheWVyIH0gZnJvbSAnLi9PcGVyYXRpb25hbExheWVyJztcclxuXHJcbmV4cG9ydCB2YXIgV2ViTWFwID0gTC5FdmVudGVkLmV4dGVuZCh7XHJcbiAgb3B0aW9uczoge1xyXG4gICAgLy8gTC5NYXBcclxuICAgIG1hcDoge30sXHJcbiAgICAvLyBhY2Nlc3MgdG9rZW4gZm9yIHNlY3VyZSBjb250ZW50cyBvbiBBcmNHSVMgT25saW5lXHJcbiAgICB0b2tlbjogbnVsbCxcclxuICAgIC8vIHNlcnZlciBkb21haW4gbmFtZSAoZGVmYXVsdD0gJ3d3dy5hcmNnaXMuY29tJylcclxuICAgIHNlcnZlcjogJ3d3dy5hcmNnaXMuY29tJ1xyXG4gIH0sXHJcblxyXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uICh3ZWJtYXBJZCwgb3B0aW9ucykge1xyXG4gICAgTC5zZXRPcHRpb25zKHRoaXMsIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuX21hcCA9IHRoaXMub3B0aW9ucy5tYXA7XHJcbiAgICB0aGlzLl90b2tlbiA9IHRoaXMub3B0aW9ucy50b2tlbjtcclxuICAgIHRoaXMuX3NlcnZlciA9IHRoaXMub3B0aW9ucy5zZXJ2ZXI7XHJcbiAgICB0aGlzLl93ZWJtYXBJZCA9IHdlYm1hcElkO1xyXG4gICAgdGhpcy5fbG9hZGVkID0gZmFsc2U7XHJcbiAgICB0aGlzLl9tZXRhZGF0YUxvYWRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5fbG9hZGVkTGF5ZXJzTnVtID0gMDtcclxuICAgIHRoaXMuX2xheWVyc051bSA9IDA7XHJcblxyXG4gICAgdGhpcy5sYXllcnMgPSBbXTsgLy8gQ2hlY2sgdGhlIGxheWVyIHR5cGVzIGhlcmUgLT4gaHR0cHM6Ly9naXRodWIuY29tL3ludW5va2F3YS9MLmVzcmkuV2ViTWFwL3dpa2kvTGF5ZXItdHlwZXNcclxuICAgIHRoaXMudGl0bGUgPSAnJzsgLy8gV2ViIE1hcCBUaXRsZVxyXG4gICAgdGhpcy5ib29rbWFya3MgPSBbXTsgLy8gV2ViIE1hcCBCb29rbWFya3MgLT4gW3sgbmFtZTogJ0Jvb2ttYXJrIG5hbWUnLCBib3VuZHM6IDxMLmxhdExuZ0JvdW5kcz4gfV1cclxuICAgIHRoaXMucG9ydGFsSXRlbSA9IHt9OyAvLyBXZWIgTWFwIE1ldGFkYXRhXHJcblxyXG4gICAgdGhpcy5WRVJTSU9OID0gdmVyc2lvbjtcclxuXHJcbiAgICB0aGlzLl9sb2FkV2ViTWFwTWV0YURhdGEod2VibWFwSWQpO1xyXG4gICAgdGhpcy5fbG9hZFdlYk1hcCh3ZWJtYXBJZCk7XHJcbiAgfSxcclxuXHJcbiAgX2NoZWNrTG9hZGVkOiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLl9sb2FkZWRMYXllcnNOdW0rKztcclxuICAgIGlmICh0aGlzLl9sb2FkZWRMYXllcnNOdW0gPT09IHRoaXMuX2xheWVyc051bSkge1xyXG4gICAgICB0aGlzLl9sb2FkZWQgPSB0cnVlO1xyXG4gICAgICB0aGlzLmZpcmUoJ2xvYWQnKTtcclxuICAgIH1cclxuICB9LFxyXG5cclxuICBfb3BlcmF0aW9uYWxMYXllcjogZnVuY3Rpb24gKGxheWVyLCBsYXllcnMsIG1hcCwgcGFyYW1zLCBwYW5lTmFtZSkge1xyXG4gICAgdmFyIGx5ciA9IG9wZXJhdGlvbmFsTGF5ZXIobGF5ZXIsIGxheWVycywgbWFwLCBwYXJhbXMpO1xyXG4gICAgaWYgKGx5ciAhPT0gdW5kZWZpbmVkICYmIGxheWVyLnZpc2liaWxpdHkgPT09IHRydWUpIHtcclxuICAgICAgbHlyLmFkZFRvKG1hcCk7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgX2xvYWRXZWJNYXBNZXRhRGF0YTogZnVuY3Rpb24gKGlkKSB7XHJcbiAgICB2YXIgcGFyYW1zID0ge307XHJcbiAgICB2YXIgbWFwID0gdGhpcy5fbWFwO1xyXG4gICAgdmFyIHdlYm1hcCA9IHRoaXM7XHJcbiAgICB2YXIgd2VibWFwTWV0YURhdGFSZXF1ZXN0VXJsID0gJ2h0dHBzOi8vJyArIHRoaXMuX3NlcnZlciArICcvc2hhcmluZy9yZXN0L2NvbnRlbnQvaXRlbXMvJyArIGlkO1xyXG4gICAgaWYgKHRoaXMuX3Rva2VuICYmIHRoaXMuX3Rva2VuLmxlbmd0aCA+IDApIHtcclxuICAgICAgcGFyYW1zLnRva2VuID0gdGhpcy5fdG9rZW47XHJcbiAgICB9XHJcblxyXG4gICAgTC5lc3JpLnJlcXVlc3Qod2VibWFwTWV0YURhdGFSZXF1ZXN0VXJsLCBwYXJhbXMsIGZ1bmN0aW9uIChlcnJvciwgcmVzcG9uc2UpIHtcclxuICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdXZWJNYXAgTWV0YURhdGE6ICcsIHJlc3BvbnNlKTtcclxuICAgICAgICB3ZWJtYXAucG9ydGFsSXRlbSA9IHJlc3BvbnNlO1xyXG4gICAgICAgIHdlYm1hcC50aXRsZSA9IHJlc3BvbnNlLnRpdGxlO1xyXG4gICAgICAgIHdlYm1hcC5fbWV0YWRhdGFMb2FkZWQgPSB0cnVlO1xyXG4gICAgICAgIHdlYm1hcC5maXJlKCdtZXRhZGF0YUxvYWQnKTtcclxuICAgICAgICBtYXAuZml0Qm91bmRzKFtyZXNwb25zZS5leHRlbnRbMF0ucmV2ZXJzZSgpLCByZXNwb25zZS5leHRlbnRbMV0ucmV2ZXJzZSgpXSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0sXHJcblxyXG4gIF9sb2FkV2ViTWFwOiBmdW5jdGlvbiAoaWQpIHtcclxuICAgIHZhciBtYXAgPSB0aGlzLl9tYXA7XHJcbiAgICB2YXIgbGF5ZXJzID0gdGhpcy5sYXllcnM7XHJcbiAgICB2YXIgc2VydmVyID0gdGhpcy5fc2VydmVyO1xyXG4gICAgdmFyIHBhcmFtcyA9IHt9O1xyXG4gICAgdmFyIHdlYm1hcFJlcXVlc3RVcmwgPSAnaHR0cHM6Ly8nICsgc2VydmVyICsgJy9zaGFyaW5nL3Jlc3QvY29udGVudC9pdGVtcy8nICsgaWQgKyAnL2RhdGEnO1xyXG4gICAgaWYgKHRoaXMuX3Rva2VuICYmIHRoaXMuX3Rva2VuLmxlbmd0aCA+IDApIHtcclxuICAgICAgcGFyYW1zLnRva2VuID0gdGhpcy5fdG9rZW47XHJcbiAgICB9XHJcblxyXG4gICAgTC5lc3JpLnJlcXVlc3Qod2VibWFwUmVxdWVzdFVybCwgcGFyYW1zLCBmdW5jdGlvbiAoZXJyb3IsIHJlc3BvbnNlKSB7XHJcbiAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBjb25zb2xlLmxvZygnV2ViTWFwOiAnLCByZXNwb25zZSk7XHJcbiAgICAgICAgdGhpcy5fbGF5ZXJzTnVtID0gcmVzcG9uc2UuYmFzZU1hcC5iYXNlTWFwTGF5ZXJzLmxlbmd0aCArIHJlc3BvbnNlLm9wZXJhdGlvbmFsTGF5ZXJzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgLy8gQWRkIEJhc2VtYXBcclxuICAgICAgICByZXNwb25zZS5iYXNlTWFwLmJhc2VNYXBMYXllcnMubWFwKGZ1bmN0aW9uIChiYXNlTWFwTGF5ZXIpIHtcclxuICAgICAgICAgIGlmIChiYXNlTWFwTGF5ZXIuaXRlbUlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZW1SZXF1ZXN0VXJsID0gJ2h0dHBzOi8vJyArIHNlcnZlciArICcvc2hhcmluZy9yZXN0L2NvbnRlbnQvaXRlbXMvJyArIGJhc2VNYXBMYXllci5pdGVtSWQ7XHJcbiAgICAgICAgICAgIEwuZXNyaS5yZXF1ZXN0KGl0ZW1SZXF1ZXN0VXJsLCBwYXJhbXMsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xyXG4gICAgICAgICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXMuYWNjZXNzKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXMuYWNjZXNzICE9PSAncHVibGljJykge1xyXG4gICAgICAgICAgICAgICAgICB0aGlzLl9vcGVyYXRpb25hbExheWVyKGJhc2VNYXBMYXllciwgbGF5ZXJzLCBtYXAsIHBhcmFtcyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICB0aGlzLl9vcGVyYXRpb25hbExheWVyKGJhc2VNYXBMYXllciwgbGF5ZXJzLCBtYXAsIHt9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgdGhpcy5fY2hlY2tMb2FkZWQoKTtcclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9vcGVyYXRpb25hbExheWVyKGJhc2VNYXBMYXllciwgbGF5ZXJzLCBtYXAsIHt9KTtcclxuICAgICAgICAgICAgdGhpcy5fY2hlY2tMb2FkZWQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LmJpbmQodGhpcykpO1xyXG5cclxuICAgICAgICAvLyBBZGQgT3BlcmF0aW9uYWwgTGF5ZXJzXHJcbiAgICAgICAgcmVzcG9uc2Uub3BlcmF0aW9uYWxMYXllcnMubWFwKGZ1bmN0aW9uIChsYXllciwgaSkge1xyXG4gICAgICAgICAgdmFyIHBhbmVOYW1lID0gJ2Vzcmktd2VibWFwLWxheWVyJyArIGk7XHJcbiAgICAgICAgICBtYXAuY3JlYXRlUGFuZShwYW5lTmFtZSk7XHJcbiAgICAgICAgICBpZiAobGF5ZXIuaXRlbUlkICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdmFyIGl0ZW1SZXF1ZXN0VXJsID0gJ2h0dHBzOi8vJyArIHNlcnZlciArICcvc2hhcmluZy9yZXN0L2NvbnRlbnQvaXRlbXMvJyArIGxheWVyLml0ZW1JZDtcclxuICAgICAgICAgICAgTC5lc3JpLnJlcXVlc3QoaXRlbVJlcXVlc3RVcmwsIHBhcmFtcywgZnVuY3Rpb24gKGVyciwgcmVzKSB7XHJcbiAgICAgICAgICAgICAgaWYgKGVycikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcy5hY2Nlc3MpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlcy5hY2Nlc3MgIT09ICdwdWJsaWMnKSB7XHJcbiAgICAgICAgICAgICAgICAgIHRoaXMuX29wZXJhdGlvbmFsTGF5ZXIobGF5ZXIsIGxheWVycywgbWFwLCBwYXJhbXMsIHBhbmVOYW1lKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgIHRoaXMuX29wZXJhdGlvbmFsTGF5ZXIobGF5ZXIsIGxheWVycywgbWFwLCB7fSwgcGFuZU5hbWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB0aGlzLl9jaGVja0xvYWRlZCgpO1xyXG4gICAgICAgICAgICB9LCB0aGlzKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX29wZXJhdGlvbmFsTGF5ZXIobGF5ZXIsIGxheWVycywgbWFwLCB7fSwgcGFuZU5hbWUpO1xyXG4gICAgICAgICAgICB0aGlzLl9jaGVja0xvYWRlZCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0uYmluZCh0aGlzKSk7XHJcblxyXG4gICAgICAgIC8vIEFkZCBCb29rbWFya3NcclxuICAgICAgICBpZiAocmVzcG9uc2UuYm9va21hcmtzICE9PSB1bmRlZmluZWQgJiYgcmVzcG9uc2UuYm9va21hcmtzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIHJlc3BvbnNlLmJvb2ttYXJrcy5tYXAoZnVuY3Rpb24gKGJvb2ttYXJrKSB7XHJcbiAgICAgICAgICAgIC8vIEVzcmkgRXh0ZW50IEdlb21ldHJ5IHRvIEwubGF0TG5nQm91bmRzXHJcbiAgICAgICAgICAgIHZhciBub3J0aEVhc3QgPSBMLlByb2plY3Rpb24uU3BoZXJpY2FsTWVyY2F0b3IudW5wcm9qZWN0KEwucG9pbnQoYm9va21hcmsuZXh0ZW50LnhtYXgsIGJvb2ttYXJrLmV4dGVudC55bWF4KSk7XHJcbiAgICAgICAgICAgIHZhciBzb3V0aFdlc3QgPSBMLlByb2plY3Rpb24uU3BoZXJpY2FsTWVyY2F0b3IudW5wcm9qZWN0KEwucG9pbnQoYm9va21hcmsuZXh0ZW50LnhtaW4sIGJvb2ttYXJrLmV4dGVudC55bWluKSk7XHJcbiAgICAgICAgICAgIHZhciBib3VuZHMgPSBMLmxhdExuZ0JvdW5kcyhzb3V0aFdlc3QsIG5vcnRoRWFzdCk7XHJcbiAgICAgICAgICAgIHRoaXMuYm9va21hcmtzLnB1c2goeyBuYW1lOiBib29rbWFyay5uYW1lLCBib3VuZHM6IGJvdW5kcyB9KTtcclxuICAgICAgICAgIH0uYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3RoaXMuX2xvYWRlZCA9IHRydWU7XHJcbiAgICAgICAgLy90aGlzLmZpcmUoJ2xvYWQnKTtcclxuICAgICAgfVxyXG4gICAgfS5iaW5kKHRoaXMpKTtcclxuICB9XHJcbn0pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHdlYk1hcCAod2VibWFwSWQsIG9wdGlvbnMpIHtcclxuICByZXR1cm4gbmV3IFdlYk1hcCh3ZWJtYXBJZCwgb3B0aW9ucyk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IHdlYk1hcDtcclxuIl0sIm5hbWVzIjpbIlJlbmRlcmVyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUE7O0FBRUEsQ0FBQTtBQUNBLENBQUEsU0FBUyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM1QixDQUFBLEVBQUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckMsQ0FBQSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUN2QixDQUFBLE1BQU0sT0FBTyxLQUFLLENBQUM7QUFDbkIsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxHQUFHO0FBQ0gsQ0FBQSxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQSxDQUFDOztBQUVELENBQUE7QUFDQSxDQUFBLFNBQVMsU0FBUyxFQUFFLFdBQVcsRUFBRTtBQUNqQyxDQUFBLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUN6RSxDQUFBLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQyxDQUFBLEdBQUc7QUFDSCxDQUFBLEVBQUUsT0FBTyxXQUFXLENBQUM7QUFDckIsQ0FBQSxDQUFDOztBQUVELENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUEsU0FBUyxlQUFlLEVBQUUsVUFBVSxFQUFFO0FBQ3RDLENBQUEsRUFBRSxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDaEIsQ0FBQSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNaLENBQUEsRUFBRSxJQUFJLE9BQU8sR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDO0FBQ2xDLENBQUEsRUFBRSxJQUFJLEdBQUcsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUIsQ0FBQSxFQUFFLElBQUksR0FBRyxDQUFDO0FBQ1YsQ0FBQSxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ2hDLENBQUEsSUFBSSxHQUFHLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM1QixDQUFBLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25ELENBQUEsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDO0FBQ2QsQ0FBQSxHQUFHO0FBQ0gsQ0FBQSxFQUFFLE9BQU8sQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDdEIsQ0FBQSxDQUFDOztBQUVELENBQUE7QUFDQSxDQUFBLFNBQVMsc0JBQXNCLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFO0FBQ2pELENBQUEsRUFBRSxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RGLENBQUEsRUFBRSxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RGLENBQUEs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TSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hELENBQUEsUUFBUSxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyQyxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUssQ0FBQyxDQUFDOztBQUVQLENBQUEsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUNsQixDQUFBLE1BQU0sa0JBQWtCLEVBQUUsVUFBVSxLQUFLLEVBQUU7QUFDM0MsQ0FBQSxRQUFRLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDbEMsQ0FBQSxRQUFRLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDOztBQUV2QyxDQUFBLFFBQVEsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUMzQixDQUFBLFVBQVUsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzFCLENBQUEsVUFBVSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxDQUFBLFNBQVM7O0FBRVQsQ0FBQSxRQUFRLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQzVELENBQUEsVUFBVSxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUNwRCxDQUFBLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUM7QUFDcEQsQ0FBQSxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7O0FBRXJELENBQUEsUUFBUSxJQUFJ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RUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyQyxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUssQ0FBQyxDQUFDOztBQUVQLENBQUEsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUNsQixDQUFBLE1BQU0sbUJBQW1CLEVBQUUsVUFBVSxLQUFLLEVBQUU7QUFDNUMsQ0FBQSxRQUFRLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDbEMsQ0FBQSxRQUFRLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDOztBQUV2QyxDQUFBLFFBQVEsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUMzQixDQUFBLFVBQVUsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzFCLENBQUEsVUFBVSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxDQUFBLFNBQVM7O0FBRVQsQ0FBQSxRQUFRLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDdkUsQ0FBQSxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDL0QsQ0FBQSxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7QUFDL0QsQ0FBQSxVQUFVLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQzs7QUFF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QU0sR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQzs7QUFFdkMsQ0FBQSxRQUFRLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUU7QUFDM0IsQ0FBQSxVQUFVLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUMxQixDQUFBLFVBQVUsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsQ0FBQSxTQUFTOztBQUVULENBQUEsUUFBUSxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztBQUM1RCxDQUFBLFVBQVUsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUM7QUFDcEQsQ0FBQSxVQUFVLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDO0FBQ3BELENBQUEsVUFBVSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDOztBQUVyRCxDQUFBLFFBQVEsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQzs7QUFFaEQsQ0FBQSxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLENBQUEsT0FBTztBQUNQLENBQUEsS0FBSyxDQUFDLENBQUM7QUFDUCxDQUFBLEdBQUc7QUFDSCxDQUFBLENBQUMsQ0FBQyxDQUFDOztBQUVILEFBQU8sQ0FBQSxJQUFJLGFBQWEsR0FBRyxVQUFVLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQzVELENBQUEsRUFBRSxPQUFPLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbEQsQ0FBQSxDQUFDLENBQUMsQUFFRjs7Q0MzRE8sSUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQzs7QUFFdkMsQ0FBQSxFQUFFLE9BQU8sRUFBRTtBQUNYLENBQUEsSUFBSSxXQUFXLEVBQUUsQ0FBQyxlQUFlLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUFDO0FBQzVHLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsVUFBVSxFQUFFLFVBQVUsVUFBVSxFQUFFLE9BQU8sRUFBRTtBQUM3QyxDQUFBLElBQUksSUFBSSxHQUFHLENBQUM7QUFDWixDQUFBLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDaEUsQ0FBQSxJQUFJLElBQUksT0FBTyxFQUFFO0FBQ2pCLENBQUEsTUFBTSxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDcEMsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLElBQUksVUFBVSxFQUFFO0FBQ3BCLENBQUEsTUFBTSxJQUFJLFVBQVUsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ3pDLENBQUEsUUFBUSxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQztBQUM1QyxDQUFBLFFBQVEsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLFVBQVUsQ0FBQyxFQUFFO0FBQ3pHLENBQUE7QUFDQSxDQUFBLFVBQVUsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDeEMsQ0FBQSxVQUFVLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDO0FBQzlCLENBQUEsU0FBUyxNQUFNO0FBQ2YsQ0FBQSxVQUFVLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsR0FBRyxRQUFRLENBQUM7QUFDdkQsQ0FBQSxVQUFVLElBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEdBQUcsR0FBRyxHQUFHLFNBQVMsR0FBRyxPQUFPLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUMzRixDQUFBLFNBQVM7QUFDVCxDQUFBLFFBQVEsSUFBSSxVQUFVLENBQUMsU0FBUyxFQUFFO0FBQ2xDLENBQUEsVUFBVSxJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sR0FBRyxVQUFVLENBQUMsV0FBVyxHQUFHLFVBQVUsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDO0FBQy9GLENBQUEsU0FBUztBQUNULENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQSxRQUFRLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLENBQUE7QUFDQSxDQUFBLFFBQVEsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUN2RCxDQUFBLE9BQU8sTUFBTTtBQUNiLENBQUEsUUFBUSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDM0IsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxHQUFHOztBQUVILENBQUE7QUFDQSxDQUFBLEVBQUUsUUFBUSxFQUFFLFVBQVUsR0FBRyxFQUFFO0FBQzNCLENBQUEsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFO0FBQ2QsQ0FBQSxNQUFNLE9BQU8sRUFBRSxDQUFDO0FBQ2hCLENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxJQUFJLElBQUksQ0FBQztBQUNiLENBQUEsSUFBSSxJQUFJO0FBQ1IsQ0FBQTtBQUNBLENBQUEsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDekMsQ0FBQSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMzQyxDQUFBLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsaUNBQWlDLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDMUUsQ0FBQSxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMvQyxDQUFBLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRTtBQUNqQixDQUFBLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQztBQUNsQixDQUFBLEtBQUs7QUFDTCxDQUFBLElBQUksT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxXQUFXLEVBQUUsWUFBWTtBQUMzQixDQUFBLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUFLLGFBQWEsRUFBRTtBQUNuSCxDQUFBLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ2pDLENBQUEsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVFLENBQUEsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNFLENBQUEsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdFLENBQUEsS0FBSyxNQUFNO0FBQ1gsQ0FBQSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUNsQyxDQUFBLEtBQUs7QUFDTCxDQUFBLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRTtBQUNoQyxDQUFBLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3ZFLENBQUEsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekUsQ0FBQSxLQUFLLE1BQU07QUFDWCxDQUFBLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO0FBQ25DLENBQUEsS0FBSzs7QUFFTCxDQUFBLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssS0FBSyxlQUFlLEVBQUU7QUFDcEQsQ0FBQSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDekUsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxXQUFXLEVBQUUsVUFBVSxPQUFPLEVBQUU7QUFDbEMsQ0FBQSxJQUFJLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQy9DLENBQUEsSUFBSSxJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7QUFDdkIsQ0FBQSxJQUFJLElBQUksT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUN4QixDQUFBLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9DLENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxJQUFJLE9BQU8sR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQzlCLENBQUEsSUFBSSxJQUFJLE9BQU8sR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDOztBQUUvQixDQUFBLElBQUksSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFO0FBQ3pCLENBQUEsTUFBTSxPQUFPLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbEQsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBRTtBQUN6QixDQUFBLE1BQU0sT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2xELENBQUEsS0FBSzs7QUFFTCxDQUFBLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztBQUN0QixDQUFBLE1BQU0sT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRO0FBQzVCLENBQUEsTUFBTSxRQUFRLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO0FBQy9CLENBQUEsTUFBTSxVQUFVLEVBQUUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO0FBQ3BDLENBQUEsS0FBSyxDQUFDLENBQUM7QUFDUCxDQUFBLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2pELENBQUEsSUFBSSxPQUFPLElBQUksQ0FBQztBQUNoQixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLFFBQVEsRUFBRSxVQUFVLElBQUksRUFBRTtBQUM1QixDQUFBO0FBQ0EsQ0FBQSxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7QUFDNUMsQ0FBQSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUU7QUFDZixDQUFBLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUM3QyxDQUFBLEtBQUs7QUFDTCxDQUFBLElBQUksT0FBTyxJQUFJLENBQUM7QUFDaEIsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxZQUFZLEVBQUUsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUU7QUFDckUsQ0FBQSxJQUFJLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDO0FBQy9ELENBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtBQUMxQixDQUFBLE1BQU0sSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFO0FBQ3BDLENBQUEsUUFBUSxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0UsQ0FBQSxRQUFRLElBQUksY0FBYyxFQUFFO0FBQzVCLENBQUEsVUFBVSxJQUFJLEdBQUcsY0FBYyxDQUFDO0FBQ2hDLENBQUEsU0FBUztBQUNULENBQUEsT0FBTztBQUNQLENBQUEsTUFBTSxJQUFJLGVBQWUsQ0FBQyxTQUFTLEVBQUU7QUFDckMsQ0FBQSxRQUFRLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0RSxDQUFBLFFBQVEsSUFBSSxLQUFLLEVBQUU7QUFDbkIsQ0FBQSxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDMUQsQ0FBQSxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUQsQ0FBQSxTQUFTO0FBQ1QsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtBQUM3QyxDQUFBLE1BQU0sSUFBSSxZQUFZLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzVFLENBQUEsTUFBTSxPQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzVDLENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFakMsQ0FBQSxJQUFJLFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLO0FBQ2xDLENBQUEsTUFBTSxLQUFLLGVBQWU7QUFDMUIsQ0FBQSxRQUFRLE9BQU8sWUFBWSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQy9FLENBQUEsTUFBTSxLQUFLLGdCQUFnQjtBQUMzQixDQUFBLFFBQVEsT0FBTyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDaEYsQ0FBQSxNQUFNLEtBQUssY0FBYztBQUN6QixDQUFBLFFBQVEsT0FBTyxXQUFXLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDOUUsQ0FBQSxNQUFNLEtBQUssVUFBVTtBQUNyQixDQUFBLFFBQVEsT0FBTyxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDMUUsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxHQUFHLENBQUM7QUFDckMsQ0FBQSxJQUFJLE9BQU8sQ0FBQyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3ZFLENBQUEsR0FBRztBQUNILENBQUEsQ0FBQyxDQUFDLENBQUM7O0FBRUgsQUFBTyxDQUFBLFNBQVMsV0FBVyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUU7QUFDbEQsQ0FBQSxFQUFFLE9BQU8sSUFBSSxXQUFXLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlDLENBQUEsQ0FBQyxBQUVEOztDQzNKTyxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0FBQ3RDLENBQUEsRUFBRSxPQUFPLEVBQUU7QUFDWCxDQUFBO0FBQ0EsQ0FBQSxJQUFJLFNBQVMsRUFBRSxDQUFDLGFBQWEsRUFBRSxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDO0FBQ25HLENBQUEsR0FBRztBQUNILENBQUEsRUFBRSxVQUFVLEVBQUUsVUFBVSxVQUFVLEVBQUUsT0FBTyxFQUFFO0FBQzdDLENBQUEsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNoRSxDQUFBLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZCLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsV0FBVyxFQUFFLFlBQVk7QUFDM0IsQ0FBQTtBQUNBLENBQUEsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDbEMsQ0FBQSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztBQUNwQyxDQUFBLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQzlCLENBQUEsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7O0FBRTVCLENBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUMzQixDQUFBLE1BQU0sT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQzFCLENBQUEsS0FBSzs7QUFFTCxDQUFBLElBQUksSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRTtBQUNoQyxDQUFBLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ25FLENBQUEsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDckUsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDeEMsQ0FBQSxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFcEUsQ0FBQSxNQUFNLElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQzs7QUFFMUIsQ0FBQSxNQUFNLFFBQVEsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLO0FBQ3BDLENBQUEsUUFBUSxLQUFLLGFBQWE7QUFDMUIsQ0FBQSxVQUFVLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM5QixDQUFBLFVBQVUsTUFBTTtBQUNoQixDQUFBLFFBQVEsS0FBSyxZQUFZO0FBQ3pCLENBQUEsVUFBVSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDOUIsQ0FBQSxVQUFVLE1BQU07QUFDaEIsQ0FBQSxRQUFRLEtBQUssZ0JBQWdCO0FBQzdCLENBQUEsVUFBVSxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwQyxDQUFBLFVBQVUsTUFBTTtBQUNoQixDQUFBLFFBQVEsS0FBSyxtQkFBbUI7QUFDaEMsQ0FBQSxVQUFVLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQSxVQUFVLE1BQU07QUFDaEIsQ0FBQSxPQUFPOztBQUVQLENBQUE7QUFDQSxDQUFBLE1BQU0sSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNqQyxDQUFBLFFBQVEsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDcEQsQ0FBQSxVQUFVLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUMvQyxDQUFBLFNBQVM7O0FBRVQsQ0FBQSxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdEQsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxLQUFLLEVBQUUsVUFBVSxPQUFPLEVBQUUsZUFBZSxFQUFFO0FBQzdDLENBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxlQUFlLEVBQUU7QUFDN0MsQ0FBQSxNQUFNLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRTtBQUNwQyxDQUFBLFFBQVEsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUM5RixDQUFBLFFBQVEsSUFBSSxjQUFjLEVBQUU7QUFDNUIsQ0FBQSxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUMvQyxDQUFBLFNBQVM7QUFDVCxDQUFBLE9BQU87QUFDUCxDQUFBLE1BQU0sSUFBSSxlQUFlLENBQUMsU0FBUyxFQUFFO0FBQ3JDLENBQUEsUUFBUSxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdEUsQ0FBQSxRQUFRLElBQUksS0FBSyxFQUFFO0FBQ25CLENBQUEsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3RELENBQUEsVUFBVSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hELENBQUEsU0FBUztBQUNULENBQUEsT0FBTztBQUNQLENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDeEIsQ0FBQSxHQUFHO0FBQ0gsQ0FBQSxDQUFDLENBQUMsQ0FBQzs7QUFFSCxBQUFPLENBQUEsU0FBUyxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRTtBQUNqRCxDQUFBLEVBQUUsT0FBTyxJQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDN0MsQ0FBQSxDQUFDLEFBRUQ7O0NDaEZPLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDekMsQ0FBQSxFQUFFLE9BQU8sRUFBRTtBQUNYLENBQUE7QUFDQSxDQUFBLElBQUksWUFBWSxFQUFFLENBQUMsY0FBYyxDQUFDO0FBQ2xDLENBQUEsR0FBRztBQUNILENBQUEsRUFBRSxVQUFVLEVBQUUsVUFBVSxVQUFVLEVBQUUsT0FBTyxFQUFFO0FBQzdDLENBQUEsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNoRSxDQUFBLElBQUksSUFBSSxVQUFVLEVBQUU7QUFDcEIsQ0FBQSxNQUFNLElBQUksVUFBVSxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssS0FBSyxhQUFhLEVBQUU7QUFDNUUsQ0FBQSxRQUFRLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDekMsQ0FBQSxPQUFPLE1BQU07QUFDYixDQUFBLFFBQVEsSUFBSSxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMzRSxDQUFBLE9BQU87QUFDUCxDQUFBLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3pCLENBQUEsS0FBSztBQUNMLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsV0FBVyxFQUFFLFlBQVk7QUFDM0IsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUMxQixDQUFBLE1BQU0sSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDekMsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0FBQ3BDLENBQUEsT0FBTyxNQUFNO0FBQ2IsQ0FBQTtBQUNBLENBQUEsUUFBUSxLQUFLLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDaEQsQ0FBQSxVQUFVLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNoRSxDQUFBLFNBQVM7QUFDVCxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUs7O0FBRUwsQ0FBQTtBQUNBLENBQUEsSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDMUIsQ0FBQSxNQUFNLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLO0FBQ2hDLENBQUE7QUFDQSxDQUFBLFVBQVUsYUFBYSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLElBQUksQ0FBQyxDQUFDLEVBQUU7QUFDM0UsQ0FBQSxRQUFRLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQyxDQUFBLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pFLENBQUEsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDM0UsQ0FBQSxPQUFPLE1BQU07QUFDYixDQUFBLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQ2xDLENBQUEsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7QUFDckMsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxLQUFLLEVBQUUsVUFBVSxPQUFPLEVBQUUsZUFBZSxFQUFFO0FBQzdDLENBQUEsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxlQUFlLElBQUksZUFBZSxDQUFDLFNBQVMsRUFBRTtBQUMxRSxDQUFBLE1BQU0sSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsZUFBZSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3BFLENBQUEsTUFBTSxJQUFJLEtBQUssRUFBRTtBQUNqQixDQUFBLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4RCxDQUFBLFFBQVEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxRCxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUs7QUFDTCxDQUFBLElBQUksT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ3hCLENBQUEsR0FBRztBQUNILENBQUEsQ0FBQyxDQUFDLENBQUM7O0FBRUgsQUFBTyxDQUFBLFNBQVMsYUFBYSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUU7QUFDcEQsQ0FBQSxFQUFFLE9BQU8sSUFBSSxhQUFhLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2hELENBQUEsQ0FBQyxBQUVEOztDQzNETyxJQUFJQSxVQUFRLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDckMsQ0FBQSxFQUFFLE9BQU8sRUFBRTtBQUNYLENBQUEsSUFBSSxtQkFBbUIsRUFBRSxLQUFLO0FBQzlCLENBQUEsSUFBSSxTQUFTLEVBQUUsSUFBSTtBQUNuQixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLFVBQVUsRUFBRSxVQUFVLFlBQVksRUFBRSxPQUFPLEVBQUU7QUFDL0MsQ0FBQSxJQUFJLElBQUksQ0FBQyxhQUFhLEdBQUcsWUFBWSxDQUFDO0FBQ3RDLENBQUEsSUFBSSxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUMvQixDQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDdkIsQ0FBQSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ3JGLENBQUEsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDckMsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxxQkFBcUIsRUFBRSxVQUFVLGVBQWUsRUFBRTtBQUNwRCxDQUFBLElBQUksSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ3JCLENBQUEsSUFBSSxJQUFJLGVBQWUsRUFBRTtBQUN6QixDQUFBLE1BQU0sS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDdkQsQ0FBQSxRQUFRLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlELENBQUEsT0FBTztBQUNQLENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxPQUFPLE9BQU8sQ0FBQztBQUNuQixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLG9CQUFvQixFQUFFLFlBQVk7QUFDcEMsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUU7QUFDMUMsQ0FBQSxNQUFNLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzlFLENBQUEsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDNUMsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxVQUFVLEVBQUUsVUFBVSxVQUFVLEVBQUU7QUFDcEMsQ0FBQSxJQUFJLElBQUksVUFBVSxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksVUFBVSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7QUFDeEUsQ0FBQSxNQUFNLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBQ2hDLENBQUEsTUFBTSxPQUFPLFdBQVcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ25ELENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxJQUFJLFVBQVUsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ3ZDLENBQUEsTUFBTSxPQUFPLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2xELENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxJQUFJLFVBQVUsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ3ZDLENBQUEsTUFBTSxPQUFPLGFBQWEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3JELENBQUEsS0FBSztBQUNMLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsVUFBVSxFQUFFLFlBQVk7QUFDMUIsQ0FBQTtBQUNBLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsbUJBQW1CLEVBQUUsVUFBVSxLQUFLLEVBQUU7QUFDeEMsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtBQUM1QixDQUFBLE1BQU0sS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4RSxDQUFBLEtBQUssTUFBTTtBQUNYLENBQUEsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzFELENBQUEsTUFBTSxLQUFLLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQ2pELENBQUEsS0FBSztBQUNMLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsWUFBWSxFQUFFLFVBQVUsT0FBTyxFQUFFLE1BQU0sRUFBRTtBQUMzQyxDQUFBLElBQUksSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2QyxDQUFBLElBQUksSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksRUFBRTtBQUNqQyxDQUFBO0FBQ0EsQ0FBQSxNQUFNLE9BQU8sR0FBRyxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDcEYsQ0FBQSxLQUFLO0FBQ0wsQ0FBQTtBQUNBLENBQUEsSUFBSSxPQUFPLENBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzRCxDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLEtBQUssRUFBRSxVQUFVLE9BQU8sRUFBRTtBQUM1QixDQUFBLElBQUksSUFBSSxVQUFVLENBQUM7QUFDbkIsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRTtBQUN2QyxDQUFBLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDMUQsQ0FBQSxLQUFLO0FBQ0wsQ0FBQTtBQUNBLENBQUEsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZDLENBQUEsSUFBSSxJQUFJLEdBQUcsRUFBRTtBQUNiLENBQUEsTUFBTSxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDckYsQ0FBQSxLQUFLLE1BQU07QUFDWCxDQUFBO0FBQ0EsQ0FBQSxNQUFNLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3hFLENBQUEsS0FBSztBQUNMLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsV0FBVyxFQUFFLFVBQVUsTUFBTSxFQUFFLFVBQVUsRUFBRTtBQUM3QyxDQUFBLElBQUksSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0FBQzFCLENBQUEsSUFBSSxJQUFJLElBQUksQ0FBQztBQUNiLENBQUE7QUFDQSxDQUFBLElBQUksS0FBSyxJQUFJLElBQUksTUFBTSxFQUFFO0FBQ3pCLENBQUEsTUFBTSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDdkMsQ0FBQSxRQUFRLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDMUMsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLO0FBQ0wsQ0FBQTtBQUNBLENBQUEsSUFBSSxJQUFJLFVBQVUsRUFBRTtBQUNwQixDQUFBLE1BQU0sS0FBSyxJQUFJLElBQUksVUFBVSxFQUFFO0FBQy9CLENBQUEsUUFBUSxJQUFJLFVBQVUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDN0MsQ0FBQSxVQUFVLFlBQVksQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEQsQ0FBQSxTQUFTO0FBQ1QsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLE9BQU8sWUFBWSxDQUFDO0FBQ3hCLENBQUEsR0FBRztBQUNILENBQUEsQ0FBQyxDQUFDLENBQUMsQUFFSCxBQUFlLEFBQVE7O0NDM0doQixJQUFJLG1CQUFtQixHQUFHQSxVQUFRLENBQUMsTUFBTSxDQUFDO0FBQ2pELENBQUEsRUFBRSxVQUFVLEVBQUUsVUFBVSxZQUFZLEVBQUUsT0FBTyxFQUFFO0FBQy9DLENBQUEsSUFBSUEsVUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDcEUsQ0FBQSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUM7QUFDM0MsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixLQUFLLHNCQUFzQixFQUFFO0FBQ2pILENBQUEsTUFBTSxJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQztBQUN2RSxDQUFBLEtBQUs7QUFDTCxDQUFBLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzFCLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsY0FBYyxFQUFFLFlBQVk7QUFDOUIsQ0FBQSxJQUFJLElBQUksTUFBTSxDQUFDO0FBQ2YsQ0FBQSxJQUFJLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDOztBQUV6RCxDQUFBLElBQUksSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7O0FBRXZCLENBQUE7QUFDQSxDQUFBLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3RELENBQUEsTUFBTSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsRUFBRTtBQUN2RixDQUFBLFFBQVEsTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQzFFLENBQUEsT0FBTyxNQUFNO0FBQ2IsQ0FBQSxRQUFRLE1BQU0sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN4RCxDQUFBLE9BQU87QUFDUCxDQUFBLE1BQU0sTUFBTSxDQUFDLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDO0FBQ2hELENBQUEsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQyxDQUFBLEtBQUs7QUFDTCxDQUFBO0FBQ0EsQ0FBQSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUN2QyxDQUFBLE1BQU0sT0FBTyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BDLENBQUEsS0FBSyxDQUFDLENBQUM7QUFDUCxDQUFBLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDaEMsQ0FBQSxJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFDakUsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxVQUFVLEVBQUUsVUFBVSxPQUFPLEVBQUU7QUFDakMsQ0FBQSxJQUFJLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlDLENBQUEsSUFBSSxJQUFJLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtBQUNsQyxDQUFBLE1BQU0sSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNuRSxDQUFBLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFO0FBQ2hELENBQUEsUUFBUSxHQUFHLEdBQUcsR0FBRyxHQUFHLFNBQVMsQ0FBQztBQUM5QixDQUFBLE9BQU8sTUFBTTtBQUNiLENBQUEsUUFBUSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7QUFDbkMsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFO0FBQzlCLENBQUEsTUFBTSxPQUFPLElBQUksQ0FBQyxjQUFjLENBQUM7QUFDakMsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsQ0FBQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDeEQsQ0FBQSxNQUFNLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFO0FBQ3RDLENBQUEsUUFBUSxNQUFNO0FBQ2QsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFBLEdBQUc7QUFDSCxDQUFBLENBQUMsQ0FBQyxDQUFDOztBQUVILEFBQU8sQ0FBQSxTQUFTLG1CQUFtQixFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUU7QUFDNUQsQ0FBQSxFQUFFLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDeEQsQ0FBQSxDQUFDLEFBRUQ7O0NDL0RPLElBQUksbUJBQW1CLEdBQUdBLFVBQVEsQ0FBQyxNQUFNLENBQUM7QUFDakQsQ0FBQSxFQUFFLFVBQVUsRUFBRSxVQUFVLFlBQVksRUFBRSxPQUFPLEVBQUU7QUFDL0MsQ0FBQSxJQUFJQSxVQUFRLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNwRSxDQUFBLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztBQUM1QyxDQUFBLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzFCLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsY0FBYyxFQUFFLFlBQVk7QUFDOUIsQ0FBQSxJQUFJLElBQUksTUFBTSxDQUFDO0FBQ2YsQ0FBQSxJQUFJLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUM7O0FBRXRELENBQUE7QUFDQSxDQUFBLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ2xELENBQUEsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbEQsQ0FBQSxNQUFNLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNwQyxDQUFBLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakMsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ2hDLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsVUFBVSxFQUFFLFVBQVUsT0FBTyxFQUFFO0FBQ2pDLENBQUEsSUFBSSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QyxDQUFBO0FBQ0EsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7QUFDeEUsQ0FBQSxNQUFNLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvRCxDQUFBLE1BQU0sSUFBSSxJQUFJLEVBQUU7QUFDaEIsQ0FBQSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDeEQsQ0FBQSxRQUFRLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqRSxDQUFBLFFBQVEsSUFBSSxJQUFJLEVBQUU7QUFDbEIsQ0FBQSxVQUFVLEdBQUcsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDMUQsQ0FBQSxTQUFTO0FBQ1QsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO0FBQ3JDLENBQUEsSUFBSSxLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3hELENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQTtBQUNBLENBQUEsTUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRTtBQUN2QyxDQUFBLFFBQVEsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsQ0FBQSxPQUFPO0FBQ1AsQ0FBQTtBQUNBLENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFBLEdBQUc7QUFDSCxDQUFBLENBQUMsQ0FBQyxDQUFDOztBQUVILEFBQU8sQ0FBQSxTQUFTLG1CQUFtQixFQUFFLFlBQVksRUFBRSxPQUFPLEVBQUU7QUFDNUQsQ0FBQSxFQUFFLE9BQU8sSUFBSSxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDeEQsQ0FBQSxDQUFDLEFBRUQ7O0NDcERPLElBQUksY0FBYyxHQUFHQSxVQUFRLENBQUMsTUFBTSxDQUFDO0FBQzVDLENBQUEsRUFBRSxVQUFVLEVBQUUsVUFBVSxZQUFZLEVBQUUsT0FBTyxFQUFFO0FBQy9DLENBQUEsSUFBSUEsVUFBUSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDcEUsQ0FBQSxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUN6QixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLGFBQWEsRUFBRSxZQUFZO0FBQzdCLENBQUEsSUFBSSxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFO0FBQ25DLENBQUEsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztBQUNyRSxDQUFBLEtBQUs7QUFDTCxDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLFVBQVUsRUFBRSxZQUFZO0FBQzFCLENBQUEsSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUIsQ0FBQSxHQUFHO0FBQ0gsQ0FBQSxDQUFDLENBQUMsQ0FBQzs7QUFFSCxBQUFPLENBQUEsU0FBUyxjQUFjLEVBQUUsWUFBWSxFQUFFLE9BQU8sRUFBRTtBQUN2RCxDQUFBLEVBQUUsT0FBTyxJQUFJLGNBQWMsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbkQsQ0FBQSxDQUFDLEFBRUQ7O0NDbkJPLFNBQVMsV0FBVyxFQUFFLGVBQWUsRUFBRSxLQUFLLEVBQUU7QUFDckQsQ0FBQSxFQUFFLElBQUksSUFBSSxDQUFDO0FBQ1gsQ0FBQSxFQUFFLElBQUksWUFBWSxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDOztBQUUxRCxDQUFBLEVBQUUsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDOztBQUVuQixDQUFBLEVBQUUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTtBQUMxQixDQUFBLElBQUksT0FBTyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztBQUN0QyxDQUFBLEdBQUc7QUFDSCxDQUFBLEVBQUUsSUFBSSxlQUFlLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRTtBQUNoRCxDQUFBLElBQUksT0FBTyxDQUFDLGlCQUFpQixHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDO0FBQ3pFLENBQUEsR0FBRztBQUNILENBQUEsRUFBRSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFO0FBQzNCLENBQUEsSUFBSSxPQUFPLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7QUFDbkQsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxRQUFRLFlBQVksQ0FBQyxJQUFJO0FBQzNCLENBQUEsSUFBSSxLQUFLLGFBQWE7QUFDdEIsQ0FBQSxNQUFNLDJCQUEyQixDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3JGLENBQUEsTUFBTSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsRUFBRTtBQUN6QyxDQUFBLFFBQVEsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDbEMsQ0FBQSxRQUFRLElBQUksS0FBSyxHQUFHLG1CQUFtQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUMvRCxDQUFBLFFBQVEsS0FBSyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNyRCxDQUFBLFFBQVEsT0FBTyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztBQUMzQyxDQUFBLE9BQU87QUFDUCxDQUFBLE1BQU0sSUFBSSxHQUFHLG1CQUFtQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN4RCxDQUFBLE1BQU0sTUFBTTtBQUNaLENBQUEsSUFBSSxLQUFLLGFBQWE7QUFDdEIsQ0FBQSxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3pDLENBQUEsTUFBTSxJQUFJLEdBQUcsbUJBQW1CLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3hELENBQUEsTUFBTSxNQUFNO0FBQ1osQ0FBQSxJQUFJO0FBQ0osQ0FBQSxNQUFNLElBQUksR0FBRyxjQUFjLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ25ELENBQUEsR0FBRztBQUNILENBQUEsRUFBRSxJQUFJLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbEMsQ0FBQSxDQUFDOztBQUVELEFBQU8sQ0FBQSxTQUFTLDJCQUEyQixFQUFFLFlBQVksRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFO0FBQzVFLENBQUEsRUFBRSxLQUFLLENBQUMsdUJBQXVCLEdBQUcsS0FBSyxDQUFDO0FBQ3hDLENBQUEsRUFBRSxJQUFJLFlBQVksS0FBSyxxQkFBcUIsRUFBRTtBQUM5QyxDQUFBLElBQUksSUFBSSxRQUFRLENBQUMsb0JBQW9CLEVBQUU7QUFDdkMsQ0FBQSxNQUFNLEtBQUssQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7QUFDM0MsQ0FBQSxLQUFLO0FBQ0wsQ0FBQTtBQUNBLENBQUEsSUFBSSxJQUFJLFFBQVEsQ0FBQyxlQUFlLElBQUksUUFBUSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUU7QUFDckUsQ0FBQSxNQUFNLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0FBQ25ELENBQUEsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEVBQUU7QUFDckUsQ0FBQSxRQUFRLEtBQUssQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUM7QUFDN0MsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxHQUFHO0FBQ0gsQ0FBQSxDQUFDLEFBRUQsQUFLQTs7Q0N6RE8sSUFBSSxpQkFBaUIsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNoRCxDQUFBLEVBQUUsT0FBTyxFQUFFO0FBQ1gsQ0FBQSxJQUFJLElBQUksRUFBRSxFQUFFO0FBQ1osQ0FBQSxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxVQUFVLEVBQUUsVUFBVSxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQ3pDLENBQUEsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFaEMsQ0FBQSxJQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDbEMsQ0FBQSxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDeEMsQ0FBQSxJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQzFCLENBQUEsSUFBSSxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUM3QixDQUFBLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7O0FBRXRCLENBQUEsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUM7O0FBRWYsQ0FBQSxJQUFJLElBQUksTUFBTSxFQUFFO0FBQ2hCLENBQUEsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNyRCxDQUFBLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNqQyxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUs7O0FBRUwsQ0FBQSxJQUFJLElBQUksT0FBTyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUN2QyxDQUFBLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QyxDQUFBLEtBQUssTUFBTTtBQUNYLENBQUEsTUFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlDLENBQUEsS0FBSztBQUNMLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUscUJBQXFCLEVBQUUsVUFBVSxNQUFNLEVBQUU7QUFDM0MsQ0FBQSxJQUFJLElBQUksR0FBRyxHQUFHLG9EQUFvRCxHQUFHLE1BQU0sR0FBRyxPQUFPLENBQUM7QUFDdEYsQ0FBQSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLEVBQUUsVUFBVSxHQUFHLEVBQUUsR0FBRyxFQUFFO0FBQ2hELENBQUEsTUFBTSxJQUFJLEdBQUcsRUFBRTtBQUNmLENBQUEsUUFBUSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLENBQUEsT0FBTyxNQUFNO0FBQ2IsQ0FBQSxRQUFRLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMxQyxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNiLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsdUJBQXVCLEVBQUUsVUFBVSxJQUFJLEVBQUU7QUFDM0MsQ0FBQSxJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQztBQUNmLENBQUEsSUFBSSxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUM7QUFDbEIsQ0FBQSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN4RCxDQUFBLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUN6RCxDQUFBLFFBQVEsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNsQixDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUs7QUFDTCxDQUFBLElBQUksSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO0FBQzFELENBQUEsSUFBSSxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUM7QUFDdkUsQ0FBQSxJQUFJLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsZUFBZSxDQUFDLGFBQWEsQ0FBQztBQUN6RSxDQUFBLElBQUksSUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDOztBQUVyRSxDQUFBLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxLQUFLLElBQUksRUFBRTtBQUNsRixDQUFBLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtBQUN0RixDQUFBLFFBQVEsT0FBTyxDQUFDLEtBQUssQ0FBQyw2QkFBNkIsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxHQUFHLHFCQUFxQixDQUFDLENBQUM7QUFDL0ksQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQztBQUMxRCxDQUFBLEtBQUs7QUFDTCxDQUFBLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7QUFDcEQsQ0FBQSxNQUFNLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDcEQsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLFlBQVksS0FBSyxTQUFTLEVBQUU7QUFDbkYsQ0FBQSxNQUFNLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQztBQUN0RixDQUFBLEtBQUs7QUFDTCxDQUFBLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFdEIsQ0FBQSxJQUFJLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7O0FBRTVFLENBQUEsSUFBSSxJQUFJLGVBQWUsS0FBSyxJQUFJLEVBQUU7QUFDbEMsQ0FBQSxNQUFNLFdBQVcsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDekMsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekIsQ0FBQSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDMUIsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxXQUFXLEVBQUUsVUFBVSxRQUFRLEVBQUUsWUFBWSxFQUFFO0FBQ2pELENBQUEsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQzdCLENBQUEsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUM7QUFDZixDQUFBLElBQUksSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDOztBQUUxQixDQUFBLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckQsQ0FBQSxNQUFNLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQixDQUFBLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQztBQUMzQixDQUFBLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDOztBQUVmLENBQUEsTUFBTSxJQUFJLFlBQVksS0FBSyxtQkFBbUIsRUFBRTtBQUNoRCxDQUFBLFFBQVEsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekcsQ0FBQSxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQztBQUM1QyxDQUFBLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO0FBQzVDLENBQUEsT0FBTyxNQUFNLElBQUksWUFBWSxLQUFLLHdCQUF3QixFQUFFO0FBQzVELENBQUEsUUFBUSxJQUFJLElBQUksQ0FBQzs7QUFFakIsQ0FBQSxRQUFRLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDcEUsQ0FBQSxVQUFVLGdCQUFnQixHQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2pJLENBQUEsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7QUFDekQsQ0FBQSxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQztBQUN6RCxDQUFBLFNBQVM7QUFDVCxDQUFBLE9BQU8sTUFBTSxJQUFJLFlBQVksS0FBSyxzQkFBc0IsRUFBRTtBQUMxRCxDQUFBLFFBQVEsSUFBSSxPQUFPLEVBQUUsUUFBUSxDQUFDOztBQUU5QixDQUFBLFFBQVEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMzRSxDQUFBLFVBQVUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM5RSxDQUFBLFlBQVksZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDdkksQ0FBQSxZQUFZLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQztBQUM3RCxDQUFBLFlBQVksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO0FBQzdELENBQUEsV0FBVztBQUNYLENBQUEsU0FBUztBQUNULENBQUEsT0FBTyxNQUFNLElBQUksWUFBWSxLQUFLLHFCQUFxQixFQUFFO0FBQ3pELENBQUEsUUFBUSxJQUFJLE9BQU8sRUFBRSxRQUFRLENBQUM7O0FBRTlCLENBQUEsUUFBUSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzNFLENBQUEsVUFBVSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzlFLENBQUEsWUFBWSxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2SSxDQUFBLFlBQVksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO0FBQzdELENBQUEsWUFBWSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUM7QUFDN0QsQ0FBQSxXQUFXO0FBQ1gsQ0FBQSxTQUFTO0FBQ1QsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxNQUFNLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxPQUFPLFlBQVksQ0FBQztBQUN4QixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLDJCQUEyQixFQUFFLFVBQVUsUUFBUSxFQUFFLGFBQWEsRUFBRTtBQUNsRSxDQUFBLElBQUksSUFBSSx3QkFBd0IsR0FBRztBQUNuQyxDQUFBLE1BQU0sSUFBSSxFQUFFLG1CQUFtQjtBQUMvQixDQUFBLE1BQU0sUUFBUSxFQUFFLEVBQUU7QUFDbEIsQ0FBQSxLQUFLLENBQUM7QUFDTixDQUFBLElBQUksSUFBSSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQzNCLENBQUEsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUM7O0FBRWYsQ0FBQSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3JELENBQUEsTUFBTSxJQUFJLE9BQU8sR0FBRyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ2hFLENBQUEsTUFBTSxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2xDLENBQUEsS0FBSzs7QUFFTCxDQUFBLElBQUksd0JBQXdCLENBQUMsUUFBUSxHQUFHLGFBQWEsQ0FBQzs7QUFFdEQsQ0FBQSxJQUFJLE9BQU8sd0JBQXdCLENBQUM7QUFDcEMsQ0FBQSxHQUFHO0FBQ0gsQ0FBQSxDQUFDLENBQUMsQ0FBQzs7QUFFSCxBQUFPLENBQUEsU0FBUyxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQ3JELENBQUEsRUFBRSxPQUFPLElBQUksaUJBQWlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2pELENBQUEsQ0FBQyxBQUVEOztDQ3JKTyxJQUFJLFFBQVEsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUN2QyxDQUFBLEVBQUUsT0FBTyxFQUFFO0FBQ1gsQ0FBQSxJQUFJLEdBQUcsRUFBRSxFQUFFO0FBQ1gsQ0FBQSxJQUFJLElBQUksRUFBRSxFQUFFO0FBQ1osQ0FBQSxJQUFJLE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxVQUFVLEVBQUUsVUFBVSxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQ3pDLENBQUEsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFaEMsQ0FBQSxJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7QUFDaEMsQ0FBQSxJQUFJLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUM7QUFDeEQsQ0FBQSxJQUFJLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUM7QUFDbEQsQ0FBQSxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDeEMsQ0FBQSxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOztBQUV0QixDQUFBLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDOztBQUVmLENBQUEsSUFBSSxJQUFJLE1BQU0sRUFBRTtBQUNoQixDQUFBLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckQsQ0FBQSxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDdEUsQ0FBQSxHQUFHOztBQUVILENBQUEsRUFBRSxTQUFTLEVBQUUsVUFBVSxHQUFHLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRTtBQUMzRCxDQUFBLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7QUFDdEIsQ0FBQSxNQUFNLFFBQVEsRUFBRSxZQUFZLENBQUMsaUJBQWlCO0FBQzlDLENBQUEsTUFBTSxRQUFRLEVBQUUsWUFBWSxDQUFDLGtCQUFrQjtBQUMvQyxDQUFBLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFYixDQUFBLElBQUksV0FBVyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN2QyxDQUFBLEdBQUc7QUFDSCxDQUFBLENBQUMsQ0FBQyxDQUFDOztBQUVILEFBQU8sQ0FBQSxTQUFTLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQzVDLENBQUEsRUFBRSxPQUFPLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN4QyxDQUFBLENBQUMsQUFFRDs7Q0N6Q08sSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDdkMsQ0FBQSxFQUFFLE9BQU8sRUFBRTtBQUNYLENBQUEsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUEsSUFBSSxHQUFHLEVBQUUsRUFBRTtBQUNYLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsVUFBVSxFQUFFLFVBQVUsTUFBTSxFQUFFLE9BQU8sRUFBRTtBQUN6QyxDQUFBLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7O0FBRWhDLENBQUEsSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO0FBQ2hDLENBQUEsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQ3hDLENBQUEsSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztBQUMxQixDQUFBLElBQUksSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDN0IsQ0FBQSxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDOztBQUV0QixDQUFBLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDOztBQUVmLENBQUEsSUFBSSxJQUFJLE1BQU0sRUFBRTtBQUNoQixDQUFBLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckQsQ0FBQSxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLE9BQU8sRUFBRSxVQUFVLEdBQUcsRUFBRTtBQUMxQixDQUFBLElBQUksSUFBSSxVQUFVLEdBQUcsNENBQTRDLEdBQUcsR0FBRyxHQUFHLGtEQUFrRCxDQUFDO0FBQzdILENBQUEsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLFVBQVUsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUN2RCxDQUFBLE1BQU0sSUFBSSxHQUFHLEVBQUU7QUFDZixDQUFBLFFBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN6QixDQUFBLE9BQU8sTUFBTTtBQUNiLENBQUEsUUFBUSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLENBQUEsUUFBUSxJQUFJLENBQUMsdUJBQXVCLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDNUQsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDYixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLHVCQUF1QixFQUFFLFVBQVUsaUJBQWlCLEVBQUU7QUFDeEQsQ0FBQSxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUMzQyxDQUFBLElBQUksSUFBSSxDQUFDLENBQUM7QUFDVixDQUFBLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDNUIsQ0FBQSxNQUFNLElBQUksaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUN0RSxDQUFBLFFBQVEsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2QixDQUFBLFFBQVEsSUFBSSxRQUFRLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUM7QUFDdkUsQ0FBQSxRQUFRLElBQUksYUFBYSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDOztBQUV0RixDQUFBLFFBQVEsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQzs7QUFFaEYsQ0FBQSxRQUFRLElBQUksaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7QUFDakUsQ0FBQSxVQUFVLElBQUksQ0FBQyxTQUFTLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNqRSxDQUFBLFNBQVM7QUFDVCxDQUFBLFFBQVEsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEtBQUssU0FBUyxFQUFFO0FBQ2hHLENBQUEsVUFBVSxJQUFJLENBQUMsWUFBWSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQztBQUNuRyxDQUFBLFNBQVM7O0FBRVQsQ0FBQSxRQUFRLFdBQVcsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3ZFLENBQUEsUUFBUSxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzdCLENBQUEsUUFBUSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLENBQUEsT0FBTztBQUNQLENBQUEsS0FBSztBQUNMLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsMkJBQTJCLEVBQUUsVUFBVSxRQUFRLEVBQUUsYUFBYSxFQUFFO0FBQ2xFLENBQUEsSUFBSSxJQUFJLHdCQUF3QixHQUFHO0FBQ25DLENBQUEsTUFBTSxJQUFJLEVBQUUsbUJBQW1CO0FBQy9CLENBQUEsTUFBTSxRQUFRLEVBQUUsRUFBRTtBQUNsQixDQUFBLEtBQUssQ0FBQztBQUNOLENBQUEsSUFBSSxJQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFDM0IsQ0FBQSxJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQzs7QUFFZixDQUFBLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDckQsQ0FBQSxNQUFNLElBQUksT0FBTyxHQUFHLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDaEUsQ0FBQSxNQUFNLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDbEMsQ0FBQSxLQUFLOztBQUVMLENBQUEsSUFBSSx3QkFBd0IsQ0FBQyxRQUFRLEdBQUcsYUFBYSxDQUFDOztBQUV0RCxDQUFBLElBQUksT0FBTyx3QkFBd0IsQ0FBQztBQUNwQyxDQUFBLEdBQUc7QUFDSCxDQUFBLENBQUMsQ0FBQyxDQUFDOztBQUVILEFBQU8sQ0FBQSxTQUFTLFFBQVEsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQzVDLENBQUEsRUFBRSxPQUFPLElBQUksUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN4QyxDQUFBLENBQUMsQUFFRDs7Q0N6Rk8sSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDeEMsQ0FBQSxFQUFFLE9BQU8sRUFBRTtBQUNYLENBQUEsSUFBSSxRQUFRLEVBQUUsSUFBSTtBQUNsQixDQUFBLElBQUksU0FBUyxFQUFFLDRCQUE0QjtBQUMzQyxDQUFBLElBQUksSUFBSSxFQUFFLEVBQUU7QUFDWixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLFVBQVUsRUFBRSxVQUFVLE9BQU8sRUFBRTtBQUNqQyxDQUFBLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sS0FBSyxLQUFLLENBQUMsR0FBRyxPQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMvRixDQUFBLElBQUksSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7QUFFL0IsQ0FBQSxJQUFJLEdBQUcsQ0FBQyxTQUFTLEdBQUcsd0lBQXdJLEdBQUcsT0FBTyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7O0FBRXZMLENBQUE7QUFDQSxDQUFBLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQy9CLENBQUEsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUM7QUFDbEMsQ0FBQSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLFdBQVcsQ0FBQztBQUMxQyxDQUFBLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDO0FBQ25DLENBQUEsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7O0FBRXBDLENBQUEsSUFBSSxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUU7QUFDdkIsQ0FBQSxNQUFNLElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3pDLENBQUEsTUFBTSxHQUFHLENBQUMsS0FBSyxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQzVFLENBQUEsS0FBSztBQUNMLENBQUEsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQzs7QUFFckMsQ0FBQSxJQUFJLE9BQU8sR0FBRyxDQUFDO0FBQ2YsQ0FBQSxHQUFHO0FBQ0gsQ0FBQSxDQUFDLENBQUMsQ0FBQzs7QUFFSCxBQUFPLENBQUEsU0FBUyxTQUFTLEVBQUUsT0FBTyxFQUFFO0FBQ3BDLENBQUEsRUFBRSxPQUFPLElBQUksU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2hDLENBQUEsQ0FBQyxBQUVEOztDQ2pDTyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztBQUN6QyxDQUFBLEVBQUUsT0FBTyxFQUFFO0FBQ1gsQ0FBQSxJQUFJLFVBQVUsRUFBRSxFQUFFO0FBQ2xCLENBQUEsSUFBSSxZQUFZLEVBQUUsRUFBRTtBQUNwQixDQUFBLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNsQixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLFVBQVUsRUFBRSxVQUFVLE1BQU0sRUFBRSxPQUFPLEVBQUU7QUFDekMsQ0FBQSxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ2hDLENBQUEsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRXBDLENBQUEsSUFBSSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUM5RixDQUFBLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN2RCxDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLGdCQUFnQixFQUFFLFVBQVUsVUFBVSxFQUFFLFlBQVksRUFBRTtBQUN4RCxDQUFBLElBQUksSUFBSSxDQUFDLEdBQUcsZUFBZSxDQUFDO0FBQzVCLENBQUEsSUFBSSxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDOztBQUVwRCxDQUFBLElBQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFO0FBQ2xELENBQUEsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hCLENBQUEsTUFBTSxPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM5QixDQUFBLEtBQUssQ0FBQyxDQUFDOztBQUVQLENBQUEsSUFBSSxPQUFPLFNBQVMsQ0FBQztBQUNyQixDQUFBLEdBQUc7O0FBRUgsQ0FBQSxFQUFFLGFBQWEsRUFBRSxVQUFVLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDekMsQ0FBQSxJQUFJLElBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQztBQUN6QixDQUFBLE1BQU0sSUFBSSxFQUFFLElBQUk7QUFDaEIsQ0FBQSxNQUFNLFVBQVUsRUFBRSxNQUFNO0FBQ3hCLENBQUEsS0FBSyxDQUFDLENBQUM7O0FBRVAsQ0FBQSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdkIsQ0FBQSxHQUFHO0FBQ0gsQ0FBQSxDQUFDLENBQUMsQ0FBQzs7QUFFSCxBQUFPLENBQUEsU0FBUyxXQUFXLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRTtBQUM5QyxDQUFBLEVBQUUsT0FBTyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDMUMsQ0FBQSxDQUFDLEFBRUQ7O0NDNUNPLFNBQVMsYUFBYSxFQUFFLFdBQVcsRUFBRTtBQUM1QyxDQUFBLEVBQUUsSUFBSSxRQUFRLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQzs7QUFFOUMsQ0FBQSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzVDLENBQUEsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDOztBQUU3QixDQUFBLEVBQUUsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQSxDQUFDLEFBRUQsQUFJQTs7Q0NiTyxTQUFTLGdCQUFnQixFQUFFLFdBQVcsRUFBRTtBQUMvQyxDQUFBLEVBQUUsSUFBSSxRQUFRLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQztBQUM5QyxDQUFBLEVBQUUsSUFBSSxVQUFVLENBQUM7O0FBRWpCLENBQUEsRUFBRSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ2xELENBQUEsRUFBRSxRQUFRLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN4RCxDQUFBLEVBQUUsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7QUFFM0IsQ0FBQSxFQUFFLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUEsQ0FBQyxBQUVELEFBSUE7O0NDZk8sU0FBUyxlQUFlLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRTtBQUNyRCxDQUFBLEVBQUUsSUFBSSxRQUFRLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQzs7QUFFOUMsQ0FBQSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ3BELENBQUEsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOztBQUUzQixDQUFBLEVBQUUsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQSxDQUFDLEFBRUQsQUFJQTs7Q0NaQSxTQUFTLG9CQUFvQixDQUFDLEtBQUssRUFBRTtBQUNyQyxDQUFBLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztBQUN6QyxDQUFBLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQzlDLENBQUEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0QsQ0FBQSxDQUFDOztBQUVELENBQUEsU0FBUyxhQUFhLENBQUMsS0FBSyxFQUFFO0FBQzlCLENBQUE7QUFDQSxDQUFBLEVBQUUsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQzVDLENBQUEsQ0FBQzs7QUFFRCxBQU9BLEFBQU8sQ0FBQSxTQUFTLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUU7QUFDM0QsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBLEVBQUUsSUFBSSxDQUFDLEdBQUcsZUFBZSxDQUFDO0FBQzFCLENBQUEsRUFBRSxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDckIsQ0FBQSxFQUFFLElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQzs7QUFFbkIsQ0FBQSxFQUFFLElBQUksU0FBUyxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7QUFDckMsQ0FBQSxJQUFJLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQ2hDLENBQUEsR0FBRzs7QUFFSCxDQUFBLEVBQUUsU0FBUyxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFFO0FBQ2hELENBQUEsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3RCLENBQUEsSUFBSSxPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixDQUFBLEdBQUcsQ0FBQyxDQUFDOztBQUVMLENBQUEsRUFBRSxPQUFPLEdBQUcsK0NBQStDLEdBQUcsU0FBUyxHQUFHLG9HQUFvRyxDQUFDOztBQUUvSyxDQUFBLEVBQUUsSUFBSSxZQUFZLEdBQUcsZ0ZBQWdGO0FBQ3JHLENBQUEsRUFBRSxJQUFJLGFBQWEsR0FBRyx3RUFBd0U7QUFDOUYsQ0FBQSxFQUFFLElBQUksU0FBUyxHQUFHLDJCQUEyQjtBQUM3QyxDQUFBLEVBQUUsSUFBSSxhQUFhLEdBQUcsa0JBQWtCOztBQUV4QyxDQUFBLEVBQUUsSUFBSSxTQUFTLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtBQUMxQyxDQUFBLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzFELENBQUEsTUFBTSxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRTtBQUNwRCxDQUFBO0FBQ0EsQ0FBQSxRQUFRLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEtBQUssS0FBSyxFQUFFO0FBQ3pELENBQUEsVUFBVSxPQUFPLElBQUksWUFBWTtBQUNqQyxDQUFBLG9CQUFvQixTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDakQsQ0FBQSxvQkFBb0IsYUFBYTtBQUNqQyxDQUFBLG9CQUFvQixTQUFTO0FBQzdCLENBQUEsb0JBQW9CLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNqRSxDQUFBLG9CQUFvQixJQUFJO0FBQ3hCLENBQUEsb0JBQW9CLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNqRSxDQUFBLG9CQUFvQixVQUFVLENBQUM7QUFDL0IsQ0FBQTtBQUNBLENBQUEsU0FBUyxNQUFNLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ3hFLENBQUEsVUFBVSxPQUFPLElBQUksWUFBWTtBQUNqQyxDQUFBLG9CQUFvQixTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDakQsQ0FBQSxvQkFBb0IsYUFBYTtBQUNqQyxDQUFBLG9CQUFvQixhQUFhO0FBQ2pDLENBQUEsb0JBQW9CLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNqRSxDQUFBLG9CQUFvQixJQUFJO0FBQ3hCLENBQUEsb0JBQW9CLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNqRSxDQUFBLG9CQUFvQixVQUFVLENBQUM7QUFDL0IsQ0FBQTtBQUNBLENBQUEsU0FBUyxNQUFNLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ3hFLENBQUEsVUFBVSxPQUFPLElBQUksWUFBWTtBQUNqQyxDQUFBLG9CQUFvQixTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDakQsQ0FBQSxvQkFBb0IsYUFBYTtBQUNqQyxDQUFBLG9CQUFvQixvQkFBb0IsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN2RixDQUFBLG9CQUFvQixNQUFNLENBQUM7QUFDM0IsQ0FBQTtBQUNBLENBQUEsT0FBTyxNQUFNLElBQUksU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3JFLENBQUEsVUFBVSxPQUFPLElBQUksWUFBWTtBQUNqQyxDQUFBLG9CQUFvQixTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7QUFDakQsQ0FBQSxvQkFBb0IsYUFBYTtBQUNqQyxDQUFBLG9CQUFvQixhQUFhLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDaEYsQ0FBQSxvQkFBb0IsTUFBTSxDQUFDO0FBQzNCLENBQUEsU0FBUyxNQUFNO0FBQ2YsQ0FBQSxVQUFVLE9BQU8sSUFBSSxZQUFZO0FBQ2pDLENBQUEsb0JBQW9CLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSztBQUNqRCxDQUFBLG9CQUFvQixhQUFhO0FBQ2pDLENBQUEsb0JBQW9CLFVBQVUsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztBQUNqRSxDQUFBLG9CQUFvQixNQUFNLENBQUM7QUFDM0IsQ0FBQSxTQUFTO0FBQ1QsQ0FBQSxPQUFPO0FBQ1AsQ0FBQSxLQUFLO0FBQ0wsQ0FBQSxJQUFJLE9BQU8sSUFBSSxRQUFRLENBQUM7O0FBRXhCLENBQUEsR0FBRyxNQUFNLElBQUksU0FBUyxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7QUFDbEQsQ0FBQTtBQUNBLENBQUEsSUFBSSxJQUFJLGVBQWUsR0FBRyxTQUFTLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLEVBQUU7QUFDeEUsQ0FBQSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEIsQ0FBQSxNQUFNLE9BQU8sVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzlCLENBQUEsS0FBSyxDQUFDLENBQUM7QUFDUCxDQUFBLElBQUksT0FBTyxJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUM7QUFDMUMsQ0FBQSxHQUFHOztBQUVILENBQUE7QUFDQSxDQUFBO0FBQ0EsQ0FBQTs7QUFFQSxDQUFBLEVBQUUsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQSxDQUFDLEFBRUQsQUFJQTs7Q0NwR08sU0FBUyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFO0FBQ3hFLENBQUEsRUFBRSxPQUFPLGtCQUFrQixDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztBQUNsRSxDQUFBLENBQUM7O0FBRUQsQUFBTyxDQUFBLFNBQVMsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRTtBQUMxRSxDQUFBLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3pELENBQUEsRUFBRSxJQUFJLEdBQUcsQ0FBQztBQUNWLENBQUEsRUFBRSxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDbEIsQ0FBQSxFQUFFLElBQUksV0FBVyxDQUFDO0FBQ2xCLENBQUEsRUFBRSxJQUFJLGFBQWEsR0FBRyxRQUFRLEdBQUcsUUFBUSxDQUFDO0FBQzFDLENBQUEsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUM7O0FBRWIsQ0FBQSxFQUFFLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxvQkFBb0IsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEtBQUssU0FBUyxFQUFFO0FBQ3BGLENBQUEsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDLENBQUM7O0FBRTVDLENBQUEsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDOztBQUVsQyxDQUFBLElBQUksSUFBSSxTQUFTLEVBQUUsWUFBWSxDQUFDO0FBQ2hDLENBQUEsSUFBSSxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFO0FBQ3BDLENBQUEsTUFBTSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDN0UsQ0FBQSxRQUFRLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDOUUsQ0FBQSxVQUFVLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtBQUNqSSxDQUFBLFlBQVksU0FBUyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3BFLENBQUEsV0FBVztBQUNYLENBQUEsVUFBVSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEtBQUssU0FBUyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEtBQUssSUFBSSxFQUFFO0FBQy9MLENBQUEsWUFBWSxZQUFZLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQztBQUN0RyxDQUFBLFdBQVc7QUFDWCxDQUFBLFNBQVM7QUFDVCxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUs7O0FBRUwsQ0FBQSxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3pDLENBQUEsSUFBSSxJQUFJLEVBQUUsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUU7QUFDckMsQ0FBQSxNQUFNLElBQUksRUFBRSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUI7QUFDbkQsQ0FBQSxNQUFNLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTztBQUM1QixDQUFBLE1BQU0sSUFBSSxFQUFFLFFBQVE7QUFDcEIsQ0FBQSxNQUFNLGFBQWEsRUFBRSxVQUFVLE9BQU8sRUFBRSxDQUFDLEVBQUU7QUFDM0MsQ0FBQSxRQUFRLElBQUksRUFBRSxLQUFLLFNBQVMsRUFBRTtBQUM5QixDQUFBLFVBQVUsU0FBUyxHQUFHLEVBQUUsQ0FBQyxTQUFTLENBQUM7QUFDbkMsQ0FBQSxVQUFVLFlBQVksR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDO0FBQ3pDLENBQUEsU0FBUztBQUNULENBQUEsUUFBUSxJQUFJLFNBQVMsS0FBSyxTQUFTLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtBQUMzRCxDQUFBLFVBQVUsSUFBSSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvRSxDQUFBO0FBQ0EsQ0FBQSxTQUFTO0FBQ1QsQ0FBQSxRQUFRLElBQUksWUFBWSxLQUFLLFNBQVMsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFO0FBQ2pFLENBQUEsVUFBVSxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUM7QUFDM0QsQ0FBQSxVQUFVLElBQUksUUFBUSxDQUFDOztBQUV2QixDQUFBLFVBQVUsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFO0FBQ25ELENBQUEsWUFBWSxRQUFRLEdBQUcsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ2xELENBQUEsV0FBVyxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRTtBQUMvRCxDQUFBLFlBQVksUUFBUSxHQUFHLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3JELENBQUEsV0FBVyxNQUFNLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLGlCQUFpQixFQUFFO0FBQ3BFLENBQUEsWUFBWSxRQUFRLEdBQUcsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekYsQ0FBQSxXQUFXLE1BQU07QUFDakIsQ0FBQSxZQUFZLFFBQVEsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsQ0FBQSxXQUFXOztBQUVYLENBQUEsVUFBVSxJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtBQUNyRCxDQUFBLFlBQVksWUFBWSxFQUFFLENBQUM7QUFDM0IsQ0FBQSxZQUFZLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtBQUMxQyxDQUFBLFlBQVksWUFBWSxFQUFFLFlBQVk7QUFDdEMsQ0FBQSxZQUFZLE1BQU0sRUFBRSxRQUFRLENBQUMsTUFBTTtBQUNuQyxDQUFBLFlBQVksSUFBSSxFQUFFLGFBQWE7QUFDL0IsQ0FBQSxXQUFXLENBQUMsQ0FBQzs7QUFFYixDQUFBLFVBQVUsV0FBVyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN0QyxDQUFBLFNBQVM7QUFDVCxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUssQ0FBQyxDQUFDOztBQUVQLENBQUEsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDOztBQUUxQyxDQUFBLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDOztBQUV0RSxDQUFBLElBQUksT0FBTyxHQUFHLENBQUM7QUFDZixDQUFBLEdBQUcsTUFBTSxJQUFJLEtBQUssQ0FBQyxTQUFTLEtBQUssb0JBQW9CLElBQUksS0FBSyxDQUFDLGVBQWUsS0FBSyxTQUFTLEVBQUU7QUFDOUYsQ0FBQSxJQUFJLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQztBQUN0QixDQUFBLElBQUksSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLFdBQVcsS0FBSyxTQUFTLEVBQUU7QUFDekQsQ0FBQSxNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7QUFDekUsQ0FBQSxRQUFRLE9BQU8sQ0FBQyxHQUFHLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUMzQyxDQUFBLFFBQVEsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDOztBQUUxQixDQUFBLFFBQVEsS0FBSyxDQUFDLGVBQWUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLEVBQUU7QUFDbEYsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBLFVBQVUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxD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QUFVLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzFILENBQUEsWUFBWSxJQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM5RCxDQUFBLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztBQUN6RSxDQUFBLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUN4QixDQUFBLFNBQVM7O0FBRVQsQ0FBQTtBQUNBLENBQUE7QUFDQSxDQUFBLE9BQU87QUFDUCxDQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNsQixDQUFBLEdBQUc7QUFDSCxDQUFBLENBQUMsQ0FBQyxDQUFDOztBQUVILEFBQU8sQ0FBQSxTQUFTLE1BQU0sRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFO0FBQzNDLENBQUEsRUFBRSxPQUFPLElBQUksTUFBTSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUN2QyxDQUFBLENBQUMsQUFFRDs7Ozs7Ozs7Ozs7Ozs7OyJ9