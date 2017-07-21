<script>
  import L from 'leaflet';
  import Control from '../leaflet/Control';
  // import LegendControl from '../../src/util/legend.js';
  // console.log(LegendControl);
  console.log(L.esri);

  // const EsriLeafletLegend = L.esri.legendControl;
  // console.log(EsriLeafletLegend);

  // REVIEW is there a better way to extend a vue component?
  const {props, methods} = Control;

  export default {
    // TODO figure how to extend props. sometimes it's an obj, sometimes an array.
    // props: Object.assign(props, {
    // }),
    // props: [
    //   'position',
    //   'imageryYears'
    // ],
    render(h) {
      return;
    },
    computed: {
      mounted() {
        const leafletElement = this.$leafletElement = this.createLeafletElement();
        const map = this.$store.state.map.map;
        const wmLayers = this.$store.state.map.webMapLayersAndRest;

        // REVIEW kind of hacky/not reactive?
        if (map) {
          map.addControl(this.$leafletElement);
          // leafletElement.addTo(map);
          // map.attributionControl.removeAttribution('overwrite');
        }
      },
      destroyed() {
        // this.$leafletElement._map.removeLayer(this.$leafletElement);
      },
    },
    methods: {
      createLeafletElement() {
        // const legend = new EsriLeafletLegend(wmLayers[0].layer);
        const legend = L.esri.legendControl(wmLayers[0].layer);
        console.log(legend);
        return legend;
      },
      parentMounted(parent) {
        console.log('Legend.vue parentMounted is running', this.$leafletElement);
        const map = parent.$leafletElement;
        map.addControl(this.$leafletElement);
        // this.$leafletElement.addTo(map);
      },
    },
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
