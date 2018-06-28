/*
________                           _____
\_____  \ ______   ____   ____    /     \ _____  ______  ______
 /   |   \\____ \_/ __ \ /    \  /  \ /  \\__  \ \____ \/  ___/
/    |    \  |_> >  ___/|   |  \/    Y    \/ __ \|  |_> >___ \
\_______  /   __/ \___  >___|  /\____|__  (____  /   __/____  >
        \/|__|        \/     \/         \/     \/|__|       \/
*/

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

var BASE_CONFIG_URL = '//rawgit.com/ajrothwell/openmaps-base-config/c8a9f210f229e16529669ab98364aadda70f0941/config.js';
var GATEKEEPER_KEY = 'ec8681f792812d7e3ff15e9094bfd4ad';
var WEBMAP_ID = '4c3ed877199c402895b7fa45ce6409b6';

// configure accounting.js
accounting.settings.currency.precision = 0;

WebMapViewer.default({
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
  baseConfig: BASE_CONFIG_URL,
  webmapId: WEBMAP_ID,
});
