/*
.____                             ___.                          .___
|    |   _____  ___.__. __________\_ |__   _________ _______  __| _/
|    |   \__  \<   |  |/ __ \_  __ \ __ \ /  _ \__  \\_  __ \/ __ |
|    |___ / __ \\___  \  ___/|  | \/ \_\ (  <_> ) __ \|  | \/ /_/ |
|_______ (____  / ____|\___  >__|  |___  /\____(____  /__|  \____ |
        \/    \/\/         \/          \/           \/           \/
*/

import Vue from 'vue';
import axios from 'axios';
import createStore from './store';
import configMixin from './util/config-mixin';
import Layerboard from './components/Layerboard.vue';
import mergeDeep from './util/merge-deep';

import * as faAll from './fa.js';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import controllerMixin from '@philly/vue-datafetch/src/controller/index.js';

import * as esri from 'esri-leaflet';
L.esri = esri;
import * as rend from 'esri-leaflet-renderers';
L.esri.Renderers = rend;
import 'esri-leaflet-legend/dist/esri-leaflet-legend-compat-src-edit.js';
import 'Leaflet-PointInPolygon/wise-leaflet-pip.js';

function initLayerboard(clientConfig) {
  const baseConfigUrl = clientConfig.baseConfig;

  // get base config
  return axios.get(baseConfigUrl).then(response => {
    const data = response.data;
    const baseConfigFn = eval(data);
    const { gatekeeperKey } = clientConfig;
    const baseConfig = baseConfigFn({ gatekeeperKey });

    // deep merge base config and client config
    const config = mergeDeep(baseConfig, clientConfig);

    // make config accessible from each component via this.$config
    Vue.use(configMixin, config);

    // create store
    const store = createStore(config);

    // mix in controller
    Vue.use(controllerMixin, { config, store });

    Vue.component('font-awesome-icon', FontAwesomeIcon)

    // mount main vue
    const vm = new Vue({
      el: config.el || '#layerboard',
      render: (h) => h(Layerboard),
      store
    });

  }, response => {
    console.error('AXIOS ERROR loading base config');
  });
}

export default initLayerboard;
