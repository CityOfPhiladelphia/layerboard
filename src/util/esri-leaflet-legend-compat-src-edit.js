// var layers = {}
var layerName;
var layerId;
var store;
// var symbolChange = false;

(function (factory) {
  //define an AMD module that relies on 'leaflet'
  if (typeof define === 'function' && define.amd) {
    define(['leaflet', 'esri-leaflet'], function (L, EsriLeaflet) {
      return factory(L, EsriLeaflet);
    });
  //define a common js module that relies on 'leaflet'
  } else if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(require('leaflet'), require('esri-leaflet'));
  }

  if(typeof window !== 'undefined' && window.L){
    factory(window.L, L.esri);
  }
}(function (L, EsriLeaflet) {

/**
 * @example
 * @param  {Array.<*>} values
 * @param  {*}         initial
 * @param  {Function}  fn       process item fn(memo, item, callback)
 * @param  {Function}  done     queue complete
 * @param  {*=}        context
 */

EsriLeaflet.Util.reduce = function(values, initial, fn, cb, context) {
  var curr = initial;
  console.log('4 running EsriLeaflet.Util.reduce, values is:', values, 'curr is:', curr);
  // var legend = initial.layers[0].legend;
  function next(index) {
    console.log('4 next is running, index:', index);
    var sync = true;
    // console.log('STARTING LOOP');
    // var labels = [];
    for (var i = index; i < values.length; i++) {
    //   console.log('INSIDE LOOP, i:', i);
      var done = false;
      fn(curr, values[i], function(err, val) {
        // labels.push(values[i].label);
        console.log('15 before err in reduce, curr is:', curr, 'values[i]:', values[i]);// 'labels', labels);
        if (err) {
          console.log('err occurred inside reduce:', err, 'val:', val);
          return cb.call(context, err, curr);
        }
        done = true;
        curr = val;
        if (!sync) {
          next(i + 1);
        }
      });
      sync = done;
      if (!sync) {
        return;
      }
    }
    cb.call(context, null, curr);
  }
  next(0);
};

EsriLeaflet.MapService.include({
  legend: function(callback, context) {
    console.log('MapService legend function is running');
    return new EsriLeaflet.Legend(this).run(callback, context);
  }
});

EsriLeaflet.FeatureLayerService.include({
  legend: function(callback, context) {
    console.log('6 FeatureLayerService legend function is running, callback is:', this, 'context is:', context);
    return new L.esri.Legend(this).run(callback, context, this);
  }
});

EsriLeaflet.Legend = EsriLeaflet.Task.extend({
  path: 'legend',
  params: {
    f: 'json'
  },
  run: function(callback, context) {
    console.log('Task extend run is running');
    if (this._service) {
      return this._service.request(this.path, this.params, callback, context);
    } else {
      return this._request('request', this.path, this.params, callback, context);
    }
  }
});

EsriLeaflet.legend = function(params) {
  // NEVER HAPPENS
  console.log('EsriLeaflet.legend function is running');
  return new EsriLeaflet.Legend(params);
};

EsriLeaflet.Legend.include({
  initialize: function(endpoint) {
    console.log('7 EsriLeaflet.Legend.include running initialize, endpoint is:', endpoint);
    this._renderer = new EsriLeaflet.Legend.SymbolRenderer();
    EsriLeaflet.Task.prototype.initialize.call(this, endpoint);
  },

  run: function(callback, context, test) {
    console.log('8 EsriLeaflet.Legend.include running run, callback is:', callback, 'context is:', context, 'test is:', test, 'this is:', this);
    function cb(error, response) {
      console.log('9-10 this:', this, 'response:', response);
      if (error && error.code === 400) { // ArcGIS server >=10.0
        console.log('error is ' + error);
        this._collectLegendFromLayers(callback, context);
      } else if (response && response.drawingInfo) {
        console.log('10 in run, response.drawingInfo:', response.drawingInfo, 'response:', response, 'this:', this);
        if (this.options.drawingInfo) {
          console.log('10.1 using orig drawing info');
          // symbolChange = true;
          this._symbolsToLegends([this.options], function(err, result) {
            callback.call(context, err, {
              layers: result
            });
          });
        } else {
          console.log('10.2 using new drawing info');
          this._symbolsToLegends([response], function(err, result) {
            callback.call(context, err, {
              layers: result
            });
          });
        }
      } else {
        console.log(error);
        console.log(response);
        callback.call(context, error, response);
      }
    }
    // if (this.options.drawingInfo) {
    //   console.log('after 8 this', this)
    //   // const response2 = { drawingInfo: this.options.drawingInfo}
    //   cb('test error', this);
    // } else
    if (this._service) {
      console.log('9 this._service exists', this);
      if (this.options.url.includes('MapServer')) {
        return this._service.request(this.path, this.params, cb, this);
      } else {
        return this._service.request('', this.params, cb, this);
      }
    } else {
      console.log('this._service does not exist');
      return this._request('request', this.path, this.params, cb, this);
    }
  },

  _collectLegendFromLayers: function(callback, context) {
    // NEVER HAPPENS
    console.log('running _collectLegendFromLayers');
    this._service.metadata(function(error, response) {
      if (error) {
        return callback.call(context, error);
      }
      var layers = [];
      for (var i = 0, len = response.layers.length; i < len; i++) {
        if (!response.layers[i].subLayerIds) {
          layers.push(response.layers[i]);
        }
      }
      this._getLayersLegends(layers, function(err, layerData) {
        if (err) {
          callback.call(context, err);
        } else {
          this._symbolsToLegends(layerData, function(err, result) {
            callback.call(context, err, {
              layers: result
            });
          });
        }
      }, this);
    }, this);
  },

  _getLayersLegends: function(layerDefs, callback, context) {
    // NEVER HAPPENS
    console.log('_getLayersLegends is running');
    var layerData = [];
    var self = this;
    EsriLeaflet.Util.reduce(layerDefs, [], function(curr, layer, cb) {
      self._getLayerLegend(layer, function(err, data) {
        if (err) {
          return cb(err, null);
        }
        cb(null, curr.concat(data));
      }, self);
    }, function(err, result) {
      callback.call(context, err, result);
    });
  },

  _getLayerLegend: function(layer, callback, context) {
    // NEVER HAPPENS
    console.log('_getLayerLegend is running');
    this._service.request(layer.id, {
      f: 'json'
    }, callback, context);
  },

  _symbolsToLegends: function(layerData, callback, context) {
    var self = this;
    console.log('pre-11 layerData:', layerData);
    EsriLeaflet.Util.reduce(layerData, [], function(curr, layer, cb) {
      console.log('11 running _symbolsToLegends, curr is:', curr, 'layer is:', layer, 'cb is:', cb, 'layer.drawingInfo is:', layer.drawingInfo);
      console.log('11.2 layer.drawingInfo.renderer.uniqueValueInfos:', layer.drawingInfo.renderer.uniqueValueInfos);
      if (layer.drawingInfo.renderer.uniqueValueInfos) {
        var newUniqueKeys = [];
        var newUnique = [];
        var valueInfos = layer.drawingInfo.renderer.uniqueValueInfos;
        for (var i = 0; i < valueInfos.length; i++) {
          if (!newUniqueKeys.includes(valueInfos[i].label)) {
            newUniqueKeys.push(valueInfos[i].label);
            newUnique.push(valueInfos[i]);
          }
        }
        console.log('11.3 newUnique:', newUnique);
        layer.drawingInfo.renderer.uniqueValueInfos = newUnique;
      }
      self._drawingInfoToLegend(layer.drawingInfo, function(err, legend) {
        console.log('after _drawingInfoToLegend');
        if (err) {
          return cb(err, null);
        }
        console.log('16 cb is about to run', layer);
        cb(null, curr.concat([{
          layerServiceItemId: layer.serviceItemId,
          layerId: layer.id,
          layerType: layer.type,
          layerName: layer.name,
          maxScale: layer.maxScale,
          minScale: layer.minScale,
          legend: legend
        }]));
      }, self);
    }, function(err, result) {
      callback.call(context, err, result);
    });
  },

  _getRendererSymbols: function(renderer) {
    console.log('13 _getRendererSymbols is running, renderer:', renderer);
    var symbols;
    if (renderer.type === 'uniqueValue') {
      symbols = renderer.uniqueValueInfos.slice();
    } else if (renderer.type === 'classBreaks') {
      symbols = renderer.classBreakInfos.slice();
    } else if (renderer.type === 'simple') {

      symbols = [{
        symbol: renderer.symbol,
        label: renderer.label,
        description: renderer.description,
        value: renderer.value
      }];
    }
    if (renderer.defaultSymbol) {
      symbols.push({
        symbol: renderer.defaultSymbol,
        label: renderer.defaultLabel,
        description: '',
        value: null
      });
    }
    return symbols;
  },

  _drawingInfoToLegend: function(drawingInfo, callback, context) {
    console.log('12 running _drawingInfoToLegend, drawingInfo:', drawingInfo);
    var self = this;
    EsriLeaflet.Util.reduce(
      this._getRendererSymbols(drawingInfo.renderer), [],
      function(curr, symbol, cb) {
        console.log('12 in callback function, curr:', curr, 'symbol:', symbol, 'cb:', cb);
        self._renderSymbol(symbol, function(err, image) {
          if (err) {
            return cb(err, curr);
          }
          cb(null, curr.concat([{
            label: symbol.label,
            height: image.height,
            url: symbol.symbol.url,
            imageData: image.imageData,
            contentType: image.contentType,
            width: image.width,
            values: [symbol.value || '']
          }]));
        }, self);
      },
      function(err, legend) {
        callback.call(context, err, legend);
      });
  },

  _renderSymbol: function(symbol, callback, context) {
    console.log('_renderSymbol is running, symbol:', symbol);
    return this._renderer.render(symbol.symbol, callback, context);
  }
});


EsriLeaflet.Legend.SymbolRenderer = L.Class.extend({
  statics: {
    SYMBOL_TYPES: {
      MARKER: 'esriSMS',
      LINE: 'esriSLS',
      FILL: 'esriSFS',
      PICTURE_MARKER: 'esriPMS',
      PICTURE_FILL: 'esriPFS',
      TEXT: 'esriTS'
    },
    DEFAULT_SIZE: 20
  },

  render: function(symbol, callback, context) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var imageData = symbol.imageData;
    console.log('14 EsriLeaflet.Legend.SymbolRenderer render is running, symbol:', symbol, 'context:', context, 'ctx:', ctx, 'imageData:', imageData);

    let newSymbol;
    // if (symbolChange === true) {
    newSymbol = Object.assign({}, symbol);
    console.log('14.1 - symbol size:', symbol.size)
    newSymbol.size = symbol.size + 4;
    console.log('14.2 - newSymbol size:', newSymbol.size)
    this._setSize(canvas, newSymbol);
    // } else {
    //   this._setSize(canvas, symbol);
    // }

    function done(error, imageData) {
      if (error) {
        callback.call(context, error);
      } else {
        console.log('14 imageData:', imageData);
        callback.call(context, null, {
          width: canvas.width || EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE,
          height: canvas.height || EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE,
          // width: 30,
          // height: 30,
          imageData: imageData.replace('data:image/png;base64,', ''),
          url: null,
          contentType: 'image/png'
        });
      }
    }

    if (symbol.imageData) {
      console.log('14 symbol.imageData:', symbol.imageData);
      return done(null, symbol.imageData);
    } else {
      console.log('14 - no symbol.imageData.  symbol:', symbol);
    }

    switch (symbol.type) {
      case 'esriSMS':
        console.log('14 after esriSMS, ctx:', ctx, 'symbol', symbol, 'newSymbol', newSymbol);
        // if (symbolChange === true) {
          this._renderMarker(ctx, newSymbol, done);
        // } else {
          // this._renderMarker(ctx, symbol, done);
        // }
        break;
      case 'esriSLS':
        console.log('14 after esriSLS, ctx:', ctx, 'symbol:', symbol, 'newSymbol', newSymbol);
        this._renderLine(ctx, symbol, done);
        break;
      case 'esriSFS':
        console.log('14 after esriSFS, ctx:', ctx, 'symbol', symbol, 'newSymbol', newSymbol);
        // this._renderLine(ctx, symbol, done);
        this._renderFill(ctx, symbol, done);
        break;
      case 'esriPMS':
        this._renderImageMarker(ctx, symbol, done);
        break;
      case 'esriPFS':
        this._renderImageFill(ctx, symbol, done);
        break;
      case 'esriST':
        this._renderText(ctx, symbol, done);
        break;
      default:
        break;
    }
  },

  _renderText: function(ctx, symbol, callback) {
    callback(null, ctx.canvas.toDataURL());
  },

  _renderFill: function(ctx, symbol, callback) {
    console.log('EsriLeaflet.Legend.SymbolRenderer _renderFill is running, EsriLeaflet:', EsriLeaflet, 'symbol:', symbol);
    // var size = EsriLeaflet.Tasks.Legend.SymbolRenderer.DEFAULT_SIZE;
    var size = EsriLeaflet.Legend.SymbolRenderer.DEFAULT_SIZE;
    var lineWidth = symbol.outline ? symbol.outline.width : 1;
    var lineOffset = Math.max(5, lineWidth * 3);
    switch (symbol.style) {

      case 'esriSFSVertical':
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSHorizontal':
        this._setRotation(ctx, 90);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSBackwardDiagonal':
        this._setRotation(ctx, -45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSForwardDiagonal':
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSCross':
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        this._setRotation(ctx, 90);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSDiagonalCross':
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        this._setRotation(ctx, 45);
        this._hatchCanvas(ctx, size, symbol.color, lineWidth, lineOffset);
        break;

      case 'esriSFSSolid':
        console.log('esriSFSSolid ctx:', ctx, 'symbol:', symbol, 'size:', size);
        ctx.fillStyle = this._formatColor(symbol.color);
        ctx.fillRect(0, 0, 10, 10);
        // ctx.fillRect(0, 0, size, size);
        // ctx.beginPath();
        // ctx.moveTo(75, 50);
        // ctx.lineTo(100, 75);
        // ctx.lineTo(100, 25);
        // ctx.fill();
        break;

      case 'esriSFSNull':
        break;

      default:
        throw new Error('Unknown SFS style: ' + symbol.style);
    }

    if (symbol.outline) {
      ctx.strokeStyle = this._formatColor(symbol.outline.color);
      ctx.lineWidth = symbol.outline.width;
      ctx.fillStyle = this._formatColor([0, 0, 0, 0]);
      this._setDashArray(ctx, symbol.outline);
      ctx.rect(symbol.outline.width, symbol.outline.width,
        size - symbol.outline.width, size - symbol.outline.width);
      ctx.stroke();
    }

    callback(null, ctx.canvas.toDataURL());
  },

  _renderLine: function(ctx, symbol, callback) {
    console.log('_renderLine is running');
    var size = EsriLeaflet.Legend.SymbolRenderer.DEFAULT_SIZE;
    ctx.beginPath();
    ctx.lineWidth = symbol.width;
    ctx.strokeStyle = this._formatColor(symbol.color);
    this._setDashArray(ctx, symbol); //

    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);

    ctx.closePath();
    ctx.stroke();
    callback(null, ctx.canvas.toDataURL());
  },

  _renderMarker: function(ctx, symbol, callback) {
    console.log('_renderMarker is running');
    var xoffset = 0;
    var yoffset = 0;
    var size = symbol.size;
    var r, rx, ry;

    ctx.beginPath();

    if (symbol.outline) {
      symbol.outline.width = 0.0001;
      console.log('IF SYMBOL.OUTLINE symbol', symbol);
      if (symbol.outline.color) {
        // console.log('has color');
        ctx.strokeStyle = this._formatColor(symbol.outline.color);
      // } else {
      //   console.log('has no color');
      //   // ctx.lineWidth = 0;
      }
      ctx.lineWidth = symbol.outline.width;
      // ctx.lineWidth = 0;
      console.log('STROKESTYLE', ctx.strokeStyle, 'LINEWIDTH', ctx.lineWidth);
      xoffset += symbol.outline.width;
      yoffset += symbol.outline.width;
    }

    this._setRotation(ctx, symbol.angle);

    switch (symbol.style) {
      case 'esriSMSCircle':
        console.log('IN esriSMSCircle symbol:', symbol)
        ctx.fillStyle = this._formatColor(symbol.color);
        r = (size - 2 * xoffset) / 2;
        ctx.arc(r + xoffset, r + xoffset, r, 0, 2 * Math.PI, false);
        ctx.fill();
        break;

      case 'esriSMSX':
        ctx.moveTo(xoffset, yoffset);
        ctx.lineTo(size - xoffset, size - yoffset);
        ctx.moveTo(size - xoffset, yoffset);
        ctx.lineTo(xoffset, size - yoffset);
        break;

      case 'esriSMSCross':
        ctx.moveTo(xoffset, size / 2);
        ctx.lineTo(size - xoffset, size / 2);
        ctx.moveTo(size / 2, yoffset);
        ctx.lineTo(size / 2, size - yoffset);
        break;

      case 'esriSMSDiamond':
        ctx.fillStyle = this._formatColor(symbol.color);
        rx = (size - 2 * xoffset) / 2;
        ry = (size - 2 * yoffset) / 2;

        ctx.moveTo(xoffset, yoffset + ry);
        ctx.lineTo(xoffset + rx, yoffset);
        ctx.lineTo(xoffset + rx * 2, yoffset + ry);
        ctx.lineTo(xoffset + rx, yoffset + 2 * ry);
        ctx.lineTo(xoffset, yoffset + ry);
        ctx.fill();
        break;

      case 'esriSMSSquare':
        ctx.rect(xoffset, yoffset, size - 2 * xoffset, size - 2 * yoffset);
        break;

      case 'esriSMSTriangle':
        ctx.fillStyle = this._formatColor(symbol.color);
        rx = (size - 2 * xoffset) / 2;
        ry = (size - 2 * yoffset) / 2;
        ctx.moveTo(xoffset, yoffset + ry * 2);
        ctx.lineTo(xoffset + rx, yoffset);
        ctx.lineTo(xoffset + rx * 2, yoffset + ry * 2);
        ctx.lineTo(xoffset, yoffset + ry * 2);
        ctx.fill();
        break;

      default:
        throw new Error('Unknown esriSMS style: ' + symbol.style);
    }

    ctx.closePath();
    if (symbol.outline) {
      ctx.stroke();
    }
    callback(null, ctx.canvas.toDataURL());
  },

  _renderImageFill: function(ctx, symbol, callback) {
    console.log('_renderImageFill is running');
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._fillImage(ctx, symbol.imageData, symbol, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        this._fillImage(ctx, null, symbol, symbol.contentType, image);
        callback(null, ctx.canvas.toDataURL());
      }, this);
    }
  },

  _renderImageMarker: function(ctx, symbol, callback) {
    console.log('_renderImageMarker is running');
    this._setRotation(ctx, symbol.angle);
    if (symbol.imageData) {
      this._drawImage(ctx, symbol.imageData, symbol.contentType);
      callback(null, ctx.toDataURL());
    } else {
      this._loadImage(symbol.url, function(err, image) {
        ctx.drawImage(image, 0, 0);
        callback(null, ctx.canvas.toDataURL());
      }, this);
    }
  },

  _setSize: function(ctx, symbol) {
    console.log('_setSize is running, ctx:', ctx, 'symbol:', symbol);
    if (symbol.size) {
      ctx.width = ctx.height = symbol.size + 4;
    } else if (symbol.type === 'esriSLS' ||
      symbol.type === 'esriSFS') {
      ctx.width = ctx.height = EsriLeaflet.Legend.SymbolRenderer.DEFAULT_SIZE;
    // } else if (symbolChange) {
    //   console.log('14 after - using symbolChange, symbol.size:', symbol.size);
    //   // symbol.size = 15;
    //   ctx.width = ctx.height = symbol.size + 3;
    } else {
      ctx.width = symbol.width + 4;
      ctx.height = symbol.height + 4;
    }
  },

  _setRotation: function(ctx, angle) {
    ctx.rotate(-parseFloat(angle) * Math.PI / 180);
  },

  _setDashArray: function(ctx, symbol) {
    var dashArray = this._formatDashArray(symbol);
    if (dashArray.length) {
      ctx.setLineDash(dashArray);
    }
  },

  _drawCross: function(ctx, xoffset, yoffset, size) {
    ctx.moveTo(xoffset, yoffset);
    ctx.lineTo(size - xoffset, size - yoffset);
    ctx.moveTo(size - xoffset, yoffset);
    ctx.lineTo(xoffset, size - yoffset);
  },

  _hatchCanvas: function(ctx, size, color, width, offset) {
    var w = size * 2;
    var h = size * 2;

    for (var i = -w; i < w; i += offset) {
      ctx.moveTo(i, -h);
      ctx.lineTo(i, h);
    }

    ctx.lineWidth = width;
    ctx.strokeStyle = this._formatColor(color);
    ctx.stroke();
  },

  _formatColor: function(color) {
    console.log('color:', color)
    let answer;
    if (color) {
      answer = 'rgba(' + color.slice(0, 3).join(',') + ',' + color[3] / 255 + ')';
    } else {
      answer = 'rgba(0, 0, 0, 0)';
    }
    // return 'rgba(' + color.slice(0, 3).join(',') + ',' + color[3] / 255 + ')';
    return answer;
  },

  _formatDashArray: function(symbol) {
    var dashValues = [];

    switch (symbol.style) {
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

    //use the dash values and the line weight to set dash array
    if (dashValues.length > 0) {
      for (var i = 0, len = dashValues.length; i < len; i++) {
        dashValues[i] *= symbol.width;
      }
    }

    return dashValues;
  },

  _getImageData: function(ctx, symbol) {
    console.log('_getImageData is running');
    return ctx.toDImageData(0, 0, symbol.width, symbol.height);
  },

  _fillImage: function(ctx, imageData, symbol, contentType, image) {
    console.log('_fillImage is running');
    var size = L.esri.Legend.DEFAULT_SIZE;
    var w = symbol.width || size;
    var h = symbol.height || size;
    if (imageData) {
      image = new Image();
      image.src = 'data:' + contentType + ';base64,' + imageData;
    }

    var pattern = ctx.createPattern(image, 'repeat');
    ctx.rect(0, 0, w, h);
    ctx.fillStyle = pattern;
    ctx.fill();

    if (symbol.outline) {
      ctx.strokeStyle = this._formatColor(symbol.outline.color);
      ctx.lineWidth = symbol.outline.width;
      ctx.fillStyle = this._formatColor([0, 0, 0, 0]);
      this._setDashArray(ctx, symbol.outline);
      ctx.rect(symbol.outline.width, symbol.outline.width,
        w - symbol.outline.width, h - symbol.outline.width);
      ctx.stroke();
    }
  },

  _drawImage: function(ctx, imageData, contentType) {
    console.log('_drawImage is running');
    var image = new Image();
    image.src = 'data:' + contentType + ';base64,' + imageData;
    ctx.drawImage(image, 0, 0);
  },

  _loadImage: function(url, callback, context) {
    console.log('_loadImage is running');
    var image = new Image();
    image.crossOrigin = '';
    image.onload = function() {
      callback.call(context, null, this);
    };
    image.onerror = function(e) {
      callback.call(context, {
        code: 500
      });
    };
    image.src = url + (url.indexOf('?') === -1 ? '?' : '&') +
      'nc=' + (new Date()).getTime();
  }

});

