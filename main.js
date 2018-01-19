// console.log = console.info = console.debug = console.error = function () {};

// var BASE_CONFIG_URL = 'https://raw.githubusercontent.com/ajrothwell/openmaps-base-config/develop/config.js';
var BASE_CONFIG_URL = '//rawgit.com/ajrothwell/openmaps-base-config/859f26025f8b3c4a4bfeddb02cf8b4523a1b7b2e/config.js';
var GATEKEEPER_KEY = 'ec8681f792812d7e3ff15e9094bfd4ad';
var WEBMAP_ID = '4c3ed877199c402895b7fa45ce6409b6';

// configure accounting.js
accounting.settings.currency.precision = 0;

Mapboard.default({
  // rootStyle: {
  //   // height: '100%'
  //   position: 'absolute',
  //   bottom: 0,
  //   // top: '78px',
  //   top: '120px',
  //   left: 0,
  //   right: 0,
  //   overflow: 'auto',
  // },
  geolocation: {
    enabled: true
  },
  map: {
    // possibly should move to base config
    defaultBasemap: 'pwd',
    defaultIdentifyFeature: 'address-marker',
    imagery: {
      enabled: true
    },
    historicBasemaps: {
      enabled: true
    },
  },
  cyclomedia: {
    enabled: true,
    measurementAllowed: false
  },
  pictometry: {
    enabled: false
  },
  baseConfig: BASE_CONFIG_URL,
  webmapId: WEBMAP_ID,
});
