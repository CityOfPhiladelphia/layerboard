<template>
  <div
    id="map-panel-container"
    :class="mapPanelContainerClass"
    :style="mapPanelContainerStyle"
  >
    <full-screen-map-toggle-tab v-once />
    <map_
      id="map-tag"
      :class="{ 'mb-map-with-widget': this.$store.state.cyclomedia.active || this.$store.state.pictometry.active }"
      :center="mapCenter"
      :zoom="this.$store.state.map.zoom"
      zoom-control-position="bottomright"
      :min-zoom="this.$config.map.minZoom"
      :max-zoom="22"
      @l-click="handleMapClick"
      @l-moveend="handleMapMove"
    >
      <!-- <polygon_ -->
      <polygon_
        v-if="selectedPopupLayerGeometryType === 'Polygon' || selectedPopupLayerGeometryType === 'MultiPolygon'"
        :color="'#00ffff'"
        :fill="false"
        :weight="5"
        :latlngs="selectedPopupLayerCoordinatesFlipped"
        :pane="'highlightOverlay'"
      />
      <polyline_
        v-if="selectedPopupLayerGeometryType === 'LineString'"
        :color="'#00ffff'"
        :weight="4"
        :latlngs="selectedPopupLayerCoordinatesFlipped"
        :pane="'highlightOverlay'"
      />
      <circle-marker
        v-if="selectedPopupLayerGeometryType === 'Point'"
        :latlng="selectedPopupLayerCoordinatesFlipped"
        :radius="7"
        :fill-color="'#00ffff'"
        :color="'#00ffff'"
        :weight="locationMarker.weight"
        :opacity="locationMarker.opacity"
        :fill-opacity="locationMarker.fillOpacity"
        :pane="'highlightOverlay'"
      />

      <!-- webmap -->
      <esri-web-map>
        <esri-web-map-layer
          v-for="(layer, key) in this.$store.state.map.webMapLayersAndRest"
          v-if="shouldShowFeatureLayer(layer)"
          :key="key"
          :layer="layer.layer"
          :layer-name="layer.title"
          :layer-definition="layer.rest.layerDefinition"
          :opacity="layer.opacity"
          :type="layer.type2"
          :layer-options="layer.options"
        />
      </esri-web-map>
      <popup v-if="shouldShowPopup">
        <popup-content />
      </popup>


      <!-- basemaps -->
      <esri-tiled-map-layer
        v-for="(basemap, key) in this.$config.map.basemaps"
        v-if="activeBasemap === key"
        :key="key"
        :name="key"
        :url="basemap.url"
        :max-zoom="basemap.maxZoom"
        :z-index="basemap.zIndex"
        :attribution="basemap.attribution"
      />

      <!-- basemap labels and parcels outlines -->
      <esri-tiled-map-layer
        v-for="(tiledLayer, key) in this.$config.map.tiledLayers"
        v-if="activeTiles.includes(key)"
        :key="key"
        :name="key"
        :url="tiledLayer.url"
        :z-index="tiledLayer.zIndex"
        :attribution="tiledLayer.attribution"
      />

      <vector-marker
        v-for="marker in markers"
        :key="marker.key"
        :latlng="marker.latlng"
        :marker-color="marker.color"
        :icon="marker.icon"
      />

      <!-- marker showing last click -->
      <vector-marker
        v-if="clickMarker.latlng[0] !== null"
        :latlng="clickMarker.latlng"
        :marker-color="clickMarker.color"
        :icon="clickMarker.icon"
      />

      <!-- marker using a png and ablility to rotate it -->
      <png-marker
        v-if="cyclomediaActive"
        :icon="'images/camera.png'"
        :latlng="cycloLatlng"
        :rotation-angle="cycloRotationAngle"
      />

      <!-- marker using custom code extending icons - https://github.com/iatkin/leaflet-svgicon -->
      <svg-view-cone-marker
        v-if="cyclomediaActive"
        :latlng="cycloLatlng"
        :rotation-angle="cycloRotationAngle"
        :h-fov="cycloHFov"
      />

      <control-corner
        :v-side="'top'"
        :h-side="'almostright'"
      />

      <control-corner
        :v-side="'top'"
        :h-side="'almostleft'"
      />

      <div v-once>
        <basemap-toggle-control
          v-if="shouldShowImageryToggle"
          v-once
          :position="'topright'"
        />
      </div>

      <div v-once>
        <basemap-select-control :position="basemapSelectControlPosition" />
      </div>

      <div v-once>
        <pictometry-button
          v-if="shouldShowPictometryButton"
          v-once
          :position="'topright'"
          :link="'pictometry'"
          :img-src="'images/pictometry.png'"
        />
      </div>

      <div v-once>
        <cyclomedia-button
          v-if="shouldShowCyclomediaButton"
          v-once
          :position="'topright'"
          :link="'cyclomedia'"
          :img-src="'images/cyclomedia.png'"
          @handle-cyclomedia-button-click="handleCyclomediaButtonClick"
        />
      </div>

      <div
        v-if="measureControlEnabled"
        v-once
      >
        <measure-control :position="'bottomleft'" />
      </div>

      <div v-once>
        <location-control
          v-if="geolocationEnabled"
          v-once
          :position="'bottomright'"
          @click="handleButtonClick"
        />
      </div>

      <!-- search control -->
      <div v-once>
        <map-address-input
          :position="addressInputPosition"
          :placeholder="addressInputPlaceholder"
          :width-from-config="addressInputWidth"
          @handle-search-form-submit="handleSearchFormSubmit"
        />
      </div>
      <map-address-candidate-list
        v-if="addressAutocompleteEnabled"
        :position="addressInputPosition"
        :width-from-config="addressInputWidth"
      />

      <!-- location marker -->
      <circle-marker
        v-if="this.$store.state.map.location.lat != null"
        :latlng="locationMarker.latlng"
        :radius="locationMarker.radius"
        :fill-color="locationMarker.fillColor"
        :color="locationMarker.color"
        :weight="locationMarker.weight"
        :opacity="locationMarker.opacity"
        :fill-opacity="locationMarker.fillOpacity"
        :pane="'highlightOverlay'"
      />

      <cyclomedia-recording-circle
        v-for="recording in cyclomediaRecordings"
        v-if="cyclomediaActive"
        :key="recording.imageId"
        :image-id="recording.imageId"
        :latlng="[recording.lat, recording.lng]"
        :size="1.2"
        :color="'#3388ff'"
        :weight="1"
        @l-click="handleCyclomediaRecordingClick"
      />
    </map_>
    <modal-about />
    <slot
      class="widget-slot"
      name="cycloWidget"
    />
    <slot
      class="widget-slot"
      name="pictWidget"
    />
  </div>
