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
         class="panorama-viewer-window"
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
      cycloLatlng() {
        if (this.$store.state.cyclomedia.orientation.xyz !== null) {
          const xyz = this.$store.state.cyclomedia.orientation.xyz;
          return [xyz[1], xyz[0]];
        }
      },
      // pictometryActive() {
      //   return this.$store.state.pictometry.active;
      // },
      cycloContainerClass() {
        if (this.pictometryActive) {
          return 'large-16 columns'
        } else {
          return 'large-24 columns'
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
      projection4326() {
        return "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
      },
      projection2272() {
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
        // console.log('watch latLngFromMap is firing, setNewLocation running with newCoords:', newCoords);
        if (Array.isArray(newCoords)) {
          // console.log('it is an array');
          this.setNewLocation([newCoords[0], newCoords[1]]);
        } else {
          // console.log('it is not an array');
          this.setNewLocation([newCoords.lat, newCoords.lng]);
        }
      },
      // cycloLatlng(newCoords) {
      //   if (newCoords) {
      //     proj4(this.projection2272, this.projection4326, [newCoords[1], newCoords[0]])
      //     this.setNewLocation(newCoords, false);
      //   }
      // },
      cyclomediaActive(newActiveStatus) {
        if (newActiveStatus === true) {
          this.setNewLocation(this.latLngFromMap);
        }
      },
      webMapActiveLayers(currentLayers) {
        // console.log('cyclo widget, watch webMapActiveLayers, currentLayers length:', currentLayers.length, 'activeLayers length:', this.activeLayers.length);
        this.changeLayers(currentLayers)
      }
    },
    mounted() {
      console.log('cyclomedia widget mounted is running');
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
      changeLayers(currentLayers) {
        let activeLayers = this.activeLayers
        if (this.activeLayers.length > currentLayers.length) {
          let arr = this.activeLayers.filter(function(item){
            return currentLayers.indexOf(item) === -1;
          });
          // console.log('a layer was removed, arr:', arr[0]);
          this.activeLayers.splice(this.activeLayers.indexOf(arr[0]))

          StreetSmartApi.removeOverlay(this.webMapGeoJson[arr[0]].id);
        } else if (this.activeLayers.length < currentLayers.length) {
          let arr = currentLayers.filter(function(item){
            // console.log('filter stuff, item:', item, 'activeLayers:', activeLayers, activeLayers.indexOf(item) === -1);
            return activeLayers.indexOf(item) === -1;
          });
          // console.log('a layer was added, arr:', arr[0], this.webMapGeoJson, Object.keys(this.webMapGeoJson));
          this.activeLayers.push(arr[0]);
          this.getGeoJson([arr[0]]);
        }
      },

      getGeoJson(layers) {
        console.log('getGeoJson is running');
        const coords = [window.panoramaViewer.props.orientation.xyz[0], window.panoramaViewer.props.orientation.xyz[1]];
        const params = {
          // geometries: feature => '[' + feature.geometry.coordinates[0] + ', ' + feature.geometry.coordinates[1] + ']',
          geometries: `[${coords.join(', ')}]`,
          inSR: 2272,
          outSR: 2272,
          bufferSR: 2272,
          distances: 200,
          unionResults: true,
          geodesic: false,
          f: 'json',
        };
        // console.debug('esri nearby params', params);

        // get buffer polygon
        // const bufferUrl = geometryServerUrl.replace(/\/$/, '') + '/buffer';
        const bufferUrl = 'https://gis.phila.gov/arcgis/rest/services/Geometry/GeometryServer/buffer';

        axios.get(bufferUrl, { params }).then(response => {
          const data = response.data;

          // console.log('did get esri nearby buffer', data);

          const geoms = data.geometries || [];
          const geom = geoms[0] || {};
          const rings = geom.rings || [];
          const xyCoords = rings[0];

          // check for xy coords
          if (!xyCoords) {
            // we can't do anything without coords, so bail out
            // this.dataManager.didFetchData(dataSourceKey, 'error');
            return;
          }
          const latlngCoords = []
          for (let coord of xyCoords) {
            let newCoord = proj4(this.projection2272, this.projection4326, coord);
            latlngCoords.push([newCoord[1], newCoord[0]]);
          }

          // const latLngCoords = xyCoords.map(xyCoord => [...xyCoord].reverse());

          // get nearby features using buffer
          // const buffer = L.polygon(latLngCoords);
          const buffer = L.polygon(latlngCoords);
          // console.log('!!!!!!xyCoords:', xyCoords, 'latlngCoords:', latlngCoords, 'buffer:', buffer);
          const map = this.$store.state.map.map;
          buffer.addTo(map);

          const options = {}
          const calculateDistance = false;
          for (let layer of layers) {
            this.fetchBySpatialQuery(layer,
                                     'intersects',
                                     buffer,
                                     options,
                                     calculateDistance ? coords : null
                                    );
          }
        }, response => {
          console.log('did fetch esri nearby error', response);
        });
      },

      fetchBySpatialQuery(layer, relationship, targetGeom, options = {}, calculateDistancePt) {
        console.log('fetch esri spatial query', layer, this.layerUrls[layer], relationship, targetGeom);
        const url = 'https://' + this.layerUrls[layer];

        let query = L.esri.query({ url })[relationship](targetGeom);

        // apply options by chaining esri leaflet option methods
        const optionsKeys = Object.keys(options) || [];
        query = optionsKeys.reduce((acc, optionsKey) => {
          const optionsVal = options[optionsKey];
          let optionsMethod;

          try {
            acc = acc[optionsKey](optionsVal);
          } catch (e) {
            throw new Error(`esri-leaflet query task does not support option:
                             ${optionsKey}`);
          }

          return acc;
        }, query);

        query.run((function(error, featureCollection, response) {
            console.log('did get esri spatial query', response, error);

            this.didGetGeoJson(error, featureCollection, response, layer);
          }).bind(this)
        )
      },

      didGetGeoJson(error, featureCollection, response, layer) {
        console.log('didGetGeoJson is running, layer:', layer, 'featureCollection:', featureCollection, 'response:', response);
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
        console.log('addOverlay is running, layerName:', layerName, 'json:', json);
        const options = {name: layerName, geojson: json }
        let layer = StreetSmartApi.addOverlay(options);
        let obj = this.webMapGeoJson;
        obj[layerName].id = layer.id;
        this.webMapGeoJson = obj;
      },

      setNewLocation(coords, updateStoreXY=true) {
        console.log('setNewLocation is running using THESE coords', coords);
        const viewerType = StreetSmartApi.ViewerType.PANORAMA;
        const coords2272 = proj4(this.projection4326, this.projection2272, [coords[1], coords[0]]);
        if (this.cyclomediaActive) {
          StreetSmartApi.open(coords2272[0] + ',' + coords2272[1], {
            viewerType: viewerType,
            srs: 'EPSG:2272',
            closable: false,
            maximizable: false,
          }).then (
            function(result) {
              console.log('StreetSmartApi2, result:', result);
              const widget = this;
              // console.log('Created component through API:', result);
              if (result) {
                for (let i =0; i < result.length; i++) {
                  if(result[i].getType() === StreetSmartApi.ViewerType.PANORAMA) window.panoramaViewer = result[i];
                }
                widget.sendOrientationToStore();
                // if (updateStoreXY) {
                widget.sendXYToStore();
                // }
                window.panoramaViewer.toggleNavbarExpanded(widget.navBarOpen);

                // if (widget.isMobileOrTablet) {
                StreetSmartApi.removeOverlay('surfaceCursorLayer');
                // }

                if (!this.$config.cyclomedia.measurementAllowed || this.$config.cyclomedia.measurementAllowed === 'false') {
                  StreetSmartApi.removeOverlay('measurementLayer');
                  window.panoramaViewer.toggleButtonEnabled('panorama.measure', false);
                }

                // console.log('TEST1');
                // window.panoramaViewer.toggleOverlay('surfaceCursorLayer');
                // window.panoramaViewer.toggleOverlay(false);
                // console.log('TEST2');

                window.panoramaViewer.on('VIEW_CHANGE', function() {
                  if (window.panoramaViewer.props.orientation.yaw !== widget.$store.state.cyclomedia.orientation.yaw ||
                      window.panoramaViewer.props.orientation.xyz !== widget.$store.state.cyclomedia.orientation.xyz
                  ) {
                    // console.log('on VIEW_CHANGE fired with yaw change', window.panoramaViewer.props.orientation);
                    widget.sendOrientationToStore();
                    widget.sendXYToStore();
                  } else if (window.panoramaViewer.getNavbarExpanded() !== this.navBarOpen) {
                    widget.$store.commit('setCyclomediaNavBarOpen', window.panoramaViewer.getNavbarExpanded());
                  }
                })

                console.log('in setNewLocation, about to call getGeoJson');
                this.getGeoJson(this.activeLayers);

              }
            }.bind(this)
          ).catch(
            function(reason) {
              // console.log('Failed to create component(s) through API: ' + reason);
            }
          );
        }
      },

      sendOrientationToStore() {
        // console.log('sendOrientationToStore, yaw:', window.panoramaViewer.props.orientation.yaw);
        this.$store.commit('setCyclomediaYaw', window.panoramaViewer.props.orientation.yaw);
        this.$store.commit('setCyclomediaHFov', window.panoramaViewer.props.orientation.hFov);
      },

      sendXYToStore() {
        const xy = [window.panoramaViewer.props.orientation.xyz[0], window.panoramaViewer.props.orientation.xyz[1]];
        const lnglat = proj4(this.projection2272, this.projection4326, xy);
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


.panorama-viewer-window {
  display: block;
  width: 100%;
  height: calc((100vh - 109px)/2);
}

@media screen and (max-width: 750px) {
  .panorama-viewer-window {
    display: block;
    width: 100%;
    height: calc((100vh - 142px)/2);
  }
}

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

/* .panorama-viewer-container {
  height: 50px !important;
} */

/* canvas {
  height: 50px !important;
} */

</style>
