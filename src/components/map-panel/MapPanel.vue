<template>
  <div id="map-panel-container"
       :class="mapPanelContainerClass"
  >
    <full-screen-map-toggle-tab v-once />
    <map_ id="map-tag"
          :center="this.$store.state.map.center"
          :zoom="this.$store.state.map.zoom"
          @l-click="handleMapClick"
          @l-moveend="handleMapMove"
          zoom-control-position="bottomright"
          :min-zoom="this.$config.map.minZoom"
          :max-zoom="22"
    >
    <!-- :class="{ 'mb-map-with-widget': this.$store.state.cyclomedia.active || this.$store.state.pictometry.active }" -->
    <!-- @l-click="handleMapClick" -->

    <!-- <polygon_ -->
    <polygon_ v-if="this.selectedPopupLayerGeometryType === 'Polygon' || this.selectedPopupLayerGeometryType === 'MultiPolygon'"
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
                  :latlng="cycloLatlng"
                  :rotationAngle="cycloRotationAngle"
      />

      <!-- marker using custom code extending icons - https://github.com/iatkin/leaflet-svgicon -->
      <svg-view-cone-marker v-if="this.cyclomediaActive"
                            :latlng="cycloLatlng"
                            :rotationAngle="cycloRotationAngle"
                            :hFov="cycloHFov"
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
        <pictometry-button v-if="this.$config.pictometry.enabled"
                           v-once
                           :position="'topright'"
                           :link="'pictometry'"
                           :imgSrc="'../../src/assets/pictometry.png'"
                           @click="handleButtonClick"
        />
      </div>

      <div v-once>
        <cyclomedia-button v-if="this.$config.cyclomedia.enabled"
                           v-once
                           :position="'topright'"
                           :link="'cyclomedia'"
                           :imgSrc="'../../src/assets/cyclomedia.png'"
                           @click="handleButtonClick"
        />
      </div>

      <div v-once>
        <measure-control :position="'bottomleft'" />
      </div>

      <div v-once>
        <location-control v-once
                          v-if="this.geolocationEnabled"
                          :position="'bottomright'"
                          @click="handleButtonClick"
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
                       id="addressSearch"
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
                     :pane="'highlightOverlay'"
      />
      <!-- :key="Math.random()" -->

      <cyclomedia-recording-circle v-for="recording in cyclomediaRecordings"
                                   v-if="cyclomediaActive"
                                   :key="recording.imageId"
                                   :imageId="recording.imageId"
                                   :latlng="[recording.lat, recording.lng]"
                                   :size="1.2"
                                   :color="'#3388ff'"
                                   :weight="1"
                                   @l-click="handleCyclomediaRecordingClick"
      />
    </map_>
    <modal-about></modal-about>
    <slot class='widget-slot' name="cycloWidget" />
    <slot class='widget-slot' name="pictWidget" />
  </div>
</template>

