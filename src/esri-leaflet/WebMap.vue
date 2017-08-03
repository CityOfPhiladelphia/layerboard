<template>
  <div>
    <slot />
  </div>
</template>

<script>
  import L from 'leaflet';
  const webmapId = 'f60e4fa0c01f408882a07ee50e8910b9'; // Default WebMap ID
  const EsriWebMap = L.esri.webMap;
  export default {
    methods: {
      parentMounted(parent) {
        const self = this;
        const map = this.$store.state.map.map;

        $.ajax({
          dataType: 'json',
          url: "https://www.arcgis.com/sharing/rest/content/items/"+ webmapId +"/data",
          success(restData) {
            self.$store.commit('setWebMapRestData', restData);
            const webMap = this.$webMap = new EsriWebMap(webmapId, { map: map });
            self.$store.commit('setWebMap', webMap);
            webMap.on('load', function() {
              // console.log('webMap', webMap);
              // console.log('map', map);
              // console.log('map layer 1', map._layers[1]);
              const ignore = ["CityBasemap", "CityBasemap_Labels"];
              const layers = webMap.layers
              let topicLayerUrls = {};
              for (let layer of layers) {
                const title = layer.title
                if (!ignore.includes(title)) {
                  if (title.includes('_')) {
                    const curLayer = title.split('_')[1];
                    if (layer.layer.service) {
                      // console.log('good', title, layer.layer.service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase());
                      topicLayerUrls[curLayer]=layer.layer.service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
                    } else if (layer.layer._layers){
                      // console.log('bad1, then good', title, layer.layer._layers[Object.keys(layer.layer._layers)[0]].service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase());
                      topicLayerUrls[curLayer]=layer.layer._layers[Object.keys(layer.layer._layers)[0]].service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
                    } else {
                      // console.log('still bad', title, layer);
                    }
                  }
                }
              }
              self.$store.commit('setTopicLayerUrls', topicLayerUrls);
              let layersAndRest = []
              for (let [index, layer] of layers.splice(2).entries()) {
                const layerObj = {
                  'title': layer.title.split('_')[1],
                  'layer': layer.layer,
                  'index': index,
                  'rest': self.$store.state.map.webMapRestData.operationalLayers[index],
                }
                layersAndRest.push(layerObj)
              }
              self.$store.commit('setWebMapLayersAndRest', layersAndRest);
            }); // end of webmap onload
            return webMap;
          }
        });
      },
    }
  };
</script>
