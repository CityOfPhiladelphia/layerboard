<template>
  <div>
    <div class="div-row">
    <!-- <li> -->
      <a :href="'http://metadata.phila.gov/#home/representationdetails/' + this.bennyId"
      target="_blank"
      v-if="bennyId"
      >
        <span><i class="fa fa-info-circle fa-2x"></i></span>
      </a>
      <input :id="'checkbox-'+layerName"
             type="checkbox"
             :layerid="layerId"
             :disabled="shouldBeDisabled"
             :checked="webMapActiveLayers.includes(layerName)"
             @click="checkboxToggle"
      >
      <!-- <ul class="dropdown menu" data-dropdown-menu>
        <li>
          <a href="#"><span><i class="fa fa-ellipsis-v"></i></span></a>
          <ul class="menu" style="background: red">
            <li><a href="#">Item 1A</a></li>
          </ul>
        </li>
      </ul> -->
      <label :for="'checkbox-'+layerName"
             :class="{ disabled: shouldBeDisabled, 'label-text': true }"
      >
        {{ layerName }}
      </label>
    </div>
    <legend-box v-if="this.$store.state.map.webMapActiveLayers.includes(layerName)"
                :layer="layer"
                :layerName="layerName"
                :layerId="layerId"
                :layerDefinition="layerDefinition"
                :legend="legend"
                :scales="this.$config.map.scales"
      >
    </legend-box>
    <slider v-if="this.$store.state.map.webMapActiveLayers.includes(layerName)"
            :layer="layer"
            :layerName="layerName"
            :layerId="layerId"
            :opacity="opacity"
    >
    </slider>
    <!-- <div v-if="this.$store.state.map.webMapActiveLayers.includes(layerName)"
         class="sliderDiv"
         data-app="true"
    >
      <v-layout row wrap>
        <v-flex xs6>
            <v-slider v-model="opa"
                      class="ml-3 mr-3 pr-3 pt-0"
                      :id="layerName"
                      min=1
            >
            </v-slider>
        </v-flex>
      </v-layout> -->
      <!-- Want to download this dataset? -->
      <!-- <select v-if="this.$store.state.map.webMapActiveLayers.includes(layerName)"
              class="download-select"
      >
        <option>GeoJSON</option>
        <option>CSV</option>
        <option>KML</option>
      </select>
      <button class="button" v-if="this.$store.state.map.webMapActiveLayers.includes(layerName)"
      >
        Download
      </button> -->
    <!-- </div> -->
  <!-- </li> -->
  </div>
</template>

