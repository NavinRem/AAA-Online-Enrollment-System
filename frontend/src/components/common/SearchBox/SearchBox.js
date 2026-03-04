import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SearchBox',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'Search...',
    },
  },
  emits: ['update:modelValue'],
})
