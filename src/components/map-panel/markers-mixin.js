export default {
  computed: {
    // returns map markers as simple object with a geometry property, key,
    // and optional properties for symbology
    markers() {
      const markers = [];
      // geocoded address marker
      const geocodeGeom = this.geocodeGeom;
      if (geocodeGeom) {
        const latlng = [...geocodeGeom.coordinates].reverse();
        const key = this.geocodeResult.properties.street_address;
        const addressMarker = {latlng, key};
        markers.push(addressMarker);
      }
      return markers;
    },
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
    // leafletMarkers() {
    //   const markers = [];
    //   markers.push.apply(markers, this.markers);
    //   markers.push.apply(markers, this.geojsonFeatures);
    //   return markers;
    // },
  },
};
