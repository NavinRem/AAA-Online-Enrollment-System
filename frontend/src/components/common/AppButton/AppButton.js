import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AppButton',
  props: {
    text: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'button',
    },
    variant: {
      type: String,
      default: 'primary', // primary, secondary, outline, subtle, light, danger, cancel, logout
    },
    size: {
      type: String,
      default: 'md', // sm, md, lg
    },
    icon: {
      type: String,
      default: '',
    },
    iconOnly: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
})
