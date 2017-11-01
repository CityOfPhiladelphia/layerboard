<template>
  <div id="map-panel"
       class="medium-12 large-16 columns mb-panel mb-panel-map"
  >
  <!-- class="large-18 columns mb-panel mb-panel-map" -->
    <map_ :center="this.$store.state.map.center"
          :zoom="this.$store.state.map.zoom"
          @l-moveend="handleMapMove"
          zoom-control-position="bottomright"
          :min-zoom="this.$config.map.minZoom"
          :max-zoom="22"
    >
    <!-- :class="{ 'mb-map-with-widget': this.$store.state.cyclomedia.active || this.$store.state.pictometry.active }" -->
    <!-- @l-click="handleMapClick" -->

    <!-- <polygon_ -->
    <polygon_ v-if="this.selectedPopupLayerGeometryType === 'Polygon'"
              :color="'#00ffff'"
              :fill="false"
              :weight="5"
              :latlngs="this.selectedPopupLayerCoordinatesFlipped"
              :pane="'highlightOverlay'"
    />
    <polyline_ v-if="this.selectedPopupLayerGeometryType === 'LineString'"
              :color="'#00ffff'"
              :weight="4"
              :latlngs="this.selectedPopupLayerCoordinatesFlipped"
              :pane="'highlightOverlay'"
    />
    <circle-marker v-if="this.selectedPopupLayerGeometryType === 'Point'"
                   :latlng="this.selectedPopupLayerCoordinatesFlipped"
                   :radius="7"
                   :fillColor="'#00ffff'"
                   :color="'#00ffff'"
                   :weight="this.locationMarker.weight"
                   :opacity="this.locationMarker.opacity"
                   :fillOpacity="this.locationMarker.fillOpacity"
                   :pane="'highlightOverlay'"
    />

      <!-- webmap -->
      <esri-web-map>
        <esri-web-map-layer v-for="(layer, key) in this.$store.state.map.webMapLayersAndRest"
                            v-if="shouldShowFeatureLayer(layer)"
                            :key="key"
                            :layer="layer.layer"
                            :layerName="layer.title"
                            :layerDefinition="layer.rest.layerDefinition"
                            :opacity="layer.opacity"
                            :type="layer.type2"
        />
      </esri-web-map>
      <pop-up v-if="this.shouldShowPopup">
        <pop-up-content />
      </pop-up>


      <!-- basemaps -->
      <esri-tiled-map-layer v-for="(basemap, key) in this.$config.map.basemaps"
                         v-if="activeBasemap === key"
                         :key="key"
                         :name="key"
                         :url="basemap.url"
                         :max-zoom="basemap.maxZoom"
                         :zIndex="basemap.zIndex"
                         :attribution="basemap.attribution"
      />

      <!-- basemap labels and parcels outlines -->
      <esri-tiled-map-layer v-for="(tiledLayer, key) in this.$config.map.tiledLayers"
                         v-if="activeTiles.includes(key)"
                         :key="key"
                         :name="key"
                         :url="tiledLayer.url"
                         :zIndex="tiledLayer.zIndex"
                         :attribution="tiledLayer.attribution"
      />

      <vector-marker v-for="(marker, index) in markers"
                    :latlng="marker.latlng"
                    :key="marker.key"
      />

      <!-- marker using a png and ablility to rotate it -->
      <png-marker v-if="this.cyclomediaActive"
                    :icon="'../../src/assets/camera.png'"
                    :orientation="this.$store.state.cyclomedia.viewer.props.orientation"
      />

      <!-- marker using custom code extending icons - https://github.com/iatkin/leaflet-svgicon -->
      <svg-marker v-if="this.cyclomediaActive"
                    :orientation="this.$store.state.cyclomedia.viewer.props.orientation"
      />


      <control-corner :vSide="'top'"
                      :hSide="'almostright'"
      >
      </control-corner>

      <div v-once>
        <basemap-toggle-control v-if="shouldShowImageryToggle"
                                v-once
                                :position="'topright'"
        />
      </div>

      <div v-once>
        <basemap-select-control
                       :position="'topalmostright'"
        />
      </div>

      <div v-once>
        <location-control v-once
                          v-if="this.geolocationEnabled"
                          :position="'bottomright'"
        />
      </div>

      <!-- search control -->
      <!-- custom components seem to have to be wrapped like this to work
           with v-once
      -->
      <div v-once>
        <control position="topleft">
          <div class="mb-search-control-container">
            <form @submit.prevent="handleSearchFormSubmit">
                <input class="mb-search-control-input"
                       placeholder="Search the map"
                       :value="this.$config.defaultAddress"
                />
                <button class="mb-search-control-button">
                  <i class="fa fa-search fa-lg"></i>
                </button>
            </form>
          </div>
        </control>
      </div>

      <!-- location marker -->
      <circle-marker v-if="this.$store.state.map.location.lat != null"
                     :latlng="this.locationMarker.latlng"
                     :radius="this.locationMarker.radius"
                     :fillColor="this.locationMarker.fillColor"
                     :color="this.locationMarker.color"
                     :weight="this.locationMarker.weight"
                     :opacity="this.locationMarker.opacity"
                     :fillOpacity="this.locationMarker.fillOpacity"
                     :key="Math.random()"
      />

    </map_>
  </div>
