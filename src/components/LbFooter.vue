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
                <a target="_blank" href="//philagsg.typeform.com/to/GQOPjW">Feedback</a>
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
    mounted() {
      console.log('LbFooter mounted, this$config:', this.$config)
    },
    components: {
      PopoverLink: () => import(/* webpackChunkName: "lblb_pvc_PopoverLink" */'@philly/vue-comps/src/components/PopoverLink.vue'),
    },
    created() {
      console.log('Footer created');
    },
    computed: {
      customStyle() {
        if (this.$config.helpPopover) {
          if (this.$config.helpPopover.linkStyle) {
            return this.$config.helpPopover.linkStyle
          } else {
            return { 'color': 'white', 'border-bottom': '0px' }
          }
        } else {
          return { 'color': 'white', 'border-bottom': '0px' }
        }
      },
      popoverHeight() {
        if (this.$config.helpPopover) {
          if (this.$config.helpPopover.height) {
            return this.$config.helpPopover.height
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
