<template>
  <div>
    <li>
      <label :for="'checkbox-'+layerName"
             :class="{ disabled: shouldBeDisabled }"
      >
        <input :id="layerName"
               type="checkbox"
               :layerid="layerId"
               :disabled="shouldBeDisabled"
               :checked="webMapActiveLayers.includes(layerName)"
               @click=checkboxToggle
        >
        {{ layerName }}
        <a :href="'http://metadata.phila.gov/#home/representationdetails/' + this.bennyId"
           target="_blank"
           v-if="bennyId"
        >(metadata)
        </a>
      </label>
      <legend-box v-if="webMapActiveLayers.includes(layerName)"
        :layer="layer"
        :layerName="layerName"
        :layerId="layerId"
        :layerDefinition="layerDefinition"
        :legendHtml="legendHtml"
        >
      </legend-box>
      <div v-if="webMapActiveLayers.includes(layerName)"
           class="sliderDiv"
           data-app="true"
      >
        <v-layout row wrap>
          <v-flex xs6>
              <v-slider v-model="opa"
                        class="ml-3 mr-3 pr-3 pt-0"
                        :id="layerName"
              >
              </v-slider>
          </v-flex>
        </v-layout>
      </div>
    </li>
  </div>
</template>

<script>
  import TopicComponent from './TopicComponent';
  import LegendBox from './LegendBox';

  export default {
    components: {
      LegendBox
    },
    props: ['layer',
            'layerName',
            'layerId',
            // minScale, maxScale, and drawingInfo are stored in layerDefinition
            'layerDefinition',
            'opacity',
            'legendHtml'
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
      }
    },
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
        const id = this.bennyEndpoints[this.url];
        return id;
      },
      webMapActiveLayers() {
        return this.$store.state.map.webMapActiveLayers;
      },
    },
    methods: {
      checkboxToggle(e) {
        console.log('checkboxToggle', e.target, e.target.id, e.target.checked);
        const activeLayers = this.webMapActiveLayers;
        if (e.target.checked) {
          activeLayers.push(e.target.id);
        } else {
          const index = activeLayers.indexOf(e.target.id);
          if (index >= 0) {
            activeLayers.splice(index, 1);
          }
        }
        this.$store.commit('setWebMapActiveLayers', activeLayers);
      },
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

</style>
