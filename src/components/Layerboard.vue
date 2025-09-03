<template>
  <div
    id="mb-root"
    class="cell medium-auto grid-x"
  >
    <button
      class="small-24 button datasets-button"
      @click="toggleTopics"
    >
      {{ buttonMessage }}
    </button>

    <topic-panel v-show="shouldShowTopics" />

    <map-panel v-show="shouldShowMap">
      <cyclomedia-widget
        v-if="shouldLoadCyclomediaWidget"
        v-show="cyclomediaActive"
        slot="cycloWidget"
        screen-percent="3"
        :orientation="this.$config.cyclomedia.orientation"
      />
      <pictometry-widget
        v-if="shouldLoadPictometryWidget"
        v-show="pictometryActive"
        slot="pictWidget"
      >
        <pictometry-png-marker
          v-if="pictometryShowAddressMarker"
          :latlng="[geocodeData.geometry.coordinates[1], geocodeData.geometry.coordinates[0]]"
          :icon="'markers.png'"
          :height="60"
          :width="40"
          :offset-x="0"
          :offset-y="0"
        />
        <pictometry-layer v-if="pictometryActive" />
        <pictometry-png-marker
          v-if="cyclomediaActive && pictometryActive"
          :latlng="cycloLatlng"
          :icon="'camera2.png'"
          :height="20"
          :width="30"
          :offset-x="-2"
          :offset-y="-2"
        />
        <pictometry-view-cone
          v-if="cyclomediaActive && pictometryActive"
          :latlng="cycloLatlng"
          :rotation-angle="cycloRotationAngle"
          :h-fov="cycloHFov"
        />
      </pictometry-widget>
    </map-panel>

    <!-- <footer-test></footer-test> -->
    <popover
      v-if="popoverOpen"
      :options="popoverOptions"
      :slots="{ 'text': popoverText }"
    />
  </div>
</template>

<script>
import axios from 'axios';
import TopicPanel from './TopicPanel.vue';
import MapPanel from './MapPanel.vue';

