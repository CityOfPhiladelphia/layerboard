<script>
  // // TODO look into a cleaner way of importing from esri-leaflet

  export default {
    props: [
      'id',
      'layer',
    ],
    mounted() {
      const leafletElement = this.$leafletElement = this.retrieveLeafletElement();
      const map = this.$store.state.map.map;

      // REVIEW kind of hacky/not reactive?
      if (map) {
        console.log('WebMapLayer.vue mounted if(map)', leafletElement);
        leafletElement.addTo(map);
        console.log('added layer to map');
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
        return this.layer;
      },
      parentMounted(parent) {
        const map = parent.$leafletElement;
        this.$leafletElement.addTo(map);
      }
    }
  };
</script>
