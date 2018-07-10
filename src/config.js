/*
________                           _____
\_____  \ ______   ____   ____    /     \ _____  ______  ______
 /   |   \\____ \_/ __ \ /    \  /  \ /  \\__  \ \____ \/  ___/
/    |    \  |_> >  ___/|   |  \/    Y    \/ __ \|  |_> >___ \
\_______  /   __/ \___  >___|  /\____|__  (____  /   __/____  >
        \/|__|        \/     \/         \/     \/|__|       \/
*/

// styles
import 'leaflet-easybutton/src/easy-button.css';
import 'leaflet-measure/dist/leaflet-measure.css';


import WebMapViewer from './main.js'

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

var BASE_CONFIG_URL = 'https://rawgit.com/ajrothwell/openmaps-base-config/b39c037e8bc058f54ff0ea0b61e879d5ad1ae800/config.js';
var GATEKEEPER_KEY = 'ec8681f792812d7e3ff15e9094bfd4ad';
var WEBMAP_ID = '4c3ed877199c402895b7fa45ce6409b6';

WebMapViewer({
  router: {
    enabled: true
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
  cyclomedia: {
    enabled: true
  },
  pictometry: {
    enabled: false
  },
  gatekeeperKey: GATEKEEPER_KEY,
  baseConfig: BASE_CONFIG_URL,
  webmapId: WEBMAP_ID,
});