EsriLeaflet.DynamicMapLayer.include({
  legend: function(callback, context) {
    return this.service.legend(callback, context);
  }
});

EsriLeaflet.FeatureLayer.include({
  legend: function(callback, context) {
    return this.service.legend(callback, context);
  }
});

EsriLeaflet.LegendControl = L.Control.extend({
  options: {
    listTemplate: '<ul>{layers}</ul>',
    layerTemplate: '<li><ul>{legends}</ul></li>',
    // layerTemplate: '<li><strong>{layerName}</strong><ul>{legends}</ul></li>',
    listRowTemplate: '<li><img width="{width}" height="{height}" src="data:{contentType};base64,{imageData}"><span>{label}</span></li>',
    emptyLabel: '',
    // emptyLabel: '<all values>',
    container: null
  },

  initialize: function(layers, options) {
    console.log('2 running EsriLeaflet.LegendControl initialize, layers:', layers, 'options', options);
    // symbolChange = false;
    this._layers = L.Util.isArray(layers) ? layers : [layers];
    L.Control.prototype.initialize.call(this, options);

    if (this._layers.length) {
      // var initial = {
      //   layers: []
      // }
      console.log('3 running EsriLeaflet.LegendControl (former _load function), this is:', this, 'options is:', options);
      L.esri.Util.reduce( // goes to line ~33
          this._layers
        , {layers: []}
        , function(curr, layer, cb) {
            console.log('5 inside _load, curr is:', curr, 'layer is:', layer, 'options is', options);//, 'legend is', curr.layers[0].legend);
            let layer2;
            if (!layer.legend) {
              console.log('layer._layers', Object.keys(layer._layers))
              const _layersKeys = Object.keys(layer._layers);
              layer2 = layer._layers[_layersKeys[0]];
              console.log('layer2 is:', layer2);
            } else {
              layer2 = layer;
            }
            // if (layer.legend) {
              layer2.legend(function(err, legend) {
                console.log('layer.legend is running, legend:', legend);
                if (err) {
                  console.log('in layer.legend, err happened:', err, 'curr:', curr);
                  return cb(err, curr);
                }
                curr.layers = curr.layers.concat(legend.layers);
                console.log('17 curr.layers is:', curr.layers);
                cb(null, curr);
              });
            // }
        }
        , this._onLoad
        , this
      );
    }
  },

  _onLoad: function(error, legend) {
    console.log('LAST running EsriLeaflet.LegendControl _onLoad, legend is:', legend);
    var legendObject = {
      'layerName': layerName,
      'layerServiceItemId': layerId,
      'legend': legend
    }
    store.commit('setLegend', legendObject);
    // if (!error) {
    //   var layersHtml = '';
    //   for (var i = 0, len = legend.layers.length; i < len; i++) {
    //     var layer = legend.layers[i];
    //     var legendsHtml = '';
    //     for (var j = 0, jj = layer.legend.length; j < jj; j++) {
    //       var layerLegend = JSON.parse(JSON.stringify(layer.legend[j]));
    //       this._validateLegendLabel(layerLegend);
    //       legendsHtml += L.Util.template(this.options.listRowTemplate, layerLegend);
    //     }
    //     layersHtml += L.Util.template(this.options.layerTemplate, {
    //       layerName: layer.layerName,
    //       legends: legendsHtml
    //     });
    //   }
    //   var legendHtml = L.Util.template(this.options.listTemplate, {
    //     layers: layersHtml
    //   });
    //   var legendObject = {
    //     'layerName': layerName,
    //     'layerServiceItemId': layerId,
    //     'legendHtml': legendHtml
    //   }
    //   store.commit('setLegend', legendObject);
    // }
  },

  _validateLegendLabel: function(layerLegend) {
    if (!layerLegend.label && this.options.emptyLabel) {
      layerLegend.label = this.options.emptyLabel;
    }
    layerLegend.label = layerLegend.label.replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

});

EsriLeaflet.legendControl = function(layers, options) {
  console.log('1 running Esri.Leaflet.legendControl, options:', options);
  layerName = options.layerName;
  layerId = options.layerId;
  store = options.store;
  drawingInfo = options.drawingInfo;
  return new L.esri.LegendControl(layers, options);
};
  return EsriLeaflet;
}));