<script>
  import * as L from 'leaflet';
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
  // import SvgShape from '../SvgShape';
  import BasemapToggleControl from '../BasemapToggleControl.vue';
  import BasemapSelectControl from '../BasemapSelectControl.vue';
  import FullScreenMapToggleTab from '../FullScreenMapToggleTab.vue';
  import LocationControl from '../LocationControl.vue';
  import CyclomediaButton from '../../cyclomedia/Button';
  import PictometryButton from '../../pictometry/Button';
  import CyclomediaRecordingCircle from '../../cyclomedia/RecordingCircle';
  import CyclomediaRecordingsClient from '../../cyclomedia/recordings-client';
  import SvgViewConeMarker from '../../cyclomedia/SvgViewConeMarker';
  import MeasureControl from '../MeasureControl.vue';
  // import LegendControl from '../../esri-leaflet/Legend.vue';
  import ControlCorner from '../../leaflet/ControlCorner.vue';
  import PopUp from '../../leaflet/PopUp.vue';
  import PopUpContent from '../../leaflet/PopUpContent.vue';
  import Polygon_ from '../../leaflet/Polygon.vue';
  import Polyline_ from '../../leaflet/Polyline.vue';

  import ModalAbout from '../ModalAbout.vue';

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
      // SvgShape,
      BasemapToggleControl,
      BasemapSelectControl,
      FullScreenMapToggleTab,
      LocationControl,
      PictometryButton,
      CyclomediaButton,
      CyclomediaRecordingCircle,
      SvgViewConeMarker,
      MeasureControl,
      // LegendControl,
      ControlCorner,
      PopUp,
      PopUpContent,
      Polygon_,
      Polyline_,
      ModalAbout
    },
    mounted() {
      this.$controller.appDidLoad();
    },
    computed: {
      isMobileOrTablet() {
        return this.$store.state.isMobileOrTablet;
      },
      fullScreenMapEnabled() {
        return this.$store.state.fullScreenMapEnabled;
      },
      windowWidth() {
        return this.$store.state.windowWidth;
      },
      mapPanelContainerClass() {
        if (this.fullScreenMapEnabled) {
          return 'medium-24 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map'
        } else if (this.windowWidth >= 950) {
          return 'medium-16 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map';
        } else {
          return 'medium-14 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map';
        }
      },
      cycloLatlng() {
        if (this.$store.state.cyclomedia.orientation.xyz !== null) {
          const xyz = this.$store.state.cyclomedia.orientation.xyz;
          return [xyz[1], xyz[0]];
        } else {
          const center = this.$config.map.center;
          return center;
        }
      },
      cycloRotationAngle() {
        return this.$store.state.cyclomedia.orientation.yaw * (180/3.14159265359);
      },
      cycloHFov() {
        return this.$store.state.cyclomedia.orientation.hFov;
      },
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
        } else if (this.selectedPopupLayerGeometryType === "Polygon") {
          return this.selectedPopupLayer.feature.geometry.coordinates[0];
        } else if (this.selectedPopupLayerGeometryType === "MultiPolygon") {
          return this.selectedPopupLayer.feature.geometry.coordinates;
        }
      },
      selectedPopupLayerCoordinatesFlipped() {
        // console.log('coords:', this.flipCoordsArray(this.selectedPopupLayerCoordinates));
        if (this.selectedPopupLayerGeometryType === "Point") {
          return this.flipCoords(this.selectedPopupLayerCoordinates);
        } else if (this.selectedPopupLayerGeometryType !== "MultiPolygon") {
          // console.log('calling FlipCoordsArray on:', this.selectedPopupLayerCoordinates);
          return this.flipCoordsArray(this.selectedPopupLayerCoordinates);
        } else {
          return this.flipCoordsMultiPolygon(this.selectedPopupLayerCoordinates);
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

      // console.log('MAPPANEL CREATED', this, 'push at 12:32');
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
        // console.log('flipCoords is running on:', coords);
        return [coords[1], coords[0]];
      },
      flipCoordsArray(anArray) {
        // console.log('flipCoordsArray is running on:', anArray);
        let newArray = []
        for (let i in anArray) {
          newArray[i] = [anArray[i][1], anArray[i][0]]
        }
        return newArray
      },
      flipCoordsMultiPolygon(aMultiPolygon) {
        // console.log('flipCoordsMultiPolygon is running on:', aMultiPolygon);
        let newArrayArray = []
        for (let i in aMultiPolygon) {
          // console.log('aMultiPolygon[i]', aMultiPolygon[i]);
          let newArray = []
          for (let j in aMultiPolygon[i][0]) {
            // console.log('aMultiPolygon[i][0][j]', aMultiPolygon[i][0][j]);
            newArray[j] = [aMultiPolygon[i][0][j][1], aMultiPolygon[i][0][j][0]]
          }
        newArrayArray[i] = newArray
        }
        return newArrayArray
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
      handleMapClick() {
        // console.log('handle map click, e:', e);
        document.getElementById('addressSearch').blur()
      },
      handleButtonClick() {
        // console.log('handle button click is running');
        document.getElementById('addressSearch').blur()
      },
      // handleMapMove(e) {
      //   const map = this.$store.state.map.map;
      //
      //   const center = map.getCenter();
      //   this.$store.commit('setMapCenter', center);
      //   const zoom = map.getZoom();
      //   this.$store.commit('setMapZoom', zoom);
      //   const scale = this.$config.map.scales[zoom];
      //   this.$store.commit('setMapScale', scale);
      //
      //   const cyclomediaConfig = this.$config.cyclomedia || {};
      //   if (cyclomediaConfig.enabled) {
      //     // update cyclo recordings
      //     this.updateCyclomediaRecordings();
      //   }
      // },

      handleMapMove(e) {
        // console.log('handleMapMove is running');
        const map = this.$store.state.map.map;

        // const pictometryConfig = this.$config.pictometry || {};

        const center = map.getCenter();
        const { lat, lng } = center;
        const coords = [lng, lat];
        const zoom = map.getZoom();
        this.$store.commit('setMapZoom', zoom);
        const scale = this.$config.map.scales[zoom];
        this.$store.commit('setMapScale', scale);

        // if (pictometryConfig.enabled) {
        //   // update state for pictometry
        //   this.$store.commit('setPictometryMapCenter', coords);
        //
        //   const zoom = map.getZoom();
        //   this.$store.commit('setPictometryMapZoom', zoom);
        // }

        const cyclomediaConfig = this.$config.cyclomedia || {};

        if (cyclomediaConfig.enabled) {
          // update cyclo recordings
          this.updateCyclomediaRecordings();
          this.$store.commit('setCyclomediaLatLngFromMap', [lat, lng]);
        }
      },

      handleSearchFormSubmit(e) {
        // this.$controller.handleSearchFormSubmit(e);
        document.getElementById('addressSearch').blur()
        const input = e.target[0].value;
        // this.$store.commit('setLastSearchMethod', 'geocode');
        this.geocode(input);
      }
    }, // end of methods
  }; //end of export