</template>

<script>
  // mixins
  import markersMixin from './markers-mixin';
  import geocodeMixin from './geocode-mixin';
  import cyclomediaMixin from '../../cyclomedia/map-panel-mixin';
  import pictometryMixin from '../../pictometry/map-panel-mixin';

  // vue doesn't like it when you import this as Map (reserved-ish word)
  import Map_ from '../../leaflet/Map';
  import Control from '../../leaflet/Control';
  import EsriWebMap from '../../esri-leaflet/WebMap';
  import EsriWebMapLayer from '../../esri-leaflet/WebMapLayer';
  import EsriTiledMapLayer from '../../esri-leaflet/TiledMapLayer';
  import EsriFeatureLayer from '../../esri-leaflet/FeatureLayer';
  // import Geojson from '../../leaflet/Geojson';
  import CircleMarker from '../../leaflet/CircleMarker';
  import VectorMarker from '../VectorMarker';
  import PngMarker from '../PngMarker';
  import SvgMarker from '../SvgMarker';
  // import SvgShape from '../SvgShape';
  import BasemapToggleControl from '../BasemapToggleControl.vue';
  import BasemapSelectControl from '../BasemapSelectControl.vue';
  import LocationControl from '../LocationControl.vue';
  import CyclomediaButton from '../../cyclomedia/Button';
  import PictometryButton from '../../pictometry/Button';
  import CyclomediaRecordingCircle from '../../cyclomedia/RecordingCircle';
  import CyclomediaRecordingsClient from '../../cyclomedia/recordings-client';
  // import LegendControl from '../../esri-leaflet/Legend.vue';
  import ControlCorner from '../../leaflet/ControlCorner.vue';
  import PopUp from '../../leaflet/PopUp.vue';
  import PopUpContent from '../../leaflet/PopUpContent.vue';
  import Polygon_ from '../../leaflet/Polygon.vue';
  import Polyline_ from '../../leaflet/Polyline.vue';

  export default {
    mixins: [
      markersMixin,
      geocodeMixin,
      cyclomediaMixin,
      pictometryMixin,
    ],
    components: {
      Map_,
      Control,
      EsriWebMap,
      EsriWebMapLayer,
      EsriTiledMapLayer,
      EsriFeatureLayer,
      // Geojson,
      CircleMarker,
      VectorMarker,
      PngMarker,
      SvgMarker,
      // SvgShape,
      BasemapToggleControl,
      BasemapSelectControl,
      LocationControl,
      PictometryButton,
      CyclomediaButton,
      CyclomediaRecordingCircle,
      // LegendControl,
      ControlCorner,
      PopUp,
      PopUpContent,
      Polygon_,
      Polyline_,
    },
    computed: {
      shouldShowPopup() {
        if (this.intersectingFeatures.length > 0) {
          return true;
        } else {
          return false;
        }
      },
      selectedPopupLayer() {
        return this.$store.state.map.selectedPopupLayer;
      },
      selectedPopupLayerGeometryType() {
        if (this.selectedPopupLayer) {
          return this.selectedPopupLayer.feature.geometry.type;
        } else {
          return null;
      }
      },
      selectedPopupLayerCoordinates() {
        if (this.selectedPopupLayerGeometryType === "Point" || this.selectedPopupLayerGeometryType === "LineString") {
          return this.selectedPopupLayer.feature.geometry.coordinates;
        } else {
          return this.selectedPopupLayer.feature.geometry.coordinates[0];
        }
      },
      selectedPopupLayerCoordinatesFlipped() {
        // console.log('coords:', this.flipCoordsArray(this.selectedPopupLayerCoordinates));
        if (this.selectedPopupLayerGeometryType === "Point") {
          return this.flipCoords(this.selectedPopupLayerCoordinates);
        } else {
          console.log('calling FlipCoordsArray on:', this.selectedPopupLayerCoordinates);
          return this.flipCoordsArray(this.selectedPopupLayerCoordinates);
        }
      },
      intersectingFeatures() {
        return this.$store.state.map.intersectingFeatures;
      },
      geolocationEnabled() {
        return this.$config.geolocation.enabled;
      },
      scale() {
        return this.$store.state.map.scale;
      },
      webMapActiveLayers() {
        return this.$store.state.map.webMapActiveLayers;
      },
      activeBasemap() {
        const shouldShowImagery = this.$store.state.map.shouldShowImagery;
        if (shouldShowImagery) {
          return this.$store.state.map.imagery;
        }
        const defaultBasemap = this.$config.map.defaultBasemap;
        const basemap = this.$store.state.map.basemap || defaultBasemap;
        return basemap;
      },
      activeTiles() {
        if (this.$config.map.basemaps[this.activeBasemap]) {
          return this.$config.map.basemaps[this.activeBasemap].tiledLayers;
        } else {
          return [];
        }
      },
      basemaps() {
        return Object.values(this.$config.map.basemaps);
      },
      shouldShowImageryToggle() {
        return this.hasImageryBasemaps && this.$config.map.imagery.enabled;
      },
      imageryBasemaps() {
        return this.basemaps.filter(basemap => basemap.type === 'imagery');
      },
      hasImageryBasemaps() {
        return this.imageryBasemaps.length > 0;
      },
      imageryYears() {
        // pluck year from basemap objects
        return this.imageryBasemaps.map(x => x.year);
      },
      historicBasemaps() {
        return this.basemaps.filter(basemap => basemap.type === 'historic');
      },
      hasHistoricBasemaps() {
        return this.historicBasemaps.length > 0;
      },
      historicYears() {
        return this.historicBasemaps.map(x => x.year);
      },
      geocodeResult() {
        return this.$store.state.geocode.data;
      },
      geocodeGeom() {
        return (this.geocodeResult || {}).geometry;;
      },
      picOrCycloActive() {
        if (this.cyclomediaActive || this.pictometryActive) {
          return true;
        } else {
          return false;
        }
      },
    },
    created() {
      // if there's a default address, navigate to it
      const defaultAddress = this.$config.defaultAddress;
      if (defaultAddress) {
        this.geocode(defaultAddress);
      }

      const cyclomediaConfig = this.$config.cyclomedia || {};
      if (cyclomediaConfig.enabled) {
      // create cyclomedia recordings client
        this.$cyclomediaRecordingsClient = new CyclomediaRecordingsClient(
          this.$config.cyclomedia.recordingsUrl,
          this.$config.cyclomedia.username,
          this.$config.cyclomedia.password,
          4326
        );
      }

      console.log('MAPPANEL CREATED', this, 'push at 12:32');
    },
    watch: {
      picOrCycloActive(value) {
        this.$nextTick(() => {
          this.$store.state.map.map.invalidateSize();
        })
      }
    },
    methods: {
      flipCoords(coords) {
        console.log('flipCoords is running on:', coords);
        return [coords[1], coords[0]];
      },
      flipCoordsArray(anArray) {
        console.log('flipCoordsArray is running on:', anArray);
        var newArray = []
        for (var i in anArray) {
          newArray[i] = [anArray[i][1], anArray[i][0]]
        }
        return newArray
      },
      shouldShowFeatureLayer(layer) {
        if (layer.rest.layerDefinition) {
          if (layer.rest.layerDefinition.minScale) {
            // console.log('minZoom for', layer.title, 'is', layer.rest.layerDefinition.minScale, typeof layer.rest.layerDefinition.minScale, 'and current scale is', this.scale, typeof this.scale);
            if (this.scale <= layer.rest.layerDefinition.minScale && this.webMapActiveLayers.includes(layer.title)) {
              // console.log('checkLayer used layerDefinition and is returning true for', layer.title);
              return true;
            }
          } else if (layer.rest.layerDefinition.drawingInfo && this.webMapActiveLayers.includes(layer.title)) {
            return true;
          }
        } else if (this.webMapActiveLayers.includes(layer.title)) {
          // console.log('checkLayer is returning true for', layer.title);
          return true;
        } else {
          return false;
        }
      },
      // calculateLayerGeometryType(layer) {
      //   layer.metadata(function(error, metadata){
      //     return metadata;
      //   });
      // //   console.log('calculateLayerGeometryType layer', layer.layer._layers)
      // //   const firstLayer = layer.layer._layers[Object.keys(layer.layer._layers)[0]];
      // //   console.log(Object.keys(layer.layer._layers)[0], 'firstLayer', firstLayer);
      // //   if (firstLayer.feature) {
      // //     geometry = firstLayer.feature.geometry.type;
      // //   } else {
      // //     const firstLayerFirstLayer = firstLayer._layers[Object.keys(firstLayer._layers)[0]];
      // //     geometry = firstLayerFirstLayer.feature.geometry.type;
      // //   }
      // //   return geometry;
      // },
      // handleMapClick(e) {
      // },
      handleMapMove(e) {
        const map = this.$store.state.map.map;

        const center = map.getCenter();
        this.$store.commit('setMapCenter', center);
        const zoom = map.getZoom();
        this.$store.commit('setMapZoom', zoom);
        const scale = this.$config.map.scales[zoom];
        this.$store.commit('setMapScale', scale);

        const cyclomediaConfig = this.$config.cyclomedia || {};
        if (cyclomediaConfig.enabled) {
          // update cyclo recordings
          this.updateCyclomediaRecordings();
        }
      },
      handleSearchFormSubmit(e) {
        // this.$controller.handleSearchFormSubmit(e);
        const input = e.target[0].value;
        // this.$store.commit('setLastSearchMethod', 'geocode');
        this.geocode(input);
      }
    }, // end of methods
  }; //end of export
