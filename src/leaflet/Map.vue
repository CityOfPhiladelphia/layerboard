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

      map.on('click', this.clickHandler);
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
      flipCoordsArray(anArray) {
        var newArray = []
        for (var i in anArray) {
          newArray[i] = [anArray[i][1], anArray[i][0]]
        }
        return newArray
      },
      clickHandler(e) {
        const map = this.$leafletElement
        var clickBounds = L.latLngBounds(e.latlng, e.latlng);
        console.log('clickHandler in Map is starting, e:', e, 'clickBounds:', clickBounds);
        var intersectingFeatures = [];
        console.log('map._layers', map._layers);
        var geometry;
        for (var l in map._layers) {
          var overlay = map._layers[l];
          if (overlay._layers) {
            for (var f in overlay._layers) {
              var feature = overlay._layers[f];
              if (feature.feature) {
                geometry = feature.feature.geometry.type;
                var bounds;
                if (geometry === 'Polygon' || geometry === 'MultiPolygon') {
                  // console.log('polygon or multipolygon');
                  if (feature.contains(e.latlng)) {
                    var ids = []
                    for (var i = 0; i < intersectingFeatures.length; i++) {
                      ids[i] = intersectingFeatures[i].feature.id;
                    }
                    if (!ids.includes(feature.feature.id)) {
                      intersectingFeatures.push(feature);
                    }
                  }
                }
                else if (geometry === 'LineString') {
                  // console.log('Line');
                  bounds = feature.getBounds();
                  if (bounds && clickBounds.intersects(bounds)) {
                    var ids = []
                    for (var i = 0; i < intersectingFeatures.length; i++) {
                      ids[i] = intersectingFeatures[i].feature.id;
                    }
                    if (!ids.includes(feature.feature.id)) {
                      intersectingFeatures.push(feature);
                    }
                  }
                } else if (geometry === 'Point') {
                  // console.log('Point');
                  bounds = L.latLngBounds(feature._latlng, feature._latlng);
                  if (bounds && clickBounds.intersects(bounds)) {
                    intersectingFeatures.push(feature);
                  }
                }
              }
            }
          }
        }
        this.$store.commit('setPopupCoords', e.latlng);
        this.$store.commit('setIntersectingFeatures', []);
        this.$store.commit('setIntersectingFeatures', intersectingFeatures);
        // var html = "Found features: " + intersectingFeatures.length + "<br/>" + intersectingFeatures.map(function(o) {
        // var html = intersectingFeatures.map(function(o) {
        //   // console.log('o', o);
        //   return o.feature.popupHtml
        // }).join('<br/>');
        //
        // console.log('html', html);
        // if (html != '') {
        //   map.openPopup(html, e.latlng, {
        //     // offset: L.point(0, -24)
        //   });
        // }
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
