<template>
  <div>
      test legendBox
  </div>
</template>

<script>
  import TopicComponent from './TopicComponent';
  import L from 'leaflet';
  // import EsriLeaflet from 'esri-leaflet';

  // const EsriLeafletLegend = L.esri.Legend;
  // console.log(EsriLeafletLegend);

  export default {
    props: ['layer',
            'layerName',
            'layerId',
            // minScale, maxScale, and drawingInfo are stored in layerDefinition
            'layerDefinition',
    ],
    mounted() {
      this.initialize();
    },
    computed: {

    },
    methods: {
      initialize() {
        console.log('INITIALIZE LEGENDBOX', this.$props.layerName, 'IS RUNNING');
        // const leg = this.$props.layerName.legend(function(err, legend) {
        //   console.log('err', err);
        //   console.log('legend', legend);
        // })
        // console.log(this.$props.layer);
        // L.esri.Util.reduce(
        //     this.$props.layer
        //   , {layers: []}
        //   , function(curr, layer, cb) {
        //       console.log('inside initialize, curr is: ');
        //       console.log(curr);
        //       console.log('layer is: ');
        //       console.log(layer);
        //       layer.legend(function(err, legend) {
        //         if (err) {
        //           console.log('err happened');
        //           console.log(err);
        //           console.log(curr);
        //           console.log(cb(err, curr));
        //           return cb(err, curr);
        //         }
        //         curr.layers = curr.layers.concat(legend.layers);
        //         console.log('curr.layers is: ');
        //         console.log(curr.layers);
        //         cb(null, curr);
        //       });
        //   }
        //   , this._onLoad
        //   , this
        // )
      }
    }
  };
</script>

<style>

</style>
