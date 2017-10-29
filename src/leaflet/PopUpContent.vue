<template>
  <div>
    <div v-if="this.popupHtmlArray.length > 1">
      <ul class="pagination text-center">
        <li :class="this.previousIsDisabled">
          <span v-if="this.previousIsDisabled !== 'pagination-previous'">
            Previous
          </span>
          <a @click="changePopup(currentPopup-1)"
             v-if="this.previousIsDisabled === 'pagination-previous'"
          >
            Previous
          </a>
        </li>
        <li v-for="(popup, index) in this.popupHtmlArray"
            :class="isCurrent(index)"
        >
          <span v-if="isCurrent(index) === 'current'">
            {{ index + 1 }}
          </span>
          <a @click="changePopup(index)"
             v-if="isCurrent(index) !== 'current'"
          >
            {{ index + 1 }}
          </a>
        </li>
        <li :class="this.nextIsDisabled">
          <span v-if="this.nextIsDisabled !== 'pagination-next'">
            Next
          </span>
          <a @click="changePopup(currentPopup+1)"
             v-if="this.nextIsDisabled === 'pagination-next'"
          >
            Next
          </a>
        </li>
      </ul>
    </div>
    <div v-html="this.popupHtmlArray[this.currentPopup]">
    </div>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        'currentPopup': 0
      }
    },
    mounted() {
      console.log('POPUPCONTENT MOUNTED')
      this.$store.commit('setSelectedPopupLayer', this.intersectingFeatures[0]);
    },
    destroyed() {
      console.log('PopupContent destroyed')
      this.$store.commit('setSelectedPopupLayer', null);
    },
    watch: {
      popupHtmlArray(nextPopupHtmlArray) {
        this.currentPopup = 0
        this.$store.commit('setSelectedPopupLayer', this.intersectingFeatures[0]);
      }
    },
    methods: {
      changePopup(index) {
        this.currentPopup = index;
        this.$store.commit('setSelectedPopupLayer', this.intersectingFeatures[index]);
      },
      isCurrent(index) {
        if (index === this.currentPopup) {
          return 'current'
        }
      },
    },
    computed: {
      previousIsDisabled() {
        if (this.currentPopup === 0) {
          return 'pagination-previous disabled'
        } else {
          return 'pagination-previous'
        }
      },
      nextIsDisabled() {
        if (this.currentPopup === this.popupHtmlArray.length - 1) {
          return 'pagination-next disabled'
        } else {
          return 'pagination-next'
        }
      },
      intersectingFeatures() {
        return this.$store.state.map.intersectingFeatures;
      },
      popupHtmlArray() {
        let htmlArray = [];
        for (let feature in this.$store.state.map.intersectingFeatures) {
          htmlArray.push(this.$store.state.map.intersectingFeatures[feature].feature.popupHtml)
        }
        return htmlArray;
      },
    }
  };
</script>
