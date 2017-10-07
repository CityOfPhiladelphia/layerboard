var BASE_CONFIG_URL = 'https://raw.githubusercontent.com/ajrothwell/citymaps-base-config/develop/config.js';
const GATEKEEPER_KEY = 'ec8681f792812d7e3ff15e9094bfd4ad';
const WEBMAP_ID = '4c3ed877199c402895b7fa45ce6409b6';

// configure accounting.js
accounting.settings.currency.precision = 0;

Mapboard.default({
  rootStyle: {
    // height: '100%'
    position: 'absolute',
    bottom: 0,
    top: '78px',
    left: 0,
    right: 0,
    overflow: 'auto',
  },
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
  baseConfig: BASE_CONFIG_URL,
  webmapId: WEBMAP_ID,
});
