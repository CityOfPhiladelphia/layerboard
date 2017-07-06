<script>
  // // TODO look into a cleaner way of importing from esri-leaflet

  export default {
    props: [
      'id',
      'layer',
      'layerDefinition'
    ],
    computed: {
      scale() {
        return this.$store.state.map.scale;
      }
    },
    mounted() {
      const leafletElement = this.$leafletElement = this.retrieveLeafletElement();
      const map = this.$store.state.map.map;

      // REVIEW kind of hacky/not reactive?
      if (map) {
        leafletElement.addTo(map);
        // map.attributionControl.removeAttribution('overwrite');
      }
    },
    destroyed() {
      this.$leafletElement._map.removeLayer(this.$leafletElement);
    },
    // we don't actually render anything, but need to define either a template
    // or a render function
    render(h) {
      return;
    },
    methods: {
      retrieveLeafletElement() {
        console.log('WebMapLayer.vue retrieveLeafletElement', this.id, this.layer);
        console.log(this.layer);
        return this.layer;
      },
      parentMounted(parent) {
        const map = parent.$leafletElement;
        this.$leafletElement.addTo(map);
      }
    }
  };
</script>
