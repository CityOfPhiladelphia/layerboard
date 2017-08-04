<template>
  <div>
    <li>
      <label :for="'checkbox-'+layerName"
             :class="{ disabled: shouldBeDisabled }"
      >
        <input :id="layerName"
               type="checkbox"
               :disabled="shouldBeDisabled"
               :checked="webMapActiveLayers.includes(layerName)"
               @click=checkboxToggle
        >
        {{ layerName }}
        <a :href="'http://metadata.phila.gov/#home/representationdetails/' + this.bennyId"
           target="_blank"
           v-if="bennyId"
        >(metadata)
        </a>
      </label>
    </li>
  </div>
</template>

<script>
  import TopicComponent from './TopicComponent';

  export default {
    props: ['layerName',
            // minScale, maxScale, and drawingInfo are stored in layerDefinition
            'layerDefinition'
    ],
    computed: {
      scale() {
        return this.$store.state.map.scale;
      },
      shouldBeDisabled() {
        const def = this.$props.layerDefinition
        if (def) {
          if (def.minScale) {
            if (this.scale > def.minScale) {
              return true;
            }
          }
        } else {
          return false;
        }
      },
      layerUrls() {
        return this.$store.state.layers.layerUrls;
      },
      bennyEndpoints() {
        return this.$store.state.bennyEndpoints;
      },
      url() {
        return this.layerUrls[this.$props.layerName];
      },
      bennyId() {
        const id = this.bennyEndpoints[this.url];
        return id;
      },
      webMapActiveLayers() {
        return this.$store.state.map.webMapActiveLayers;
      },
    },
    methods: {
      checkboxToggle(e) {
        console.log('checkboxToggle', e.target.id, e.target.checked);
        const activeLayers = this.webMapActiveLayers;
        if (e.target.checked) {
          activeLayers.push(e.target.id);
        } else {
          const index = activeLayers.indexOf(e.target.id);
          if (index >= 0) {
            activeLayers.splice(index, 1);
          }
        }
        this.$store.commit('setWebMapActiveLayers', activeLayers);
      },
    }
  };
</script>

<style scoped>
  .disabled {
    color: #d3d3d3;
  }
</style>
