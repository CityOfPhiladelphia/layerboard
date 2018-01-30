<template>
  <section :class="['pprf-about' ,'pprf-modal', {'pprf-modal--open': modals.about.open}]">
  <!-- <section :class="['pprf-about' ,'pprf-modal']"> -->
    <button @click="closeModal" class="pprf-modal-close pprf-btn"><font-awesome-icon size="l" icon="times"/></button>
    <h2 class="text-center ">How to use the finder</h2>
    <div class="pprf-modal-content">
      <p>There are two ways to use the finder.</p>
      <div class="tour-tip" @mouseover="highlight('.pprf-search.form')" @mouseleave="removeHighlight('.pprf-search.form')">
        <font-awesome-icon class="tour-tip__icon text-nopad" icon="search"/>
        <div>
          <p class="tour-tip__action"><b>Search by entering an activity, location, or ZIP code into the search box.</b></p>
        <p class="tour-tip__result text-nopad">The finder will return results that match what you put input.</p>
        </div>
      </div>

      <div class="tour-tip" @mouseover="highlight('.pprf-category-card')" @mouseleave="removeHighlight('.pprf-category-card')">
        <font-awesome-icon class="tour-tip__icon text-nopad" icon="image"/>
        <div>
          <p class="tour-tip__action"><b>Browse by Category.</b></p>
        <p class="tour-tip__result text-nopad">Select one of the pictured categories.</p>
        </div>
      </div>

      <p>Once you get results, you can <b><font-awesome-icon size="xs" icon="filter"/> filter</b> by age, fee, gender, and day of week to narrow down your search.</p>

    </div>
  </section>
</template>

<script>
// import {mapState} from 'vuex'
// import FontAwesomeIcon from '@fortawesome/vue-fontawesome'
/**
 * HOW TO USE THE FINDER MODAL
 *
 * Hightlights certain elements of the interface on keyword hover.
 *
 * @since 0.6.22
 */
export default {

  name: 'Modal-About',
  // components: {FontAwesomeIcon},
  computed: {
    route() {
      return this.$store.state.route;
    },
    shouldBeOpen() {
      if (this.route === 'help') {
        return true;
      } else {
        return false;
      }
    },
    modals() {
      return this.$store.state.modals;
    }
    // ...mapState(['modals'])
  },
  methods: {
    closeModal () {
      this.$store.dispatch('toggleModal', {name: 'about', open: false})
    },
    highlight (selector) {
      let el = document.querySelectorAll(selector)[0]
      el.classList.add('tour-highlight')
    },
    removeHighlight (selector) {
      let el = document.querySelectorAll(selector)[0]
      el.classList.remove('tour-highlight')
    }
  }
}
</script>

<!--<style lang="scss" scoped>-->
<style scoped>

.pprf-modal{
  width: calc(100vw - #{$sidebar-width});
  height:calc(#{$max-app-height} - #{$header-height} - #{$footer-height});
  padding: 40px;
  overflow: hidden;
  position: absolute;
  top:$header-height;
  left: $sidebar-width;
  z-index:-1;
  background: rgba($white, 0.85);
  transition: all 1s ease;
  opacity: 0;
  @include rem(font-size, 2);
}

.pprf-modal.pprf-modal--open{
  z-index:1000;
  border-left: 3px solid color(ghost-gray);
  opacity: 1;
}

.pprf-modal-content{
  width: 80%;
  margin: 20px auto;
}


@include breakpoint(medium down) {
  .pprf-modal{
    position:fixed;
    width: 100%;
    height:calc(100vh - #{$header-height-mobile});
    left:0;
    top: $header-height-mobile;
    background: $white;
    padding:10%;
  }
  .pprf-modal-content{
    width: 100%;
  }
  .pprf-modal-close{
    position: absolute;
    top:15px;
    left:15px;
  }
}

</style>