</script>

<style scoped>

  /* .map-panel-container {
    height: calc(100vh - 220px);
  }

  @media screen and (max-width: 40em) {
    .map-panel-container {
      height: calc(100vh - 256px);
    }
  } */

/*this allows the loading mask to fill the div*/
  .mb-panel-map {
    position: relative;
  }

  /* @media (max-width: 1024px) {
    .mb-panel-map {
      height: 600px;
    }
  } */

  .mb-search-control-container {
    height: 48px;
    border-radius: 2px;
    box-shadow:0 2px 4px rgba(0,0,0,0.2),0 -1px 0px rgba(0,0,0,0.02);
  }

  .mb-search-control-button {
    color: #fff;
    width: 50px;
    background: #2176d2;
    line-height: 48px;
  }

  .mb-search-control-input {
    /* background-color: white; */
    border: 0;
    /* height: 48px !important; */
    /* line-height: 48px; */
    padding: 15px;
    /* padding-left: 15px; */
    /* padding-right: 15px; */
    font-family: 'Montserrat', 'Tahoma', sans-serif;
    font-size: 16px;
    width: 275px;
  }

  /* .mb-map-with-widget {
    height: 50%;
  } */

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

  @media screen and (max-width: 1023px) {
    .mb-search-control-input {
      width: 250px;
    }
  }

  @media screen and (max-width: 900px) {
    .mb-search-control-input {
      width: 200px;
    }
  }

  @media screen and (max-width: 800px) {
    .mb-search-control-input {
      width: 150px;
    }
  }

  @media screen and (max-width: 750px) {
    .mb-search-control-input {
      width: 250px;
    }
  }

  /* @media screen and (max-width: 639px) {
    .mb-search-control-input {
      width: 250px;
    }
  } */

  @media screen and (max-width: 450px) {
    .mb-search-control-input {
      width: 200px;
    }
  }

  @media screen and (max-width: 400px) {
    .mb-search-control-input {
      width: 150px;
    }
  }

  @media screen and (max-width: 350px) {
    .mb-search-control-input {
      width: 100px;
    }
  }
</style>
