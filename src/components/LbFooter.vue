<template>
  <div>
    <div class="app-footer">
      <div class="row expanded">
        <div class="columns">
          <nav>
            <ul class="inline-list">
              <li>
                <popover-link :options="this.popoverLinkOptions"
                              :slots="this.popoverLinkSlots"
                              :customStyle="this.customStyle"
                />
              </li>
              <li>
                <a target="_blank" :href="this.feedbackUrl">Feedback</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>


<script>

  export default {
    name: 'LbFooter',
    components: {
      PopoverLink: () => import(/* webpackChunkName: "lblb_pvc_PopoverLink" */'@philly/vue-comps/src/components/PopoverLink.vue'),
    },
    computed: {
      feedbackUrl() {
        if (this.$config.footer) {
          if (this.$config.footer.feedbackUrl) {
            return this.$config.footer.feedbackUrl
          } else {
            return null
          }
        } else {
          return null
        }
      },
      customStyle() {
        if (this.$config.footer) {
          if (this.$config.footer.helpPopover) {
            if (this.$config.footer.helpPopover.linkStyle) {
              return this.$config.footer.helpPopover.linkStyle
            } else {
              return { 'color': 'white', 'border-bottom': '0px' }
            }
          } else {
            return { 'color': 'white', 'border-bottom': '0px' }
          }
        } else {
          return { 'color': 'white', 'border-bottom': '0px' }
        }
      },
      popoverHeight() {
        if (this.$config.footer) {
          if (this.$config.footer.helpPopover) {
            if (this.$config.footer.helpPopover.height) {
              return this.$config.footer.helpPopover.height
            } else {
              return '80%'
            }
          } else {
            return '80%'
          }
        } else {
          return '80%'
        }
      },
      popoverLinkOptions() {
        return {
          height: this.popoverHeight,
          components: [
            {
              type: 'helpInstructions'
            }
          ]
        }
      },
      popoverLinkSlots() {
        return {
          shouldShowValue: false,
          value: 'Help'
        }
      }
    }
  }
</script>
