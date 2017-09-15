<template>
  <div id="topic-panel"
       class="mb-panel mb-panel-topics"
  >
    <v-layout column>
      <!-- <v-flex xs12> -->
        <div class="mb-search-control-container">
          <form @submit.prevent="handleFilterFormX"
                @keydown="preventEnter"
          >
              <input class="mb-search-control-input"
                     placeholder="Search for layers"
                     id="theInput"
                     @keyup="handleFilterFormKeyup"
              />
              <button class="mb-search-control-button"
                      v-if="this.$store.state.layers.inputLayerFilter != ''"
              >
                <i class="fa fa-times fa-lg"></i>
              </button>
          </form>
        </div>
      <!-- </v-flex xs12> -->
    <!-- </v-layout row wrap>


    <v-layout row wrap> -->
      <!-- <v-flex xs12> -->
        <div class="topic-body">
          <form action="#/">
            <fieldset class="options">
              <ul class="no-bullet">
                <checkbox v-for="(currentWmLayer, index) in this.currentWmLayers"
                          :layer="currentWmLayer.layer"
                          :layerName="currentWmLayer.title"
                          :layerId="currentWmLayer.id"
                          :layerDefinition="currentWmLayer.rest.layerDefinition"
                          :opacity="currentWmLayer.opacity"
                          :legend="currentWmLayer.legend"
                          :key=index
                >
                </checkbox>
              </ul>
            </fieldset>
          </form>
        </div>


        <!-- <div class="topic-body">
          <v-list class="no-bullet">
            <v-checkbox v-for="(currentWmLayer, index) in this.currentWmLayers"
                      :layer="currentWmLayer.layer"
                      :layerName="currentWmLayer.title"
                      :layerId="currentWmLayer.id"
                      :layerDefinition="currentWmLayer.rest.layerDefinition"
                      :opacity="currentWmLayer.opacity"
                      :legendHtml="currentWmLayer.legendHtml"
                      :key=index
            >
          </v-checkbox>
        </v-list>
        </div> -->


      <!-- </v-flex> -->
    </v-layout>
  </div>
</template>

<script>
  import Checkbox from './topic-components/Checkbox';

  export default {
    components: {
      Checkbox
    },
    computed: {
      scale() {
        return this.$store.state.map.scale;
      },
      currentWmLayers() {
        const layers = this.$store.state.map.webMapLayersAndRest;
        let currentLayers = [];
        for (let layer of layers) {
          if (layer.title.toLowerCase().includes(this.inputLayerFilter.toLowerCase()) || this.webMapActiveLayers.includes(layer.title)) {
            currentLayers.push(layer)
          }
        }
        return currentLayers;
      },
      webMapActiveLayers() {
        return this.$store.state.map.webMapActiveLayers;
      },
      inputLayerFilter() {
        return this.$store.state.layers.inputLayerFilter;
      },
    },
    methods: {
      handleFilterFormKeyup(e) {
        console.log('keyup', e.target.value);
        const input = e.target.value;
        // if (input.length >= 3) {
        this.$store.commit('setInputLayerFilter', input);
        // } else {
          // this.$store.commit('setInputLayerFilter', null);
        // }
      },
      handleFilterFormX(e) {
        // const input = e.target[0].value;
        // this.$store.commit('setInputLayerFilter', input);
        e.target[0].value = ''
        this.$store.commit('setInputLayerFilter', '');
      },
      preventEnter(e) {
        if(e.keyCode === 13) {
          e.preventDefault();
        }
      }
    },
  };
</script>

<style scoped>

  ul {
    padding: 0;
  }

  .loading {
    float: right;
  }

  .mb-panel-topics {
    height: 100%;
    position: relative;
    background: #fff;
    padding-left: 20px !important;
    padding-right: 5px !important;
    overflow-y: auto;
  }

  /*this allows the loading mask to fill the div*/
  /*.mb-panel-map {
    position: relative;
  }*/

  /*@media (max-width: 1024px) {
    .mb-panel-map {
      height: 600px;
    }
  }*/

  .mb-search-control-container {
    height: 48px;
    border-radius: 2px;
    box-shadow:0 2px 4px rgba(0,0,0,0.2),0 -1px 0px rgba(0,0,0,0.02);
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .mb-search-control-button {
    width: 50px;
    background: #ccc;
    line-height: 48px;
    float: right;
  }

  .mb-search-control-input {
    border: 0;
    height: 48px !important;
    line-height: 48px;
    padding: 10px;
    padding-left: 15px;
    padding-right: 15px;
    font-family: 'Montserrat', 'Tahoma', sans-serif;
    font-size: 16px;
    width: 300px;
  }

</style>
