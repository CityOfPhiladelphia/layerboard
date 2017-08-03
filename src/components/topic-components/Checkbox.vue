<template>
  <div>
    <li>
      <label :for="'checkbox-'+layer"
             :class="{ disabled: shouldBeDisabled }"
      >
        <input :id="layer"
               type="checkbox"
               :disabled="shouldBeDisabled"
               :checked="webMapActiveLayers.includes(layer)"
               @click=checkboxToggle
        >
        {{ layer }}
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
    props: ['layer',
            'index',
            'shouldBeDisabled'
    ],
    computed: {
      topicLayerUrls() {
        return this.$store.state.topics.topicLayerUrls;
      },
      bennyEndpoints() {
        return this.$store.state.bennyEndpoints;
      },
      fullLayer() {
        return this.layer;
      },
      url() {
        return this.topicLayerUrls[this.fullLayer];
      },
      bennyId() {
        // const url = this.topicLayerUrls[fullLayer];
        // console.log('url', url);
        const id = this.bennyEndpoints[this.url];
        // console.log('id', id);
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
