<template>
  <!-- <div id="mainDiv">
    <v-layout>
      <v-flex xs3>
        <topic-panel>
        </topic-panel>
      </v-flex>
      <v-flex xs9> -->
  <div class="mb-root row collapse"
       id="mb-root"
  >
  <!-- :style="this.$config.rootStyle" -->
    <button class="small-24 button datasets-button"
            @click="toggleTopics"
    >
      <!-- <i class="fa fa-bars fa-inverse" aria-hidden="true"></i> -->
      See Datasets
    </button>

    <!-- <div class="below-button"
         id="below-button"
    > -->
      <topic-panel v-if="shouldShowTopics"
                   :style="styleObject"
      />

      <map-panel :style="styleObject"
      >
        <cyclomedia-widget v-if="this.$config.cyclomedia.enabled"
                           slot="cycloWidget"
                           v-show="cyclomediaActive"
        />
        <pictometry-widget v-if="this.$config.pictometry.enabled"
                           slot="pictWidget"
                           v-show="pictometryActive"
                           :apiKey="this.$config.pictometry.apiKey"
                           :secretKey="this.$config.pictometry.secretKey"
        >
          <png-marker v-if="this.pictometryShowAddressMarker"
                  :latlng="[this.geocodeData.geometry.coordinates[1], this.geocodeData.geometry.coordinates[0]]"
                  :icon="'markers.png'"
                  :height="60"
                  :width="40"
                  :offsetX="0"
                  :offsetY="0"
          />
          <layer v-if="this.pictometryActive"
          />
          <png-marker v-if="this.cyclomediaActive && this.pictometryActive"
                  :latlng="[this.$store.state.cyclomedia.viewer.props.orientation.xyz[1], this.$store.state.cyclomedia.viewer.props.orientation.xyz[0]]"
                  :icon="'camera2.png'"
                  :height="20"
                  :width="30"
                  :offsetX="-2"
                  :offsetY="-2"
          />
          <!-- :icon="'../assets/camera.png'" -->
          <view-cone v-if="this.cyclomediaActive && this.pictometryActive"
                     :orientation="this.$store.state.cyclomedia.viewer.props.orientation"
          />
        </pictometry-widget>
        <!-- :center="this.$store.state.map.map.center" -->
      </map-panel>
    <!-- </div> -->
      <!-- </v-flex>
    </v-layout> -->
  </div>
</template>

