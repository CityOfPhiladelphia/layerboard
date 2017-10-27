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
          this.$leafletElement.on('click', this.clickHandler);
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
      this.layer.metadata(function(error, metadata){
        this.geometryType = metadata.geometryType
      }, this);
    },
    mounted() {
      console.log('THE LAYER:', this.$leafletElement, 'THE GEO TYPE:', this.geometryType);
      const map = this.$store.state.map.map;
      if (map) {
        this.$leafletElement.addTo(map);
      }
      // if (this.geometryType === 'esriGeometryPoint') {
      //   console.log('GEOMETRY TYPE IS POINT!');
      //   this.$leafletElement.on('click', clickHandler);
      // }
    },
    destroyed() {
      this.$leafletElement._map.removeLayer(this.$leafletElement);
    },
    render(h) {
      return;
    },
    methods: {
      // calculateGeometryType() {
      //   let geometry;
      //   const firstLayer = this.$leafletElement._layers[Object.keys(this.$leafletElement._layers)[0]];
      //   console.log('leafletElement._layers', this.$leafletElement._layers, Object.keys(this.$leafletElement._layers)[0], 'firstLayer', firstLayer);
      //   if (firstLayer.feature) {
      //     geometry = firstLayer.feature.geometry.type;
      //   } else {
      //     const firstLayerFirstLayer = firstLayer._layers[Object.keys(firstLayer._layers)[0]];
      //     geometry = firstLayerFirstLayer.feature.geometry.type;
      //   }
      //   console.log('geometry', geometry);
      //   // return geometry;
      // },
      // retrieveLeafletElement() {
      //   // let geometry;
      //   // const firstLayer = this.layer._layers[Object.keys(this.layer._layers)[0]];
      //   // console.log('leafletElement._layers', this.layer._layers, Object.keys(this.layer._layers)[0], 'firstLayer', firstLayer);
      //   // if (firstLayer.feature) {
      //   //   geometry = firstLayer.feature.geometry.type;
      //   // } else {
      //   //   const firstLayerFirstLayer = firstLayer._layers[Object.keys(firstLayer._layers)[0]];
      //   //   geometry = firstLayerFirstLayer.feature.geometry.type;
      //   // }
      //   // console.log('geometry', geometry);
      //   return this.layer;
      // },
      parentMounted(parent) {
        const map = parent.$leafletElement;
        this.$leafletElement.addTo(map);
        // this.$nextTick(() => {
        //   this.changeOpacity(100);
        // })
        // this.changeDot();
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
        console.log('clickHandler in WebMapLayer is starting, e:', e);
        var clickBounds = L.latLngBounds(e.latlng, e.latlng);
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
                console.log('clickHandler GEOMETRY:', geometry);
                var bounds;
                if (geometry === 'Polygon' || geometry === 'MultiPolygon') {
                  console.log('polygon or multipolygon');
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
                  console.log('Line');
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
                  console.log('Point');
                  bounds = L.latLngBounds(feature._latlng, feature._latlng);
                  if (bounds && clickBounds.intersects(bounds)) {
                    intersectingFeatures.push(feature);
                  }
                }
              }
            }
          }
        }
        var html = "Found features: " + intersectingFeatures.length + "<br/>" + intersectingFeatures.map(function(o) {
          console.log('o', o);
          // return 'test'
          return o.feature.id
        }).join('<br/>');

        map.openPopup(html, e.latlng, {
          offset: L.point(0, -24)
        });
      }
    }
  };
</script>
