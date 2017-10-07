<template>
  <!-- <div id="mainDiv">
    <v-layout>
      <v-flex xs3>
        <topic-panel>
        </topic-panel>
      </v-flex>
      <v-flex xs9> -->
  <div class="mb-root row collapse"
       :style="this.$config.rootStyle"
  >
    <topic-panel>
    </topic-panel>
    <map-panel>
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
      <!-- </v-flex>
    </v-layout> -->
  </div>
</template>

<script>
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
    mounted() {
      const store = this.$store;
      $.ajax({
        dataType: 'json',
        url: "https://api.knackhq.com/v1/objects/object_4/records/export?type=json",
        headers: {
          'X-Knack-Application-Id': '550c60d00711ffe12e9efc64',
          'X-Knack-REST-API-Key': '7bce4520-28dc-11e5-9f0a-4d758115b820'
        },
        success(dataOut) {
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
          // console.log('mapboard mounted, bennyEndpoints:', bennyEndpoints);
          store.commit('setBennyEndpoints', bennyEndpoints);
        }
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
      }
    },
    watch: {
      pictometryShowAddressMarker(nextValue) {
        console.log('watch pictometryShowAddressMarker', nextValue);
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
    /*position: absolute;
    bottom: 0;*/
  }

  .mb-panel {
    height: 100%;
  }

  .mb-panel-topics-with-widget {
    height: 50%;
  }
</style>