</script>

<style scoped>
  .mb-panel-map {
    /*this allows the loading mask to fill the div*/
    position: relative;
  }

  /*@media (max-width: 1024px) {
    .mb-panel-map {
      height: 600px;
    }
  }*/

  .mb-search-control-container {
    height: 48px;
    border-radius: 2px;
    /*box-shadow:0 2px 4px rgba(0,0,0,0.2),0 -1px 0px rgba(0,0,0,0.02);*/
  }

  .mb-search-control-button {
    width: 50px;
    background: #ccc;
    line-height: 48px;
  }

  .mb-search-control-input {
    background-color: white;
    border: 0;
    height: 48px !important;
    line-height: 48px;
    padding: 10px;
    padding-left: 15px;
    padding-right: 15px;
    font-family: 'Montserrat', 'Tahoma', sans-serif;
    font-size: 16px;
    width: 350px;
  }

  .mb-map-with-widget {
    height: 50%;
  }

  .widget-slot {
    display: inline-block;
    float: left;
  }

  .mb-map-loading-mask {
    /*display: inline;*/
    position: absolute;
    top: 0;
    height: 100%;
    width: 100%;
    background: rgba(0, 0 ,0 , 0.25);
    z-index: 1000;
    text-align: center;
    vertical-align: middle;
  }

  .mb-map-loading-mask-inner {
    position: absolute;
    top: 40%;
    left: 40%;
  }

  @media screen and (max-width: 950px) {
    .mb-search-control-input {
      width: 250px;
    }
  }

  @media screen and (max-width: 350px) {
    .mb-search-control-input {
      width: 200px;
    }
  }
</style>
