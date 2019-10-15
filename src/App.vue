<template>
  <div>
    <layerboard />
    <lb-footer />
  </div>
</template>

<script>

import Layerboard from './components/Layerboard.vue';
import LbFooter from './components/LbFooter.vue';

export default {
  name: 'App',
  components: {
    Layerboard,
    LbFooter,
  },
  mounted() {
    window.addEventListener('resize', this.handleWindowResize);
    this.handleWindowResize();
  },
  methods: {
    handleWindowResize() {
      const windowHeight = window.innerHeight;
      const rootElement = document.getElementById('mb-root');
      const rootStyle = window.getComputedStyle(rootElement);
      // const rootHeight = rootStyle.getPropertyValue('height');
      // const rootHeightNum = parseInt(rootHeight.replace('px', ''));
      // const rootHeightNum = 100;
      const rootWidth = rootStyle.getPropertyValue('width');
      const rootHeight = rootStyle.getPropertyValue('height');
      const rootWidthNum = parseInt(rootWidth.replace('px', ''));
      const rootHeightNum = parseInt(rootHeight.replace('px', ''));

      const dim = {
        width: rootWidthNum,
        height: rootHeightNum,
      };

      // console.log('App handleWindowResize is running, dim:', dim);
      // this.$store.commit('setWindowWidth', rootWidthNum);
      this.$store.commit('setWindowDimensions', dim);
    },
  },

};
</script>
