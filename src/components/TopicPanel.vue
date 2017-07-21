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

      <topic v-for="(topic, key) in currentTopicLayerMap"
             :topicLayerMap = currentTopicLayerMap
             :topicKey="key"
             :key="key"
      />
    </div>
  </div>
</template>

<script>
  import Topic from './Topic';

  export default {
    components: {
      Topic
    },
    computed: {
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
