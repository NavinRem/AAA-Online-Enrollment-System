export default {
  name: 'AppTable',
  props: {
    headers: {
      type: Array,
      required: true,
      // ['No', 'Fullname', 'Child', 'Status', 'Action']
    },
    loading: {
      type: Boolean,
      default: false,
    },
    empty: {
      type: Boolean,
      default: false,
    },
  },
}
