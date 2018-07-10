import axios from 'axios';

export default {
  computed: {
    isGeocoding() {
      return this.$store.state.geocode.status === 'waiting';
    },
  },
  methods: {
    geocode(input) {
      const self = this;
      const searchConfig = this.$config.geocoder.methods.search;
      const url = searchConfig.url(input);
      const params = searchConfig.params;
      console.log('geocode, input:', input, 'searchConfig:', searchConfig, 'url:', url, 'params:', params);

      // set status of geocode
      this.$store.commit('setGeocodeStatus', 'waiting');

      axios.get(url, { params }).then(this.didGeocode, response => {
        console.log('geocode error')
        self.$store.commit('setGeocodeData', null);
        self.$store.commit('setGeocodeStatus', 'error');
      });
    },
    didGeocode(response) {
      console.log('didGeocode is running, response:', response);
      const data = response.data;
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
