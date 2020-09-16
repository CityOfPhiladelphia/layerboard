<template>
  <header class="app-header cell shrink">
    <div class="grid-x grid-padding-x grid-padding-y align-middle">
      <div class="cell mobile-menu show-for-small-only small-2">
        <font-awesome-icon
          v-show="!isOpen"
          icon="bars"
          size="2x"
          :style="{ color: 'white' }"
          @click="toggleMenu"
        />
        <font-awesome-icon
          v-show="isOpen"
          icon="times"
          size="2x"
          :style="{ color: 'white' }"
          @click="toggleMenu"
        />
      </div>
      <div class="cell medium-auto small-21">
        <div class="grid-x grid-padding-x align-middle">
          <!-- <div class="cell shrink hide-for-small-only">
            <a
              :href="appLogoLink"
              class="logo flex-child-auto"
            >
              <img
                :src="appLogo"
                :alt="appLogoAlt"
                class="app-logo"
              >
            </a>
          </div>
          <div class="cell shrink hide-for-small-only">
            <div class="app-divide flex-child-auto" />
          </div> -->
          <div class="cell shrink">
            <section class="title-container flex-child-auto">
              <a
                :href="appLogoLink"
                class="logo flex-child-auto disabled"
              >
                <img
                  :src="compLogo()"
                  :alt="appLogoAlt"
                  class="app-logo"
                >
              </a>
              <div class="app-divide" />
              <a
                href="/"
                onclick="location.reload()"
                class="app-title"
              >
                <!-- :to="appLink" -->
                <h1 class="title">
                  {{ appTitle }}
                    <div id="demo-badge">
                      BETA
                    </div>
                </h1>
                <h2 class="sub-title">
                  {{ subTitle }}
                </h2>
              </a>
            </section>
          </div>
          <!-- <div class="cell large-auto small-auto small-centered text-center">
            <combo-search
              :dropdown="dropdownData"
              :search-string="searchString"
              :dropdown-selected="dropdownSelected"
              @trigger-combo-search="comboSearchTriggered"
              @trigger-clear-search="clearSearchTriggered"
            />
            <div class="search">
              <slot name="search" />
            </div>
          </div> -->
        </div>
      </div>
    </div>
    <div
      v-show="!isOpen"
      class="stripe"
    />
    <!-- <div
      class="white-stripe"
    /> -->
    <div
      v-show="isOpen"
      class="mobile-menu-content-container show-for-small-only"
    >
      <div class="mobile-menu-content">
        <a
          :href="appLogoLink"
          class="logo flex-child-auto"
        >
          <img
            :src="appLogo"
            :alt="appLogoAlt"
            class="app-logo"
          >
        </a>
        <slot name="mobile-menu" />
      </div>
    </div>
    <slot name="after-stripe" />
  </header>
</template>

<script>
// TODO: move logo, link etc to app config.
import Logo from '../assets/city-of-philadelphia-logo.png';
// import AddressInput from '@phila/vue-comps/src/components/AddressInput.vue'
// import Paragraph from '@phila/vue-comps/src/components/Paragraph.vue'
// import '@phila/vue-comps'

