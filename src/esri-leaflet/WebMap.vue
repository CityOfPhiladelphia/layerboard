<template>
  <div>
    <slot />
  </div>
</template>

<script>
  import L from 'leaflet';
  import generateUniqueId from '../util/uniqueId';

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
            const webMap = this.$webMap = new EsriWebMap(webmapId, { map: map });

            webMap.on('load', function() {
              const ignore = ["CityBasemap", "CityBasemap_Labels"];


              // create webMapLayersAndRest
              let webMapLayersAndRest = []
              for (let [index, layer] of webMap.layers.splice(2).entries()) {
                const layerObj = {
                  'title': layer.title.split('_')[1],
                  'layer': layer.layer,
                  // 'index': index,
                  'id': generateUniqueId(),
                  'rest': restData.operationalLayers[index],
                }
                webMapLayersAndRest.push(layerObj)
              }
              self.$store.commit('setWebMapLayersAndRest', webMapLayersAndRest);


              // create layerUrls - object mapping layerName to url
              let layerUrls = {};
              for (let layer of webMap.layers) {
                const title = layer.title
                if (!ignore.includes(title)) {
                  if (title.includes('_')) {
                    const curLayer = title.split('_')[1];
                    if (layer.layer.service) {
                      // console.log('good', title, layer.layer.service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase());
                      layerUrls[curLayer]=layer.layer.service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
                    } else if (layer.layer._layers){
                      // console.log('bad1, then good', title, layer.layer._layers[Object.keys(layer.layer._layers)[0]].service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase());
                      layerUrls[curLayer]=layer.layer._layers[Object.keys(layer.layer._layers)[0]].service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
                    } else {
                      // console.log('still bad', title, layer);
                    }
                  }
                }
              }
              self.$store.commit('setLayerUrls', layerUrls);

            }); // end of webmap onload
          }
        });
      },
    }
  };
</script>
