export default {
  // watch: {
  //   locationMarker(nextLocationMarker) {
  //     console.log('watch', nextLocationMarker);
  //     // alert('watch markers-mixin computed locationMarker changed:', nextLocationMarker.latlngArray);
  //     // this.$leafletElement._map.removeLayer(this.$leafletElement);
  //     // const leafletElement = this.$leafletElement = this.createLeafletElement();
  //     // const map = this.$store.state.map.map;
  //     // if (map) {
  //     //   leafletElement.addTo(map);
  //     // }
  //   }
  // },
  computed: {
    // returns map markers as simple object with a geometry property, key,
    // and optional properties for symbology
    markers() {
      const markers = [];

      // geocoded address marker
      const geocodeGeom = this.geocodeGeom;
      if (this.identifyFeature === 'address-marker' && geocodeGeom) {
        const latlng = [...geocodeGeom.coordinates].reverse();
        const key = this.geocodeResult.properties.street_address;
        const addressMarker = {latlng, key};
        markers.push(addressMarker);
      }

      return markers;
    },
    // returns all geojson features to be rendered on the map along with
    // necessary props.
    locationMarker() {
      const latlngArray = [this.$store.state.map.location.lat, this.$store.state.map.location.lng]
      const marker = {
        latlng: latlngArray,
        radius: 6,
        fillColor: '#ff3f3f',
        color: '#ff0000',
        weight: 1,
        opacity: 1,
        fillOpacity: 1.0
      }
      return marker;
    },
    leafletMarkers() {
      const markers = [];

      markers.push.apply(markers, this.markers);
      markers.push.apply(markers, this.geojsonFeatures);

      return markers;
    },
  },
  methods: {
    geofind() {
      console.log('geofind is running');
      this.geolocation.watchPosition(this.geofindSuccess, this.geofindError, {enableHighAccuracy: true, timeout: 1000, maximumAge: 0, distanceFilter: 5});
    },
    geofindSuccess(position) {
      // alert('geofindSuccess is running, position:', position);
      const payload = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }
      this.$store.commit('setLocation', payload);
      console.log('latitude', payload.lat, 'longitude', payload.lng);
    },
    geofindError() {
      console.log('GeofindError')
    }
  }
};
