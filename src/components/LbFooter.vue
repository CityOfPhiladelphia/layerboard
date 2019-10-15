<template>
  <div>
    <div class="app-footer">
      <div class="row expanded">
        <div class="columns">
          <nav>
            <ul class="inline-list">
              <!-- <li v-for="link in this.$config.footerContent"> -->
              <topic-component-group
                :topic-components="footerComponents"
                :is-list="true"
              />
              <!-- <popover-link :options="this.popoverLinkOptions"
                              :slots="this.popoverLinkSlots"
                              :customStyle="this.customStyle"
                /> -->
              <!-- </li> -->
              <!-- <li>
                <a target="_blank" :href="this.feedbackUrl">Feedback</a>
              </li> -->
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>


<script>

import TopicComponentGroup from '@philly/vue-comps/src/components/TopicComponentGroup.vue';

export default {
  name: 'LbFooter',
  components: {
    TopicComponentGroup,
    // PopoverLink: () => import(/* webpackChunkName: "lblb_pvc_PopoverLink" */'@philly/vue-comps/src/components/PopoverLink.vue'),
  },
  computed: {
    footerContent() {
      return this.$config.footerContent;
    },
    footerComponents() {
      if (this.$config.footerContent.components) {
        return this.$config.footerContent.components;
      }
      return null;
      // if no components, use a single 'checkbox-set'
      // return [{ type: 'checkbox-set' }];

    },
    feedbackUrl() {
      if (this.$config.footer) {
        if (this.$config.footer.feedbackUrl) {
          return this.$config.footer.feedbackUrl;
        }
        return null;

      }
      return null;

    },
    customStyle() {
      if (this.$config.footer) {
        if (this.$config.footer.helpPopover) {
          if (this.$config.footer.helpPopover.linkStyle) {
            return this.$config.footer.helpPopover.linkStyle;
          }
          return { 'color': 'white', 'border-bottom': '0px' };

        }
        return { 'color': 'white', 'border-bottom': '0px' };

      }
      return { 'color': 'white', 'border-bottom': '0px' };

    },
    popoverHeight() {
      if (this.$config.footer) {
        if (this.$config.footer.helpPopover) {
          if (this.$config.footer.helpPopover.height) {
            return this.$config.footer.helpPopover.height;
          }
          return '80%';

        }
        return '80%';

      }
      return '80%';

    },
    popoverLinkOptions() {
      return {
        height: this.popoverHeight,
        components: [
          {
            type: 'helpInstructions',
          },
        ],
      };
    },
    popoverLinkSlots() {
      return {
        shouldShowValue: false,
        value: 'Help',
      };
    },
  },
};
</script>
