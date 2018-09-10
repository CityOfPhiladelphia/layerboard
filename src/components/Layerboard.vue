<template>
  <div class="cell medium-auto grid-x" id="mb-root">
    <button class="small-24 button datasets-button"
            @click="toggleTopics"
    >
      {{ this.buttonMessage }}
    </button>

      <topic-panel v-show="shouldShowTopics" />
      <map-panel v-show="shouldShowMap">
        <cyclomedia-widget v-if="this.shouldLoadCyclomediaWidget"
                           slot="cycloWidget"
                           v-show="cyclomediaActive"
                           screen-percent="3"
        />
        <pictometry-widget v-if="this.shouldLoadPictometryWidget"
                           slot="pictWidget"
                           v-show="pictometryActive"
                           :apiKey="this.ak"
                           :secretKey="this.sk"
        >
          <png-marker v-if="this.pictometryShowAddressMarker"
                      :latlng="[this.geocodeData.geometry.coordinates[1], this.geocodeData.geometry.coordinates[0]]"
                      :icon="'markers.png'"
                      :height="60"
                      :width="40"
                      :offsetX="0"
                      :offsetY="0"
          />
          <layer v-if="this.pictometryActive" />
          <png-marker v-if="this.cyclomediaActive && this.pictometryActive"
                      :latlng="cycloLatlng"
                      :icon="'camera2.png'"
                      :height="20"
                      :width="30"
                      :offsetX="-2"
                      :offsetY="-2"
          />
          <view-cone v-if="this.cyclomediaActive && this.pictometryActive"
                     :latlng="cycloLatlng"
                     :rotationAngle="cycloRotationAngle"
                     :hFov="cycloHFov"
          />
        </pictometry-widget>
      </map-panel>
  </div>
</template>

