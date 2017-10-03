<script>
  import L from 'leaflet';
  // TODO look into a cleaner way of importing from esri-leaflet
  const EsriTiledMapLayer = L.esri.tiledMapLayer;

  export default {
    props: [
      'name',
      'url',
      'minZoom',
      'maxZoom',
      'zIndex',
      'attribution'
    ],
    mounted() {
      const leafletElement = this.$leafletElement = this.createLeafletElement();
      const map = this.$store.state.map.map;

      // REVIEW kind of hacky/not reactive?
      if (map) {
        leafletElement.addTo(map);
        // console.log('map tiled layer', map);
        // this.$nextTick(() => {
        console.log('map', map);
        // map.attributionControl.removeAttribution('overwrite');
        map.attributionControl.removeAttribution('overwrite');
        map.attributionControl.removeAttribution('<span class="esri-attributions" style="line-height:14px; vertical-align: -3px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden; display:inline-block; max-width:1385px;"></span>');
        // })
      }
      // let mapPackage = {}
      // mapPackage[this.$props.name] = leafletElement;
      // // const name = this.$props.name
      // this.$store.commit('setBasemapLayers', mapPackage);
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
      createLeafletElement() {
        const props = Object.assign({}, this.$props);
        const mapLayer = new EsriTiledMapLayer(props);
        return mapLayer;

      },
      parentMounted(parent) {
        const map = parent.$leafletElement;
        this.$leafletElement.addTo(map);
        map.attributionControl.removeAttribution('overwrite');
        map.attributionControl.removeAttribution('<span class="esri-attributions" style="line-height:14px; vertical-align: -3px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden; display:inline-block; max-width:1385px;"></span>');
      }
    }
  };
</script>
