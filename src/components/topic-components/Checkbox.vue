<template>
  <div>
    <li>
      <label :for="'checkbox-'+layer">
        <input :id="topicKey+'_'+layer"
               type="checkbox"
               :checked="webMapActiveLayers.includes(topicKey+'_'+layer)"
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
            'topicKey',
    ],
    computed: {
      topicLayerUrls() {
        return this.$store.state.topics.topicLayerUrls;
      },
      bennyEndpoints() {
        return this.$store.state.bennyEndpoints;
      },
      fullLayer() {
        return this.topicKey+'_'+this.layer;
      },
      url() {
        return this.topicLayerUrls[this.fullLayer];
      },
      bennyId() {
        // const fullLayer = topicKey+'_'+layer;
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
  /*.mb-badge {
    padding: 0;
    margin: 0 auto;
    margin-bottom: inherit;
  }

  @media (max-width: 640px) {
    .mb-badge {
      width: 100%;
    }
  }

  @media (min-width: 640px) {
    .mb-badge {
      width: 300px;
    }
  }

  .mb-badge-header {
    color: #eee;
    text-align: center;
  }

  .mb-badge-header h4 {
    margin: 0;
  }

  .mb-badge-body {
    padding: 10px;
  }

  .mb-badge-body > h1 {
    margin: 0;
    margin-bottom: 5px;
  }*/
</style>
