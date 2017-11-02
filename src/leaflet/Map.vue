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

      // map.on('click', this.clickHandler);
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

      // nearly the same function is in WebMapLayer.Vue
      // this one is used when the click is NOT on a point
      clickHandler(e) {
        const map = this.$leafletElement
        const clickBounds = L.latLngBounds(e.latlng, e.latlng);
        // console.log('clickHandler in Map is starting, e:', e, 'clickBounds:', clickBounds);
        // console.log('map._layers', map._layers);
        let intersectingFeatures = [];
        let geometry;
        for (let layer in map._layers) {
          var overlay = map._layers[layer];
          if (overlay._layers) {
            for (let oLayer in overlay._layers) {
              const feature = overlay._layers[oLayer];
              if (feature.feature) {
                geometry = feature.feature.geometry.type;
                let bounds;
                if (geometry === 'Polygon' || geometry === 'MultiPolygon') {
                  // console.log('polygon or multipolygon');
                  if (feature.contains(e.latlng)) {
                    this.checkForDuplicates(layer, feature, intersectingFeatures);
                  }
                }
                else if (geometry === 'LineString') {
                  // console.log('Line');
                  bounds = feature.getBounds();
                  if (bounds && clickBounds.intersects(bounds)) {
                    this.checkForDuplicates(layer, feature, intersectingFeatures);
                  }
                } else if (geometry === 'Point') {
                  // console.log('Point');
                  bounds = L.latLngBounds(feature._latlng, feature._latlng);
                  if (bounds && clickBounds.intersects(bounds)) {
                    this.checkForDuplicates(layer, feature, intersectingFeatures);
                  }
                }
              }
            }
          }
        }
        this.$store.commit('setPopupCoords', e.latlng);
        this.$store.commit('setIntersectingFeatures', intersectingFeatures);
      },
      checkForDuplicates(layer, feature, intersectingFeatures) {
        // console.log('checkForDuplicates is running');
        let ids = []
        for (let i = 0; i < intersectingFeatures.length; i++) {
          ids[i] = layer + '_' + intersectingFeatures[i].feature.id;
        }
        if (!ids.includes(layer + '_' + feature.feature.id)) {
          intersectingFeatures.push(feature);
        }
      }
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
