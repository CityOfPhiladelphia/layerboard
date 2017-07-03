<template>
  <div>
    <slot />
  </div>
</template>

<script>
  import L from 'leaflet';
  // TODO look into a cleaner way of importing from esri-leaflet
  // const webmapId = 'd46a7e59e2c246c891fbee778759717e'; // Default WebMap ID
  // const webmapId = '980cd5736a12448697429dccd0f30669'; // Default WebMap ID
  const webmapId = 'f60e4fa0c01f408882a07ee50e8910b9'; // Default WebMap ID
  const EsriWebMap = L.esri.webMap;

  export default {
    // we don't actually render anything, but need to define either a template
    // or a render function
    // render(h) {
    //   return;
    // },
    methods: {
      parentMounted(parent) {
        const self = this;
        const map = this.$store.state.map.map;
        const webMap = this.$webMap = new EsriWebMap(webmapId, { map: map });
        this.$store.commit('setWebMap', webMap);

        webMap.on('load', function() {
          const ignore = ["CityBasemap", "CityBasemap_Labels"];
          const layers = webMap.layers

          let topicLayerMap = {};
          let topicLayerUrls = {};
          for (let layer of layers) {
            const title = layer.title
            if (!ignore.includes(title)) {
              if (title.includes('_')) {
                const curTopic = title.split('_')[0];
                const curLayer = title.split('_')[1];
                if (!Object.keys(topicLayerMap).includes(curTopic)) {
                  topicLayerMap[curTopic] = [];
                  // topicLayerUrls = {};
                }
                topicLayerMap[curTopic].push(curLayer);
                if (layer.layer.service) {
                  // console.log('good', title, layer.layer.service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase());
                  topicLayerUrls[title]=layer.layer.service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
                } else if (layer.layer._layers){
                  console.log('bad1, then good', title, layer.layer._layers[Object.keys(layer.layer._layers)[0]].service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase());
                  topicLayerUrls[title]=layer.layer._layers[Object.keys(layer.layer._layers)[0]].service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
                } else {
                  console.log('still bad', title, layer);
                }
              }
            }
          }
          self.$store.commit('setTopicLayerMap', topicLayerMap);
          self.$store.commit('setTopicLayerUrls', topicLayerUrls);
        }); // end of webmap onload
        return webMap;
      }
    }
  };
</script>
