import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'StatusBadge',
  props: {
    status: {
      type: [String, Number],
      required: true,
    },
    // Optional override for the color category ('green', 'yellow', 'orange', 'red', 'blue', 'purple', 'magenta')
    type: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const displayStatus = computed(() => {
      if (props.status === undefined || props.status === null) return 'N/A'

      const str = String(props.status)
      const lower = str.toLowerCase()

      // Auto-capitalize specific terms exactly how we want them
      if (lower === 'unpaid') return 'Unpaid'
      if (lower === 'paid') return 'Paid'
      if (lower === 'canceled' || lower === 'cancelled') return 'Cancelled'
      if (lower === 'pending') return 'Pending'
      if (lower === 'active') return 'Active'
      if (lower === 'inactive') return 'Inactive'

      return str // otherwise return exactly what was passed
    })

    const statusColor = computed(() => {
      if (props.type) return props.type // use override if provided

      const s = String(props.status).toLowerCase().trim()

      // Dynamic matches
      if (s.includes('$') || /monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(s))
        return 'blue'
      if ((s.includes(':') && s.includes('am')) || (s.includes(':') && s.includes('pm')))
        return 'blue'

      // Exact matches based on provided categories
      const greenSet = [
        'paid',
        'success',
        'active',
        'studying',
        'on-time',
        'present',
        'beginner',
        'excellent',
        'parent',
        'create at',
        'start date',
        'joined at',
      ]
      const yellowSet = [
        'unpaid',
        'pending',
        'deactivated',
        'suspended',
        'permission',
        'middle-level',
        'middle level',
        'warning',
        'suspended at',
      ]
      const redSet = [
        'canceled',
        'cancelled',
        'failed',
        'stopped',
        'absent',
        'serious',
        'advanced',
        'end date',
        'stopped at',
      ]
      const orangeSet = ['inactive']
      const blueSet = [
        'graduated',
        'late',
        'elementary',
        'good/fair',
        'good',
        'fair',
        'update at',
        'graduated at',
        'guardian',
      ]
      const purpleSet = ['make-up', 'makeup', 'intermediate', 'children']
      const magentaSet = ['unmarked']

      if (greenSet.includes(s)) return 'green'
      if (yellowSet.includes(s)) return 'yellow'
      if (orangeSet.includes(s)) return 'orange'
      if (redSet.includes(s)) return 'red'
      if (blueSet.includes(s)) return 'blue'
      if (purpleSet.includes(s)) return 'purple'
      if (magentaSet.includes(s)) return 'magenta'

      return 'gray' // Default fallback for anything unmatched
    })

    const badgeClass = computed(() => `status-badge badge-${statusColor.value}`)

    return {
      displayStatus,
      badgeClass,
    }
  },
})