<script>
  import * as philaVueMapping from '@cityofphiladelphia/phila-vue-mapping';
  const CyclomediaWidget = philaVueMapping.CyclomediaWidget;
  const PictometryWidget = philaVueMapping.PictometryWidget;
  const Layer = philaVueMapping.PictometryLayer;
  const ViewCone = philaVueMapping.PictometryViewCone;
  const PngMarker = philaVueMapping.PictometryPngMarker;

  import axios from 'axios';
  import TopicPanel from './TopicPanel.vue';
  import MapPanel from './MapPanel.vue';

  export default {
    components: {
      TopicPanel,
      MapPanel,
      CyclomediaWidget,
      PictometryWidget,
      Layer,
      ViewCone,
      PngMarker
    },
    mounted() {
      // console.log('cyclo', this.$config.cyclomedia.enabled, CyclomediaWidget);
      window.addEventListener('resize', this.handleWindowResize);
      this.handleWindowResize();

      const store = this.$store;
      const knackUrl = "https://api.knackhq.com/v1/objects/object_4/records/export?type=json";
      const params = {
        // dataType: 'json'
      }
      const headers = {
        'X-Knack-Application-Id': '550c60d00711ffe12e9efc64',
        'X-Knack-REST-API-Key': '7bce4520-28dc-11e5-9f0a-4d758115b820'
      }
      axios.get(knackUrl, { params, headers }).then(response => {
        const dataOut = response.data;
        const records = dataOut.records;
        const recordsFiltered = records.filter(record => record.field_12 === "API" || record.field_12 === "GeoService");

        let bennyEndpoints = {};

        for (let record of recordsFiltered) {
          const url = record.field_25.split('"')[1];
          let url2;
          if (url) {
            url2 = url.split('query')[0].replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
          } else {
            url2 = null;
          }
          if (record.field_13_raw.length > 0) {
              bennyEndpoints[url2] = record.field_13_raw[0].id;
          } else {
              bennyEndpoints[url2] = '';
          }
        }
        store.commit('setBennyEndpoints', bennyEndpoints);
      }, response => {
        console.log('AXIOS ERROR Layerboard.vue');
      });
    },
    computed: {
      isMobileOrTablet() {
        return this.$store.state.isMobileOrTablet;
      },
      shouldLoadCyclomediaWidget() {
        return this.$config.cyclomedia.enabled && !this.isMobileOrTablet;
      },
      shouldLoadPictometryWidget() {
        return this.$config.pictometry.enabled && !this.isMobileOrTablet;
      },
      fullScreenMapEnabled() {
        return this.$store.state.fullScreenMapEnabled;
      },
      cyclomediaActive() {
        return this.$store.state.cyclomedia.active
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
      pictometryActive() {
        return this.$store.state.pictometry.active
      },
      pictometryZoom() {
        return this.$store.state.pictometry.zoom
      },
      pictometryShowAddressMarker() {
        if (!this.pictometryActive || !this.geocodeData) {
          return false;
        } else if (this.pictometryZoom < 20 && this.cyclomediaActive) {
          return false;
        } else {
          return true;
        }
      },
      geocodeData() {
        return this.$store.state.geocode.data
      },
      ak() {
        const host = window.location.hostname;
        if (host === 'atlas.phila.gov') {
          return this.$config.pictometry.apiKey;
        }
        if (host === 'atlas-dev.phila.gov') {
          return this.$config.pictometryDev.apiKey;
        }
        if (host === 'cityatlas.phila.gov') {
          return this.$config.pictometryCity.apiKey;
        }
        if (host === 'cityatlas-dev.phila.gov') {
          return this.$config.pictometryCityDev.apiKey;
        }
        if (host === '10.8.101.67') {
          return this.$config.pictometryLocal.apiKey;
        }
      },
      sk() {
        const host = window.location.hostname;
        if (host === 'atlas.phila.gov') {
          return this.$config.pictometry.secretKey;
        }
        if (host === 'atlas-dev.phila.gov') {
          return this.$config.pictometryDev.secretKey;
        }
        if (host === 'cityatlas.phila.gov') {
          return this.$config.pictometryCity.secretKey;
        }
        if (host === 'cityatlas-dev.phila.gov') {
          return this.$config.pictometryCityDev.secretKey;
        }
        if (host === '10.8.101.67') {
          return this.$config.pictometryLocal.secretKey;
        }
      },
      geocodeData() {
        return this.$store.state.geocode.data
      },
      windowWidth() {
        return this.$store.state.windowWidth;
      },
      windowHeight() {
        return this.$store.state.windowSize.height;
      },
      didToggleTopicsOn() {
        return this.$store.state.didToggleTopicsOn;
      },
      buttonMessage() {
        if (this.didToggleTopicsOn) {
          return 'See Map';
        } else {
          return 'See Datasets';
        }
      },
      shouldShowTopics() {
        return this.$store.state.shouldShowTopics;
      },
      shouldShowMap() {
        return this.$store.state.shouldShowMap;
      }
    },
    watch: {
      pictometryShowAddressMarker(nextValue) {
        // console.log('watch pictometryShowAddressMarker', nextValue);
      },
      windowWidth(nextWidth) {
        this.calculateShouldShowTopics();
        this.calculateShouldShowMap();
      },
      fullScreenMapEnabled(nextValue) {
        this.calculateShouldShowTopics();
        this.calculateShouldShowMap();
      },
      didToggleTopicsOn(nextValue) {
        this.calculateShouldShowTopics();
        this.calculateShouldShowMap();
      },
      shouldShowTopics(nextValue) {
        this.handleWindowResize();
      },
      shouldShowMap(nextValue) {
        this.handleWindowResize();
      }
    },
    methods: {
      // for mobile only
      toggleTopics() {
        const prevVal = this.$store.state.didToggleTopicsOn;
        this.$store.commit('setDidToggleTopicsOn', !prevVal);
      },
      calculateShouldShowTopics() {
        const windowWidth = this.windowWidth;
        const smallScreen = windowWidth < 750;
        const didToggleTopicsOn = this.$store.state.didToggleTopicsOn;
        const fullScreenMapEnabled = this.$store.state.fullScreenMapEnabled;
        // console.log('calculateShouldShowTopics, smallScreen:', smallScreen, 'didToggleTopicsOn', didToggleTopicsOn, 'fullScreenMapEnabled', fullScreenMapEnabled);
        const shouldShowTopics = !smallScreen && !fullScreenMapEnabled || smallScreen && didToggleTopicsOn;
        this.$store.commit('setShouldShowTopics', shouldShowTopics);
      },
      calculateShouldShowMap() {
        const windowWidth = this.windowWidth;
        const notMobile = windowWidth > 750;
        const didToggleTopicsOn = this.$store.state.didToggleTopicsOn;
        const shouldShowMap = notMobile || !didToggleTopicsOn;
        this.$store.commit('setShouldShowMap', shouldShowMap);
      },
      handleWindowResize() {
        const rootElement = document.getElementById('mb-root');
        const rootStyle = window.getComputedStyle(rootElement);
        // const rootHeight = rootStyle.getPropertyValue('height');
        // const rootHeightNum = parseInt(rootHeight.replace('px', ''));
        const rootHeightNum = 100;
        const rootWidth = rootStyle.getPropertyValue('width');
        const rootWidthNum = parseInt(rootWidth.replace('px', ''));
        // let boardHeight;
        const windowWidth = rootWidthNum;
        const notMobile = windowWidth >= 640;
        // console.log('handleWindowResize is running, windowWidth:', windowWidth, 'notMobile:', notMobile, 'this.$store.state.shouldShowTopics:', this.$store.state.shouldShowTopics);
        // if (!notMobile) {
        //   boardHeight = rootHeightNum - 34;
        //   console.log('subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
        // } else {
        //   boardHeight = rootHeightNum
        //   // console.log('NOT subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
        // }
        // this.styleObject.height = boardHeight.toString() + 'px';

        // const obj = {
        //   height: rootHeightNum,
        //   width: rootWidthNum
        // }
        this.$store.commit('setWindowWidth', rootWidthNum);
      }
    }
  };
</script>

<style>
  /*don't highlight any form elements*/
  input:focus,
  select:focus,
  textarea:focus,
  button:focus {
    outline: none;
  }

  /* standards applies padding to buttons, which causes some weirdness with
  buttons on the map panel. override here. */
  button {
    padding: inherit;
  }

  .mb-root {
    position: absolute;
    bottom: 0;
    top: 78px;
    left: 0;
    right: 0;
    overflow: auto;
  }

  .datasets-button {
    display: none;
    margin: 0;
  }

  .mb-panel {
    height: 100%;
  }

  /*.mb-panel-topics-with-widget {
    height: 50%;
  }*/

  /*small devices only*/
  /* @media screen and (max-width: 39.9375em) { */
  @media screen and (max-width: 750px) {
    .datasets-button {
      display: block;
    }
  }

  /* Medium and up */
  /* @media screen and (min-width: 40em) {

  } */

  /* Medium only */
  /* @media screen and (min-width: 40em) and (max-width: 63.9375em) {

  } */

  /* Large and up */
  /* @media screen and (min-width: 64em) {

  } */

  /* Large only */
  /* @media screen and (min-width: 64em) and (max-width: 74.9375em) {

  } */

</style>