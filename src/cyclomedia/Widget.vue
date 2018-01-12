<template>
  <div id="cyclo-container"
       :class="this.cycloContainerClass"
  >
  <!-- v-once -->
    <div id="inCycloDiv"
         v-if="this.isMobileOrTablet === false"
         @click="this.popoutClicked"
         :style="{ right: popoutPosition }"
    >
      <i class="fa fa-external-link fa popout-icon"></i>
    </div>
    <div id="cycloviewer"
         ref="cycloviewer"
         class="panoramaViewerWindow"
    >
    <!-- @mousedown="console.log('mouseup')" -->
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        'docWidth': 0,
        'divWidth': 0,
        'popoutPosition': 0,
        'activeLayers': [],
        'webMapGeoJson': {},
      }
    },
    computed: {
      isMobileOrTablet() {
        return this.$store.state.isMobileOrTablet;
      },
      cyclomediaActive() {
        return this.$store.state.cyclomedia.active;
      },
      pictometryActive() {
        return this.$store.state.pictometry.active;
      },
      cycloContainerClass() {
        if (this.pictometryActive) {
          return 'large-16 columns mb-panel'
        } else {
          return 'large-24 columns mb-panel'
        }
      },
      locForCyclo() {
        // console.log('computing locForCyclo');
        const geocodeData = this.$store.state.geocode.data;
        const map = this.$store.state.map.map;
        if (geocodeData) {
          return [geocodeData.geometry.coordinates[1], geocodeData.geometry.coordinates[0]];
        }
      },
      latLngFromMap() {
        return this.$store.state.cyclomedia.latLngFromMap;
      },
      mapCenter() {
        return this.$store.state.map.center;
      },
      navBarOpen() {
        return this.$store.state.cyclomedia.navBarOpen;
      },
      webMapActiveLayers() {
        return this.$store.state.map.webMapActiveLayers
      },
      // webMapGeoJson() {
      //   return this.$store.state.map.webMapGeoJson;
      // },
      firstProjection() {
        return "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
      },
      secondProjection() {
        return "+proj=lcc +lat_1=40.96666666666667 +lat_2=39.93333333333333 +lat_0=39.33333333333334 +lon_0=-77.75 +x_0=600000 +y_0=0 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs";
      },
      // docWidthComp() {
      //   return $(document).width();
      // }
      layerUrls() {
        return this.$store.state.layers.layerUrls;
      },
    },
    watch: {
      locForCyclo(newCoords) {
        console.log('watch locForCyclo is firing, setNewLocation running with newCoords:', newCoords);
        if (newCoords) {
          this.setNewLocation(newCoords);
        }
      },
      latLngFromMap(newCoords) {
        console.log('watch latLngFromMap is firing, setNewLocation running with newCoords:', newCoords);
        if (Array.isArray(newCoords)) {
          console.log('it is an array');
          this.setNewLocation([newCoords[1], newCoords[0]]);
        } else {
          console.log('it is not an array');
          this.setNewLocation([newCoords.lat, newCoords.lng]);
        }
      },
      cyclomediaActive(newActiveStatus) {
        if (newActiveStatus === true) {
          this.setNewLocation(this.latLngFromMap);
        }
      },
      webMapActiveLayers(currentLayers) {
        console.log('cyclo widget, watch webMapActiveLayers, currentLayers length:', currentLayers.length, 'activeLayers length:', this.activeLayers.length);
        let activeLayers = this.activeLayers
        if (this.activeLayers.length > currentLayers.length) {
          let arr = this.activeLayers.filter(function(item){
            return currentLayers.indexOf(item) === -1;
          });
          console.log('a layer was removed, arr:', arr[0]);
          this.activeLayers.splice(this.activeLayers.indexOf(arr[0]))
          StreetSmartApi.removeOverlay(this.webMapGeoJson[arr[0]].id);
        } else if (this.activeLayers.length < currentLayers.length) {
          let arr = currentLayers.filter(function(item){
            console.log('filter stuff, item:', item, 'activeLayers:', activeLayers, activeLayers.indexOf(item) === -1);
            return activeLayers.indexOf(item) === -1;
          });
          console.log('a layer was added, arr:', arr[0], this.webMapGeoJson, Object.keys(this.webMapGeoJson));
          this.activeLayers.push(arr[0]);

          if (!Object.keys(this.webMapGeoJson).includes(arr[0])) {
            console.log('webMapGeoJson does not include', arr[0]);
            this.getGeoJson(arr[0]);
          } else {
            console.log('webMapGeoJson already includes', arr[0]);
            this.addOverlay(arr[0], this.webMapGeoJson[arr[0]].geoJson);
          }
        }
      }
      // docWidthComp() {
      //   console.log('docWidth changed');
      // }
      // cyclomediaActive() {
      //   this.setDivWidth();
      // },
      // pictometryActive() {
      //   this.setDivWidth();
      // }
    },
    mounted() {
      StreetSmartApi.init({
        targetElement: this.$refs.cycloviewer,
        username: this.$config.cyclomedia.username,
        password: this.$config.cyclomedia.password,
        apiKey: this.$config.cyclomedia.apiKey,
        // srs: 'EPSG:4326',
        srs: 'EPSG:2272',
        locale: 'en-us',
        addressSettings: {
          locale: 'en-us',
          database: 'CMDatabase'
        }
      }).then (
        () => {
          // get map center and set location
          const map = this.$store.state.map;
          console.log('mounted is calling setNewLocation, map.center:', map.center);
          this.setNewLocation([map.center[1], map.center[0]]);
        },
        err => {
          // console.log('Api: init: failed. Error: ', err);
        }
      );
      // window.addEventListener('resize', this.setDivWidth);
    },
    updated() {
      console.log('cyclomedia updated running');
      // TODO find a better way to get the image to update and not be stretched
      // const viewer = this.$store.state.cyclomedia.viewer;
      if (this.cyclomediaActive) {
        if (window.panoramaViewer) {
          window.panoramaViewer.rotateRight(0.0000001);
        }
      }
      // this.setDivWidth();
    },
    methods: {
      getGeoJson(layer) {
        // const layer2 = 'services.arcgis.com/fLeGjb7u4uXqeF9q/ArcGIS/rest/services/WasteBaskets_Big_Belly/FeatureServer/0'
        // const url = 'http://' + layer2;
        const url = 'https://' + this.layerUrls[layer];
        console.log('getGeoJson is running, layer:', layer, 'url:', url);
        const dataQuery = L.esri.query({ url });
        dataQuery.where("1=1");
        dataQuery.run((function(error, featureCollection, response) {
          // console.log('parcelQuery ran, activeParcelLayer:', activeParcelLayer);
          this.didGetData(error, featureCollection, response, layer);
        }).bind(this)
      )
      },
      didGetData(error, featureCollection, response, layer) {
        console.log('didGetData is running, layer:', layer, 'featureCollection:', featureCollection, 'response:', response);
        // const obj = {
        //   'layerName': layer,
        //   'json': response
        let obj = this.webMapGeoJson;
        obj[layer] = {}
        obj[layer].geoJson = response;
        this.webMapGeoJson = obj;
        this.addOverlay(layer, response);
      },
      addOverlay(layerName, json) {
// const json2 = {
//   "type": "FeatureCollection",
//   "features": [
//     {
//       "type": "Feature",
//       "properties": {},
//       "geometry": {
//         "type": "Point",
//         "coordinates": proj4(this.firstProjection, this.secondProjection, [-75.16411453485489, 39.95166770541699])
//       }
//     },
//     {
//       "type": "Feature",
//       "properties": {},
//       "geometry": {
//         "type": "Point",
//         "coordinates": proj4(this.firstProjection, this.secondProjection, [-75.16361027956009, 39.951591628011556])
//       }
//     },
//     {
//       "type": "Feature",
//       "properties": {},
//       "geometry": {
//         "type": "Point",
//         "coordinates": proj4(this.firstProjection, this.secondProjection, [-75.16386240720749, 39.95171910902144])
//       }
//     },
//     {
//       "type": "Feature",
//       "properties": {},
//       "geometry": {
//         "type": "Point",
//         "coordinates": proj4(this.firstProjection, this.secondProjection, [-75.16375780105591, 39.95171910902144])
//       }
//     },
//     {
//       "type": "Feature",
//       "properties": {},
//       "geometry": {
//         "type": "LineString",
//         "coordinates": [
//           proj4(this.firstProjection, this.secondProjection, [-75.16329646110535, 39.95168415457463]),
//           proj4(this.firstProjection, this.secondProjection, [-75.16367733478546, 39.95171910902144]),
//           proj4(this.firstProjection, this.secondProjection, [-75.16348421573639, 39.951741726595145]),
//           proj4(this.firstProjection, this.secondProjection, [-75.16348421573639, 39.951657424691476])
//         ]
//       }
//     }
//   ]
// }
        console.log('addOverlay is running, layerName:', layerName, 'json:', json);
        // const options = {name: 'test', geojson: json, sourceSrs: 'EPSG: 2272'}
        // const options = {name: 'test', geojson: json, sourceSrs: 'EPSG: 4326', sldXMLtext: 'XMLstring'}
        // const options = {name: 'test', geojson: json, sourceSrs: 'EPSG: 4326', sldXMLtext: xmlString}
        const options = {name: layerName, geojson: json }
        let layer = StreetSmartApi.addOverlay(options);
        let obj = this.webMapGeoJson;
        obj[layerName].id = layer.id;
        this.webMapGeoJson = obj;
        // const layer = StreetSmartApi.addOverlay(options);
        // const layerId = layer.id
        // console.log('addOverlay layerId:', layerId);
        // StreetSmartApi.removeOverlay('surfaceCursorLayer');
      },
      // setDivWidth() {
      //   const docWidth = $(document).width();
      //   this.docWidth = docWidth;
      //   const el = document.getElementById('cyclo-container');
      //   const divStyle = window.getComputedStyle(el);
      //   const divWidth = parseFloat(divStyle.getPropertyValue('width').replace('px', ''));
      //   this.divWidth = divWidth;
      //   // console.log('setDivWidth is running, docWidth:', docWidth, 'divWidth', divWidth);
      //   this.popoutPosition = docWidth - (docWidth/2 + divWidth) + 'px';
      //   // return width;
      // },
      setNewLocation(coords) {
        // console.log('!!!!!!!!!!!!!!!!!!!!setNewLocation is running using THESE coords', coords);
        const viewerType = StreetSmartApi.ViewerType.PANORAMA;
        const coords2272 = proj4(this.firstProjection, this.secondProjection, [coords[1], coords[0]])
        // console.log('coords2272:', coords2272);
        // StreetSmartApi.open(center.lng + ',' + center.lat, {
        // StreetSmartApi.open(coords[1] + ',' + coords[0], {
        StreetSmartApi.open(coords2272[0] + ',' + coords2272[1], {
          viewerType: viewerType,
          srs: 'EPSG:2272',
          // srs: 'EPSG:4326',
          closable: false,
          maximizable: false,
        }).then (
          function(result) {
            // console.log('StreetSmartApi2, result:', result);
            const widget = this;
            // console.log('Created component through API:', result);
            if (result) {
              for (let i =0; i < result.length; i++) {
                if(result[i].getType() === StreetSmartApi.ViewerType.PANORAMA) window.panoramaViewer = result[i];
              }
              widget.sendOrientationToStore();
              window.panoramaViewer.toggleNavbarExpanded(widget.navBarOpen);
              if (widget.isMobileOrTablet) {
                StreetSmartApi.removeOverlay('surfaceCursorLayer');
              }

              window.panoramaViewer.on('VIEW_CHANGE', function() {
                if (window.panoramaViewer.props.orientation.yaw !== widget.$store.state.cyclomedia.orientation.yaw ||
                    window.panoramaViewer.props.orientation.xyz !== widget.$store.state.cyclomedia.orientation.xyz
                ) {
                  // console.log('on VIEW_CHANGE fired with yaw change', window.panoramaViewer.props.orientation);
                  widget.sendOrientationToStore();
                } else if (window.panoramaViewer.getNavbarExpanded() !== this.navBarOpen) {
                  widget.$store.commit('setCyclomediaNavBarOpen', window.panoramaViewer.getNavbarExpanded());
                }
              })
            }
          }.bind(this)
        ).catch(
          function(reason) {
            // console.log('Failed to create component(s) through API: ' + reason);
          }
        );

        // const viewer = this.$store.state.cyclomedia.viewer;
        // viewer.openByCoordinate(coords);
      },
      sendOrientationToStore() {
        // console.log('sendOrientationToStore, yaw:', window.panoramaViewer.props.orientation.yaw);
        this.$store.commit('setCyclomediaYaw', window.panoramaViewer.props.orientation.yaw);
        this.$store.commit('setCyclomediaHFov', window.panoramaViewer.props.orientation.hFov);
        const xy = [window.panoramaViewer.props.orientation.xyz[0], window.panoramaViewer.props.orientation.xyz[1]];
        const lnglat = proj4(this.secondProjection, this.firstProjection, xy);
        // console.log('xy:', xy, 'lnglat', lnglat);
        this.$store.commit('setCyclomediaXyz', lnglat);
      },
      popoutClicked() {
        const map = this.$store.state.map.map;
        const center = map.getCenter();
        window.open('//cyclomedia.phila.gov/?' + center.lat + '&' + center.lng, '_blank');
        this.$store.commit('setCyclomediaActive', false);
      }
    }
  };
</script>

<style>

#cyclo-container {
  padding: 0px;
  height: 50%;
}

#inCycloDiv {
  /* position: absolute; */
  position: absolute;
  /* top: 0px; */
  right: 0px;
  /* float: right; */
  background-color: white;
  border: 0px solid;
  width: 30px;
  height: 30px;
  cursor:pointer;
  z-index: 10;
}

.popout-icon {
  margin-top: 8.5px;
  font-size: 15px;
  margin-left: 8.5px;
}

.panoramaViewerWindow {
  display: block;
  width: 100%;
  height:100%;
}

</style>
