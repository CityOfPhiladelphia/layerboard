<template>
  <div class="cell medium-auto grid-x" id="mb-root">
    <button class="small-24 button datasets-button"
            @click="toggleTopics"
    >
      {{ this.buttonMessage }}
    </button>

      <topic-panel v-show="shouldShowTopics"
      />

      <map-panel v-show="shouldShowMap"
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
          <view-cone v-if="this.cyclomediaActive && this.pictometryActive"
                     :orientation="this.$store.state.cyclomedia.viewer.props.orientation"
          />
        </pictometry-widget>
      </map-panel>
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
    // data() {
    //   const data = {
    //     styleObject: {
    //       'overflow-y': 'auto',
    //       'height': '100%'
    //     }
    //   };
    //   return data;
    // },
    created() {
      // check if mobile or tablet
      this.$store.commit('setIsMobileOrTablet', this.isMobileOrTablet());
    },
    mounted() {
      console.log('cyclo', this.$config.cyclomedia.enabled, CyclomediaWidget);
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
        console.log('AXIOS ERROR Mapboard.vue');
      });
    },
    computed: {
      fullScreenMapEnabled() {
        return this.$store.state.fullScreenMapEnabled;
      },
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
      isMobileOrTablet() {
        const mobileOrTabletRegexA = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
        const mobileOrTabletRegexB = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;

        // get the user agent and test against both regex patterns
        const userAgent = (navigator.userAgent || navigator.vendor || window.opera || '');
        const isMobileOrTablet = mobileOrTabletRegexA.test(userAgent) || mobileOrTabletRegexB.test(userAgent.substr(0,4));

        return isMobileOrTablet;
      },
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
        console.log('calculateShouldShowTopics, smallScreen:', smallScreen, 'didToggleTopicsOn', didToggleTopicsOn, 'fullScreenMapEnabled', fullScreenMapEnabled);
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
        console.log('handleWindowResize is running, windowWidth:', windowWidth, 'notMobile:', notMobile, 'this.$store.state.shouldShowTopics:', this.$store.state.shouldShowTopics);
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
