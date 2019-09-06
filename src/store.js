import Vue from 'vue';
import Vuex from 'vuex';
import isMobileDevice from './util/is-mobile-device';
import pvdStore from '@philly/vue-datafetch/src/controller/store.js';
import pvmStore from '@philly/vue-mapping/src/store.js';
import pvcStore from '@philly/vue-comps/src/store.js';
import mergeDeep from './util/merge-deep';

// when you load vuex from a script tag this seems to happen automatically
Vue.use(Vuex);

// function createStore(config, bennyEndpoints, bennyRepresentation) {
function createStore(config) { //}, bennyEndpoints, bennyRepresentation) {
  // const modals = pvdStore.createModals(config);
  const sources = pvdStore.createSources(config);

  const initialState = {
    sources,
    isMobileOrTablet: isMobileDevice(),
    fullScreen: {
      mapOnly: false,
      topicsOnly: false,
    },
    fullScreenMapEnabled: false,
    bennyEndpoints: {},
    layers: {
      defaultLayers: [],
      layerUrls: {},
      inputLayerFilter: '',
      inputTagsFilter: '',
    },
    map: {
      scale: null,
      webMap: null,
      webMapUrlLayer: null,
      webMapActiveLayers: [],
      webMapDisplayedLayers: [],
      webMapLayersAndRest: [],
      intersectingFeatures: [],
      popupCoords: null,
      selectedPopupLayer: null,
      categories: [],
      selectedCategory: '',
    },
    candidates: [],
    addressEntered: null,
    didToggleTopicsOn: false,
    shouldShowTopics: true,
    shouldShowMap: true,
    windowDimensions: {
      height: 0,
      width: 0,
    },
    // windowWidth: 0,
    route: null,
    modals: {
      keys: config.modals,
      open: '',
    },
  };

  if (config.map) {
    if (config.map.initialImagery) {
      initialState.map.imagery = config.map.initialImagery;
    }
    if (config.map.overlaySelectControl) {
      if (config.map.overlaySelectControl.initialSelection) {
        initialState.map.selectedOverlay = config.map.overlaySelectControl.initialSelection;
      }
    }
  }

  const lb = {
    state: initialState,
    getters: {},
    mutations: {
      setIsMobileOrTablet(state, payload) {
        state.isMobileOrTablet = payload;
      },
      setMapOnly(state, payload) {
        state.fullScreen.mapOnly = payload;
      },
      setTopicsOnly(state, payload) {
        state.fullScreen.topicsOnly = payload;
      },
      setFullScreenMapEnabled(state, payload) {
        state.fullScreenMapEnabled = payload;
      },
      setCategories(state, payload) {
        state.map.categories = payload;
      },
      setSelectedCategory(state, payload) {
        state.map.selectedCategory = payload;
      },
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
      setLocation(state, payload) {
        state.map.location.lat = payload.lat;
        state.map.location.lng = payload.lng;
      },
      setWatchPositionOn(state, payload) {
        state.map.watchPositionOn = payload;
      },
      setDefaultLayers(state, payload) {
        state.layers.defaultLayers = payload;
      },
      setLayerUrls(state, payload) {
        state.layers.layerUrls = payload;
      },
      setInputLayerFilter(state, payload) {
        state.layers.inputLayerFilter = payload;
      },
      setInputTagsFilter(state, payload) {
        state.layers.inputTagsFilter = payload;
      },
      setMap(state, payload) {
        state.map.map = payload.map;
      },
      setWebMap(state, payload) {
        state.map.webMap = payload;
      },
      setWebMapUrlLayer(state, payload) {
        state.map.webMapUrlLayer = payload;
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
        // console.log('METHOD layerboard store setLegend is running, payload:', payload);
        state.map.webMapLayersAndRest.filter(layer => layer.title === payload.layerName)[0].legend = payload.legend;
      },
      setMapScale(state, payload) {
        state.map.scale = payload
      },
      // setBasemap(state, payload) {
      //   state.map.basemap = payload;
      // },
      setDidToggleTopicsOn(state, payload) {
        state.didToggleTopicsOn = payload;
      },
      setShouldShowTopics(state, payload) {
        state.shouldShowTopics = payload;
      },
      setShouldShowMap(state, payload) {
        state.shouldShowMap = payload;
      },
      setWindowDimensions(state, payload) {
        state.windowDimensions = payload;
      },
      // setWindowWidth(state, payload) {
      //   state.windowWidth = payload;
      // },
      setRoute(state, payload) {
        state.route = payload;
      },
      // setDidToggleModal(state, name) {
      //   // console.log('setDidToggleModal, name:', name, 'open:', open);
      //   // console.log('setDidToggleModal, name:', name);
      //   // state.modals[name].open = open === null ? !state.modals[name].open : open
      //   state.modals.open = name;
      // },
      setCandidates(state, payload) {
        state.candidates = payload;
      },
      setAddressEntered(state, payload) {
        state.addressEntered = payload;
      },
    }
  }

  // let mergeStore = mergeDeep(lb, pvdStore.store);
  let mergeStore = mergeDeep(pvcStore, pvdStore.store);
  mergeStore = mergeDeep(mergeStore, pvmStore);
  mergeStore = mergeDeep(mergeStore, lb);

  // reset the map center and zoom based on the config
  mergeStore.state.map.center = config.map.center;
  mergeStore.state.map.zoom = config.map.zoom;
  mergeStore.state.pictometry.map.center = config.map.center;
  mergeStore.state.pictometry.map.zoom = config.map.zoom;

  return new Vuex.Store({
    state: mergeStore.state,
    getters: mergeStore.getters,
    mutations: mergeStore.mutations
  });
}

export default createStore;
