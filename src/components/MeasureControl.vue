<script>
  import MeasureControl from 'leaflet-measure';
  console.log('MeasureControl:', MeasureControl);

  export default {
    props: ['position'],
    mounted() {
      const leafletElement = this.$leafletElement = this.createLeafletElement();
    },
    destroyed() {
      this.$leafletElement._map.removeControl(this.$leafletElement);
    },
    render(h) {
      return;
    },
    methods: {
      createLeafletElement() {
        const { position } = this.$props;

        return new MeasureControl({
  				position,
  				primaryLengthUnit: 'feet',
  				primaryAreaUnit: 'sqfeet',
  			});
      },
      parentMounted(parent) {
        const map = parent.$leafletElement;
        map.addControl(this.$leafletElement);
      }
    }
  };
</script>

<style>
</style>
