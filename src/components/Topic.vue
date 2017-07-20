<template>
  <div v-if="shouldShowTopic">
    <a href="#"
       class="topic-header"
       @click="setActiveTopics"
       v-if="shouldShowHeader"
    >
      <span v-show="status === 'waiting'" class="loading">
        <i class="fa fa-spinner fa-lg spin"></i>
      </span>
      {{ topic.key }}
    </a>

    <!-- success -->
    <div class="topic-body" v-if="shouldShowBody">
      <form action="#/">
        <fieldset class="options">
          <ul class="no-bullet">
            <checkbox v-for="(layer, index) in this.wmLayers"
                      :layer="layer.title.split('_')[1]"
                      :shouldBeDisabled="shouldBeDisabled(layer)"
                      :index=index
                      :topicKey=topicKey
                      :key=index
            >
            </checkbox>
          </ul>
        </fieldset>
      </form>
    </div>
    <!-- error -->
    <div class="topic-body" v-show="shouldShowError">
      Could not locate records for that address.
    </div>
  </div>
</template>

<script>
  import Checkbox from './topic-components/Checkbox';

  export default {
    components: {
      Checkbox
    },
    props: ['topicKey',
            'topicLayerMap'
    ],
    computed: {
      scale() {
        return this.$store.state.map.scale;
      },
      wmLayers() {
        const layers = this.$store.state.map.webMapLayersAndRest;
        // const layersFilt = layers.filter(layer => layer.title.split('_')[0] === this.$props.topicKey && this.$props.topiclayerMap[this.$props.topicKey].includes(layer.title.split('_')[1]));
        const layersFilt = layers.filter(layer => this.$props.topicLayerMap[this.$props.topicKey].includes(layer.title.split('_')[1]));
        return layersFilt;
        // return this.$store.state.map.webMapLayersAndRest.filter(title => title.split('_')[0] === topicKey);
      },
      topic() {
        const topicKey = this.$props.topicKey;
        let topic = {
          key: topicKey,
        }
        return topic;
      },
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
      dataSources() {
        return this.topic.dataSources || [];
      },
      hasData() {
        return this.dataSources.every(dataSource => {
          const targetsFn = this.$config.dataSources[dataSource].targets
          if (targetsFn) {
            const targetsMap = this.$store.state.sources[dataSource].targets;
            const targets = Object.values(targetsMap);
            return targets.every(target => target.status !== 'waiting');
          } else {
            return this.$store.state.sources[dataSource].data;
          }
        });
      },
      shouldShowBody() {
        // const succeeded = this.status === 'success';
        // const hasData = this.hasData;
        // const should = succeeded && hasData && this.isActive;
        const should = this.isActive || this.inputLayerFilter.length > 1;
        return should;
      },
      shouldShowError() {
        // console.log('shouldShowError', this.topic.label, this);
        return this.status === 'error' || (this.status !== 'waiting' && !this.hasData);
      },
      // REVIEW this is getting cached and not updating when the deps update
      status: {
        cache: false,
        get() {
          // get the status of each source
          const dataSources = this.topic.dataSources || [];

          // if no sources, return success
          if (dataSources.length === 0) {
            return 'success';
          }

          let topicStatus;

          const sourceStatuses = dataSources.map(dataSource => {
            // this is what should be observed. when it changes,
            // it's not causing this to re-evaluate.
            return this.$store.state.sources[dataSource].status;
          });

          // if any sources are still waiting, return waiting
          if (sourceStatuses.some(x => x === 'waiting')) {
            topicStatus = 'waiting';
          }

          // if any sources have errors, return error
          else if (sourceStatuses.some(x => x === 'error')) {
            topicStatus = 'error';
          }

          else {
            topicStatus = 'success';
          }

          return topicStatus;
        }
      },
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
      setActiveTopics() {
        const topic = this.$props.topicKey;
        let activeTopics = this.$store.state.activeTopics
        if (activeTopics.includes(topic)) {
          const index = activeTopics.indexOf(topic);
          activeTopics.splice(index, 1);
        } else {
          activeTopics.push(topic);
        }
        // let nextTopic;
        // if (topic === this.$store.state.activeTopic) {
        //   nextTopic = null;
        // } else {
        //   nextTopic = topic;
        // }
        // this.$store.commit('setActiveTopics', { topic: nextTopic });
        this.$store.commit('setActiveTopics', activeTopics);
      },
    }
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
</style>
