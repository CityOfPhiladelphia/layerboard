<template>
  <div>
    <slot />
  </div>
</template>

<script>
  import L from 'leaflet';
  import generateUniqueId from '../util/unique-id';

  const EsriWebMap = L.esri.webMap;

  export default {
    // mounted() {
      // signal children to mount
      // for (let child of this.$children) {
      //   // REVIEW it seems weird to pass children their own props. trying to
      //   // remember why this was necessary... binding issue?
      //   child.parentMounted(this, child.$props);
      // }
    // },
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

        $.ajax({
          dataType: 'json',
          url: "https://www.arcgis.com/sharing/rest/content/items/"+ this.webmapId +"/data",
          webmapId: this.webmapId,
          // data: {
          //   outFields:'*'
          // },
          success(restData) {
            const webMap = this.$webMap = L.esri.webMap(this.webmapId, { map: map });

            console.log('WEBMAP', webMap);
            // webMap.layers[1].layer.service.options.maxZoom = 22;
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

              // create webMapLayersAndRest
              let webMapLayersAndRest = []
              for (let [index, layer] of webMap.layers.splice(2).entries()) {
                const id = generateUniqueId();
                const layerObj = {
                  'title': layer.title.split('_')[1],
                  'layer': layer.layer,
                  'id': id,
                  'serviceItemId': restData.operationalLayers[index].itemId,
                  'rest': restData.operationalLayers[index],
                  'opacity': restData.operationalLayers[index].opacity,
                  'type': restData.operationalLayers[index].layerType,
                  'type2': layer.type,
                  'legend': null
                }
                webMapLayersAndRest.push(layerObj);
              }
              self.$store.commit('setWebMapLayersAndRest', webMapLayersAndRest);
              // self.method2(webMap);
            }); // end of webmap onload
          }
        })//.then(function() {
          // console.log('testing', map);
          // map.attributionControl.removeAttribution('<span class="esri-attributions" style="line-height:14px; vertical-align: -3px; text-overflow:ellipsis; white-space:nowrap; overflow:hidden; display:inline-block; max-width:1385px;"></span>');
          // map.attributionControl.setPrefix('test');
        // })
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
