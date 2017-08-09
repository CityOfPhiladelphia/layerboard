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
        leafletElement.addTo(map);
        // map.attributionControl.removeAttribution('overwrite');
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
      },
      changeOpacity(nextOpacity) {
        console.log('LEAFLET ELEMENT:', this.$leafletElement);
        if (this.$props.type != 'FL') {
          this.$leafletElement.setOpacity(nextOpacity);
        } else {
          this.$leafletElement.eachFeature(function(layer){
            console.log('LAYER', layer);
            if (layer._icon) {
              const style = layer._icon.attributes.style.nodeValue;
              const styleSlice = style.slice(0, style.indexOf('; opacity'));
              const styleConcat = styleSlice.concat('; opacity:', nextOpacity, '; fill-opacity:', nextOpacity, ';');
              layer._icon.attributes.style.nodeValue = styleConcat;
            } else if (layer._path) {
              layer.setStyle({
                fillOpacity: nextOpacity
              })
            }
          })
        }
      }
    }
  };
</script>
