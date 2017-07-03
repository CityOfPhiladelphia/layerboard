<template>
  <div class="map-container">
    <!-- the leaflet map -->
    <div class="map" ref="map" id="map" />
      <div>
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
  import { Map, LatLngBounds } from 'leaflet';
  import bindEvents from './util/bind-events';
  // const webmapId = '980cd5736a12448697429dccd0f30669'; // Default WebMap ID
  // const webmapId = 'f60e4fa0c01f408882a07ee50e8910b9'; // Default WebMap ID
  const EsriWebMap = L.esri.webMap;

  export default {
    props: [
      'center',
      'zoom',
      'zoomControlPosition',
      'minZoom',
      'maxZoom',
      // 'markers'
    ],
    // watch: {
    //   markers(next, prev) {
    //     // get markers
    //     // fit bounds
    //     // const leafletMarkers = this.getMarkers();
    //     // console.log('watch markers fired', leafletMarkers);
    //     this.refit();
    //   }
    // },
    mounted() {
      const map = this.$leafletElement = this.createLeafletElement();

      // move zoom control
      map.zoomControl.setPosition(this.$props.zoomControlPosition);

      // put in state
      // REVIEW do we want to do this? is it serializable?
      this.$store.commit('setMap', { map });

      map.setView(this.center,
                  this.zoom);

      // signal children to mount
      for (let child of this.$children) {
        // REVIEW it seems weird to pass children their own props. trying to
        // remember why this was necessary... binding issue?
        child.parentMounted(this, child.$props);
      }

      // bind events
      // http://leafletjs.com/reference.html#map-click

      // const MAP_EVENTS = [
      //   'click',
      //   'dblclick',
      //   'mousedown',
      //   'mouseup',
      //   'mouseover',
      //   'mouseout',
      //   'mousemove',
      //   'contextmenu',
      //   'focus',
      //   'blur',
      //   'preclick',
      //   'load',
      //   'unload',
      //   'viewreset',
      //   'movestart',
      //   'move',
      //   'moveend',
      //   'dragstart',
      //   'drag',
      //   'dragend',
      //   'zoomstart',
      //   'zoomend',
      //   'zoomlevelschange',
      //   'resize',
      //   'autopanstart',
      //   'layeradd',
      //   'layerremove',
      //   'baselayerchange',
      //   'overlayadd',
      //   'overlayremove',
      //   'locationfound',
      //   'locationerror',
      //   'popupopen',
      //   'popupclose'
      // ];

      // TODO warn if trying to bind an event that doesn't exist
      bindEvents(this, this.$leafletElement, this._events);
    },
    // updated(next, prev) {
    //   const markers = this.getMarkers();
    //   if (markers.length === 0) return;
    //   const latlngs = markers.map(marker => marker.getLatLng());
    //   console.log('updated', markers);
    //   const latLngBounds = new LatLngBounds(latlngs);
    //   console.log('llb', latLngBounds);
    //   this.$leafletElement.fitBounds(latLngBounds);
    // },
    methods: {
      createLeafletElement() {
        const { zoomControlPosition, ...options } = this.$props;
        const theMap = new Map(this.$refs.map, options);
        return theMap;

      },
      childDidMount(child) {
        child.addTo(this.$leafletElement);
      },
      // getMarkers() {
      //   const children = this.$children;
      //   const MARKER_CLASSES = [
      //     '<Geojson>',
      //     '<VectorMarker>',
      //   ];
      //   const markers = children.filter(child => {
      //     const name = child._name;
      //     return MARKER_CLASSES.includes(name);
      //   });
      //   return markers.map(marker => marker.$leafletElement);
      // },
      // refit() {
      //   const markers = this.getMarkers();
      //   if (markers.length === 0) return;
      //   const latlngs = markers.map(marker => marker.getLatLng());
      //   console.log('updated', markers);
      //   const latLngBounds = new LatLngBounds(latlngs);
      //   console.log('llb', latLngBounds);
      //   this.$leafletElement.fitBounds(latLngBounds);
      // }
    }
  };
</script>

<style>
  .map-container {
    height: 100%;
  }
  .map {
    height: 100%;
  }
</style>
