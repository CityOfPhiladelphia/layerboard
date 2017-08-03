<script>
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
