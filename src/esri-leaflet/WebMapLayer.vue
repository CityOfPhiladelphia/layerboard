<script>
  export default {
    props: [
      'layer',
      'layerName',
      // minScale, maxScale, and drawingInfo are stored in layerDefinition
      'layerDefinition',
      'opacity',
      'type',
      // 'geometryType'
    ],
    data() {
      return {
        'geometryType': 6
      }
    },
    watch: {
      opacity(nextOpacity) {
        this.changeOpacity(nextOpacity);
      },
      geometryType(nextGeometryType) {
        console.log('WATCH GEO TYPE:', nextGeometryType);
        if (nextGeometryType === 'esriGeometryPoint') {
          console.log('GEOMETRY TYPE IS POINT!');
          if (this.$leafletElement.metadata) {
            this.$leafletElement.on('click', function(e) {
              L.DomEvent.stopPropagation(e);
            })
            this.$leafletElement.on('click', this.clickHandler);
          } else if (this.$leafletElement._layers[Object.keys(this.$leafletElement._layers)[0]].metadata) {
            console.log('watch leafletelement._layers');
            for (let layer of Object.keys(this.$leafletElement._layers)) {
              console.log('OBJECT KEYS', Object.keys(this.$leafletElement._layers[layer]._layers));
              for (let innerLayer of Object.keys(this.$leafletElement._layers[layer]._layers)) {
                this.$leafletElement._layers[layer]._layers[innerLayer].options.bubblingMouseEvents = false;
                console.log('!!!!THIS', this.$leafletElement._layers[layer]._layers[innerLayer]);
              }
              // this.$leafletElement.options.bubblingMouseEvents = false;
              // this.$leafletElement._layers[layer].options.bubblingMouseEvents = false;
              console.log('layer', layer, this.$leafletElement, 'this.$leafletElement._layers[layer]', this.$leafletElement._layers[layer]);
              this.$leafletElement._layers[layer].on('click', function(e) {
                L.DomEvent.stopPropagation(e);
              })
              this.$leafletElement._layers[layer].on('click', this.clickHandler);// {
                // console.log('e', e, 'this', this, 'layer', layer, 'this._layers', this._layers, 'this._layers[layer]', this._layers[layer]);
              //   this.clickHandler();
              // });
            }
          }
        }
      }
    },
    computed: {
      scale() {
        return this.$store.state.map.scale;
      },
    },
    created() {
      const leafletElement = this.$leafletElement = this.layer;
      if (this.layer.metadata) {
        this.layer.metadata(function(error, metadata) {
          console.log('metadata', metadata);
          this.geometryType = metadata.geometryType
        }, this);
      } else if (this.layer._layers[Object.keys(this.layer._layers)[0]].metadata){
        this.layer._layers[Object.keys(this.layer._layers)[0]].metadata(function(error, metadata) {
          console.log('metadata', metadata);
          this.geometryType = metadata.geometryType
        }, this);
      }
    },
    mounted() {
      console.log('THE LAYER:', this.$leafletElement, 'THE GEO TYPE:', this.geometryType);
      const map = this.$store.state.map.map;
      if (map) {
        this.$leafletElement.addTo(map);
      }
    },
    destroyed() {
      this.$leafletElement._map.removeLayer(this.$leafletElement);
    },
    render(h) {
      return;
    },
    methods: {
      parentMounted(parent) {
        const map = parent.$leafletElement;
        this.$leafletElement.addTo(map);
      },
      changeOpacity(nextOpacity) {
        // console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!webMapLayer changeOpacity is running, nextOpacity:', nextOpacity, 'LEAFLET ELEMENT:', this.$leafletElement);
        let element;
        // sometimes you have to dig into the leafletElement to get to the objects being shown
        // one way to know whether you have to do that is whether the leafletElement has a "legend" function
        if (!this.$leafletElement.legend) {
          element = this.$leafletElement._layers[Object.keys(this.$leafletElement._layers)[0]];
        } else {
          element = this.$leafletElement;
        }

        // if it is not a feature layer, you can change the opacity of the entire layer
        if (this.$props.type != 'FL') {
          element.setOpacity(nextOpacity);
        } else {
          element.eachFeature(function(layer){
            // console.log('LAYER', layer);
            if (layer._icon) {
              // console.log('LAYER icon', layer);
              const style = layer._icon.attributes.style.nodeValue;
              const styleSlice = style.slice(0, style.indexOf('; opacity'));
              const styleConcat = styleSlice.concat('; opacity:', nextOpacity, '; fill-opacity:', nextOpacity, ';');
              layer._icon.attributes.style.nodeValue = styleConcat;
            } else if (layer._path) {
              // console.log('LAYER path', layer);
              if (layer.options.fillOpacity === 0) {
                layer.setStyle({
                  opacity: nextOpacity,
                })
              } else if (layer.options.opacity === 0) {
                layer.setStyle({
                  fillOpacity: nextOpacity
                })
              } else {
                layer.setStyle({
                  opacity: nextOpacity,
                  fillOpacity: nextOpacity
                })
              }
            } // end of elseIf layer._path
          }) // end of eachFeature
        } // end of else - it is a FL
      }, // end of changeOpacity
      clickHandler(e) {
        const map = this.$store.state.map.map;
        console.log('clickHandler in WebMapLayer is starting, e:', e, 'e.layer._latlng', e.layer._latlng);
        var clickBounds = L.latLngBounds(e.layer._latlng, e.layer._latlng);
        var intersectingFeatures = [];
        console.log('map._layers', map._layers);
        var geometry;
        for (var l in map._layers) {
          var overlay = map._layers[l];
          if (overlay._layers) {
            for (var f in overlay._layers) {
              var feature = overlay._layers[f];
              if (feature.feature) {
                geometry = feature.feature.geometry.type;
                // console.log('clickHandler FEATURE:', feature, 'GEOMETRY:', geometry);
                var bounds;
                if (geometry === 'Polygon' || geometry === 'MultiPolygon') {
                  // console.log('polygon or multipolygon');
                  if (feature.contains(e.latlng)) {
                    var ids = []
                    for (var i = 0; i < intersectingFeatures.length; i++) {
                      ids[i] = intersectingFeatures[i].feature.id;
                    }
                    if (!ids.includes(feature.feature.id)) {
                      intersectingFeatures.push(feature);
                    }
                  }
                }
                else if (geometry === 'LineString') {
                  // console.log('Line');
                  bounds = feature.getBounds();
                  if (bounds && clickBounds.intersects(bounds)) {
                    var ids = []
                    for (var i = 0; i < intersectingFeatures.length; i++) {
                      ids[i] = intersectingFeatures[i].feature.id;
                    }
                    if (!ids.includes(feature.feature.id)) {
                      intersectingFeatures.push(feature);
                    }
                  }
                } else if (geometry === 'Point') {
                  bounds = L.latLngBounds(feature._latlng, feature._latlng);
                  // console.log('Point, bounds:', bounds, 'clickBounds:', clickBounds);
                  if (bounds && clickBounds.intersects(bounds)) {
                    // console.log('Winner - feature:', feature, 'bounds:', bounds, 'clickBounds:', clickBounds);
                    var ids = []
                    for (var i = 0; i < intersectingFeatures.length; i++) {
                      ids[i] = intersectingFeatures[i].feature.id;
                    }
                    if (!ids.includes(feature.feature.id)) {
                      intersectingFeatures.push(feature);
                    }
                  }
                }
              }
            }
          }
        }
        this.$store.commit('setPopupCoords', e.latlng);
        this.$store.commit('setIntersectingFeatures', []);
        this.$store.commit('setIntersectingFeatures', intersectingFeatures);
        // var html = "Found features: " + intersectingFeatures.length + "<br/>" + intersectingFeatures.map(function(o) {
        // var html = intersectingFeatures.map(function(o) {
        //   console.log('o', o);
        //   return o.feature.popupHtml;
        // }).join('<br/>');
        //
        // map.openPopup(html, e.latlng, {
        //   offset: L.point(0, -24)
        // });
      }
    }
  };
</script>
