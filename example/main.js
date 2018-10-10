/*
  _                       _                         _
 | |                     | |                       | |
 | | __ _ _   _  ___ _ __| |__   ___   __ _ _ __ __| |
 | |/ _` | | | |/ _ \ '__| '_ \ / _ \ / _` | '__/ _` |
 | | (_| | |_| |  __/ |  | |_) | (_) | (_| | | | (_| |
 |_|\__,_|\__, |\___|_|  |_.__/ \___/ \__,_|_|  \__,_|
           __/ |
          |___/
*/

import accounting from 'accounting';
import axios from 'axios';
import moment from 'moment';
import layerboard from '../dist/layerboard';

// import 'leaflet/dist/leaflet.css';
// import 'leaflet-easybutton/src/easy-button.css';
// import 'leaflet-measure/dist/leaflet-measure.css';

// turn off console logging in production
// TODO come up with better way of doing this with webpack + env vars
const { hostname='' } = location;
if (hostname !== 'localhost' && !hostname.match(/(\d+\.){3}\d+/)) {
  console.log = console.info = console.debug = console.error = function () {};
}

function openHelp() {
  var firstHash = window.location.hash;
  // console.log('setHash is running, firstHash:', firstHash);
  var firstHashArr = firstHash.split('/').slice(2);
  console.log('firstHashArr:', firstHashArr);
  var finalHash = '#/help';
  for (var i=0; i < firstHashArr.length; i++) {
    finalHash = finalHash + '/' + firstHashArr[i];
  }
  window.location.hash = finalHash;
}

console.log('openHelp:', openHelp);

var BASE_CONFIG_URL = 'https://rawgit.com/ajrothwell/openmaps-base-config/f7a091508316694767f24fd68ab07af38ddad163/config.js';
var GATEKEEPER_KEY = 'ec8681f792812d7e3ff15e9094bfd4ad';
var WEBMAP_ID = '4c3ed877199c402895b7fa45ce6409b6';

layerboard({
  bundled: true,
  router: {
    enabled: true
  },
  geolocation: {
    enabled: true
  },
  addressAutocomplete: {
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
    center: [-75.16347348690034, 39.952562122622254],
    clickToIdentifyFeatures: true,
    containerClass: 'map-container-type2',
  },
  cyclomedia: {
    enabled: true,
    measurementAllowed: false,
    popoutAble: true,
  },
  pictometry: {
    enabled: false,
  },
  gatekeeperKey: GATEKEEPER_KEY,
  baseConfig: BASE_CONFIG_URL,
  webmapId: WEBMAP_ID,
});