<script>
  import axios from 'axios';
  import TopicPanel from './TopicPanel';
  import MapPanel from './map-panel/MapPanel';
  import CyclomediaWidget from '../cyclomedia/Widget';
  import PictometryWidget from '../pictometry/Widget';
  import Layer from '../pictometry/Layer';
  import ViewCone from '../pictometry/ViewCone';
  import PngMarker from '../pictometry/PngMarker';

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
    data() {
      const data = {
        styleObject: {
          // 'position': 'relative',
          // 'top': '100px',
          'overflow-y': 'auto',
          'height': '100%'
        }
      };
      return data;
    },
    mounted() {
      window.addEventListener('resize', this.handleWindowResize);
      // this.$nextTick(() => {
      this.handleWindowResize();
      // });
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
        // const recordsFiltered = records;
        const recordsFiltered = records.filter(record => record.field_12 === "API" || record.field_12 === "GeoService");
        console.log(recordsFiltered);
        // let bennyEndpoints2 = {};
        // let bennyEndpoints3 = []
        // const knackUrl2 = "https://api.knackhq.com/v1/objects/object_3/records/export?type=json";
        // const params = {
        //   // dataType: 'json'
        // }
        // const headers = {
        //   'X-Knack-Application-Id': '550c60d00711ffe12e9efc64',
        //   'X-Knack-REST-API-Key': '7bce4520-28dc-11e5-9f0a-4d758115b820'
        // }
        // axios.get(knackUrl2, { params, headers }).then(response2 => {
        //   const dataOut2 = response2.data;
        //   const records2 = dataOut2.records;
        //   console.log('records2', records2);

        let bennyEndpoints = {};

        for (let record of recordsFiltered) {


          // bennyEndpoints2[record.id] = record.field_25;\
          // if (record.id) {
          //   bennyEndpoints3.push(record.id);
          // }
          const url = record.field_25.split('"')[1];
          let url2;
          if (url) {
            url2 = url.split('query')[0].replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
          } else {
            url2 = null;
          }
          // if (record.field_12.length > 0) {
            if (record.field_13_raw.length > 0) {
              // if (bennyEndpoints[url2]) {
                // console.log('already there', url2, record.field_12, record.field_13_raw[0]);
                bennyEndpoints[url2] = record.field_13_raw[0].id;
                // bennyEndpoints[url2][record.field_12] = record.field_13_raw[0].id;
              // } else {
              //   // console.log('not there yet', url2, record.field12, record.field_13_raw[0])
              //   bennyEndpoints[url2] = {}
              //   bennyEndpoints[url2][record.field_12] = record.field_13_raw[0].id;
              // }
            } else {
              // if (bennyEndpoints[url2]) {
                bennyEndpoints[url2] = '';
                // bennyEndpoints[url2][record.field_12] = '';
              // } else {
              //   bennyEndpoints[url2] = {}
              //   bennyEndpoints[url2][record.field_12] = '';
              // }
            }
          }
        // }
        store.commit('setBennyEndpoints', bennyEndpoints);
        // store.commit('setBennyEndpoints2', bennyEndpoints2);
        // store.commit('setBennyEndpoints3', bennyEndpoints3);
        // }, response => {
        //   console.log('AXIOS ERROR Mapboard.vue');
        // });
      }, response => {
        console.log('AXIOS ERROR Mapboard.vue');
      });
    },
    computed: {
      cyclomediaActive() {
        return this.$store.state.cyclomedia.active
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
      windowWidth() {
        return this.$store.state.windowSize.width;
      },
      windowHeight() {
        return this.$store.state.windowSize.height;
      },
      didToggleTopicsOn() {
        return this.$store.state.didToggleTopicsOn;
      },
      shouldShowTopics() {
        return this.$store.state.shouldShowTopics;
        // const windowWidth = this.windowWidth;
        // const notMobile = windowWidth >= 768;
        // const didToggleTopicsOn = this.$store.state.didToggleTopicsOn;
        // return notMobile || didToggleTopicsOn;
      }
    },
    watch: {
      pictometryShowAddressMarker(nextValue) {
        console.log('watch pictometryShowAddressMarker', nextValue);
      },
      windowWidth(nextWidth) {
        this.calculateShouldShowTopics();
      },
      didToggleTopicsOn(nextValue) {
        this.calculateShouldShowTopics();
      },
      shouldShowTopics(nextValue) {
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
        const notMobile = windowWidth >= 768;
        const didToggleTopicsOn = this.$store.state.didToggleTopicsOn;
        const shouldShowTopics = notMobile || didToggleTopicsOn;
        this.$store.commit('setShouldShowTopics', shouldShowTopics);
      },

      handleWindowResize() {
        const rootElement = document.getElementById('mb-root');
        const rootStyle = window.getComputedStyle(rootElement);
        const rootHeight = rootStyle.getPropertyValue('height');
        const rootHeightNum = parseInt(rootHeight.replace('px', ''));
        const rootWidth = rootStyle.getPropertyValue('width');
        const rootWidthNum = parseInt(rootWidth.replace('px', ''));
        const obj = {
          height: rootHeightNum,
          width: rootWidthNum
        }

        console.log('handleWindowResize is running, this.$store.state.shouldShowTopics:', this.$store.state.shouldShowTopics);
        let boardHeight;
        if (!this.$store.state.shouldShowTopics) {
          boardHeight = rootHeightNum - 34;
          console.log('subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
        } else {
          boardHeight = rootHeightNum
          console.log('NOT subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
        }
        // this.$nextTick(() => {
        this.styleObject.height = boardHeight.toString() + 'px';
        // this.$store.state.map.map.invalidateSize();
        // })
        this.$store.commit('setWindowSize', obj) //= topicsHeight.toString() + 'px';
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

  @media (min-width: 1024px) {
    .mb-root {
      /*height: 100%;*/
      /*height: 800px;*/
    }
  }

  @media (min-width: 1024px) {
    .mb-root {
      /*height: 100%;*/
      /*height: 800px;*/
    }
  }

  .mb-root {
    /*height: 800px;*/
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

  /*small devices only*/
  @media screen and (max-width: 39.9375em) {
    /*TODO map is flowing off screen*/
    .mb-map-panel {
      top: 112.4063px;
    }

    /*.mb-panel-topics {
      display: none;
    }*/

    .datasets-button {
      display: block;
    }
  }

  .mb-panel {
    height: 100%;
  }

  .mb-panel-topics-with-widget {
    height: 50%;
  }
</style>