export default {
  // components: {
  //   ComboSearch: () => import(/* webpackChunkName: "pvc_ComboSearch" */'@phila/vue-comps/src/components/ComboSearch.vue'),
  // },
  props: {
    appLink: {
      type: String,
      default: '/',
    },
    appLogo: {
      type: String,
      default: Logo,
    },
    appLogoAlt: {
      type: String,
      default: 'City of Philadelphia',
    },
    appLogoLink: {
      type: String,
      default: 'https://www.phila.gov',
    },
    appTagLine: {
      type: String,
      default: 'App Tag Line',
    },
    appTitle: {
      type: String,
      default: 'App Title',
    },
    subTitle: {
      type: String,
      default: 'Sub Title',
    },
  },
  data() {
    return {
      dropdownData: {
        address: {
          text: 'Address',
          data: null,
        },
        keyword: {
          text: 'Keyword',
          data: null,
        },
      },
      searchString: '',
      dropdownSelected: '',
      isOpen: false,
    };
  },
  computed: {
    address() {
      let value;
      if (this.$store.state.geocode.data) {
        if (this.$store.state.geocode.data.properties) {
          value = this.$store.state.geocode.data.properties.street_address;
        }
      } else {
        value = '';
      }
      return value;
    },
    keywords() {
      return this.$store.state.selectedKeywords;
    },
    searchType() {
      return this.$store.state.searchType;
    },
  },
  watch: {
    address(nextAddress) {
      this.dropdownData.address.data = nextAddress;
    },
    keywords(nextKeywords) {
      this.dropdownData.keyword.data = nextKeywords;
    },
    searchType(nextSearchType) {
      this.searchTypeChanged(nextSearchType);
    },
  },
  // created() {
  //   Object.keys(this.dropdownData).forEach(item => {
  //     if (this.$route.query[item]) {
  //       this.searchString = this.$route.query[item];
  //       this.dropdownData[item].selected = true;
  //     }
  //   });
  // },
  methods: {
    searchTypeChanged(nextSearchType) {
      console.log('searchTypeChanged, nextSearchType:', nextSearchType);
      let startQuery = { ...this.$route.query };
      for (let dropdown of Object.keys(this.dropdownData)) {
        console.log('in loop, dropdown:', dropdown);
        delete startQuery[dropdown];
      }
      // this.$router.push({ query: startQuery });
      this.searchString = '';
    },
    // comboSearchTriggered(query) {
    //   // console.log('in comboSearchTriggered, query:', query, 'this.searchType:', this.searchType, '{...this.$route.query}:', { ...this.$route.query }, '{...query}:', { ...query });
    //   this.$router.push({ query: { ...this.$route.query, ...query }});
    //   this.searchString = query[this.searchType];
    // },
    clearSearchTriggered() {
      // console.log('in clearSearchTriggered, this.$route.query:', this.$route.query);
      let startQuery = { ...this.$route.query };
      delete startQuery[this.searchType];
      // this.$router.push({ query: startQuery });
      this.searchString = '';
    },
    compLogo(){
      let mobileLogo = "//cityofphiladelphia.github.io/patterns/images/city-of-philadelphia-mobile.png";
      return window.innerWidth < 750 ? mobileLogo : Logo;
    },
    toggleMenu() {
      this.isOpen = !this.isOpen;
      this.toggleBodyClass('no-scroll');
    },
    // TODO: make generic toggle class
    toggleBodyClass(className) {
      const el = document.body;
      return this.isOpen ? el.classList.add(className) : el.classList.remove(className);
    },
  },
};
</script>

<style lang="scss">

.app-title>h1 {
  position: relative;
  top: 50%;
}

.app-header{
  vertical-align: middle;
  background: color(dark-ben-franklin);

  .app-logo{
    height: 45px;
    min-width: 37px;
  }
  .logo{
    opacity: 1;
    transition: opacity .25s ease-in-out;
    &:hover {
      opacity: .6;
    }
  }

  .title-container{
    display: inline-flex;
    word-break: break-word;

    h1, h2{
      padding:0;
      margin-bottom: 0;
    }
    .sub-title {
      text-transform: uppercase;
    }
    a {
      color: white;
    }

    .title {
      display: inline-block;
    }

    #demo-badge{
      /*text-transform: capitalize;*/
      white-space: nowrap;
      height: 22px;
      width: 48px;
      text-align: center;
      line-height: 1.5rem;
      display: inline-block;
      font-size: 12px;
      font-family: Arial, Helvetica, sans-serif;
      font-weight: 800;
      vertical-align: middle;
      margin-left: 8px;
      border-radius: 1px;
      color: black;
      background: #FF8D00;
    }

  }
  .app-title{
    opacity: 1;
    transition: opacity .25s ease-in-out;
    &:hover {
      opacity: .6;
    }
  }
  .title{
    @media screen and (max-width: 20rem) {
      max-width: 20rem;
    }

    line-height: 2rem;
  }
}
.mobile-menu-content-container{
  position: relative;
  margin-top:1rem;
  overflow: hidden;
  color: white;
  z-index: 1000;
  background: color(dark-ben-franklin);
  height: 100vh;
  width:100%;

  .mobile-menu-content{
    text-align: center;
  }
}

.app-divide{
  display: inline-block;
  margin: 0 1rem;
  vertical-align: middle;

  @media screen and (min-width: 40em) {
    border-left:1px solid white;
  }
}
.stripe {
  min-height: 5px;
  background: color(electric-blue);
}
.white-stripe{
  min-height: 5px;
  background: white;
}

@media screen and (max-width: 750px) {

  a.disabled {
    pointer-events: none;
    cursor: default;
  }

  .mobile-menu-content {
    top: 15%
  }
  .mobile-menu-content>a>.app-logo {
    display: none;
  }
  .footer-nav>li {
    display: block;
    width: 100%;
    border-left: none !important;
    border-right: none !important;
  }

  .footer-nav>li, .footer-nav>li>a, .footer-nav>li>div>a  {
    padding-top: 20px !important;
    font-size: 1.4285714286rem;
    font-family: "Montserrat", sans-serif;
    font-style: normal;
    font-weight: normal !important;
  }

  .logo {
    display: none;
  }


}

@media screen and (min-width: 750px) {
  .sub-title {
    display: none;
  }
  .app-header h1.title {
    top: 25%;
  }
}



</style>
