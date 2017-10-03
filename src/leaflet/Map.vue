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

  export default {
    props: [
      'center',
      'zoom',
      'zoomControlPosition',
      'minZoom',
      'maxZoom',
    ],
    mounted() {
      const map = this.$leafletElement = this.createLeafletElement();

      // move zoom control
      map.zoomControl.setPosition(this.$props.zoomControlPosition);

      // put in state
      this.$store.commit('setMap', { map });

      map.setView(this.center,
                  this.zoom);

      this.$nextTick(() => {
        map.attributionControl.setPrefix('<a target="_blank" href="//www.phila.gov/it/aboutus/units/Pages/GISServicesGroup.aspx">City of Philadelphia | CityGeo</a>');
      })

      // signal children to mount
      for (let child of this.$children) {
        // REVIEW it seems weird to pass children their own props. trying to
        // remember why this was necessary... binding issue?
        child.parentMounted(this, child.$props);
      }


      // TODO warn if trying to bind an event that doesn't exist
      bindEvents(this, this.$leafletElement, this._events);
    },
    methods: {
      createLeafletElement() {
        const { zoomControlPosition, ...options } = this.$props;
        const theMap = new Map(this.$refs.map, options);
        return theMap;

      },
      childDidMount(child) {
        child.addTo(this.$leafletElement);
      },
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