</template>

<script>
import 'leaflet/dist/leaflet.css';

import {
  LatLngBounds,
} from 'leaflet';

// import { geoJSON, featureGroup } from 'leaflet';
// import { marker as Lmarker } from 'leaflet';

// mixins
import markersMixin from './markers-mixin';
import cyclomediaMixin from '@phila/vue-mapping/src/cyclomedia/map-panel-mixin.js';
import pictometryMixin from '@phila/vue-mapping/src/pictometry/map-panel-mixin.js';

// components
import CyclomediaRecordingsClient from '@phila/vue-mapping/src/cyclomedia/recordings-client.js';
import ControlCorner from '@phila/vue-mapping/src/leaflet/ControlCorner.vue';
import FullScreenMapToggleTab from '@phila/vue-mapping/src/components/FullScreenMapToggleTab.vue';
import Map_ from '@phila/vue-mapping/src/leaflet/Map.vue';
import LocationControl from '@phila/vue-mapping/src/components/LocationControl.vue';
import BasemapToggleControl from '@phila/vue-mapping/src/components/BasemapToggleControl.vue';
import BasemapSelectControl from '@phila/vue-mapping/src/components/BasemapSelectControl.vue';
import PictometryButton from '@phila/vue-mapping/src/pictometry/Button.vue';
import CyclomediaButton from '@phila/vue-mapping/src/cyclomedia/Button.vue';
import MeasureControl from '@phila/vue-mapping/src/components/MeasureControl.vue';
// import LegendControl from '@phila/vue-mapping/src/components/LegendControl.vue';
import MapAddressInput from '@phila/vue-mapping/src/components/MapAddressInput.vue';

import Popup from '@phila/vue-mapping/src/leaflet/Popup.vue';
import PopupContent from '@phila/vue-mapping/src/leaflet/PopupContent.vue';

