<template>
  <div>
    <slot />
  </div>
</template>

<script>
  import axios from 'axios';
  import L from 'leaflet';
  import generateUniqueId from '../util/unique-id';

  const EsriWebMap = L.esri.webMap;

  export default {
    computed: {
      webmapId() {
        console.log('config', this.$config);
        return this.$config.webmapId;
      }
    },
    methods: {
      parentMounted(parent) {
        const self = this;
        const map = this.$store.state.map.map;

        const esriUrl = "https://www.arcgis.com/sharing/rest/content/items/"+ this.webmapId +"/data";
        const params = {
          dataType: 'json',
          webmapId: this.webmapId
        }

        axios.get(esriUrl, { params }).then(response => {
          const restData = response.data;
          const webMap = this.$webMap = L.esri.webMap(this.webmapId, { map: map });

          console.log('WEBMAP', webMap, 'restData', restData);
          self.$store.commit('setWebMap', webMap);

          webMap.on('load', function() {
            map.attributionControl.setPrefix('<a target="_blank" href="//www.phila.gov/it/aboutus/units/Pages/GISServicesGroup.aspx">City of Philadelphia | CityGeo</a>');

            const ignore = ["CityBasemap", "CityBasemap_Labels"];

            // create layerUrls - object mapping layerName to url
            let layerUrls = {};
            for (let layer of webMap.layers) {
              const title = layer.title
              if (!ignore.includes(title)) {
                if (title.includes('_')) {
                  const curLayer = title.split('_')[1];
                  if (layer.layer.service) {
                    // console.log('good', title, layer.layer.service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase());
                    layerUrls[curLayer]=layer.layer.service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "")//.toLowerCase();
                  } else if (layer.layer._layers){
                    // console.log('bad1, then good', title, layer.layer._layers[Object.keys(layer.layer._layers)[0]].service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase());
                    layerUrls[curLayer]=layer.layer._layers[Object.keys(layer.layer._layers)[0]].service.options.url.replace('https://', '').replace('http://', '').replace(/\/$/, "")//.toLowerCase();
                  } else {
                    // console.log('still bad', title, layer);
                  }
                }
              }
            }
            self.$store.commit('setLayerUrls', layerUrls);

            // create webMapLayersAndRest
            let webMapLayersAndRest = []
            const opLayers = restData.operationalLayers
            // console.log('opLayers', opLayers);
            // console.log('webMap layers', webMap.layers);
            for (let [index, layer] of webMap.layers.splice(1).entries()) {
              // console.log('layer.title', layer.title);
              let curOpLayer;
              for (let opLayer of opLayers) {
                // console.log('opLayer and webmap titles', opLayer.title, layer.title);
                if (opLayer.title === layer.title) {
                  curOpLayer = opLayer
                }
              }
              // console.log(curOpLayer.title)
              const id = generateUniqueId();
              const layerObj = {
                'category': layer.title.split('_')[0],
                'title': layer.title.split('_')[1],
                'layer': layer.layer,
                // 'geoType': layer,
                'id': id,
                'serviceItemId': curOpLayer.itemId,
                'rest': curOpLayer,
                'opacity': curOpLayer.opacity,
                'type': curOpLayer.layerType,
                // 'serviceItemId': restData.operationalLayers[index].itemId,
                // 'rest': restData.operationalLayers[index],
                // 'opacity': restData.operationalLayers[index].opacity,
                // 'type': restData.operationalLayers[index].layerType,
                'type2': layer.type,
                'legend': null
              }
              webMapLayersAndRest.push(layerObj);
            }
            webMapLayersAndRest.sort(function(a, b) {
              const titleA = a.title.toLowerCase()
              const titleB=b.title.toLowerCase()
              if (titleA < titleB) //sort string ascending
                  return -1
              if (titleA > titleB)
                  return 1
              return 0 //default return value (no sorting)
            })

            const categories = ['']
            for (let layer of webMapLayersAndRest) {
              if (!categories.includes(layer.category)) {
                categories.push(layer.category);
              }
            }

            categories.sort(function(a, b) {
              const titleA = a.toLowerCase()
              const titleB=b.toLowerCase()
              if (titleA < titleB) //sort string ascending
                  return -1
              if (titleA > titleB)
                  return 1
              return 0 //default return value (no sorting)
            })

            self.$store.commit('setWebMapLayersAndRest', webMapLayersAndRest);
            self.$store.commit('setCategories', categories);
            map.createPane('highlightOverlay');
              // self.method2(webMap);
          }); // end of webmap onload
        }, response => {
          console.log('AXIOS ERROR WebMap.vue');
        });
      },

      method2(webMap) {
        console.log('method2 is running');
        console.log('webmap.layers', webMap.layers);
        console.log('layers[0]', webMap.layers[0]);
        console.log('layer', webMap.layers[0].layer);
        console.log('service', webMap.layers[0].layer.service);
        console.log('maxZoom', webMap.layers[0].layer.service.options.maxZoom);
        // webMap.layers[0].layer.service.options.maxZoom = 22;
        console.log('maxZoom', webMap.layers[0].layer.service.options.maxZoom);

      },
    }
  };
</script>
