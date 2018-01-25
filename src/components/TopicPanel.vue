<template>
  <div id="topic-panel-container"
       :class="this.topicPanelContainerClass"
  >
  <!-- class="cell medium-8 small-order-2 medium-order-1" -->
      <div class="cell">
        <div class="forms-header">
          <form @submit.prevent="handleFilterFormX"
                @keydown="preventEnter"
                class="mb-search-control-input"
          >
            <div class="input-group text-filter">
              <span class="input-group-label input-font">Filter By Text:</span>
              <input
                     type="text"
                     class="input-type"
                     @keyup="handleFilterFormKeyup"
              />
              <!-- placeholder="Filter datasets" -->
              <div class="input-group-button"
                   v-if="this.$store.state.layers.inputLayerFilter != ''"
              >

                <button class="mb-search-control-button">
                <!-- <input type="submit" class="button" value="X"> -->
                <!-- v-if="this.$store.state.layers.inputLayerFilter != ''" -->
                  <i class="fa fa-times fa-lg"></i>
                </button>
              </div>
            </div>
          </form>
          <div class="input-group">
            <span class="input-group-label input-font">Filter By Category:</span>

            <select @change="didSelectCategory"
                    class="input-select"
            >
              <option v-for="category in this.categories"
                      value="category"
              >
                {{ category }}
              </option>
            </select>
          </div>
        </div>
      <!-- </div> -->

        <div class="topics-container cell medium-cell-block-y"
             id="topics-container"
        >
          <form action="#/">
            <fieldset class="options">
              <!-- <ul class="no-bullet"> -->
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
              <!-- </ul> -->
            </fieldset>
          </form>
        </div>

      </div>

  </div>
</template>

