import axios from 'axios';
import Vue from 'vue';
import createStore from './store';
import configMixin from './util/config-mixin';
import eventBusMixin from './util/event-bus-mixin';
import WebMapViewer from './components/WebMapViewer';
import mergeDeep from './util/merge-deep';
import controllerMixin from './controller';
import generateUniqueId from './util/unique-id';

export default (clientConfig) => {
  const baseConfigUrl = clientConfig.baseConfig;
  // console.log('clientConfig', clientConfig, 'baseConfigUrl', baseConfigUrl);

  // Vue.use(eventBusMixin);
  // create a global event bus used to proxy events to the host
  const eventBus = new Vue();
  Vue.prototype.$eventBus = eventBus;

  // get base config
  return axios.get(baseConfigUrl).then(response => {
    const data = response.data;
    const baseConfig = eval(data);
    // console.log('baseConfig', baseConfig);

    // deep merge base config and client config
    //const config = mergeDeep(clientConfig, baseConfig);
    const config = mergeDeep(baseConfig, clientConfig);

    // make config accessible from each component via this.$config
    Vue.use(configMixin, config);

    // create store
    const store = createStore(config);

    // mix in controller
    Vue.use(controllerMixin, { config, store, eventBus });

    // mount main vue
    const vm = new Vue({
      el: config.el || '#webmap-viewer',
      render: (h) => h(WebMapViewer),
      store
    });

    // bind events to host app
    const events = config.events || {};
    for (let eventName of Object.keys(events)) {
      const callback = events[eventName];
      vm.$eventBus.$on(eventName, callback);
    }

  }, response => {
    console.error('AXIOS ERROR loading base config');
  });
};
