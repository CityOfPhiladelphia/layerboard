<script>
  import L from 'leaflet';
  import Control from '../leaflet/Control';

  const {props, methods} = Control;

  export default {
    props: [
      'position',
      'wmActiveLayers'
    ],
    render(h) {
      return;
    },
    computed: {
      currentWmLayers() {
        return this.$store.state.map.webMapLayersAndRest.filter(layer => this.$props.wmActiveLayers.includes(layer.title));
      }
    },
    mounted() {
      const leafletElement = this.$leafletElement = this.createLeafletElement();
      const map = this.$store.state.map.map;
      if (map) {
        map.addControl(this.$leafletElement);
      }
    },
    destroyed() {
      this.$leafletElement._map.removeControl(this.$leafletElement);
    },
    methods: {
      createLeafletElement() {
        console.log('CREATING LEGEND FOR', this.currentWmLayers[0].title);
        const legend = L.esri.legendControl(this.currentWmLayers[0].layer);
        console.log(legend);
        return legend;
      },
      parentMounted(parent) {
        const map = parent.$leafletElement;
        map.addControl(this.$leafletElement);
      },
    },
  };
</script>

<style>
  .leaflet-legend-control {
      background: white;
      padding: 1em;
      max-height: 300px;
      overflow: auto;
      font: 12px/1.5 "Helvetica Neue", Arial, Helvetica, sans-serif;
  }

  .leaflet-legend-control ul {
      padding: 0;
      margin: 0;
      list-style-type: none;
  }

  .leaflet-legend-control ul li img {
      display: inline-block;
      margin-right: 5px;
  }

  .leaflet-legend-control ul li span {
      vertical-align: top;
      line-height: 22px;
  }

  .leaflet-legend-control ul ul {
      margin-left: 15px;
  }
  /*.year-selector-container {
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
    text-align: center;
    text-decoration: none;
    color: black;
  }

  .leaflet-bar button {
    background-position: 50% 50%;
    background-repeat: no-repeat;
    overflow: hidden;
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
  }

  .button-image {
    vertical-align: top;

  }*/
</style>
