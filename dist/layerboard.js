(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vue'), require('vuex'), require('@cityofphiladelphia/phila-vue-comps'), require('leaflet'), require('@cityofphiladelphia/phila-vue-mapping'), require('axios'), require('@cityofphiladelphia/phila-vue-datafetch')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vue', 'vuex', '@cityofphiladelphia/phila-vue-comps', 'leaflet', '@cityofphiladelphia/phila-vue-mapping', 'axios', '@cityofphiladelphia/phila-vue-datafetch'], factory) :
  (factory((global.layerboard = {}),global.Vue,global.Vuex,global.philaVueComps,global.L,global.philaVueMapping,global.axios,global.philaVueDatafetch));
}(this, (function (exports,Vue,Vuex,philaVueComps,leaflet,philaVueMapping,axios,philaVueDatafetch) { 'use strict';

  Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;
  Vuex = Vuex && Vuex.hasOwnProperty('default') ? Vuex['default'] : Vuex;
  axios = axios && axios.hasOwnProperty('default') ? axios['default'] : axios;
  philaVueDatafetch = philaVueDatafetch && philaVueDatafetch.hasOwnProperty('default') ? philaVueDatafetch['default'] : philaVueDatafetch;

  function isMobileDevice () {
    var mobileOrTabletRegexA = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i;
    var mobileOrTabletRegexB = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;

    // get the user agent and test against both regex patterns
    var userAgent = (navigator.userAgent || navigator.vendor || window.opera || '');
    var isMobileOrTablet = (mobileOrTabletRegexA.test(userAgent) ||
                              mobileOrTabletRegexB.test(userAgent.substr(0,4)));

    return isMobileOrTablet;
  }

  // when you load vuex from a script tag this seems to happen automatically
  Vue.use(Vuex);

  // function createStore(config, bennyEndpoints, bennyRepresentation) {
  function createStore(config) { //}, bennyEndpoints, bennyRepresentation) {

    var initialState = {
      isMobileOrTablet: isMobileDevice(),
      fullScreenMapEnabled: false,
      bennyEndpoints: {},
      // bennyEndpoints2: {},
      // bennyEndpoints3: [],
      geocode: {
        status: null,
        data: null,
        input: null,
        related: null,
      },
      layers: {
        layerUrls: {},
        inputLayerFilter: '',
        inputTagsFilter: '',
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
        webMapUrlLayer: null,
        webMapActiveLayers: [],
        webMapDisplayedLayers: [],
        webMapLayersAndRest: [],
        watchPositionOn: false,
        intersectingFeatures: [],
        popupCoords: null,
        selectedPopupLayer: null,
        categories: [],
        selectedCategory: '',
        // webMapGeoJson: {}
      },
      shouldShowAddressCandidateList: false,
      candidates: [],
      addressEntered: null,
      cyclomedia: {
        initialized: false,
        navBarOpen: false,
        latLngFromMap: null,
        orientation: {
          yaw: null,
          hFov: null,
          xyz: null,
        },
        active: false,
        recordings: [],
      },
      pictometry: {
        ipa: null,
        active: false,
        shapeIds: [],
        pngMarkerIds: [],
        zoom: null,
        // this is the state of the main leaflet map. when these values change
        // the pictometry widget should react. the reason these are duplicated
        // here is to avoid an infinite loop in the Map component when the
        // viewport changes.
        map: {
          center: config.map.center,
          zoom: config.map.zoom
        }
      },
      lastSearchMethod: null,
      // this gets set to true on a mobile device when the user clicks the
      // "See Datasets" button
      didToggleTopicsOn: false,
      shouldShowTopics: true,
      shouldShowMap: true,
      windowWidth: 0,
      route: null,
      modals: {
        help: {
          open: false
        }
      }
    };

    // const TOGGLE_MODAL = 'modal/TOGGLE_MODAL'
    // const CLOSE_MODALS = 'modal/CLOSE_MODALS'

    // TODO standardize how payloads are passed around/handled
    return new Vuex.Store({
      state: initialState,
      getters: {},
      mutations: {
        setCyclomediaInitialized: function setCyclomediaInitialized(state, payload) {
          state.cyclomedia.initialized = payload;
        },
        setIsMobileOrTablet: function setIsMobileOrTablet(state, payload) {
          state.isMobileOrTablet = payload;
        },
        setFullScreenMapEnabled: function setFullScreenMapEnabled(state, payload) {
          state.fullScreenMapEnabled = payload;
        },
        setCategories: function setCategories(state, payload) {
          state.map.categories = payload;
        },
        setSelectedCategory: function setSelectedCategory(state, payload) {
          state.map.selectedCategory = payload;
        },
        setSelectedPopupLayer: function setSelectedPopupLayer(state, payload) {
          state.map.selectedPopupLayer = payload;
        },
        setIntersectingFeatures: function setIntersectingFeatures(state, payload) {
          state.map.intersectingFeatures = payload;
        },
        setPopupCoords: function setPopupCoords(state, payload) {
          state.map.popupCoords = payload;
        },
        setBennyEndpoints: function setBennyEndpoints(state, payload) {
          state.bennyEndpoints = payload;
        },
        setBennyEndpoints2: function setBennyEndpoints2(state, payload) {
          state.bennyEndpoints2 = payload;
        },
        setBennyEndpoints3: function setBennyEndpoints3(state, payload) {
          state.bennyEndpoints3 = payload;
        },
        setLocation: function setLocation(state, payload) {
          state.map.location.lat = payload.lat;
          state.map.location.lng = payload.lng;
        },
        setWatchPositionOn: function setWatchPositionOn(state, payload) {
          state.map.watchPositionOn = payload;
        },
        setLayerUrls: function setLayerUrls(state, payload) {
          state.layers.layerUrls = payload;
        },
        setInputLayerFilter: function setInputLayerFilter(state, payload) {
          state.layers.inputLayerFilter = payload;
        },
        setInputTagsFilter: function setInputTagsFilter(state, payload) {
          state.layers.inputTagsFilter = payload;
        },
        setMap: function setMap(state, payload) {
          state.map.map = payload.map;
        },
        setWebMap: function setWebMap(state, payload) {
          state.map.webMap = payload;
        },
        setWebMapUrlLayer: function setWebMapUrlLayer(state, payload) {
          state.map.webMapUrlLayer = payload;
        },
        setWebMapActiveLayers: function setWebMapActiveLayers(state, payload) {
          state.map.webMapActiveLayers = payload;
        },
        setWebMapDisplayedLayers: function setWebMapDisplayedLayers(state, payload) {
          state.map.webMapDisplayedLayers = payload;
        },
        setWebMapLayersAndRest: function setWebMapLayersAndRest(state, payload) {
          state.map.webMapLayersAndRest = payload;
        },
        setWebMapLayersOpacity: function setWebMapLayersOpacity(state, payload) {
          // console.log('SETWEBMAPLAYERSOPACITY IS RUNNING', payload);
          // let opa = state.map.webMapLayersAndRest.filter(layer => layer.layerName === payload.layerName)[0].opacity
          // console.log('OPACITY BEFORE', state.map.webMapLayersAndRest.filter(layer => layer.title === payload.layerName)[0].opacity);
          state.map.webMapLayersAndRest.filter(function (layer) { return layer.title === payload.layerName; })[0].opacity = payload.opa;
          // console.log('OPACITY AFTER', state.map.webMapLayersAndRest.filter(layer => layer.title === payload.layerName)[0].opacity);
          //   return currentLayer[0];
          // console.log('SETWEBMAPLAYERSOPACITY FINISHED RUNNING');
        },
        // setWebMapGeoJson(state, payload) {
        //   // const layerName = payload.layerName;
        //   // const json = payload.json;
        //   console.log('payload', payload);
        //   // state.map.webMapGeoJson[payload[]] = payload[json];
        //   state.map.webMapGeoJson = payload;
        // },

        setLegend: function setLegend(state, payload) {
          state.map.webMapLayersAndRest.filter(function (layer) { return layer.title === payload.layerName; })[0].legend = payload.legend;
        },


        setMapScale: function setMapScale(state, payload) {
          state.map.scale = payload;
        },
        setBasemap: function setBasemap(state, payload) {
          state.map.basemap = payload;
        },
        setImagery: function setImagery(state, payload) {
          state.map.imagery = payload;
        },
        setShouldShowImagery: function setShouldShowImagery(state, payload) {
          state.map.shouldShowImagery = payload;
        },
        // setLastSearchMethod(state, payload) {
        //   state.lastSearchMethod = payload;
        // },


        setMapCenter: function setMapCenter(state, payload) {
          state.map.center = payload;
        },
        setMapZoom: function setMapZoom(state, payload) {
          state.map.zoom = payload;
        },
        setGeocodeStatus: function setGeocodeStatus(state, payload) {
          state.geocode.status = payload;
        },
        setGeocodeData: function setGeocodeData(state, payload) {
          state.geocode.data = payload;
        },
        setGeocodeRelated: function setGeocodeRelated(state, payload) {
          state.geocode.related = payload;
        },
        setGeocodeInput: function setGeocodeInput(state, payload) {
          state.geocode.input = payload;
        },
        setPictometryActive: function setPictometryActive(state, payload) {
          if (!config.pictometry.enabled) {
            return;
          }
          state.pictometry.active = payload;
        },
        setPictometryIpa: function setPictometryIpa(state, payload) {
          state.pictometry.ipa = payload;
        },
        setPictometryShapeIds: function setPictometryShapeIds(state, payload) {
          state.pictometry.shapeIds = payload;
        },
        setPictometryPngMarkerIds: function setPictometryPngMarkerIds(state, payload) {
          state.pictometry.pngMarkerIds = payload;
        },
        setPictometryMapCenter: function setPictometryMapCenter(state, payload) {
          state.pictometry.map.center = payload;
        },
        setPictometryMapZoom: function setPictometryMapZoom(state, payload) {
          state.pictometry.map.zoom = payload;
        },
        setPictometryZoom: function setPictometryZoom(state, payload) {
          state.pictometry.zoom = payload;
        },
        setCyclomediaActive: function setCyclomediaActive(state, payload) {
          if (!config.cyclomedia.enabled) {
            return;
          }
          state.cyclomedia.active = payload;
        },
        setCyclomediaYaw: function setCyclomediaYaw(state, payload) {
          state.cyclomedia.orientation.yaw = payload;
        },
        setCyclomediaHFov: function setCyclomediaHFov(state, payload) {
          state.cyclomedia.orientation.hFov = payload;
        },
        setCyclomediaXyz: function setCyclomediaXyz(state, payload) {
          state.cyclomedia.orientation.xyz = payload;
        },
        setCyclomediaRecordings: function setCyclomediaRecordings(state, payload) {
          state.cyclomedia.recordings = payload;
        },
        setCyclomediaLatLngFromMap: function setCyclomediaLatLngFromMap(state, payload) {
          state.cyclomedia.latLngFromMap = payload;
          // const { lat, lng } = payload || {};
          // state.cyclomedia.latLngFromMap[0] = lat;
          // state.cyclomedia.latLngFromMap[1] = lng;
        },
        setCyclomediaNavBarOpen: function setCyclomediaNavBarOpen(state, payload) {
          state.cyclomedia.navBarOpen = payload;
        },
        setDidToggleTopicsOn: function setDidToggleTopicsOn(state, payload) {
          state.didToggleTopicsOn = payload;
        },
        setShouldShowTopics: function setShouldShowTopics(state, payload) {
          state.shouldShowTopics = payload;
        },
        setShouldShowMap: function setShouldShowMap(state, payload) {
          state.shouldShowMap = payload;
        },
        setWindowWidth: function setWindowWidth(state, payload) {
          state.windowWidth = payload;
        },

        setRoute: function setRoute(state, payload) {
          state.route = payload;
        },
        setDidToggleModal: function setDidToggleModal(state, ref) {
          var name = ref.name;
          var open = ref.open;

          console.log('setDidToggleModal, name:', name, 'open:', open);
          state.modals[name].open = open === null ? !state.modals[name].open : open;
        },
        // [types.TOGGLE_MODAL] (state, {name, open}) {
        //   state.modals[name].open = open === null ? !state.modals[name].open : open
        // },
        // [types.CLOSE_MODALS] (state) {
        //   for (let modalName in state.modals) {
        //     state.modals[modalName].open = false
        //   }
        // }
        setShouldShowAddressCandidateList: function setShouldShowAddressCandidateList(state, payload) {
          state.shouldShowAddressCandidateList = payload;
        },
        setCandidates: function setCandidates(state, payload) {
          state.candidates = payload;
        },
        setAddressEntered: function setAddressEntered(state, payload) {
          state.addressEntered = payload;
        }
      }
    });
  }

  // shout out to airyland
  // https://github.com/airyland/vue-config/blob/master/index.js

  function configMixin (Vue$$1, config) {
    Vue$$1.mixin({
      created: function created() {
        this.$config = config;
      }
    });
  }

  (function(){ if(typeof document !== 'undefined'){ var head=document.head||document.getElementsByTagName('head')[0], style=document.createElement('style'), css=" .forms-header[data-v-c37cf8b6] { padding: 5px; /*this keeps the box shadow over the scrollable part of the panel*/ position: relative; z-index: 1; -webkit-box-shadow: 0px 5px 7px -2px rgba(0,0,0,0.18); -moz-box-shadow: 0px 5px 7px -2px rgba(0,0,0,0.18); box-shadow: 0px 5px 7px -2px rgba(0,0,0,0.18); } .input-type[data-v-c37cf8b6] { margin-bottom: 0px; } .input-select[data-v-c37cf8b6] { margin-bottom: 0px; } .input-group[data-v-c37cf8b6] { height: 40px !important; margin-top: 6px; margin-bottom: 6px; } .input-group-label[data-v-c37cf8b6] { border-right: 1px; border-style: solid; padding-left: 8px; padding-right: 8px; padding-top: 0px; padding-bottom: 0px; height: 20px !important; } .topics-container[data-v-c37cf8b6] { padding: 20px; overflow-y: scroll; } .topics-container[data-v-c37cf8b6] { /* height: calc(100vh - 220px); */ /* height: calc(100vh - 268px); */ height: calc(100vh - 218px); } /* @media screen and (max-width: 40em) { */ @media screen and (max-width: 750px) { .topics-container[data-v-c37cf8b6] { /* height: calc(100vh - 256px); */ height: calc(100vh - 300px); } } .om-search-control-container[data-v-c37cf8b6] { border-radius: 2px; box-shadow:0 2px 4px rgba(0,0,0,0.2),0 -1px 0px rgba(0,0,0,0.02); margin-top: 10px; margin-bottom: 10px; width: inherit; } .om-search-control-button[data-v-c37cf8b6] { width: 40px; background: #ccc; float: right; } .om-search-control-input[data-v-c37cf8b6] { font-family: 'Montserrat', 'Tahoma', sans-serif; font-size: 16px; } .om-search-control-input-tags[data-v-c37cf8b6] { font-family: 'Montserrat', 'Tahoma', sans-serif; font-size: 16px; } .input-font[data-v-c37cf8b6] { font-family: 'Montserrat', 'Tahoma', sans-serif; font-size: 16px; } "; style.type='text/css'; if (style.styleSheet){ style.styleSheet.cssText = css; } else { style.appendChild(document.createTextNode(css)); } head.appendChild(style); } })();
  var Checkbox = philaVueComps.Checkbox;

  var TopicPanel = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{class:this.topicPanelContainerClass,attrs:{"id":"topic-panel-container"}},[_c('div',{staticClass:"cell"},[_c('div',{staticClass:"forms-header"},[_c('form',{staticClass:"om-search-control-input",on:{"submit":function($event){$event.preventDefault();return _vm.handleLayerFilterFormX($event)},"keydown":_vm.preventEnter}},[_c('div',{staticClass:"input-group text-filter"},[_c('span',{staticClass:"input-group-label input-font"},[_vm._v("Filter By Text:")]),_vm._v(" "),_c('input',{staticClass:"input-type",attrs:{"type":"text"},on:{"keyup":_vm.handleLayerFilterFormKeyup}}),_vm._v(" "),(this.$store.state.layers.inputLayerFilter != '')?_c('div',{staticClass:"input-group-button"},[_vm._m(0)]):_vm._e()])]),_vm._v(" "),_c('form',{staticClass:"om-search-control-input-tags",on:{"submit":function($event){$event.preventDefault();return _vm.handleTagsFilterFormX($event)},"keydown":_vm.preventEnter}},[_c('div',{staticClass:"input-group text-filter"},[_c('span',{staticClass:"input-group-label input-font"},[_vm._v("Filter By Tags:")]),_vm._v(" "),_c('input',{staticClass:"input-type",attrs:{"type":"text"},on:{"keyup":_vm.handleTagsFilterFormKeyup}}),_vm._v(" "),(this.$store.state.layers.inputTagsFilter != '')?_c('div',{staticClass:"input-group-button"},[_vm._m(1)]):_vm._e()])])]),_vm._v(" "),_c('div',{staticClass:"topics-container cell medium-cell-block-y",attrs:{"id":"topics-container"}},[_c('form',{attrs:{"action":"#/"}},[_c('fieldset',{staticClass:"options"},_vm._l((this.currentWmLayers),function(currentWmLayer,index){return _c('checkbox',{key:currentWmLayer.id,attrs:{"layer":currentWmLayer.layer,"layerName":currentWmLayer.title,"layerId":currentWmLayer.id,"layerDefinition":currentWmLayer.rest.layerDefinition,"opacity":currentWmLayer.opacity,"legend":currentWmLayer.legend,"tags":currentWmLayer.tags}})}))])])])])},staticRenderFns: [function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('button',{staticClass:"om-search-control-button"},[_c('i',{staticClass:"fa fa-times fa-lg"})])},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('button',{staticClass:"om-search-control-button"},[_c('i',{staticClass:"fa fa-times fa-lg"})])}],_scopeId: 'data-v-c37cf8b6',
    components: {
      Checkbox: Checkbox
    },
    computed: {
      windowWidth: function windowWidth() {
        return this.$store.state.windowWidth;
      },
      fullScreenMapEnabled: function fullScreenMapEnabled() {
        return this.$store.state.fullScreenMapEnabled;
      },
      topicPanelContainerClass: function topicPanelContainerClass() {
        if (this.fullScreenMapEnabled) {
          return 'cell medium-1 small-order-2 medium-order-1'
        } else if (this.windowWidth >= 950) {
          return 'cell medium-8 small-order-1 small-24 medium-order-2';
        } else {
          return 'cell medium-10 small-order-1 small-24 medium-order-2';
        }
      },
      categories: function categories() {
        return this.$store.state.map.categories;
      },
      selectedCategory: function selectedCategory() {
        return this.$store.state.map.selectedCategory;
      },
      scale: function scale() {
        return this.$store.state.map.scale;
      },
      currentWmLayers: function currentWmLayers() {
        var this$1 = this;

        var layers = this.$store.state.map.webMapLayersAndRest;
        var currentLayers = [];
        for (var i = 0, list = layers; i < list.length; i += 1) {
          var layer = list[i];

          if (layer.tags) {
            if (
              layer.title.toLowerCase().includes(this$1.inputLayerFilter.toLowerCase()) && layer.tags.join().toLowerCase().includes(this$1.inputTagsFilter.toLowerCase()) && layer.category.includes(this$1.selectedCategory)
              || this$1.$store.state.map.webMapActiveLayers.includes(layer.title)
            ) {
              // if (this.inputTagsFilter !== '') {
              //   for (let layerTag of layer.tags) {
              //     if (layerTag.toLowerCase().includes(this.inputTagsFilter.toLowerCase())) {
              //       console.log('layerTag:', layerTag);
              //     }
              //   }
              // }
              currentLayers.push(layer);
            }
          } else if (this$1.inputTagsFilter !== '') {
            continue;
          } else {
            if (
              layer.title.toLowerCase().includes(this$1.inputLayerFilter.toLowerCase()) && layer.category.includes(this$1.selectedCategory)
              || this$1.$store.state.map.webMapActiveLayers.includes(layer.title)
            ) {
              currentLayers.push(layer);
            }
          }
        }
        return currentLayers;
      },
      inputLayerFilter: function inputLayerFilter() {
        return this.$store.state.layers.inputLayerFilter;
      },
      inputTagsFilter: function inputTagsFilter() {
        return this.$store.state.layers.inputTagsFilter;
      },
      windowSize: function windowSize() {
        return this.$store.state.windowSize;
      },
    },
    methods: {
      handleLayerFilterFormKeyup: function handleLayerFilterFormKeyup(e) {
        var input = e.target.value;
        this.$store.commit('setInputLayerFilter', input);
      },
      handleLayerFilterFormX: function handleLayerFilterFormX(e) {
        e.target[0].value = '';
        this.$store.commit('setInputLayerFilter', '');
      },
      handleTagsFilterFormKeyup: function handleTagsFilterFormKeyup(e) {
        var input = e.target.value;
        // if (input.length >= 3) {
        this.$store.commit('setInputTagsFilter', input);
        // } else {
          // this.$store.commit('setInputLayerFilter', null);
        // }
      },
      handleTagsFilterFormX: function handleTagsFilterFormX(e) {
        e.target[0].value = '';
        this.$store.commit('setInputTagsFilter', '');
      },
      didSelectCategory: function didSelectCategory(e) {
        var selected = e.target.selectedIndex;
        this.$store.commit('setSelectedCategory', this.categories[selected]);
      },
      preventEnter: function preventEnter(e) {
        if(e.keyCode === 13) {
          e.preventDefault();
        }
      },
    },
  };

  var markersMixin = {
    computed: {
      // returns map markers as simple object with a geometry property, key,
      // and optional properties for symbology
      markers: function markers() {
        var markers = [];
        // geocoded address marker
        var geocodeGeom = this.geocodeGeom;
        if (geocodeGeom) {
          var latlng = [].concat( geocodeGeom.coordinates ).reverse();
          var key = this.geocodeResult.properties.street_address;
          var addressMarker = {latlng: latlng, key: key};
          markers.push(addressMarker);
        }
        return markers;
      },
      locationMarker: function locationMarker() {
        var latlngArray = [this.$store.state.map.location.lat, this.$store.state.map.location.lng];
        var marker = {
          latlng: latlngArray,
          radius: 6,
          fillColor: '#ff3f3f',
          color: '#ff0000',
          weight: 1,
          opacity: 1,
          fillOpacity: 1.0
        };
        return marker;
      },
    },
  };

  (function(){ if(typeof document !== 'undefined'){ var head=document.head||document.getElementsByTagName('head')[0], style=document.createElement('style'), css=" /* .map-panel-container { height: calc(100vh - 220px); } @media screen and (max-width: 40em) { .map-panel-container { height: calc(100vh - 256px); } } */ /*this allows the loading mask to fill the div*/ .mb-panel-map[data-v-11a08c18] { position: relative; } .mb-map-with-widget[data-v-11a08c18] { height: 50%; } /* @media (max-width: 1024px) { .mb-panel-map { height: 600px; } } */ .mb-search-control-container[data-v-11a08c18] { height: 48px; border-radius: 2px; box-shadow:0 2px 4px rgba(0,0,0,0.2),0 -1px 0px rgba(0,0,0,0.02); } .mb-search-control-button[data-v-11a08c18] { color: #fff; width: 50px; background: #2176d2; line-height: 48px; } .mb-search-control-input[data-v-11a08c18] { /* background-color: white; */ border: 0; /* height: 48px !important; */ /* line-height: 48px; */ padding: 15px; /* padding-left: 15px; */ /* padding-right: 15px; */ font-family: 'Montserrat', 'Tahoma', sans-serif; font-size: 16px; width: 275px; } /* .mb-map-with-widget { height: 50%; } */ .widget-slot[data-v-11a08c18] { display: inline-block; float: left; } .mb-map-loading-mask[data-v-11a08c18] { /*display: inline;*/ position: absolute; top: 0; height: 100%; width: 100%; background: rgba(0, 0 ,0 , 0.25); z-index: 1000; text-align: center; vertical-align: middle; } .mb-map-loading-mask-inner[data-v-11a08c18] { position: absolute; top: 40%; left: 40%; } @media screen and (max-width: 1023px) { .mb-search-control-input[data-v-11a08c18] { width: 250px; } } @media screen and (max-width: 900px) { .mb-search-control-input[data-v-11a08c18] { width: 200px; } } @media screen and (max-width: 800px) { .mb-search-control-input[data-v-11a08c18] { width: 150px; } } @media screen and (max-width: 750px) { .mb-search-control-input[data-v-11a08c18] { width: 250px; } } /* @media screen and (max-width: 639px) { .mb-search-control-input { width: 250px; } } */ @media screen and (max-width: 450px) { .mb-search-control-input[data-v-11a08c18] { width: 200px; } } @media screen and (max-width: 400px) { .mb-search-control-input[data-v-11a08c18] { width: 150px; } } @media screen and (max-width: 350px) { .mb-search-control-input[data-v-11a08c18] { width: 100px; } } "; style.type='text/css'; if (style.styleSheet){ style.styleSheet.cssText = css; } else { style.appendChild(document.createTextNode(css)); } head.appendChild(style); } })();
  var cyclomediaMixin = philaVueMapping.CyclomediaMixin;
  var pictometryMixin = philaVueMapping.PictometryMixin;

  // vue doesn't like it when you import this as Map (reserved-ish word)
  var Map_ = philaVueMapping.Map_;
  var AddressInput = philaVueMapping.AddressInput;
  var AddressCandidateList = philaVueMapping.AddressCandidateList;
  var CircleMarker = philaVueMapping.CircleMarker;
  var Control = philaVueMapping.Control;
  var EsriTiledMapLayer = philaVueMapping.EsriTiledMapLayer;
  var PngMarker = philaVueMapping.PngMarker;
  var BasemapToggleControl = philaVueMapping.BasemapToggleControl;
  var BasemapSelectControl = philaVueMapping.BasemapSelectControl;
  var FullScreenMapToggleTab = philaVueMapping.FullScreenMapToggleTab;
  var LocationControl = philaVueMapping.LocationControl;
  var CyclomediaButton = philaVueMapping.CyclomediaButton;
  var PictometryButton = philaVueMapping.PictometryButton;
  var CyclomediaRecordingCircle = philaVueMapping.CyclomediaRecordingCircle;
  var CyclomediaRecordingsClient = philaVueMapping.CyclomediaRecordingsClient;
  var SvgViewConeMarker = philaVueMapping.SvgViewConeMarker;
  var MeasureControl = philaVueMapping.MeasureControl;
  var ControlCorner = philaVueMapping.ControlCorner;
  var PopUp = philaVueMapping.PopUp;
  var PopUpContent = philaVueMapping.PopUpContent;
  var Polygon_ = philaVueMapping.Polygon_;
  var Polyline_ = philaVueMapping.Polyline_;
  var ModalAbout = philaVueMapping.ModalAbout;

  var EsriWebMap = philaVueMapping.WebMap;
  var EsriWebMapLayer = philaVueMapping.WebMapLayer;
  var VectorMarker = philaVueMapping.VectorMarker;

  var MapPanel = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{class:this.mapPanelContainerClass,attrs:{"id":"map-panel-container"}},[_vm._m(0),_vm._v(" "),_c('map_',{class:{ 'mb-map-with-widget': this.$store.state.cyclomedia.active || this.$store.state.pictometry.active },attrs:{"id":"map-tag","center":this.mapCenter,"zoom":this.$store.state.map.zoom,"zoom-control-position":"bottomright","min-zoom":this.$config.map.minZoom,"max-zoom":22},on:{"l-click":_vm.handleMapClick,"l-moveend":_vm.handleMapMove}},[(this.selectedPopupLayerGeometryType === 'Polygon' || this.selectedPopupLayerGeometryType === 'MultiPolygon')?_c('polygon_',{attrs:{"color":'#00ffff',"fill":false,"weight":5,"latlngs":this.selectedPopupLayerCoordinatesFlipped,"pane":'highlightOverlay'}}):_vm._e(),_vm._v(" "),(this.selectedPopupLayerGeometryType === 'LineString')?_c('polyline_',{attrs:{"color":'#00ffff',"weight":4,"latlngs":this.selectedPopupLayerCoordinatesFlipped,"pane":'highlightOverlay'}}):_vm._e(),_vm._v(" "),(this.selectedPopupLayerGeometryType === 'Point')?_c('circle-marker',{attrs:{"latlng":this.selectedPopupLayerCoordinatesFlipped,"radius":7,"fillColor":'#00ffff',"color":'#00ffff',"weight":this.locationMarker.weight,"opacity":this.locationMarker.opacity,"fillOpacity":this.locationMarker.fillOpacity,"pane":'highlightOverlay'}}):_vm._e(),_vm._v(" "),_c('esri-web-map',_vm._l((this.$store.state.map.webMapLayersAndRest),function(layer,key){return (_vm.shouldShowFeatureLayer(layer))?_c('esri-web-map-layer',{key:key,attrs:{"layer":layer.layer,"layerName":layer.title,"layerDefinition":layer.rest.layerDefinition,"opacity":layer.opacity,"type":layer.type2}}):_vm._e()})),_vm._v(" "),(this.shouldShowPopup)?_c('pop-up',[_c('pop-up-content')],1):_vm._e(),_vm._v(" "),_vm._l((this.$config.map.basemaps),function(basemap,key){return (_vm.activeBasemap === key)?_c('esri-tiled-map-layer',{key:key,attrs:{"name":key,"url":basemap.url,"max-zoom":basemap.maxZoom,"zIndex":basemap.zIndex,"attribution":basemap.attribution}}):_vm._e()}),_vm._v(" "),_vm._l((this.$config.map.tiledLayers),function(tiledLayer,key){return (_vm.activeTiles.includes(key))?_c('esri-tiled-map-layer',{key:key,attrs:{"name":key,"url":tiledLayer.url,"zIndex":tiledLayer.zIndex,"attribution":tiledLayer.attribution}}):_vm._e()}),_vm._v(" "),_vm._l((_vm.markers),function(marker,index){return _c('vector-marker',{key:marker.key,attrs:{"latlng":marker.latlng}})}),_vm._v(" "),(this.cyclomediaActive)?_c('png-marker',{attrs:{"icon":'../../src/assets/camera.png',"latlng":_vm.cycloLatlng,"rotationAngle":_vm.cycloRotationAngle}}):_vm._e(),_vm._v(" "),(this.cyclomediaActive)?_c('svg-view-cone-marker',{attrs:{"latlng":_vm.cycloLatlng,"rotationAngle":_vm.cycloRotationAngle,"hFov":_vm.cycloHFov}}):_vm._e(),_vm._v(" "),_c('control-corner',{attrs:{"vSide":'top',"hSide":'almostright'}}),_vm._v(" "),_c('control-corner',{attrs:{"vSide":'top',"hSide":'almostleft'}}),_vm._v(" "),_vm._m(2),_vm._v(" "),_vm._m(3),_vm._v(" "),_vm._m(5),_vm._v(" "),_vm._m(7),_vm._v(" "),_vm._m(8),_vm._v(" "),_vm._m(10),_vm._v(" "),_vm._m(11),_vm._v(" "),(this.addressAutocompleteEnabled)?_c('AddressCandidateList',{attrs:{"position":this.addressInputPosition}}):_vm._e(),_vm._v(" "),(this.$store.state.map.location.lat != null)?_c('circle-marker',{attrs:{"latlng":this.locationMarker.latlng,"radius":this.locationMarker.radius,"fillColor":this.locationMarker.fillColor,"color":this.locationMarker.color,"weight":this.locationMarker.weight,"opacity":this.locationMarker.opacity,"fillOpacity":this.locationMarker.fillOpacity,"pane":'highlightOverlay'}}):_vm._e(),_vm._v(" "),_vm._l((_vm.cyclomediaRecordings),function(recording){return (_vm.cyclomediaActive)?_c('cyclomedia-recording-circle',{key:recording.imageId,attrs:{"imageId":recording.imageId,"latlng":[recording.lat, recording.lng],"size":1.2,"color":'#3388ff',"weight":1},on:{"l-click":_vm.handleCyclomediaRecordingClick}}):_vm._e()})],2),_vm._v(" "),_c('modal-about'),_vm._v(" "),_vm._t("cycloWidget"),_vm._v(" "),_vm._t("pictWidget")],2)},staticRenderFns: [function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('full-screen-map-toggle-tab')},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('basemap-toggle-control',{attrs:{"position":'topright'}})},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[(_vm.shouldShowImageryToggle)?_vm._m(1):_vm._e()],1)},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('basemap-select-control',{attrs:{"position":'topalmostright'}})],1)},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('pictometry-button',{attrs:{"position":'topright',"link":'pictometry',"imgSrc":'../../src/assets/pictometry.png'}})},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[(this.shouldShowPictometryButton)?_vm._m(4):_vm._e()],1)},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('cyclomedia-button',{attrs:{"position":'topright',"link":'cyclomedia',"imgSrc":'../../src/assets/cyclomedia.png'},on:{"click":_vm.handleCyclomediaButtonClick}})},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[(this.shouldShowCyclomediaButton)?_vm._m(6):_vm._e()],1)},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('measure-control',{attrs:{"position":'bottomleft'}})],1)},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('location-control',{attrs:{"position":'bottomright'},on:{"click":_vm.handleButtonClick}})},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[(this.geolocationEnabled)?_vm._m(9):_vm._e()],1)},function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',[_c('AddressInput',{attrs:{"position":this.addressInputPosition}})],1)}],_scopeId: 'data-v-11a08c18',
    mixins: [
      markersMixin,
      cyclomediaMixin,
      pictometryMixin ],
    components: {
      AddressInput: AddressInput,
      AddressCandidateList: AddressCandidateList,
      Map_: Map_,
      Control: Control,
      EsriWebMap: EsriWebMap,
      EsriWebMapLayer: EsriWebMapLayer,
      EsriTiledMapLayer: EsriTiledMapLayer,
      CircleMarker: CircleMarker,
      VectorMarker: VectorMarker,
      PngMarker: PngMarker,
      BasemapToggleControl: BasemapToggleControl,
      BasemapSelectControl: BasemapSelectControl,
      FullScreenMapToggleTab: FullScreenMapToggleTab,
      LocationControl: LocationControl,
      PictometryButton: PictometryButton,
      CyclomediaButton: CyclomediaButton,
      CyclomediaRecordingCircle: CyclomediaRecordingCircle,
      SvgViewConeMarker: SvgViewConeMarker,
      MeasureControl: MeasureControl,
      ControlCorner: ControlCorner,
      PopUp: PopUp,
      PopUpContent: PopUpContent,
      Polygon_: Polygon_,
      Polyline_: Polyline_,
      ModalAbout: ModalAbout
    },
    mounted: function mounted() {
      this.$controller.appDidLoad();
    },
    computed: {
      mapCenter: function mapCenter() {
        return this.$store.state.map.center;
      },
      addressAutocompleteEnabled: function addressAutocompleteEnabled() {
        // TODO tidy up the code
        if (this.$config.addressAutocomplete.enabled === true) {
          return true;
        } else {
          return false;
        }
      },
      addressInputPosition: function addressInputPosition() {
        if (this.isMobileOrTablet) {
          return 'topleft'
        } else {
          return 'topalmostleft'
        }
      },
      isMobileOrTablet: function isMobileOrTablet() {
        return this.$store.state.isMobileOrTablet;
      },
      fullScreenMapEnabled: function fullScreenMapEnabled() {
        return this.$store.state.fullScreenMapEnabled;
      },
      windowWidth: function windowWidth() {
        return this.$store.state.windowWidth;
      },
      mapPanelContainerClass: function mapPanelContainerClass() {
        if (this.fullScreenMapEnabled) {
          return 'medium-24 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map'
        } else if (this.windowWidth >= 950) {
          return 'medium-16 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map';
        } else {
          return 'medium-14 small-order-1 small-24 medium-order-2 mb-panel mb-panel-map';
        }
      },
      cycloLatlng: function cycloLatlng() {
        if (this.$store.state.cyclomedia.orientation.xyz !== null) {
          var xyz = this.$store.state.cyclomedia.orientation.xyz;
          return [xyz[1], xyz[0]];
        } else {
          var center = this.$config.map.center;
          return center;
        }
      },
      cycloRotationAngle: function cycloRotationAngle() {
        return this.$store.state.cyclomedia.orientation.yaw * (180/3.14159265359);
      },
      cycloHFov: function cycloHFov() {
        return this.$store.state.cyclomedia.orientation.hFov;
      },
      shouldShowCyclomediaButton: function shouldShowCyclomediaButton() {
        return this.$config.cyclomedia.enabled && !this.isMobileOrTablet;
      },
      shouldShowPictometryButton: function shouldShowPictometryButton() {
        return this.$config.pictometry.enabled && !this.isMobileOrTablet;
      },
      shouldShowPopup: function shouldShowPopup() {
        if (this.intersectingFeatures.length > 0) {
          return true;
        } else {
          return false;
        }
      },
      selectedPopupLayer: function selectedPopupLayer() {
        return this.$store.state.map.selectedPopupLayer;
      },
      selectedPopupLayerGeometryType: function selectedPopupLayerGeometryType() {
        if (this.selectedPopupLayer) {
          return this.selectedPopupLayer.feature.geometry.type;
        } else {
          return null;
      }
      },
      selectedPopupLayerCoordinates: function selectedPopupLayerCoordinates() {
        if (this.selectedPopupLayerGeometryType === "Point" || this.selectedPopupLayerGeometryType === "LineString") {
          return this.selectedPopupLayer.feature.geometry.coordinates;
        } else if (this.selectedPopupLayerGeometryType === "Polygon") {
          return this.selectedPopupLayer.feature.geometry.coordinates[0];
        } else if (this.selectedPopupLayerGeometryType === "MultiPolygon") {
          return this.selectedPopupLayer.feature.geometry.coordinates;
        }
      },
      selectedPopupLayerCoordinatesFlipped: function selectedPopupLayerCoordinatesFlipped() {
        // console.log('coords:', this.flipCoordsArray(this.selectedPopupLayerCoordinates));
        if (this.selectedPopupLayerGeometryType === "Point") {
          return this.flipCoords(this.selectedPopupLayerCoordinates);
        } else if (this.selectedPopupLayerGeometryType !== "MultiPolygon") {
          // console.log('calling FlipCoordsArray on:', this.selectedPopupLayerCoordinates);
          return this.flipCoordsArray(this.selectedPopupLayerCoordinates);
        } else {
          return this.flipCoordsMultiPolygon(this.selectedPopupLayerCoordinates);
        }
      },
      intersectingFeatures: function intersectingFeatures() {
        return this.$store.state.map.intersectingFeatures;
      },
      geolocationEnabled: function geolocationEnabled() {
        return this.$config.geolocation.enabled;
      },
      scale: function scale() {
        return this.$store.state.map.scale;
      },
      webMapActiveLayers: function webMapActiveLayers() {
        return this.$store.state.map.webMapActiveLayers;
      },
      activeBasemap: function activeBasemap() {
        var shouldShowImagery = this.$store.state.map.shouldShowImagery;
        if (shouldShowImagery) {
          return this.$store.state.map.imagery;
        }
        var defaultBasemap = this.$config.map.defaultBasemap;
        var basemap = this.$store.state.map.basemap || defaultBasemap;
        return basemap;
      },
      activeTiles: function activeTiles() {
        if (this.$config.map.basemaps[this.activeBasemap]) {
          return this.$config.map.basemaps[this.activeBasemap].tiledLayers;
        } else {
          return [];
        }
      },
      basemaps: function basemaps() {
        return Object.values(this.$config.map.basemaps);
      },
      shouldShowImageryToggle: function shouldShowImageryToggle() {
        return this.hasImageryBasemaps && this.$config.map.imagery.enabled;
      },
      imageryBasemaps: function imageryBasemaps() {
        return this.basemaps.filter(function (basemap) { return basemap.type === 'imagery'; });
      },
      hasImageryBasemaps: function hasImageryBasemaps() {
        return this.imageryBasemaps.length > 0;
      },
      imageryYears: function imageryYears() {
        // pluck year from basemap objects
        return this.imageryBasemaps.map(function (x) { return x.year; });
      },
      historicBasemaps: function historicBasemaps() {
        return this.basemaps.filter(function (basemap) { return basemap.type === 'historic'; });
      },
      hasHistoricBasemaps: function hasHistoricBasemaps() {
        return this.historicBasemaps.length > 0;
      },
      historicYears: function historicYears() {
        return this.historicBasemaps.map(function (x) { return x.year; });
      },
      geocodeResult: function geocodeResult() {
        return this.$store.state.geocode.data;
      },
      geocodeGeom: function geocodeGeom() {
        return (this.geocodeResult || {}).geometry;    },
      picOrCycloActive: function picOrCycloActive() {
        if (this.cyclomediaActive || this.pictometryActive) {
          return true;
        } else {
          return false;
        }
      },
    },
    created: function created() {
      // if there's a default address, navigate to it
      var defaultAddress = this.$config.defaultAddress;
      if (defaultAddress) {
        this.$controller.goToDefaultAddress(defaultAddress);
      }

      var cyclomediaConfig = this.$config.cyclomedia || {};
      if (cyclomediaConfig.enabled) {
      // create cyclomedia recordings client
        this.$cyclomediaRecordingsClient = new CyclomediaRecordingsClient(
          this.$config.cyclomedia.recordingsUrl,
          this.$config.cyclomedia.username,
          this.$config.cyclomedia.password,
          4326
        );
      }
    },
    watch: {
      picOrCycloActive: function picOrCycloActive(value) {
        var this$1 = this;

        this.$nextTick(function () {
          this$1.$store.state.map.map.invalidateSize();
        });
      }
    },
    methods: {
      flipCoords: function flipCoords(coords) {
        // console.log('flipCoords is running on:', coords);
        return [coords[1], coords[0]];
      },
      flipCoordsArray: function flipCoordsArray(anArray) {
        // console.log('flipCoordsArray is running on:', anArray);
        var newArray = [];
        for (var i in anArray) {
          newArray[i] = [anArray[i][1], anArray[i][0]];
        }
        return newArray
      },
      flipCoordsMultiPolygon: function flipCoordsMultiPolygon(aMultiPolygon) {
        // console.log('flipCoordsMultiPolygon is running on:', aMultiPolygon);
        var newArrayArray = [];
        for (var i in aMultiPolygon) {
          // console.log('aMultiPolygon[i]', aMultiPolygon[i]);
          var newArray = [];
          for (var j in aMultiPolygon[i][0]) {
            // console.log('aMultiPolygon[i][0][j]', aMultiPolygon[i][0][j]);
            newArray[j] = [aMultiPolygon[i][0][j][1], aMultiPolygon[i][0][j][0]];
          }
        newArrayArray[i] = newArray;
        }
        return newArrayArray
      },
      shouldShowFeatureLayer: function shouldShowFeatureLayer(layer) {
        if (layer.rest.layerDefinition) {
          if (layer.rest.layerDefinition.minScale) {
            // console.log('minZoom for', layer.title, 'is', layer.rest.layerDefinition.minScale, typeof layer.rest.layerDefinition.minScale, 'and current scale is', this.scale, typeof this.scale);
            if (this.scale <= layer.rest.layerDefinition.minScale && this.webMapActiveLayers.includes(layer.title)) {
              // console.log('checkLayer used layerDefinition and is returning true for', layer.title);
              return true;
            }
          } else if (layer.rest.layerDefinition.drawingInfo && this.webMapActiveLayers.includes(layer.title)) {
            return true;
          }
        } else if (this.webMapActiveLayers.includes(layer.title)) {
          // console.log('checkLayer is returning true for', layer.title);
          return true;
        } else {
          return false;
        }
      },
      handleMapClick: function handleMapClick() {
        // console.log('handle map click, e:', e);
        document.getElementById('pvm-search-control-input').blur();
      },
      handleButtonClick: function handleButtonClick() {
        // console.log('handle button click is running');
        document.getElementById('pvm-search-control-input').blur();
      },
      handleMapMove: function handleMapMove(e) {
        // console.log('handleMapMove is running');
        var map = this.$store.state.map.map;

        var pictometryConfig = this.$config.pictometry || {};

        var center = map.getCenter();
        var lat = center.lat;
        var lng = center.lng;
        var coords = [lng, lat];
        var zoom = map.getZoom();
        this.$store.commit('setMapZoom', zoom);
        var scale = this.$config.map.scales[zoom];
        this.$store.commit('setMapScale', scale);

        if (pictometryConfig.enabled) {
          // update state for pictometry
          this.$store.commit('setPictometryMapCenter', coords);

          var zoom$1 = map.getZoom();
          this.$store.commit('setPictometryMapZoom', zoom$1);
        }

        var cyclomediaConfig = this.$config.cyclomedia || {};

        if (cyclomediaConfig.enabled) {
          // update cyclo recordings
          this.updateCyclomediaRecordings();
          this.$store.commit('setCyclomediaLatLngFromMap', [lat, lng]);
        }
      },

    }, // end of methods
  }; //end of export

  (function(){ if(typeof document !== 'undefined'){ var head=document.head||document.getElementsByTagName('head')[0], style=document.createElement('style'), css=" /*don't highlight any form elements*/ input:focus, select:focus, textarea:focus, button:focus { outline: none; } /* standards applies padding to buttons, which causes some weirdness with buttons on the map panel. override here. */ button { padding: inherit; } .mb-root { position: absolute; bottom: 0; top: 78px; left: 0; right: 0; overflow: auto; } .datasets-button { display: none; margin: 0; } .mb-panel { height: 100%; } /*.mb-panel-topics-with-widget { height: 50%; }*/ /*small devices only*/ /* @media screen and (max-width: 39.9375em) { */ @media screen and (max-width: 750px) { .datasets-button { display: block; } } /* Medium and up */ /* @media screen and (min-width: 40em) { } */ /* Medium only */ /* @media screen and (min-width: 40em) and (max-width: 63.9375em) { } */ /* Large and up */ /* @media screen and (min-width: 64em) { } */ /* Large only */ /* @media screen and (min-width: 64em) and (max-width: 74.9375em) { } */ "; style.type='text/css'; if (style.styleSheet){ style.styleSheet.cssText = css; } else { style.appendChild(document.createTextNode(css)); } head.appendChild(style); } })();
  var CyclomediaWidget = philaVueMapping.CyclomediaWidget;
  var PictometryWidget = philaVueMapping.PictometryWidget;
  var Layer = philaVueMapping.PictometryLayer;
  var ViewCone = philaVueMapping.PictometryViewCone;
  var PngMarker$1 = philaVueMapping.PictometryPngMarker;

  var Layerboard = {render: function(){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{staticClass:"cell medium-auto grid-x",attrs:{"id":"mb-root"}},[_c('button',{staticClass:"small-24 button datasets-button",on:{"click":_vm.toggleTopics}},[_vm._v(" "+_vm._s(this.buttonMessage)+" ")]),_vm._v(" "),_c('topic-panel',{directives:[{name:"show",rawName:"v-show",value:(_vm.shouldShowTopics),expression:"shouldShowTopics"}]}),_vm._v(" "),_c('map-panel',{directives:[{name:"show",rawName:"v-show",value:(_vm.shouldShowMap),expression:"shouldShowMap"}]},[(this.shouldLoadCyclomediaWidget)?_c('cyclomedia-widget',{directives:[{name:"show",rawName:"v-show",value:(_vm.cyclomediaActive),expression:"cyclomediaActive"}],attrs:{"slot":"cycloWidget","screen-percent":"3"},slot:"cycloWidget"}):_vm._e(),_vm._v(" "),(this.shouldLoadPictometryWidget)?_c('pictometry-widget',{directives:[{name:"show",rawName:"v-show",value:(_vm.pictometryActive),expression:"pictometryActive"}],attrs:{"slot":"pictWidget","apiKey":this.ak,"secretKey":this.sk},slot:"pictWidget"},[(this.pictometryShowAddressMarker)?_c('png-marker',{attrs:{"latlng":[this.geocodeData.geometry.coordinates[1], this.geocodeData.geometry.coordinates[0]],"icon":'markers.png',"height":60,"width":40,"offsetX":0,"offsetY":0}}):_vm._e(),_vm._v(" "),(this.pictometryActive)?_c('layer'):_vm._e(),_vm._v(" "),(this.cyclomediaActive && this.pictometryActive)?_c('png-marker',{attrs:{"latlng":_vm.cycloLatlng,"icon":'camera2.png',"height":20,"width":30,"offsetX":-2,"offsetY":-2}}):_vm._e(),_vm._v(" "),(this.cyclomediaActive && this.pictometryActive)?_c('view-cone',{attrs:{"latlng":_vm.cycloLatlng,"rotationAngle":_vm.cycloRotationAngle,"hFov":_vm.cycloHFov}}):_vm._e()],1):_vm._e()],1)],1)},staticRenderFns: [],
    components: {
      TopicPanel: TopicPanel,
      MapPanel: MapPanel,
      CyclomediaWidget: CyclomediaWidget,
      PictometryWidget: PictometryWidget,
      Layer: Layer,
      ViewCone: ViewCone,
      PngMarker: PngMarker$1
    },
    mounted: function mounted() {
      // console.log('cyclo', this.$config.cyclomedia.enabled, CyclomediaWidget);
      window.addEventListener('resize', this.handleWindowResize);
      this.handleWindowResize();

      var store = this.$store;
      var knackUrl = "https://api.knackhq.com/v1/objects/object_4/records/export?type=json";
      var params = {
        // dataType: 'json'
      };
      var headers = {
        'X-Knack-Application-Id': '550c60d00711ffe12e9efc64',
        'X-Knack-REST-API-Key': '7bce4520-28dc-11e5-9f0a-4d758115b820'
      };
      axios.get(knackUrl, { params: params, headers: headers }).then(function (response) {
        var dataOut = response.data;
        var records = dataOut.records;
        var recordsFiltered = records.filter(function (record) { return record.field_12 === "API" || record.field_12 === "GeoService"; });

        var bennyEndpoints = {};

        for (var i = 0, list = recordsFiltered; i < list.length; i += 1) {
          var record = list[i];

          var url = record.field_25.split('"')[1];
          var url2 = (void 0);
          if (url) {
            url2 = url.split('query')[0].replace('https://', '').replace('http://', '').replace(/\/$/, "").toLowerCase();
          } else {
            url2 = null;
          }
          if (record.field_13_raw.length > 0) {
              bennyEndpoints[url2] = record.field_13_raw[0].id;
          } else {
              bennyEndpoints[url2] = '';
          }
        }
        store.commit('setBennyEndpoints', bennyEndpoints);
      }, function (response) {
        console.log('AXIOS ERROR Layerboard.vue');
      });
    },
    computed: {
      isMobileOrTablet: function isMobileOrTablet() {
        return this.$store.state.isMobileOrTablet;
      },
      shouldLoadCyclomediaWidget: function shouldLoadCyclomediaWidget() {
        return this.$config.cyclomedia.enabled && !this.isMobileOrTablet;
      },
      shouldLoadPictometryWidget: function shouldLoadPictometryWidget() {
        return this.$config.pictometry.enabled && !this.isMobileOrTablet;
      },
      fullScreenMapEnabled: function fullScreenMapEnabled() {
        return this.$store.state.fullScreenMapEnabled;
      },
      cyclomediaActive: function cyclomediaActive() {
        return this.$store.state.cyclomedia.active
      },
      cycloLatlng: function cycloLatlng() {
        if (this.$store.state.cyclomedia.orientation.xyz !== null) {
          var xyz = this.$store.state.cyclomedia.orientation.xyz;
          return [xyz[1], xyz[0]];
        } else {
          var center = this.$config.map.center;
          return center;
        }
      },
      cycloRotationAngle: function cycloRotationAngle() {
        return this.$store.state.cyclomedia.orientation.yaw * (180/3.14159265359);
      },
      cycloHFov: function cycloHFov() {
        return this.$store.state.cyclomedia.orientation.hFov;
      },
      pictometryActive: function pictometryActive() {
        return this.$store.state.pictometry.active
      },
      pictometryZoom: function pictometryZoom() {
        return this.$store.state.pictometry.zoom
      },
      pictometryShowAddressMarker: function pictometryShowAddressMarker() {
        if (!this.pictometryActive || !this.geocodeData) {
          return false;
        } else if (this.pictometryZoom < 20 && this.cyclomediaActive) {
          return false;
        } else {
          return true;
        }
      },
      geocodeData: function geocodeData() {
        return this.$store.state.geocode.data
      },
      ak: function ak() {
        var host = window.location.hostname;
        if (host === 'atlas.phila.gov') {
          return this.$config.pictometry.apiKey;
        }
        if (host === 'atlas-dev.phila.gov') {
          return this.$config.pictometryDev.apiKey;
        }
        if (host === 'cityatlas.phila.gov') {
          return this.$config.pictometryCity.apiKey;
        }
        if (host === 'cityatlas-dev.phila.gov') {
          return this.$config.pictometryCityDev.apiKey;
        }
        if (host === '10.8.101.67') {
          return this.$config.pictometryLocal.apiKey;
        }
      },
      sk: function sk() {
        var host = window.location.hostname;
        if (host === 'atlas.phila.gov') {
          return this.$config.pictometry.secretKey;
        }
        if (host === 'atlas-dev.phila.gov') {
          return this.$config.pictometryDev.secretKey;
        }
        if (host === 'cityatlas.phila.gov') {
          return this.$config.pictometryCity.secretKey;
        }
        if (host === 'cityatlas-dev.phila.gov') {
          return this.$config.pictometryCityDev.secretKey;
        }
        if (host === '10.8.101.67') {
          return this.$config.pictometryLocal.secretKey;
        }
      },
      geocodeData: function geocodeData() {
        return this.$store.state.geocode.data
      },
      windowWidth: function windowWidth() {
        return this.$store.state.windowWidth;
      },
      windowHeight: function windowHeight() {
        return this.$store.state.windowSize.height;
      },
      didToggleTopicsOn: function didToggleTopicsOn() {
        return this.$store.state.didToggleTopicsOn;
      },
      buttonMessage: function buttonMessage() {
        if (this.didToggleTopicsOn) {
          return 'See Map';
        } else {
          return 'See Datasets';
        }
      },
      shouldShowTopics: function shouldShowTopics() {
        return this.$store.state.shouldShowTopics;
      },
      shouldShowMap: function shouldShowMap() {
        return this.$store.state.shouldShowMap;
      }
    },
    watch: {
      pictometryShowAddressMarker: function pictometryShowAddressMarker(nextValue) {
        // console.log('watch pictometryShowAddressMarker', nextValue);
      },
      windowWidth: function windowWidth(nextWidth) {
        this.calculateShouldShowTopics();
        this.calculateShouldShowMap();
      },
      fullScreenMapEnabled: function fullScreenMapEnabled(nextValue) {
        this.calculateShouldShowTopics();
        this.calculateShouldShowMap();
      },
      didToggleTopicsOn: function didToggleTopicsOn(nextValue) {
        this.calculateShouldShowTopics();
        this.calculateShouldShowMap();
      },
      shouldShowTopics: function shouldShowTopics(nextValue) {
        this.handleWindowResize();
      },
      shouldShowMap: function shouldShowMap(nextValue) {
        this.handleWindowResize();
      }
    },
    methods: {
      // for mobile only
      toggleTopics: function toggleTopics() {
        var prevVal = this.$store.state.didToggleTopicsOn;
        this.$store.commit('setDidToggleTopicsOn', !prevVal);
      },
      calculateShouldShowTopics: function calculateShouldShowTopics() {
        var windowWidth = this.windowWidth;
        var smallScreen = windowWidth < 750;
        var didToggleTopicsOn = this.$store.state.didToggleTopicsOn;
        var fullScreenMapEnabled = this.$store.state.fullScreenMapEnabled;
        // console.log('calculateShouldShowTopics, smallScreen:', smallScreen, 'didToggleTopicsOn', didToggleTopicsOn, 'fullScreenMapEnabled', fullScreenMapEnabled);
        var shouldShowTopics = !smallScreen && !fullScreenMapEnabled || smallScreen && didToggleTopicsOn;
        this.$store.commit('setShouldShowTopics', shouldShowTopics);
      },
      calculateShouldShowMap: function calculateShouldShowMap() {
        var windowWidth = this.windowWidth;
        var notMobile = windowWidth > 750;
        var didToggleTopicsOn = this.$store.state.didToggleTopicsOn;
        var shouldShowMap = notMobile || !didToggleTopicsOn;
        this.$store.commit('setShouldShowMap', shouldShowMap);
      },
      handleWindowResize: function handleWindowResize() {
        var rootElement = document.getElementById('mb-root');
        var rootStyle = window.getComputedStyle(rootElement);
        var rootWidth = rootStyle.getPropertyValue('width');
        var rootWidthNum = parseInt(rootWidth.replace('px', ''));
        // console.log('handleWindowResize is running, windowWidth:', windowWidth, 'notMobile:', notMobile, 'this.$store.state.shouldShowTopics:', this.$store.state.shouldShowTopics);
        // if (!notMobile) {
        //   boardHeight = rootHeightNum - 34;
        //   console.log('subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
        // } else {
        //   boardHeight = rootHeightNum
        //   // console.log('NOT subtracting 34, rootHeightNum:', rootHeightNum, 'boardHeight:', boardHeight);
        // }
        // this.styleObject.height = boardHeight.toString() + 'px';

        // const obj = {
        //   height: rootHeightNum,
        //   width: rootWidthNum
        // }
        this.$store.commit('setWindowWidth', rootWidthNum);
      }
    }
  };

  // http://stackoverflow.com/a/37164538/676001

  // helper to verify that an item is an object
  function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
  }
  // merges n objects, deeply, immutably
  function mergeDeep(target, source) {
    var output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(function (key) {
        var obj, obj$1;

        if (isObject(source[key])) {
          if (!(key in target))
            { Object.assign(output, ( obj = {}, obj[key] = source[key], obj)); }
          else
            { output[key] = mergeDeep(target[key], source[key]); }
        } else {
          Object.assign(output, ( obj$1 = {}, obj$1[key] = source[key], obj$1));
        }
      });
    }
    return output;
  }

  var controllerMixin = philaVueDatafetch;

  function initOpenMaps(clientConfig) {
    var baseConfigUrl = clientConfig.baseConfig;

    // get base config
    return axios.get(baseConfigUrl).then(function (response) {
      var data = response.data;
      var baseConfigFn = eval(data);
      var gatekeeperKey = clientConfig.gatekeeperKey;
      var baseConfig = baseConfigFn({ gatekeeperKey: gatekeeperKey });

      // deep merge base config and client config
      var config = mergeDeep(baseConfig, clientConfig);

      // make config accessible from each component via this.$config
      Vue.use(configMixin, config);

      // create store
      var store = createStore(config);

      // mix in controller
      Vue.use(controllerMixin, { config: config, store: store });

      // mount main vue
      var vm = new Vue({
        el: config.el || '#layerboard',
        render: function (h) { return h(Layerboard); },
        store: store
      });

    }, function (response) {
      console.error('AXIOS ERROR loading base config');
    });
  }

  exports.default = initOpenMaps;
  exports.Layerboard = Layerboard;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=layerboard.js.map
