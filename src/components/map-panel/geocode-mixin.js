export default {
  computed: {
    isGeocoding() {
      return this.$store.state.geocode.status === 'waiting';
    },
  },
  methods: {
    geocode(input) {
      // console.log('geocode', input);
      const self = this;
      const searchConfig = this.$config.geocoder.methods.search;
      const url = searchConfig.url(input);
      const params = searchConfig.params;

      // set status of geocode
      this.$store.commit('setGeocodeStatus', 'waiting');

      this.$http.get(url, { params }).then(this.didGeocode, response => {
        console.log('geocode error')
        self.$store.commit('setGeocodeData', null);
        self.$store.commit('setGeocodeStatus', 'error');
      });
    },
    didGeocode(response) {
      const data = response.body;
      // TODO handle multiple results

      if (!data.features || data.features.length < 1) {
        console.log('geocode got no features', data);
        return;
      }

      // TODO do some checking here
      const feature = data.features[0];
      this.$store.commit('setGeocodeData', feature);
      this.$store.commit('setGeocodeStatus', 'success');

      // send geocode result event to host
      this.$eventBus.$emit('geocodeResult', feature);

      // pan and center map
      // TODO ideally the map should fit its bounds to the combined extent
      // of markers/other content, reactively
      const map = this.$store.state.map.map;
      const [x, y] = feature.geometry.coordinates;
      map.setView([y, x]);
    }
  }
};