import EsriWebMap from '@phila/vue-mapping/src/esri-leaflet/EsriWebMap.vue';
import EsriWebMapLayer from '@phila/vue-mapping/src/esri-leaflet/EsriWebMapLayer.vue';

export default {
  name: 'MapPanel',
  components: {
    MapAddressCandidateList: () => import(/* webpackChunkName: "lbmp_pvm_MapAddressCandidateList" */'@phila/vue-mapping/src/components/MapAddressCandidateList.vue'),
    EsriTiledMapLayer: () => import(/* webpackChunkName: "lbmp_pvm_EsriTiledMapLayer" */'@phila/vue-mapping/src/esri-leaflet/TiledMapLayer.vue'),
    ModalAbout: () => import(/* webpackChunkName: "lbmp_pvm_ModalAbout" */'@phila/vue-mapping/src/components/ModalAbout.vue'),
    CircleMarker: () => import(/* webpackChunkName: "lbmp_pvm_CircleMarker" */'@phila/vue-mapping/src/leaflet/CircleMarker.vue'),
    VectorMarker: () => import(/* webpackChunkName: "lbmp_pvm_VectorMarker" */'@phila/vue-mapping/src/components/VectorMarker.vue'),
    PngMarker: () => import(/* webpackChunkName: "lbmp_pvm_PngMarker" */'@phila/vue-mapping/src/components/PngMarker.vue'),
    CyclomediaRecordingCircle: () => import(/* webpackChunkName: "lbmp_pvm_CyclomediaRecordingCircle" */'@phila/vue-mapping/src/cyclomedia/RecordingCircle.vue'),
    SvgViewConeMarker: () => import(/* webpackChunkName: "lbmp_pvm_CyclomediaSvgViewConeMarker" */'@phila/vue-mapping/src/cyclomedia/SvgViewConeMarker.vue'),
    EsriWebMap,
    EsriWebMapLayer,
    ControlCorner,
    FullScreenMapToggleTab,
    Map_,
    LocationControl,
    BasemapToggleControl,
    BasemapSelectControl,
    PictometryButton,
    CyclomediaButton,
    MeasureControl,
    MapAddressInput,
    Popup,
    PopupContent,
    Polygon_: () => import(/* webpackChunkName: "lbmp_pvm_Polygon_" */'@phila/vue-mapping/src/leaflet/Polygon.vue'),
    Polyline_: () => import(/* webpackChunkName: "lbmp_pvm_Polyline_" */'@phila/vue-mapping/src/leaflet/Polyline.vue'),
    // Control: () => import(/* webpackChunkName: "lbmp_pvm_Control" */'@phila/vue-mapping/src/leaflet/Control.vue'),
    // LegendControl,
    // Geojson: () => import(/* webpackChunkName: "lbmp_pvm_Geojson" */'@phila/vue-mapping/src/leaflet/Geojson.vue'),
    // BasemapTooltip: () => import(/* webpackChunkName: "lbmp_pvm_BasemapTooltip" */'@phila/vue-mapping/src/components/BasemapTooltip.vue'),
    // EsriFeatureLayer: () => import(/* webpackChunkName: "lbmp_pvm_EsriFeatureLayer" */'@phila/vue-mapping/src/esri-leaflet/FeatureLayer.vue'),
    // EsriTiledOverlay: () => import(/* webpackChunkName: "lbmp_pvm_EsriTiledOverlay" */'@phila/vue-mapping/src/esri-leaflet/TiledOverlay.vue'),
    // EsriDynamicMapLayer: () => import(/* webpackChunkName: "lbmp_pvm_EsriDynamicMapLayer" */'@phila/vue-mapping/src/esri-leaflet/DynamicMapLayer.vue'),
    // EsriWebMap: () => import(/* webpackChunkName: "lbmp_pvm_EsriWebMap" */'@phila/vue-mapping/src/esri-leaflet/EsriWebMap.vue'),
    // EsriWebMapLayer: () => import(/* webpackChunkName: "lbmp_pvm_EsriWebMapLayer" */'@phila/vue-mapping/src/esri-leaflet/EsriWebMapLayer.vue'),
  },
  mixins: [
    markersMixin,
    cyclomediaMixin,
    pictometryMixin,
  ],
  data() {
    const windowHeight = window.innerHeight;
    const siteHeaderHeightNum = parseInt(document.getElementsByClassName('site-header')[0].getBoundingClientRect().height);
    console.log('siteHeaderHeightNum:', siteHeaderHeightNum);
    // const appFooterHeightNum = parseInt(document.getElementsByClassName('app-footer')[0].getBoundingClientRect().height);
    const appFooterHeightNum = 36;
    // console.log('appFooterHeightNum:', appFooterHeightNum);
    // console.log(document.getElementsByClassName('datasets-button'))
    // const datasetsButtonHeightNum = parseInt(document.getElementsByClassName('datasets-button')[0].getBoundingClientRect().height);
    // console.log('datasetsButtonHeightNum:', datasetsButtonHeightNum);
    let mapPanelHeight = windowHeight - siteHeaderHeightNum - appFooterHeightNum - 36;
    let mapPanelHeightStr = mapPanelHeight.toString() + 'px';
    console.log('mapPanelHeightStr:', mapPanelHeightStr);

    const data = {
      mapPanelContainerStyle: {
        'height': mapPanelHeightStr,
        'min-height': mapPanelHeightStr,
      },
    };
    return data;
  },
  computed: {
    geocodeZoom() {
      if (this.$config.map.geocodeZoom) {
        return this.$config.map.geocodeZoom;
      }
      return 19;

    },
    windowDim() {
      return this.$store.state.windowDimensions;
    },
    mapCenter() {
      return this.$store.state.map.center;
    },
    addressAutocompleteEnabled() {
      // TODO tidy up the code
      if (this.$config.addressInput) {
        if (this.$config.addressInput.autocompleteEnabled === true) {
          return true;
        }
        return false;

      }
      return false;

    },
    addressInputPosition() {
      if (this.isMobileOrTablet) {
        return 'topleft';
      }
      return 'topalmostleft';

    },
    addressInputWidth() {
      if (this.$config.addressInput) {
        return this.$config.addressInput.mapWidth;
      }
      return 415;

    },
    addressInputPlaceholder() {
      if (this.$config.addressInput) {
        return this.$config.addressInput.placeholder;
      }
      return null;

    },
    basemapSelectControlPosition() {
      if (this.isMobileOrTablet) {
        return 'topright';
      }
      return 'topalmostright';

    },
    isMobileOrTablet() {
      return this.$store.state.isMobileOrTablet;
    },
    fullScreenMapEnabled() {
      return this.$store.state.fullScreenMapEnabled;
    },
    // windowWidth() {
    //   return this.$store.state.windowWidth;
    // },
    topics() {
      let configTopics = [];
      if (this.$config.topics) {
        for (let topic of this.$config.topics) {
          configTopics.push(topic.label);
        }
      } else {
        configTopics = null;
      }
      return configTopics;
    },
    activeTopic() {
      return this.$store.state.activeTopic;
    },
    activeTopicConfig() {
      const key = this.activeTopic;
      const createdComplete = this.createdComplete;
      // console.log('computed activeTopicConfig is running, this.$config:', this.$config, 'key:', key, 'createdComplete:', createdComplete);
      let config;

      // if no active topic, return null
      if (key && this.$config) {
        config = this.$config.topics.filter((topic) => {
          return topic.key === key;
        })[0];
      }

      return config || {};
    },
    activeTopicLayers() {
      if (!this.topics) {
        // if there are no topics, return all layers
        let titles = [];
        for (let layer of this.$store.state.map.webMapLayersAndRest) {
          titles.push(layer.title);
        }
        return titles;
      } else if (this.topics && !this.activeTopic) {
        // if there are topics, but none is open, return no layers
        return [];
      }
      const activeTopicConfigComponents = this.activeTopicConfig.components;
      let topicLayers;
      for (let component of activeTopicConfigComponents) {
        if (component.type === 'checkbox-set' || component.type === 'radio-button-set') {
          topicLayers = component.options.topicLayers;
        }
      }
      let topicLayersKeys = [];
      console.log('topicLayers:', topicLayers);
      if (topicLayers) {
        for (let topicLayer of topicLayers) {
          topicLayersKeys.push(topicLayer.title);
        }
      }
      return topicLayersKeys;
    },
    mapPanelContainerClass() {
      if (this.fullScreenMapEnabled) {
        return 'medium-24 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map';
      } else if (this.windowDim.width >= 950) {
        return 'medium-16 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map';
      }
      return 'medium-14 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map';

    },
    cycloLatlng() {
      if (this.$store.state.cyclomedia.orientation.xyz !== null) {
        const xyz = this.$store.state.cyclomedia.orientation.xyz;
        return [ xyz[1], xyz[0] ];
      }
      const center = this.$config.map.center;
      return center;

    },
    cycloRotationAngle() {
      return this.$store.state.cyclomedia.orientation.yaw;// * (180/3.14159265359);
    },
    cycloHFov() {
      return this.$store.state.cyclomedia.orientation.hFov;
    },
    shouldShowCyclomediaButton() {
      return this.$config.cyclomedia.enabled && !this.isMobileOrTablet;
    },
    shouldShowPictometryButton() {
      return this.$config.pictometry.enabled && !this.isMobileOrTablet;
    },
    shouldShowPopup() {
      if (this.intersectingFeatures.length > 0) {
        return true;
      }
      return false;

    },
    selectedPopupLayer() {
      return this.$store.state.map.selectedPopupLayer;
    },
    selectedPopupLayerGeometryType() {
      if (this.selectedPopupLayer) {
        return this.selectedPopupLayer.feature.geometry.type;
      }
      return null;

    },
    selectedPopupLayerCoordinates() {
      let coordinates;
      if (this.selectedPopupLayerGeometryType === "Point" || this.selectedPopupLayerGeometryType === "LineString") {
        coordinates = this.selectedPopupLayer.feature.geometry.coordinates;
      } else if (this.selectedPopupLayerGeometryType === "Polygon") {
        coordinates = this.selectedPopupLayer.feature.geometry.coordinates[0];
      } else if (this.selectedPopupLayerGeometryType === "MultiPolygon") {
        coordinates = this.selectedPopupLayer.feature.geometry.coordinates;
      }
      return coordinates;
    },
    selectedPopupLayerCoordinatesFlipped() {
      // console.log('coords:', this.flipCoordsArray(this.selectedPopupLayerCoordinates));
      if (this.selectedPopupLayerGeometryType === "Point") {
        return this.flipCoords(this.selectedPopupLayerCoordinates);
      } else if (this.selectedPopupLayerGeometryType !== "MultiPolygon") {
        // console.log('calling FlipCoordsArray on:', this.selectedPopupLayerCoordinates);
        return this.flipCoordsArray(this.selectedPopupLayerCoordinates);
      }
      return this.flipCoordsMultiPolygon(this.selectedPopupLayerCoordinates);

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
      const shouldShowBasemapSelectControl = this.$store.state.map.shouldShowBasemapSelectControl;
      if (shouldShowBasemapSelectControl) {
        return this.$store.state.map.imagery;
      }
      const defaultBasemap = this.$config.map.defaultBasemap;
      const basemap = this.$store.state.map.basemap || defaultBasemap;
      return basemap;
    },
    activeTiles() {
      if (this.$config.map.basemaps[this.activeBasemap]) {
        return this.$config.map.basemaps[this.activeBasemap].tiledLayers;
      }
      return [];

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
      return (this.geocodeResult || {}).geometry;
    },
    picOrCycloActive() {
      if (this.cyclomediaActive || this.pictometryActive) {
        return true;
      }
      return false;

    },
    measureControlEnabled() {
      if (this.$config.measureControlEnabled === false) {
        return false;
      }
      return true;

    },
  },
  watch: {
    windowDim(nextDim) {
      // console.log('mapPanel windowDim watch is firing, nextDim:', nextDim);
      this.handleWindowResize(nextDim);
    },
    picOrCycloActive(value) {
      this.$nextTick(() => {
        this.$store.state.map.map.invalidateSize();
      });
    },
    geocodeResult(nextGeocodeResult) {
      if (nextGeocodeResult._featureId) {
        this.$store.commit('setMapCenter', nextGeocodeResult.geometry.coordinates);
        this.$store.commit('setMapZoom', this.geocodeZoom);
      } else {
        this.$store.commit('setBasemap', 'pwd');
      }
    },
  },
  created() {
    // if there's a default address, navigate to it
    const defaultAddress = this.$config.defaultAddress;
    if (defaultAddress) {
      this.$controller.goToDefaultAddress(defaultAddress);
    }

    const cyclomediaConfig = this.$config.cyclomedia || {};
    if (cyclomediaConfig.enabled) {
      // create cyclomedia recordings client
      this.$cyclomediaRecordingsClient = new CyclomediaRecordingsClient(
        this.$config.cyclomedia.recordingsUrl,
        this.$config.cyclomedia.username,
        this.$config.cyclomedia.password,
        4326,
      );
    }
  },
  mounted() {
    this.$controller.appDidLoad();
    // window.addEventListener('resize', this.handleWindowResize);
    // this.handleWindowResize(25);
  },
  methods: {
    handleSearchFormSubmit(value) {
      console.log('MapPanel.vue handleSearchFormSubmit is running');
      this.$controller.handleSearchFormSubmit(value);
    },
    flipCoords(coords) {
      // console.log('flipCoords is running on:', coords);
      return [ coords[1], coords[0] ];
    },
    flipCoordsArray(anArray) {
      // console.log('flipCoordsArray is running on:', anArray);
      let newArray = [];
      for (let i in anArray) {
        newArray[i] = [ anArray[i][1], anArray[i][0] ];
      }
      return newArray;
    },
    flipCoordsMultiPolygon(aMultiPolygon) {
      // console.log('flipCoordsMultiPolygon is running on:', aMultiPolygon);
      let newArrayArray = [];
      for (let i in aMultiPolygon) {
        // console.log('aMultiPolygon[i]', aMultiPolygon[i]);
        let newArray = [];
        for (let j in aMultiPolygon[i][0]) {
          // console.log('aMultiPolygon[i][0][j]', aMultiPolygon[i][0][j]);
          newArray[j] = [ aMultiPolygon[i][0][j][1], aMultiPolygon[i][0][j][0] ];
        }
        newArrayArray[i] = newArray;
      }
      return newArrayArray;
    },
    shouldShowFeatureLayer(layer) {
      if (layer.rest.layerDefinition) {
        if (layer.rest.layerDefinition.minScale) {
          // console.log('minZoom for', layer.title, 'is', layer.rest.layerDefinition.minScale, typeof layer.rest.layerDefinition.minScale, 'and current scale is', this.scale, typeof this.scale);
          if (this.scale <= layer.rest.layerDefinition.minScale && this.webMapActiveLayers.includes(layer.title) && this.activeTopicLayers.includes(layer.title)) {
            // if (this.scale <= layer.rest.layerDefinition.minScale && this.webMapActiveLayers.includes(layer.title)) {
            // console.log('checkLayer used layerDefinition and is returning true for', layer.title);
            return true;
          }
        } else if (layer.rest.layerDefinition.drawingInfo && this.webMapActiveLayers.includes(layer.title) && this.activeTopicLayers.includes(layer.title)) {
          // } else if (layer.rest.layerDefinition.drawingInfo && this.webMapActiveLayers.includes(layer.title)) {
          return true;
        }
      } else if (this.webMapActiveLayers.includes(layer.title) && this.activeTopicLayers.includes(layer.title)) {
        // } else if (this.webMapActiveLayers.includes(layer.title)) {
        // console.log('checkLayer is returning true for', layer.title);
        return true;
      } else {
        return false;
      }
    },
    handleMapClick(e) {
      console.log('handle map click, e:', e);
      document.getElementsByClassName('pvm-search-control-input')[0].blur();

      if (this.$store.state.map.mode === 'clickMarker') {
        console.log('map was in clickMarker mode');
        this.setClickMarkerLocation(e);
        this.$store.commit('setMapMode', 'identifyFeatures');
      } else {
        this.identifyFeatures(e);
      }
    },

    setClickMarkerLocation(e) {
      const payload = {
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      };
      this.$store.commit('setClickMarkerLocation', payload);
    },

    // this is used when the click should identify features
    identifyFeatures(e) {
      console.log('identifyFeatures is running, e:', e);
      const map = this.$store.state.map.map;
      // const map = this.$leafletElement;
      const clickBounds = new LatLngBounds(e.latlng, e.latlng);
      // console.log('map._layers', map._layers);
      let intersectingFeatures = [];
      let geometry;
      for (let layer in map._layers) {
        var overlay = map._layers[layer];
        // console.log('layer:', layer, 'overlay:', overlay);
        if (overlay._layers) {
          for (let oLayer in overlay._layers) {
            const feature = overlay._layers[oLayer];
            // console.log('feature:', feature);
            if (feature.feature) {
              geometry = feature.feature.geometry.type;
              // console.log('clickHandler LAYER:', layer, 'FEATURE:', feature, 'GEOMETRY:', geometry);
              let bounds;
              if (geometry === 'Polygon' || geometry === 'MultiPolygon') {
                // console.log('polygon or multipolygon');
                if (feature.contains(e.latlng)) {
                  // console.log('about to run checkForDuplicates')
                  this.checkForDuplicates(layer, feature, intersectingFeatures);
                }
              } else if (geometry === 'LineString') {
                // console.log('Line');
                bounds = feature.getBounds();
                if (bounds && clickBounds.intersects(bounds)) {
                  this.checkForDuplicates(layer, feature, intersectingFeatures);
                }
              } else if (geometry === 'Point') {
                // console.log('Point');
                bounds = new LatLngBounds(feature._latlng, feature._latlng);
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
      // console.log('checkForDuplicates is running, layer:', layer, 'feature:', feature);
      let ids = [];
      for (let i = 0; i < intersectingFeatures.length; i++) {
        ids[i] = layer + '_' + intersectingFeatures[i].feature.id;
      }
      // console.log('layer:', layer, 'feature.feature.id:', feature.feature.id);
      if (!ids.includes(layer + '_' + feature.feature.id)) {
        // console.log('checkForDuplicates going to push to intersectingFeatures:', layer, feature.feature.id);
        intersectingFeatures.push(feature);
      }
    },


    handleButtonClick() {
      // console.log('handle button click is running');
      document.getElementsByClassName('pvm-search-control-input')[0].blur();
    },
    handleMapMove(e) {
      // console.log('handleMapMove is running');
      const map = this.$store.state.map.map;

      const pictometryConfig = this.$config.pictometry || {};

      const center = map.getCenter();
      const { lat, lng } = center;
      const coords = [ lng, lat ];
      const zoom = map.getZoom();
      this.$store.commit('setMapZoom', zoom);
      const scale = this.$config.map.scales[zoom];
      this.$store.commit('setMapScale', scale);

      if (pictometryConfig.enabled) {
        // update state for pictometry
        this.$store.commit('setPictometryMapCenter', coords);

        const zoom = map.getZoom();
        this.$store.commit('setPictometryMapZoom', zoom);
      }

      const cyclomediaConfig = this.$config.cyclomedia || {};

      if (cyclomediaConfig.enabled) {
        // update cyclo recordings
        this.updateCyclomediaRecordings();
        this.$store.commit('setCyclomediaLatLngFromMap', [ lat, lng ]);
      }
    },
    handleWindowResize(dim) {
      // console.log('MapPanel handleWindowResize is running, dim:', dim);
      const windowHeight = window.innerHeight;
      const siteHeaderHeightNum = parseInt(document.getElementsByClassName('site-header')[0].getBoundingClientRect().height);
      const appFooterHeightNum = parseInt(document.getElementsByClassName('app-footer')[0].getBoundingClientRect().height);
      const datasetsButtonHeightNum = parseInt(document.getElementsByClassName('datasets-button')[0].getBoundingClientRect().height);
      // console.log('MapPanel handleWindowResize is running, datasetsButtonHeightNum:', datasetsButtonHeightNum);
      let mapPanelHeight = windowHeight - siteHeaderHeightNum - appFooterHeightNum - datasetsButtonHeightNum;

      this.mapPanelContainerStyle.height = mapPanelHeight.toString() + 'px';
      this.mapPanelContainerStyle['min-height'] = mapPanelHeight.toString() + 'px';
      // this.mapPanelContainerStyle['overflow-y'] = 'auto';
    },

    handleCyclomediaButtonClick(e) {
      console.log('handleCyclomediaButtonClick is running');
      if (!this.cyclomediaInitializationBegun) {
        this.$store.commit('setCyclomediaInitializationBegun', true);
      }
      const willBeActive = !this.$store.state.cyclomedia.active;

      this.$store.commit('setCyclomediaActive', willBeActive);

      // if (this.isMobileOrTablet) {
      //   // console.log('isMobileOrTablet is true');
      //   if (this.$store.state.pictometry.active) {
      //     this.$store.commit('setPictometryActive', false);
      //   }
      // }
    },

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

  .mb-map-with-widget {
    height: 50%;
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
