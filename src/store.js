import Vue from 'vue';
import Vuex from 'vuex';

// when you load vuex from a script tag this seems to happen automatically
// Vue.use(Vuex);

// function createStore(config, bennyEndpoints, bennyRepresentation) {
function createStore(config) { //}, bennyEndpoints, bennyRepresentation) {

  const initialState = {
    bennyEndpoints: {},
    // bennyEndpoints2: {},
    // bennyEndpoints3: [],
    geocode: {
      status: null,
      data: null
    },
    layers: {
      layerUrls: {},
      inputLayerFilter: '',
    },
    map: {
      location: {
        lat: null,
        lng: null
      },
      center: config.map.center,
      zoom: config.map.zoom,
      scale: null,
      map: null,
      basemap: 'pwd',
      imagery: 'imagery2017',
      shouldShowImagery: false,
      basemapLayers: {},
      webMap: null,
      webMapActiveLayers: [],
      webMapDisplayedLayers: [],
      webMapLayersAndRest: [],
      watchPositionOn: false,
      intersectingFeatures: [],
      popupCoords: null,
      selectedPopupLayer: null,
    },
    cyclomedia: {
      active: false,
      viewer: null,
      recordings: [],
      locFromApp: null,
      locFromViewer: null,
    },
    pictometry: {
      ipa: null,
      active: false,
      shapeIds: [],
      pngMarkerIds: [],
      zoom: null,
    },
    lastSearchMethod: null,
    // this gets set to true on a mobile device when the user clicks the
    // "See Datasets" button
    didToggleTopicsOn: false,
    shouldShowTopics: true,
    shouldShowMap: true,
    windowSize: {
      // TODO set based on current window size
      height: 0,
      width: 0,
    },
  };

  // TODO standardize how payloads are passed around/handled
  return new Vuex.Store({
    state: initialState,
    getters: {},
    mutations: {
      setSelectedPopupLayer(state, payload) {
        state.map.selectedPopupLayer = payload;
      },
      setIntersectingFeatures(state, payload) {
        state.map.intersectingFeatures = payload;
      },
      setPopupCoords(state, payload) {
        state.map.popupCoords = payload;
      },
      setBennyEndpoints(state, payload) {
        state.bennyEndpoints = payload;
      },
      setBennyEndpoints2(state, payload) {
        state.bennyEndpoints2 = payload;
      },
      setBennyEndpoints3(state, payload) {
        state.bennyEndpoints3 = payload;
      },
      setLocation(state, payload) {
        state.map.location.lat = payload.lat;
        state.map.location.lng = payload.lng;
      },
      setWatchPositionOn(state, payload) {
        state.map.watchPositionOn = payload;
      },
      setLayerUrls(state, payload) {
        state.layers.layerUrls = payload;
      },
      setInputLayerFilter(state, payload) {
        state.layers.inputLayerFilter = payload;
      },
      setMap(state, payload) {
        state.map.map = payload.map;
      },
      setWebMap(state, payload) {
        state.map.webMap = payload;
      },
      setWebMapActiveLayers(state, payload) {
        state.map.webMapActiveLayers = payload;
      },
      setWebMapDisplayedLayers(state, payload) {
        state.map.webMapDisplayedLayers = payload;
      },
      setWebMapLayersAndRest(state, payload) {
        state.map.webMapLayersAndRest = payload;
      },
      setWebMapLayersOpacity(state, payload) {
        // console.log('SETWEBMAPLAYERSOPACITY IS RUNNING', payload);
        // let opa = state.map.webMapLayersAndRest.filter(layer => layer.layerName === payload.layerName)[0].opacity
        // console.log('OPACITY BEFORE', state.map.webMapLayersAndRest.filter(layer => layer.title === payload.layerName)[0].opacity);
        state.map.webMapLayersAndRest.filter(layer => layer.title === payload.layerName)[0].opacity = payload.opa;
        // console.log('OPACITY AFTER', state.map.webMapLayersAndRest.filter(layer => layer.title === payload.layerName)[0].opacity);
        //   return currentLayer[0];
        // console.log('SETWEBMAPLAYERSOPACITY FINISHED RUNNING');
      },

      setLegend(state, payload) {
        state.map.webMapLayersAndRest.filter(layer => layer.title === payload.layerName)[0].legend = payload.legend;
      },


      setMapScale(state, payload) {
        state.map.scale = payload
      },
      setBasemap(state, payload) {
        state.map.basemap = payload;
      },
      setImagery(state, payload) {
        state.map.imagery = payload;
      },
      setShouldShowImagery(state, payload) {
        state.map.shouldShowImagery = payload;
      },
      // setLastSearchMethod(state, payload) {
      //   state.lastSearchMethod = payload;
      // },


      setMapCenter(state, payload) {
        state.map.center = payload;
      },
      setMapZoom(state, payload) {
        state.map.zoom = payload
      },
      setGeocodeStatus(state, payload) {
        state.geocode.status = payload;
      },
      setGeocodeData(state, payload) {
        state.geocode.data = payload;
      },



      setPictometryActive(state, payload) {
        if (!config.pictometry.enabled) {
          return;
        }
        state.pictometry.active = payload;
      },
      setPictometryIpa(state, payload) {
        state.pictometry.ipa = payload;
      },
      setPictometryShapeIds(state, payload) {
        state.pictometry.shapeIds = payload;
      },
      setPictometryPngMarkerIds(state, payload) {
        state.pictometry.pngMarkerIds = payload;
      },
      setPictometryZoom(state, payload) {
        state.pictometry.zoom = payload;
      },
      setCyclomediaActive(state, payload) {
        if (!config.cyclomedia.enabled) {
          return;
        }
        state.cyclomedia.active = payload;
      },
      setCyclomediaViewer(state, payload) {
        state.cyclomedia.viewer = payload;
      },
      setCyclomediaRecordings(state, payload) {
        state.cyclomedia.recordings = payload;
      },
      setCyclomediaLocFromApp(state, payload) {
        state.cyclomedia.locFromApp = payload;
      },
      setCyclomediaLocFromViewer(state, payload) {
        state.cyclomedia.locFromViewer = payload;
      },
      setDidToggleTopicsOn(state, payload) {
        state.didToggleTopicsOn = payload;
      },
      setShouldShowTopics(state, payload) {
        state.shouldShowTopics = payload;
      },
      setShouldShowMap(state, payload) {
        state.shouldShowMap = payload;
      },
      setWindowSize(state, payload) {
        state.windowSize = payload;
      }
    }
  });
}

export default createStore;
