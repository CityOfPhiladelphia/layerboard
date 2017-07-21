<template>
  <div style="display: inline">
    <div class="leaflet-bar easy-button-container leaflet-control">
      <button class="easy-button-button leaflet-bar-part leaflet-interactive unnamed-state-active"
              @click="handleSideBySideButtonClick"
      >
        <span class="button-state state-unnamed-state unnamed-state-active">
          <img class="button-image" :src="'../../src/assets/basemap_side_by_side.png'">
        </span>
      </button>
    </div>
  </div>
</template>

<script>
  import Control from '../leaflet/Control';
  import L from 'leaflet';
  const EsriTiledMapLayer = L.esri.tiledMapLayer;

  const {props, methods} = Control;

  // const sideBySide = new L.control.sideBySide;

  export default {
    props: [
      'position',
    ],
    computed: {
      activeBasemap() {
        const basemap = this.$store.state.map.basemap;
        return basemap;
      },
      activeBasemapLeft() {
        const basemapLeft = this.$store.state.map.basemapLeft;
        return basemapLeft;
      },
      sideBySideActive() {
        return this.$store.state.map.sideBySideActive;
      },
      leftMap() {
        return this.$store.state.map.basemapLayers[this.activeBasemapLeft]
      },
      rightMap() {
        return this.$store.state.map.basemapLayers[this.activeBasemap]
      },
      // sideBySide() {
      //   return new L.control.sideBySide;
      // },

    },
    methods: Object.assign(methods, {
      // configForBasemap(key) {
      //   return this.$config.map.basemaps[key];
      // },
      // return a list of imagery basemap years in descending order
      handleSideBySideButtonClick(e) {
        console.log('test')
        if (this.sideBySideActive === false) {
          console.log('sideBySide is false');

          const map = this.$store.state.map;

          const mapLayer = EsriTiledMapLayer({
            url: 'http://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer',
          });
          const imageryLayer = EsriTiledMapLayer({
            url: 'http://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityImagery_2016_3in/MapServer',
          });

          console.log('leftMap:', this.leftMap);
          console.log('mapLayer', mapLayer);
          console.log('rightMap:', this.rightMap);
          console.log('imageryLayer', imageryLayer);

          if (map) {
            mapLayer.addTo(map.map);
            imageryLayer.addTo(map.map);
          }

          // const sideBySide = L.control.sideBySide(this.leftMap, this.rightMap);
          const sideBySide = L.control.sideBySide(mapLayer, imageryLayer);
          console.log('!!!!!!!!!sideByside:', sideBySide);
          //
          // // console.log('handleSideBySideButtonClick fired, sideBySideActive is becoming active')
          // // console.log('left:',this.$store.state.map.basemapLayers[this.activeBasemapLeft]);
          // // this.sideBySide.setLeftLayers(this.$store.state.map.basemapLayers[this.activeBasemapLeft]);
          // // console.log('right:', this.$store.state.map.basemapLayers[this.activeBasemap])
          // // this.sideBySide.setRightLayers(this.$store.state.map.basemapLayers[this.activeBasemap]);
          //
          if (map) {
            sideBySide.addTo(map.map);
          }
          this.$store.commit('setSideBySideActive', true);

        } else {
          console.log('handleSideBySideButtonClick fired, sideBySideActive is becoming inactive')
          // this.sideBySide.remove();
          this.$store.commit('setSideBySideActive', false);
        }

      },
    })
  };
</script>

<style scoped>
  .year-selector-container {
    /*border: 1px solid #222;*/
    display: inline-block;
    margin-right: 20px;
  }

  ul {
    margin: 0;
    list-style-type: none;
    text-align: center;
  }

  li {
    background: #cfcfcf;
    border: 1px solid #fff;
    border-bottom: none;
    padding: 8px;
  }

  li.active {
    background: #FFF;
  }

  .leaflet-bar button,
  .leaflet-bar button:hover {
    background-color: #fff;
    border: none;
    border-bottom: 1px solid #ccc;
    width: 26px;
    height: 26px;
    line-height: 26px;
    /*display: block;*/
    text-align: center;
    text-decoration: none;
    color: black;
  }

  .leaflet-bar button {
    background-position: 50% 50%;
    background-repeat: no-repeat;
    overflow: hidden;
    /*display: block;*/
  }

  .leaflet-bar button:hover {
    background-color: #f4f4f4;
  }

  .leaflet-bar button:first-of-type {
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
  }

  .leaflet-bar button:last-of-type {
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    border-bottom: none;
  }

  .leaflet-bar.disabled,
  .leaflet-bar button.disabled {
    cursor: default;
    pointer-events: none;
    opacity: .4;
  }

  .easy-button-button .button-state{
    display: block;
    width: 30px;
    height: 30px;
    position: relative;
  }

  .leaflet-touch .leaflet-bar button {
    width: 30px;
    height: 30px;
    line-height: 30px;
  }

  .basemap-toggle-button {
    width: 30px;
    height: 30px;
    opacity: 0%;
    /*padding: 0px;
    margin: 0px;*/
    /*background: white;*/
    /*background: rgba(255,255,255,1);*/
    /* box-shadow: 0 0 15px rgba(0,0,0,0.2); */
    /*display: inline-block;*/
    /*float: right;*/
  }

  .button-image {
    vertical-align: top;

  }
</style>