export default {
  name: 'Layerboard',
  components: {
    TopicPanel,
    MapPanel,
    CyclomediaWidget: () => import(/* webpackChunkName: "mbmb_pvm_CyclomediaWidget" */'@phila/vue-mapping/src/cyclomedia/Widget.vue'),
    PictometryWidget: () => import(/* webpackChunkName: "mbmb_pvm_PictometryWidget" */'@phila/vue-mapping/src/pictometry/Widget.vue'),
    PictometryLayer: () => import(/* webpackChunkName: "mbmb_pvm_PictometryLayer" */'@phila/vue-mapping/src/pictometry/Layer.vue'),
    PictometryPngMarker: () => import(/* webpackChunkName: "mbmb_pvm_PictometryPngMarker" */'@phila/vue-mapping/src/pictometry/PngMarker.vue'),
    PictometryViewCone: () => import(/* webpackChunkName: "mbmb_pvm_PictometryViewCone" */'@phila/vue-mapping/src/pictometry/ViewCone.vue'),
    Popover: () => import(/* webpackChunkName: "mbmb_pvc_Popover" */'@phila/vue-comps/src/components/Popover.vue'),
  },
  computed: {
    popoverOpen() {
      return this.$store.state.popover.open;
    },
    popoverText() {
      return this.$store.state.popover.text;
    },
    popoverOptions() {
      return this.$store.state.popover.options;
    },
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
      return this.$store.state.cyclomedia.active;
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
      return this.$store.state.cyclomedia.orientation.yaw * (180 / 3.14159265359);
    },
    cycloHFov() {
      return this.$store.state.cyclomedia.orientation.hFov;
    },
    pictometryActive() {
      return this.$store.state.pictometry.active;
    },
    pictometryZoom() {
      return this.$store.state.pictometry.zoom;
    },
    pictometryShowAddressMarker() {
      if (!this.pictometryActive || !this.geocodeData) {
        return false;
      } else if (this.pictometryZoom < 20 && this.cyclomediaActive) {
        return false;
      }
      return true;
    },
    geocodeData() {
      return this.$store.state.geocode.data;
    },
    windowDim() {
      return this.$store.state.windowDimensions;
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
      }
      return 'See Datasets';
    },
    shouldShowTopics() {
      return this.$store.state.shouldShowTopics;
    },
    shouldShowMap() {
      return this.$store.state.shouldShowMap;
    },
  },
  watch: {
    pictometryShowAddressMarker(nextValue) {
    },
    windowDim(nextDim) {
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
    },
  },
  mounted() {
    let defaultLayers = [];

    if (this.$config.initialPopover && window.location.hash == '') {
      this.$store.commit('setPopoverOpen', true);
      this.$store.commit('setPopoverOptions', this.$config.initialPopover.options);
      if (this.$config.initialPopover.slots) {
        this.$store.commit('setPopoverText', this.$config.initialPopover.slots.text);
      }
    }

    if (this.$config.topics != undefined) {
      for (let topic of this.$config.topics) {
        for (let component of topic.components) {
          if (component.type === 'checkbox-set' || component.type === 'radio-button-set') {
            defaultLayers = defaultLayers.concat(component.options.defaultTopicLayers);
          }
        }
      }
    }

    this.$store.commit('setDefaultLayers', defaultLayers);
    this.$store.commit('setWebMapActiveLayers', defaultLayers);

    if (this.$config.defaultPanel) {
      if (this.$config.defaultPanel === 'topics') {
        this.$store.commit('setDidToggleTopicsOn', true);
      }
    }

    if (this.$config.dataSources) {
      this.$controller.dataManager.fetchData();
    }

    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();

    const store = this.$store;
    const cartoUrlQuery = `https://phl.carto.com:443/api/v2/sql?q= \
    select url_text, COALESCE(representation, '') as representation \
    from phl.knack_metadata_reps_endpoints_join \
    WHERE ( format = 'API' OR format = 'GeoService' ) \
    AND url_text IS NOT null`;

    axios.get(cartoUrlQuery).then(response => {
      const data = response.data.rows;
      let bennyEndpoints = {};
      data.map((datum) => {
        const shortUrl = datum.url_text.split('query')[0].replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
        bennyEndpoints[shortUrl] = datum.representation;
      });
      store.commit('setBennyEndpoints', bennyEndpoints);
    }, () => {
      console.log('AXIOS ERROR Layerboard.vue');
    });
  },
  methods: {
    // for mobile only
    toggleTopics() {
      const prevVal = this.$store.state.didToggleTopicsOn;
      this.$store.commit('setDidToggleTopicsOn', !prevVal);
    },
    calculateShouldShowTopics() {
      const windowWidth = this.windowDim.width;
      const smallScreen = windowWidth < 750;
      const didToggleTopicsOn = this.$store.state.didToggleTopicsOn;
      const fullScreenMapEnabled = this.$store.state.fullScreenMapEnabled;
      const shouldShowTopics = !smallScreen && !fullScreenMapEnabled || smallScreen && didToggleTopicsOn;
      this.$store.commit('setShouldShowTopics', shouldShowTopics);
    },
    calculateShouldShowMap() {
      const windowWidth = this.windowDim.width;
      const notMobile = windowWidth > 750;
      const didToggleTopicsOn = this.$store.state.didToggleTopicsOn;
      const shouldShowMap = notMobile || !didToggleTopicsOn;
      this.$store.commit('setShouldShowMap', shouldShowMap);
    },
    handleWindowResize() {
      const windowHeight = window.innerHeight;
      const rootElement = document.getElementById('mb-root');
      const rootStyle = window.getComputedStyle(rootElement);
      const rootWidth = rootStyle.getPropertyValue('width');
      const rootHeight = rootStyle.getPropertyValue('height');
      const rootWidthNum = parseInt(rootWidth.replace('px', ''));
      const rootHeightNum = parseInt(rootHeight.replace('px', ''));
      const dim = {
        width: rootWidthNum,
        height: rootHeightNum,
      };
      this.$store.commit('setWindowDimensions', dim);
    },
  },
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
  height: 36px;
  margin: 0;
}

/*small devices only*/
/* @media screen and (max-width: 39.9375em) { */
@media screen and (max-width: 750px) {
  .datasets-button {
    display: block;
    height: 36px;
  }
}
</style>
