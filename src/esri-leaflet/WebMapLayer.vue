<script>
  export default {
    props: [
      'layer',
      'layerName',
      // minScale, maxScale, and drawingInfo are stored in layerDefinition
      'layerDefinition',
      'opacity',
      'type'
    ],
    watch: {
      opacity(nextOpacity) {
        this.changeOpacity(nextOpacity);
      }
    },
    computed: {
      scale() {
        return this.$store.state.map.scale;
      },
    },
    mounted() {
      const leafletElement = this.$leafletElement = this.retrieveLeafletElement();
      // console.log('THE LAYER:', this.$leafletElement);
      const map = this.$store.state.map.map;
      if (map) {
        // console.log('$$$$$$$$$$$$$$$$$$$webmapLayer mounted if map is running')
        leafletElement.addTo(map);
        // this.$nextTick(() => {
        //   this.changeOpacity(1);
        // })
        // map.attributionControl.removeAttribution('overwrite');
        // this.changeDot();
      }
    },
    destroyed() {
      this.$leafletElement._map.removeLayer(this.$leafletElement);
    },
    render(h) {
      return;
    },
    methods: {
      retrieveLeafletElement() {
        return this.layer;
      },
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
      // changeDot() {
      //   console.log('changeDot is running - LEAFLET ELEMENT:', this.$leafletElement);
      //   let element;
      //   // sometimes you have to dig into the leafletElement to get to the objects being shown
      //   // one way to know whether you have to do that is whether the leafletElement has a "legend" function
      //   if (!this.$leafletElement.legend) {
      //     element = this.$leafletElement._layers[Object.keys(this.$leafletElement._layers)[0]];
      //   } else {
      //     element = this.$leafletElement;
      //   }
      //   console.log('changeDot set element', element);
      //   // if it is not a feature layer, you can change the opacity of the entire layer
      //   if (this.$props.type != 'FL') {
      //     console.log('changeDot not FL');
      //     // element.setOpacity(nextOpacity);
      //   } else {
      //     console.log('changeDot FL, element:', element);
      //     element.eachFeature(function(layer){
      //       console.log('changeDot layer', layer);
      //       if (layer._icon) {
      //         console.log('changeDot LAYER icon', layer);
      //         // const style = layer._icon.attributes.style.nodeValue;
      //         // const styleSlice = style.slice(0, style.indexOf('; opacity'));
      //         // const styleConcat = styleSlice.concat('; opacity:', nextOpacity, '; fill-opacity:', nextOpacity, ';');
      //         // layer._icon.attributes.style.nodeValue = styleConcat;
      //       } else if (layer._path) {
      //         console.log('changeDot LAYER path', layer);
      //         const newRadius = layer.options.radius + 10;
      //         // if (layer.options.fillOpacity === 0) {
      //           layer.setStyle({
      //             radius: newRadius,
      //           })
      //         // } else if (layer.options.opacity === 0) {
      //         //   layer.setStyle({
      //         //     fillOpacity: nextOpacity
      //         //   })
      //         // } else {
      //         //   layer.setStyle({
      //         //     opacity: nextOpacity,
      //         //     fillOpacity: nextOpacity
      //         //   })
      //         // }
      //       } // end of elseIf layer._path
      //     }) // end of eachFeature
      //   } // end of else - it is a FL
      // } // end of changeDot
    }
  };
</script>
