<template>
  <div>
    <div v-html="legendHtml"
         class="legend"
    />
  </div>
</template>

<script>
  import TopicComponent from './TopicComponent';
  import L from 'leaflet';

  export default {
    props: ['layer',
            'layerName',
            'layerId',
            // minScale, maxScale, and drawingInfo are stored in layerDefinition
            'layerDefinition',
            'legendHtml'
    ],
    mounted() {
      this.initialize();
    },
    methods: {
      initialize() {
        const opts = {
          layerName: this.$props.layerName,
          layerId: this.$props.layerId,
          store: this.$store
        }
        const legend = L.esri.legendControl(this.$props.layer, opts);
      }
    }
  };
</script>

<style>

.legend {
  margin-left: 10px;
}
</style>
