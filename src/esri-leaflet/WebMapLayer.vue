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
      console.log('THE LAYER:', this.$leafletElement);
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
        // console.log('WEBMAPLAYER.VUE changeOpacity is running', nextOpacity, this.$leafletElement);
        // if (this.$props.layerDefinition) {
        //   const _layers = this.$props.layer._layers
        //   for (let key of Object.keys(_layers)){
        //     console.log(_layers[key]);
        //     if (key === '205') {
        //       console.log('on', key)
        //       _layers[key].options.drawingInfo.transparency = nextOpacity
        //     }
        //   }
        //   console.log(_layers);
        // } else {
        if (this.$props.type != 'FL') {
          this.$leafletElement.setOpacity(nextOpacity);
        } else {
          this.$leafletElement.eachFeature(function(layer){
            layer.setStyle({
              opacity: nextOpacity
            })
          })
        }
      }
    }
  };
</script>
