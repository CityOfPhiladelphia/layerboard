<template>
  <div class="large-6 columns mb-panel mb-panel-topics">
    <div class="row">
    <!-- <v-layout column> -->
      <!-- <v-flex xs12> -->
      <div class="mb-search-control-container">
        <!-- <div class="control-spacer"> -->
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
        <!-- </div> -->
      </div>
      <!-- </v-flex xs12> -->
    <!-- </v-layout row wrap>


    <v-layout row wrap> -->
      <!-- <v-flex xs12> -->
      <div class="topics-container"
           id="topics-container"
           :style="styleObject"
      >
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
                        :key="index"
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
    <!-- </v-layout> -->
    </div>
  </div>
</template>

<script>
  import Checkbox from './topic-components/Checkbox';

  export default {
    components: {
      Checkbox
    },
    data() {
      const data = {
        styleObject: {
          'position': 'relative',
          // 'top': '100px',
          'overflow-y': 'auto',
          'height': '100px'
        }
      };
      return data;
    },
    mounted() {
      window.addEventListener('resize', this.handleWindowResize);
      this.handleWindowResize();
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.handleWindowResize);
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
      },
      handleWindowResize() {
        console.log('handleWindowResize is running');
        const rootElement = document.getElementById('mb-root');
        console.log('rootElement', rootElement);
        const rootStyle = window.getComputedStyle(rootElement);
        const rootHeight = rootStyle.getPropertyValue('height');
        const rootHeightNum = parseInt(rootHeight.replace('px', ''));
        const topicsHeight = rootHeightNum - 70;
        this.styleObject.height = topicsHeight.toString() + 'px';
      }
    },
  };
</script>

<style scoped>

  ul {
    padding: 0;
  }

  /*.topic-header {
    background: #f5f5f5;
    border: 1px solid #ddd;
    display: block;
    font-size: 18px;
    font-weight: normal;
    height: 40px;
    line-height: 20px;
    padding: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    margin-bottom: 8px;
  }
  .topic-header:hover {
    background: #fff;
    color: inherit;
  }
  .topic-header-icon {
    padding-left: 10px;
    padding-right: 10px;
  }
  .topic-body {
    padding-left: 10px;
    /*margin-bottom: 20px;
  }*/
  .loading {
    float: right;
  }
  /*.scroll {overflow:auto;}
  .scroll::-webkit-scrollbar {
    width:16px;
    height:16px;
    background:inherit;
  }
  .scroll::-webkit-scrollbar-track:vertical {
    border-right:8px solid rgba(0,0,0,.2);
  }
  .scroll::-webkit-scrollbar-thumb:vertical {
    border-right:8px solid rgba(255,255,255,.2);
  }
  .scroll::-webkit-scrollbar-track:horizontal {
    border-bottom:8px solid rgba(0,0,0,.2);
  }
  .scroll::-webkit-scrollbar-thumb:horizontal {
    border-bottom:8px solid rgba(255,255,255,.2);
  }
  .scroll::-webkit-scrollbar-corner,
    .scroll::-webkit-resizer {background:inherit;
    border-right:8px solid rgba(255,255,255,.2); //optional
    border-bottom:8px solid rgba(255,255,255,.2); //optional
  }*/

  .mb-panel-topics {
    background: #fff;
    padding-left: 20px !important;
    padding-right: 5px !important;
    /*overflow-y: auto;*/
  }

  .control-spacer {
    position: absolute;
    /*left: -5px;*/
    height: 50px;
    width: 20%;
    background-color: white;
  }

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