<script>
  import Checkbox from './topic-components/Checkbox';

  export default {
    components: {
      Checkbox
    },
    // data() {
    //   const data = {
    //     styleObject: {
    //       'position': 'relative',
    //       'top': '10px',
    //       'overflow-y': 'auto',
    //       'height': '100px'
    //     }
    //   };
    //   return data;
    // },
    mounted() {
      console.log('topicPanel mounted');
      // window.addEventListener('resize', this.handleWindowResize);
      // this.handleWindowSizeChange();
    },
    // beforeDestroy() {
    //   window.removeEventListener('resize', this.handleWindowResize);
    // },
    computed: {
      windowWidth() {
        return this.$store.state.windowWidth;
      },
      fullScreenMapEnabled() {
        return this.$store.state.fullScreenMapEnabled;
      },
      topicPanelContainerClass() {
        if (this.fullScreenMapEnabled) {
          return 'cell medium-1 small-order-2 medium-order-1'
        } else if (this.windowWidth >= 950) {
          return 'cell medium-8 small-order-1 small-24 medium-order-2';
        } else {
          return 'cell medium-10 small-order-1 small-24 medium-order-2';
        }
      },
      categories() {
        return this.$store.state.map.categories;
      },
      selectedCategory() {
        return this.$store.state.map.selectedCategory;
      },
      scale() {
        return this.$store.state.map.scale;
      },
      currentWmLayers() {
        const layers = this.$store.state.map.webMapLayersAndRest;
        let currentLayers = [];
        for (let layer of layers) {
          if (layer.title.toLowerCase().includes(this.inputLayerFilter.toLowerCase()) && layer.category.includes(this.selectedCategory) || this.$store.state.map.webMapActiveLayers.includes(layer.title)) {
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
    // watch: {
    //   windowSize(nextSize) {
    //     this.handleWindowSizeChange(nextSize);
    //   }
    // },
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
      didSelectCategory(e) {
        const selected = e.target.selectedIndex;
        this.$store.commit('setSelectedCategory', this.categories[selected]);
      },
      preventEnter(e) {
        if(e.keyCode === 13) {
          e.preventDefault();
        }
      },
      // handleWindowSizeChange(nextSize) {
      //   // let width;
      //   if (!nextSize) {
      //     nextSize = this.$store.state.windowSize;
      //   }
      //     // width = window.innerWidth;
      //     // const rootElement = document.getElementById('mb-panel-topics');
      //     // const rootStyle = window.getComputedStyle(rootElement);
      //     // const rootHeight = rootStyle.getPropertyValue('height');
      //     // const rootHeightNum = parseInt(rootHeight.replace('px', ''));
      //     // const rootHeightNum = this.$store.state.windowSize.height;
      //   // } else {
      //   //   // width = nextSize.width;
      //   // }
      //   const notMobile = nextSize.width >= 640;
      //   // console.log('handleWindowResize is running, windowWidth:', windowWidth, 'notMobile:', notMobile, 'this.$store.state.shouldShowTopics:', this.$store.state.shouldShowTopics);
      //   let topicsHeight;
      //   if (!notMobile) {
      //     topicsHeight = nextSize.height - 148;
      //     // topicsHeight = nextSize.height - 108;
      //     // console.log('subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
      //   } else {
      //     topicsHeight = nextSize.height - 114;
      //     // topicsHeight = nextSize.height - 74;
      //     // console.log('NOT subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
      //   }
      //   // const topicsHeight = nextSize.height - 74;
      //   // console.log('handleWindowSizeChange is running, topicsHeight:', topicsHeight);
      //   this.styleObject.height = topicsHeight.toString() + 'px';
      // }
    },
  };
</script>

<style scoped>
  .forms-header {
    /* background: #daedfe;
    color: #0f4d90; */
    padding: 5px;

    /*this keeps the box shadow over the scrollable part of the panel*/
    position: relative;
    z-index: 1;

    -webkit-box-shadow: 0px 5px 7px -2px rgba(0,0,0,0.18);
    -moz-box-shadow: 0px 5px 7px -2px rgba(0,0,0,0.18);
    box-shadow: 0px 5px 7px -2px rgba(0,0,0,0.18);
  }

  .input-type {
    margin-bottom: 0px;
  }

  .input-select {
    margin-bottom: 0px;
  }

  .input-group {
    height: 40px !important;
    margin-top: 6px;
    margin-bottom: 6px;
  }

  .input-group-label {
    border-right: 1px;
    border-style: solid;
    padding-left: 8px;
    padding-right: 8px;
    padding-top: 0px;
    padding-bottom: 0px;
    height: 20px !important;
  }

  /* .address-header-line-1 {
    margin-bottom: 0;
    margin-top: 0;
  } */

  .topics-container {
    padding: 20px;
    overflow-y: scroll;
  }

  .topics-container {
    height: calc(100vh - 220px);
  }

  /* @media screen and (max-width: 40em) { */
  @media screen and (max-width: 750px) {
    .topics-container {
      height: calc(100vh - 256px);
    }
  }

  /* ul {
    padding: 0;
  }

  .loading {
    float: right;
  }
*/
  /* #topic-panel-container {
    background: #fff;
    padding-left: 20px !important;
    padding-right: 5px !important;
  } */
/*
  .control-spacer {
    height: 90px;
    width: inherit;
    background-color: white;
  }
*/
  .mb-search-control-container {
    /* height: 48px; */
    border-radius: 2px;
    box-shadow:0 2px 4px rgba(0,0,0,0.2),0 -1px 0px rgba(0,0,0,0.02);
    margin-top: 10px;
    margin-bottom: 10px;
    width: inherit;
  }

  .mb-search-control-button {
    width: 40px;
    background: #ccc;
    /* line-height: 39px; */
    float: right;
  }

  .mb-search-control-input {
    /* border: 0; */
    /* height: 48px !important;
    line-height: 48px; */
    /* padding: 10px; */
    /* padding-left: 15px;
    padding-right: 15px; */
    font-family: 'Montserrat', 'Tahoma', sans-serif;
    font-size: 16px;
    /* width: inherit; */
  }

  .input-font {
    font-family: 'Montserrat', 'Tahoma', sans-serif;
    font-size: 16px;
  }

  /* .text-filter {
    margin-top: 10px;
    margin-bottom: 10px;
  } */

</style>
