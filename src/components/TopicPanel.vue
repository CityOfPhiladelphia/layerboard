<template>
  <div class="large-6 columns mb-panel mb-panel-topics">
    <div class="row">
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
                    v-if="this.$store.state.topics.inputLayerFilter != ''"
            >
              <i class="fa fa-times fa-lg"></i>
            </button>
        </form>
      </div>

      <div class="topic-body">
        <form action="#/">
          <fieldset class="options">
            <ul class="no-bullet">
              <checkbox v-for="(layer, index) in this.wmLayers"
                        :layer="layer.title.split('_')[1]"
                        :shouldBeDisabled="shouldBeDisabled(layer)"
                        :index=index
                        :key=index
              >
              <!-- :topicKey=topicKey -->
              </checkbox>
            </ul>
          </fieldset>
        </form>
      </div>
      <!-- error -->
      <div class="topic-body" v-show="shouldShowError">
        Could not locate records for that address.
      </div>

      <!-- <topic v-for="(topic, key) in currentTopicLayerMap"
             :topicLayerMap = currentTopicLayerMap
             :topicKey="key"
             :key="key"
      /> -->
    </div>
  </div>
</template>

<script>
  // import Topic from './Topic';
  import Checkbox from './topic-components/Checkbox';

  export default {
    components: {
      // Topic
      Checkbox
    },
    computed: {
      scale() {
        return this.$store.state.map.scale;
      },
      wmLayers() {
        const layers = this.$store.state.map.webMapLayersAndRest;
        // const layersFilt = layers.filter(layer => layer.title.split('_')[0] === this.$props.topicKey && this.$props.topiclayerMap[this.$props.topicKey].includes(layer.title.split('_')[1]));
        // const layersFilt = layers.filter(layer => this.$props.topicLayerMap[this.$props.topicKey].includes(layer.title.split('_')[1]));
        return layers;
        // return this.$store.state.map.webMapLayersAndRest.filter(title => title.split('_')[0] === topicKey);
      },
      // topic() {
      //   const topicKey = this.$props.topicKey;
      //   let topic = {
      //     key: topicKey,
      //   }
      //   return topic;
      // },
      webMapActiveLayers() {
        return this.$store.state.map.webMapActiveLayers;
      },
      inputLayerFilter() {
        return this.$store.state.topics.inputLayerFilter;
      },


      shouldShowTopic() {
        return true;
      },
      isActive() {
        const key = this.topic.key;
        const activeTopics = this.$store.state.activeTopics;
        return activeTopics.includes(key);
      },
      shouldShowHeader() {
        return this.$config.topics.length > 1;
      },
      // dataSources() {
      //   return this.topic.dataSources || [];
      // },
      // hasData() {
      //   return this.dataSources.every(dataSource => {
      //     const targetsFn = this.$config.dataSources[dataSource].targets
      //     if (targetsFn) {
      //       const targetsMap = this.$store.state.sources[dataSource].targets;
      //       const targets = Object.values(targetsMap);
      //       return targets.every(target => target.status !== 'waiting');
      //     } else {
      //       return this.$store.state.sources[dataSource].data;
      //     }
      //   });
      // },
      shouldShowBody() {
        // const succeeded = this.status === 'success';
        // const hasData = this.hasData;
        // const should = succeeded && hasData && this.isActive;
        const should = this.isActive || this.inputLayerFilter.length > 1;
        return should;
      },
      shouldShowError() {
        // console.log('shouldShowError', this.topic.label, this);
        return this.status === 'error' || (this.status !== 'waiting')// && !this.hasData);
      },
      // REVIEW this is getting cached and not updating when the deps update
      // status: {
      //   cache: false,
      //   get() {
      //     // get the status of each source
      //     const dataSources = this.topic.dataSources || [];
      //
      //     // if no sources, return success
      //     if (dataSources.length === 0) {
      //       return 'success';
      //     }
      //
      //     let topicStatus;
      //
      //     const sourceStatuses = dataSources.map(dataSource => {
      //       // this is what should be observed. when it changes,
      //       // it's not causing this to re-evaluate.
      //       return this.$store.state.sources[dataSource].status;
      //     });
      //
      //     // if any sources are still waiting, return waiting
      //     if (sourceStatuses.some(x => x === 'waiting')) {
      //       topicStatus = 'waiting';
      //     }
      //
      //     // if any sources have errors, return error
      //     else if (sourceStatuses.some(x => x === 'error')) {
      //       topicStatus = 'error';
      //     }
      //
      //     else {
      //       topicStatus = 'success';
      //     }
      //
      //     return topicStatus;
      //   }
      // },



      currentTopicLayerMap() {
        const topicLayerMap = this.$store.state.topics.topicLayerMap;
        const inputFilter = this.$store.state.topics.inputLayerFilter;
        const webMapActiveLayers = this.$store.state.map.webMapActiveLayers;

        let currentTopicLayerMap = {}
        for (let topic of Object.keys(topicLayerMap)) {
          let currentLayers = []
          for (let layer of topicLayerMap[topic]) {
            // console.log(topic+'_'+layer);
            // console.log(webMapActiveLayers.includes(topic+'_'+layer));
            if (layer.toLowerCase().includes(inputFilter.toLowerCase()) || webMapActiveLayers.includes(topic+'_'+layer)) {
              currentLayers.push(layer)
            } // end of if
          } // end of inner loop
          // console.log(topic, currentLayers.length)
          if (currentLayers.length > 0) {
            // console.log(currentLayers.length);
            currentTopicLayerMap[topic] = currentLayers
          }
        } // end of outer loop
        // console.log(currentTopicLayerMap);
        return currentTopicLayerMap
      },

      // topicsFiltered() {
      //   const inputLayerFilter = this.$store.state.topics.inputLayerFilter;
      //   return this.topics.filter()
      //   // get input text
      //   // filter topics
      // },

      // ais() {
      //   return this.$store.state.geocode.data;
      // },
      // address() {
      //   const ais = this.ais;
      //   if (!ais) return null;
      //   return ais.properties.street_address;
      // },
      // zipCode() {
      //   const ais = this.ais;
      //   if (!ais) return null;
      //   const zipCode = ais.properties.zip_code;
      //   const zip4 = ais.properties.zip_4
      //   return zipCode + '-' + zip4;
      // },
    },
    methods: {
      shouldBeDisabled(layer) {
        // console.log('shouldBeDisabled is running', layer);
        if (layer.rest.layerDefinition) {
          if (layer.rest.layerDefinition.minScale) {
            // console.log('minScale for', layer.title, 'is', layer.rest.layerDefinition.minScale, 'and current scale is', this.scale);
            if (this.scale > layer.rest.layerDefinition.minScale) {
              // console.log('checkLayer used layerDefinition and is returning true for', layer.title);
              return true;
            }
          }
        } else {
          return false;
        }
      },

      // TODO use mapMuptations for less boilerplate
      // setActiveTopics() {
      //   const topic = this.$props.topicKey;
      //   let activeTopics = this.$store.state.activeTopics
      //   if (activeTopics.includes(topic)) {
      //     const index = activeTopics.indexOf(topic);
      //     activeTopics.splice(index, 1);
      //   } else {
      //     activeTopics.push(topic);
      //   }
      //   // let nextTopic;
      //   // if (topic === this.$store.state.activeTopic) {
      //   //   nextTopic = null;
      //   // } else {
      //   //   nextTopic = topic;
      //   // }
      //   // this.$store.commit('setActiveTopics', { topic: nextTopic });
      //   this.$store.commit('setActiveTopics', activeTopics);
      // },



      handleFilterFormKeyup(e) {
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
  /*REVIEW these aren't prefixed `mb-`because they're scoped, but it feels
  inconsistent?*/
  ul {
    padding: 0;
  }

  .topic-header {
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
    /*margin-bottom: 20px;*/
  }

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
