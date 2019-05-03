<template>
  <div id="topic-panel-container"
       :class="this.topicPanelContainerClass"
  >
    <div class="forms-header"
         v-show="!!this.$config.layerFilter"
    >
      <!-- tags filter -->
      <form @submit.prevent="handleTagsFilterFormX"
            @keydown="preventEnter"
            class="om-search-control-input-tags"
      >
        <div class="input-group text-filter">
          <span class="input-group-label input-font">Filter:</span>
          <input
                 type="text"
                 class="input-type"
                 @keyup="handleTagsFilterFormKeyup"
          />
          <!-- placeholder="Filter datasets" -->
          <div class="input-group-button"
               v-if="this.$store.state.layers.inputTagsFilter != ''"
          >

            <button class="om-search-control-button">
              <i class="fa fa-times fa-lg"></i>
            </button>
          </div>
        </div>
      </form>
    </div>

    <div class="topics-container cell medium-cell-block-y"
         id="topics-container"
         :style="topicsContainerStyle"
    >
      <topic-component-group :topic-components="this.appComponents" />
    </div>

  </div>
</template>

<script>

  // import Checkbox from '@philly/vue-mapping/src/esri-leaflet/Checkbox.vue';
  import Topic from '@philly/vue-comps/src/components/Topic.vue';
  import TopicComponentGroup from '@philly/vue-comps/src/components/TopicComponentGroup.vue';

  export default {
    components: {
      // Checkbox,
      TopicComponentGroup,
      Topic
      // Checkbox: () => import(/* webpackChunkName: "lbmp_pvm_Checkbox" */'@philly/vue-mapping/src/esri-leaflet/Checkbox.vue'),
    },
    data() {
      const data = {
        topicsContainerStyle: {
          'overflow-y': 'auto',
          'height': '100px',
          'min-height': '100px',
        }
      };
      return data;
    },
    watch: {
      windowDim(nextDim) {
        this.handleWindowResize(nextDim);
      }
    },
    computed: {
      windowDim() {
        return this.$store.state.windowDimensions;
      },
      appComponents() {
        if (this.$config.components) {
          return this.$config.components;
        } else {
          // if no components, use a single 'checkbox-set'
          return [{ type: 'checkbox-set' }];
        }
      },
      fullScreenMapEnabled() {
        return this.$store.state.fullScreenMapEnabled;
      },
      topicPanelContainerClass() {
        if (this.fullScreenMapEnabled) {
          return 'cell medium-1 small-order-2 medium-order-1'
        } else if (this.windowDim.width >= 950) {
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
      inputLayerFilter() {
        return this.$store.state.layers.inputLayerFilter;
      },
      inputTagsFilter() {
        return this.$store.state.layers.inputTagsFilter;
      },
      windowSize() {
        return this.$store.state.windowSize;
      },
    },
    methods: {
      handleLayerFilterFormKeyup(e) {
        const input = e.target.value;
        this.$store.commit('setInputLayerFilter', input);
      },
      handleLayerFilterFormX(e) {
        e.target[0].value = ''
        this.$store.commit('setInputLayerFilter', '');
      },
      handleTagsFilterFormKeyup(e) {
        const input = e.target.value;
        // if (input.length >= 3) {
        this.$store.commit('setInputTagsFilter', input);
        // } else {
          // this.$store.commit('setInputLayerFilter', null);
        // }
      },
      handleTagsFilterFormX(e) {
        e.target[0].value = ''
        this.$store.commit('setInputTagsFilter', '');
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
      handleWindowResize(dim) {
        // console.log('TopicPanel handleWindowResize, dim:', dim);
        const windowHeight = window.innerHeight;
        const siteHeaderHeightNum = parseInt(document.getElementsByClassName('site-header')[0].getBoundingClientRect().height);
        const appFooterHeightNum = parseInt(document.getElementsByClassName('app-footer')[0].getBoundingClientRect().height);
        const datasetsButtonHeightNum = parseInt(document.getElementsByClassName('datasets-button')[0].getBoundingClientRect().height);
        const formsHeaderHeightNum = parseInt(document.getElementsByClassName('forms-header')[0].getBoundingClientRect().height);
        // console.log('TopicPanel handleWindowResize is running, formsHeaderHeightNum:', formsHeaderHeightNum);
        let topicsHeight = windowHeight - siteHeaderHeightNum - appFooterHeightNum - datasetsButtonHeightNum - formsHeaderHeightNum;
        // console.log('topicsHeight:', topicsHeight);

        // let topicsHeight = dim.height;

        this.topicsContainerStyle.height = topicsHeight.toString() + 'px';
        this.topicsContainerStyle['min-height'] = topicsHeight.toString() + 'px';
        this.topicsContainerStyle['overflow-y'] = 'auto';
      }
    },
  };
</script>

<style scoped>
  .forms-header {
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

  .topics-container {
    padding: 20px;
    overflow-y: auto;
  }

  .topics-container {
    /* height: calc(100vh - 220px); */
    /* height: calc(100vh - 268px); */

    /* height: calc(100vh - 218px); */

    /* height: calc(100vh - 170px); */
    height: calc(100vh - 110px);
  }

  /* @media screen and (max-width: 40em) { */
  @media screen and (max-width: 750px) {
    .topics-container {
      /* height: calc(100vh - 256px); */

      /* height: calc(100vh - 300px); */
      height: calc(100vh - 140px);
    }
  }

  .om-search-control-container {
    border-radius: 2px;
    box-shadow:0 2px 4px rgba(0,0,0,0.2),0 -1px 0px rgba(0,0,0,0.02);
    margin-top: 10px;
    margin-bottom: 10px;
    width: inherit;
  }

  .om-search-control-button {
    width: 40px;
    background: #ccc;
    float: right;
  }

  .om-search-control-input {
    font-family: 'Montserrat', 'Tahoma', sans-serif;
    font-size: 16px;
  }

  .om-search-control-input-tags {
    font-family: 'Montserrat', 'Tahoma', sans-serif;
    font-size: 16px;
  }

  .input-font {
    font-family: 'Montserrat', 'Tahoma', sans-serif;
    font-size: 16px;
  }

</style>
