export default {
  name: 'TableToolbar',
  props: {
    hasSearch: {
      type: Boolean,
      default: true,
    },
    searchQuery: {
      type: String,
      default: '',
    },
    searchPlaceholder: {
      type: String,
      default: 'Search...',
    },
    hasFilter: {
      type: Boolean,
      default: false,
    },
    currentFilter: {
      type: String,
      default: 'all',
    },
    filterOptions: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:searchQuery', 'update:currentFilter'],
  data() {
    return {
      isFilterOpen: false,
    }
  },
  methods: {
    toggleFilter() {
      this.isFilterOpen = !this.isFilterOpen
    },
    closeFilter() {
      setTimeout(() => {
        this.isFilterOpen = false
      }, 200)
    },
    selectFilter(val) {
      this.$emit('update:currentFilter', val)
      this.isFilterOpen = false
    },
  },
}
