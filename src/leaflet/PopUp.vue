<template>
  <div>
    <slot />
  </div>
</template>

<script>
  export default {
    mounted() {
      console.log('pop-up mounted')
    },
    destroyed() {
      console.log('pop-up destroyed')
    },
    watch: {
      intersectingFeatures(nextIntersectingFeatures) {
        const html = nextIntersectingFeatures.map(function(o) {
          console.log('o', o);
          return o.feature.popupHtml;
        }).join('<br/>');
        if (html != '') {
          this._map.openPopup(this.$children[0].$el, this.popupCoords, {
            minWidth: 350,
            // height: 300,
            // minHeight: 300,
            // maxHeight: 300,
          })
        }
      }
    },
    computed: {
      _map() {
        return this.$store.state.map.map;
      },
      intersectingFeatures() {
        return this.$store.state.map.intersectingFeatures;
      },
      popupCoords() {
        return this.$store.state.map.popupCoords;
      }
    }
  };
</script>
