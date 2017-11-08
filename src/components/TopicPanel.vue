<template>
  <div class="medium-12 large-8 columns mb-panel mb-panel-topics"
       id="mb-panel-topics"
  >
    <div class="row">
      <div class="control-spacer">
        <div class="mb-search-control-container">
            <form @submit.prevent="handleFilterFormX"
                  @keydown="preventEnter"
            >
                <input class="mb-search-control-input"
                       placeholder="Filter datasets"
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
      </div>

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
                        :key="currentWmLayer.id"
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
          'top': '10px',
          'overflow-y': 'auto',
          'height': '100px'
        }
      };
      return data;
    },
    mounted() {
      // window.addEventListener('resize', this.handleWindowResize);
      this.handleWindowSizeChange();
    },
    // beforeDestroy() {
    //   window.removeEventListener('resize', this.handleWindowResize);
    // },
    computed: {
      scale() {
        return this.$store.state.map.scale;
      },
      currentWmLayers() {
        const layers = this.$store.state.map.webMapLayersAndRest;
        let currentLayers = [];
        for (let layer of layers) {
          if (layer.title.toLowerCase().includes(this.inputLayerFilter.toLowerCase()) || this.$store.state.map.webMapActiveLayers.includes(layer.title)) {
            currentLayers.push(layer)
          }
        }
        return currentLayers;
      },
      // webMapActiveLayers() {
      //   console.log('topic panel webMapActiveLayers is recalculating');
      //   return this.$store.state.map.webMapActiveLayers;
      // },
      inputLayerFilter() {
        return this.$store.state.layers.inputLayerFilter;
      },
      windowSize() {
        return this.$store.state.windowSize;
      },
    },
    watch: {
      windowSize(nextSize) {
        this.handleWindowSizeChange(nextSize);
      }
    },
    methods: {
      handleFilterFormKeyup(e) {
        // console.log('keyup', e.target.value);
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
      handleWindowSizeChange(nextSize) {
        // let width;
        if (!nextSize) {
          nextSize = this.$store.state.windowSize;
        }
          // width = window.innerWidth;
          // const rootElement = document.getElementById('mb-panel-topics');
          // const rootStyle = window.getComputedStyle(rootElement);
          // const rootHeight = rootStyle.getPropertyValue('height');
          // const rootHeightNum = parseInt(rootHeight.replace('px', ''));
          // const rootHeightNum = this.$store.state.windowSize.height;
        // } else {
        //   // width = nextSize.width;
        // }
        const notMobile = nextSize.width >= 640;
        // console.log('handleWindowResize is running, windowWidth:', windowWidth, 'notMobile:', notMobile, 'this.$store.state.shouldShowTopics:', this.$store.state.shouldShowTopics);
        let topicsHeight;
        if (!notMobile) {
          topicsHeight = nextSize.height - 108;
          // console.log('subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
        } else {
          topicsHeight = nextSize.height - 74;
          // console.log('NOT subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
        }
        // const topicsHeight = nextSize.height - 74;
        console.log('handleWindowSizeChange is running, topicsHeight:', topicsHeight);
        this.styleObject.height = topicsHeight.toString() + 'px';
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
    background: #fff;
    padding-left: 20px !important;
    padding-right: 5px !important;
    /*overflow-y: auto;*/
  }

  .control-spacer {
    /*position: absolute;*/
    /*left: -5px;*/
    height: 50px;
    width: inherit;
    /*width: 20%;*/
    background-color: white;
  }

  .mb-search-control-container {
    height: 48px;
    border-radius: 2px;
    box-shadow:0 2px 4px rgba(0,0,0,0.2),0 -1px 0px rgba(0,0,0,0.02);
    margin-top: 10px;
    margin-bottom: 10px;
    width: inherit;
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
    width: inherit;
    /*width: 300px;*/
  }

</style>
