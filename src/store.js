import Vue from 'vue';
import Vuex from 'vuex';

// when you load vuex from a script tag this seems to happen automatically
// Vue.use(Vuex);

function createStore(config, bennyEndpoints, bennyRepresentation) {

  // create initial state for sources. data key => {}
  const sourceKeys = Object.keys(config.dataSources || {});
  const sources = sourceKeys.reduce((o, key) => {
    let val;
    // if the source has targets, just set it to be an empty object
    if (config.dataSources[key].targets) {
      val = {
        targets: {}
      };
    } else {
      val = {
       // we have to define these here, because vue can't observe properties that
       // are added later.
       status: null,
       data: null
     };
    }

    o[key] = val;

    return o;
  }, {});

  const initialState = {
    bennyEndpoints,
    geocode: {
      status: null,
      data: null
    },
    layers: {
      layerUrls: {},
      inputLayerFilter: '',
    },
    map: {
      center: config.map.center,
      zoom: config.map.zoom,
      scale: null,
      map: null,
      basemap: 'pwd',
      basemapLeft: 'imagery2017',
      basemapLayers: {},
      circleMarkers: [],
      webMapActiveLayers: [],
      webMapLayersAndRest: [],
      sideBySideActive: false,
    },
    dorParcels: [],
    pwdParcel: null,
    sources,
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
    activeFeature: null,
    lastSearchMethod: null
  };

  // TODO standardize how payloads are passed around/handled
  return new Vuex.Store({
    state: initialState,
    getters: {},
    mutations: {
      setLayerUrls(state, payload) {
        state.layers.layerUrls = payload;
      },
      setInputLayerFilter(state, payload) {
        state.layers.inputLayerFilter = payload;
      },
      setMap(state, payload) {
        state.map.map = payload.map;
      },
      setWebMapActiveLayers(state, payload) {
        state.map.webMapActiveLayers = payload;
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
      setMapScale(state, payload) {
        state.map.scale = payload
      },
      setBasemap(state, payload) {
        state.map.basemap = payload;
      },
      setBasemapLeft(state, payload) {
        state.map.basemapLeft = payload;
      },
      setBasemapLayers(state, payload) {
        // console.log('setBasemapLayers is running, payload:', payload);
        const key = Object.keys(payload);
        const value = Object.values(payload);
        // console.log(key);
        if (state.map.basemapLayers[key]){
          // console.log('already has key');
        } else {
          // console.log('doesnt have key');
          state.map.basemapLayers[key] = value[0];
        }
      },
      setActiveFeature(state, payload) {
        state.activeFeature = payload;
      },
      setLastSearchMethod(state, payload) {
        state.lastSearchMethod = payload;
      },
      setSideBySideActive(state, payload) {
        state.map.sideBySideActive = payload;
      },



      setMapCenter(state, payload) {
        state.map.center = payload;
      },
      setMapZoom(state, payload) {
        state.map.zoom = payload
      },
      setDorParcels(state, payload) {
        state.dorParcels = payload;
      },
      setPwdParcel(state, payload) {
        state.pwdParcel = payload;
      },
      setGeocodeStatus(state, payload) {
        state.geocode.status = payload;
      },
      setGeocodeData(state, payload) {
        state.geocode.data = payload;
      },





      setSourceStatus(state, payload) {
        const key = payload.key;
        const status = payload.status;

        // if a target id was passed in, set the status for that target
        const targetId = payload.targetId;

        if (targetId) {
          state.sources[key].targets[targetId].status = status;
        } else {
          state.sources[key].status = status;
        }
      },
      setSourceData(state, payload) {
        const key = payload.key;
        const data = payload.data;

        // if a target id was passed in, set the data object for that target
        const targetId = payload.targetId;

        if (targetId) {
          state.sources[key].targets[targetId].data = data;
        } else {
          state.sources[key].data = data;
        }
      },
      // this sets empty targets for a data source
      createEmptySourceTargets(state, payload) {
        const {key, targetIds} = payload;
        state.sources[key].targets = targetIds.reduce((acc, targetId) => {
          acc[targetId] = {
            status: null,
            data: null
          };
          return acc;
        }, {});
      },
      clearSourceTargets(state, payload) {
        const key = payload.key;
        state.sources[key].targets = {};
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
    }
  });
}

export default createStore;