<script>
  import TopicComponent from './TopicComponent';
  import LegendBox from './LegendBox';
  import Slider from './Slider';

  export default {
    components: {
      LegendBox,
      Slider
    },
    props: ['layer',
            'layerName',
            'layerId',
            // minScale, maxScale, and drawingInfo are stored in layerDefinition
            'layerDefinition',
            'opacity',
            'legend'
    ],
    data() {
      return {
        opa: this.$props.opacity * 100
      }
    },
    watch: {
      opa(nextOpacity) {
        const payload = {
                          layerName: this.$props.layerName,
                          opa: nextOpacity/100
                        }
        // console.log('OPACITY CHANGED', payload);
        this.$store.commit('setWebMapLayersOpacity', payload);
      },
      shouldBeDisabled(nextShouldBeDisabled) {
        // console.log('watch shouldBeDisabled is firing:', this.$props.layerName, nextShouldBeDisabled);
        if (this.webMapActiveLayers.includes(this.$props.layerName) && nextShouldBeDisabled === true) {
          this.removeFromWebMapDisplayedLayers();
        } else if (this.webMapActiveLayers.includes(this.$props.layerName) && nextShouldBeDisabled === false) {
          this.addToWebMapDisplayedLayers();
        }
      }
    },
    // mounted() {
    //   // REVIEW globals. also is this still needed?
    //   $(document).foundation();
    // },
    computed: {
      scale() {
        return this.$store.state.map.scale;
      },
      shouldBeDisabled() {
        const def = this.$props.layerDefinition
        if (def) {
          if (def.minScale) {
            if (this.scale > def.minScale) {
              return true;
            } else {
              return false;
            }
          }
        } else {
          return false;
        }
      },
      layerUrls() {
        return this.$store.state.layers.layerUrls;
      },
      bennyEndpoints() {
        return this.$store.state.bennyEndpoints;
      },
      url() {
        return this.layerUrls[this.$props.layerName];
      },
      bennyId() {
        if (Object.keys(this.bennyEndpoints).length > 0) {
          const id = this.bennyEndpoints[this.url];
          // const id = this.bennyEndpoints[this.url]['Metadata'];
          return id;
        } else {
          return ' ';
        }
      },
      webMapActiveLayers() {
        return this.$store.state.map.webMapActiveLayers;
      },
      webMapDisplayedLayers() {
        return this.$store.state.map.webMapDisplayedLayers;
      }
    },
    methods: {
      checkboxToggle(e) {
        console.log('checkboxToggle', e.target, e.target.id, e.target.checked);
        const activeLayers = this.webMapActiveLayers;
        const displayedLayers = this.webMapDisplayedLayers;
        if (e.target.checked) {
          activeLayers.push(e.target.id.split('-')[1]);
          displayedLayers.push(e.target.id.split('-')[1]);
        } else {
          const activeIndex = activeLayers.indexOf(e.target.id.split('-')[1]);
          if (activeIndex >= 0) {
            activeLayers.splice(activeIndex, 1);
          }
          const displayedIndex = displayedLayers.indexOf(e.target.id.split('-')[1]);
          if (displayedIndex >= 0) {
            displayedLayers.splice(displayedIndex, 1);
          }
          // this.$store.commit('setIntersectingFeatures', []);
        }
        this.$store.commit('setWebMapActiveLayers', activeLayers);
        this.$store.commit('setWebMapDisplayedLayers', displayedLayers);
      },
      removeFromWebMapDisplayedLayers() {
        const displayedLayers = this.webMapDisplayedLayers;
        const index = displayedLayers.indexOf(this.$props.layerName);
        // console.log('layer', this.$props.layerName, 'is active, but now should not be displayed, index:', index);
        if (index >= 0) {
          displayedLayers.splice(index, 1);
        }
        this.$store.commit('setWebMapDisplayedLayers', displayedLayers);
      },
      addToWebMapDisplayedLayers() {
        // console.log('layer', this.$props.layerName, 'is active, and now should be displayed');
        const displayedLayers = this.webMapDisplayedLayers;
        displayedLayers.push(this.$props.layerName);
        this.$store.commit('setWebMapDisplayedLayers', displayedLayers);
      }
    }
  };
</script>

<style scoped>

  .disabled {
    color: #d3d3d3;
  }

  .sliderDiv {
    height: 60px;
  }

  .flex {
    margin-bottom: 16px;
  }


  .metadata-link {
    display: inline-block;
    height: 10px;
    width: 10px;
    /*border: solid;
    border-width: 1px;*/
  }

  .download-select {
    width: 200px;
  }


  .div-row {
    position: relative;
    margin-bottom: 12px;
  }

  input[type="checkbox"] {
    width: 25px; /*Desired width*/
    height: 25px; /*Desired height*/
    position: absolute;
    top: 50%;
    margin-top: -10px;
    margin-left: 32px;
    cursor: pointer;
    /*line-height: 15px;*/
    /*margin: 0;*/
    /*-webkit-appearance: none;*/
    /*appearance: none;*/
  }

  a {
    position: absolute;
    top: 50%;
    margin-top: -11px;
    /*margin-left: 25px;*/
  }

  .label-text {
    /*position: absolute;*/
    display: inline-block;
    /*top: 50%;*/
    margin-top: 4px;
    padding-left: 55px;
  }


</style>
