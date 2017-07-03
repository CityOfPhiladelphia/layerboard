import Vue from 'vue';
import createStore from './store';
import configMixin from './util/config-mixin';
import eventBusMixin from './util/event-bus-mixin';
import Mapboard from './components/Mapboard';
import mergeDeep from './util/merge-deep';

export default (clientConfig) => {
  const baseConfigUrl = clientConfig.baseConfig;

  // create a global event bus used to proxy events to the mapboard host
  Vue.use(eventBusMixin);

  // get base config
  return $.ajax({
    url: baseConfigUrl,
    success(data) {

      // $.getJSON("representation.json", function(bennyRepresentation) {
      //   console.log(bennyRepresentation);
      // $.ajax({
      //   dataType: "json",
      //   url: "representation.json",
      //   success(bennyRepresentation) {
      //     console.log(bennyRepresentation);
      //     console.log(data);
      //
      //
      //   // $.getJSON("endpoints.json", function(bennyEndpoints) {
      //   //   console.log(bennyEndpoints);
      //   $.ajax({
      //     dataType: "json",
      //     url: "endpoints.json",
      //     success(bennyEndpoints) {
      //       console.log(bennyEndpoints);
      //       console.log(bennyRepresentation);


          $.ajax({
            dataType: 'json',
            url: "https://api.knackhq.com/v1/objects/object_4/records/export?type=json",
            headers: {
              'X-Knack-Application-Id': '550c60d00711ffe12e9efc64',
              'X-Knack-REST-API-Key': '7bce4520-28dc-11e5-9f0a-4d758115b820'
            },
            success(dataOut) {
              const records = dataOut.records;
              const recordsFiltered = records.filter(record => record.field_12 === "API" || record.field_12 === "GeoService");

              // const recordsFiltered = records;

              // const bennyEndpoints = recordsFiltered;
              let bennyEndpoints = {};
              for (let record of recordsFiltered) {
                //let endpoint = {};
                const url = record.field_25.split('"')[1]//.split('query')[0];
                // console.log('url:', url);
                let url2;
                if (url) {
                  url2 = url.split('query')[0].replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
                } else {
                  url2 = null;
                }
                // console.log('url2:', url2);
                if (record.field_13_raw.length > 0) {
                  bennyEndpoints[url2] = record.field_13_raw[0].id;
                  // endpoint['"'+url2+'"'] = record.field_13_raw[0].id;
                } else {
                  bennyEndpoints[url2] = '';
                  // endpoint['"'+url2+'"'] = '';
                }
                // console.log(endpoint);
                //bennyEndpoints.push(endpoint)

                // endpoint['url'] = record.field_25.split('"')[1];
                // if (record.field_13.length > 0) {
                //   endpoint['identifier'] = record.field_13[1].identifier;
                //   bennyEndpoints['id'] = record.field_13[1].id;
                // }
              }


              // console.log(bennyEndpoints);
            //       console.log(bennyRepresentation);
          // })

          // parse raw js. yes, it's ok to use eval :)
          // http://stackoverflow.com/a/87260/676001
          const baseConfig = eval(data);

          // deep merge base config and client config
          //const config = mergeDeep(clientConfig, baseConfig);
          const config = mergeDeep(baseConfig, clientConfig);

          // make config accessible from each component via this.$config
          Vue.use(configMixin, config);

          // create store
          const store = createStore(config, bennyEndpoints)//, bennyRepresentation);

          // mount main vue
          const vm = new Vue({
            el: config.el || '#mapboard',
            render: (h) => h(Mapboard),
            store
          });

          // bind mapboard events to host app
          const events = config.events || {};
          for (let eventName of Object.keys(events)) {
            const callback = events[eventName];
            vm.$eventBus.$on(eventName, callback);
          }

          // event api for host apps
          // this doesn't work now that we're getting the base config
          // asynchronously. see above for workaround.
          // REVIEW it would be nice to return the jquery ajax deferred and have the
          // client app call .then() on it.
          // return {
          //   on(eventName, callback) {
          //     vm.$eventBus.$on(eventName, callback);
          //     return this;
          //   },
          //   off(eventName, callback) {
          //     vm.$eventBus.$off(eventName, callback);
          //     return this;
          //   }
          // };
        }
        });
      // }
      // });
    },




    error(err) {
      console.error('Error loading base config:', err);
    }
  });
};
