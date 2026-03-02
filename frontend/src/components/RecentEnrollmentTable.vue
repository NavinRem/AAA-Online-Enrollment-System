<script setup>
const props = defineProps({
  registrations: {
    type: Array,
    default: () => [],
  },
})

const getStatusClass = (status) => {
  if (!status) return ''
  status = status.toLowerCase()
  if (status === 'confirmed') return 'paid'
  if (status === 'pending') return 'unpaid'
  return status
}

const getDisplayStatus = (status) => {
  if (!status) return 'Pending'
  status = status.toLowerCase()
  if (status === 'confirmed' || status === 'paid') return 'Paid'
  if (status === 'pending' || status === 'unpaid') return 'Unpaid'
  if (status === 'canceled' || status === 'cancelled') return 'Canceled'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  // Handle Firestore Timestamp objects if they leaked through
  if (dateString && typeof dateString === 'object' && dateString.seconds) {
    dateString = dateString.toDate().toISOString()
  }
  try {
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    const formattedTime = date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    return `${formattedDate} at ${formattedTime}`
  } catch (e) {
    return dateString
  }
}
</script>

<template>
  <div class="table-container">
    <div class="table-header">
      <div class="header-left">
        <h3 class="section-title">Recent Enrollment</h3>
      </div>
      <div class="header-right">
        <div class="search-mini">
          <input type="text" placeholder="Search something" />
          <img src="../assets/icons/search-svgrepo.svg" />
        </div>
        <button class="filter-btn">Filter</button>
      </div>
    </div>

    <table class="recent-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Parent/Guardian</th>
          <th>Child</th>
          <th>Course</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Enrolled Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in registrations" :key="item.no">
          <td>{{ item.no }}</td>
          <td class="bold">{{ item.parent }}</td>
          <td>{{ item.child }}</td>
          <td>{{ item.course }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(item.status)">
              {{ getDisplayStatus(item.status) }}
            </span>
          </td>
          <td>
            <span class="amount-cell">{{ item.amount }}</span>
          </td>
          <td class="date-cell">{{ formatDate(item.date) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: white;
  padding: 25px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
  margin-top: 25px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  white-space: nowrap;
}

.header-left::after {
  content: '';
  flex: 1;
  margin-left: 20px;
  height: 1px;
  background-color: #eee;
  margin-right: 20px;
}

.header-right {
  display: flex;
  gap: 15px;
}

.search-mini {
  position: relative;
}

.search-mini input {
  background: #f8f9fa;
  border: 1px solid #eee;
  padding: 8px 12px 8px 35px;
  border-radius: 20px;
  font-size: 0.85rem;
  width: 250px;
}

.search-mini img {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  opacity: 0.4;
}

.filter-btn {
  background: #00aeef;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
}

.recent-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.recent-table th {
  font-size: 0.8rem;
  color: #999;
  font-weight: 600;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.recent-table td {
  padding: 15px 0;
  font-size: 0.85rem;
  color: #444;
  border-bottom: 1px solid #f8f8f8;
}

.bold {
  font-weight: 600;
  color: #1a1a1a;
}

.status-badge {
  padding: 5px 15px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.paid {
  background: #e1f5fe;
  color: #4caf50;
}

.status-badge.unpaid {
  background: #fffde7;
  color: #fbc02d;
}

.status-badge.canceled {
  background: #ffebee;
  color: #f44336;
}

.amount-cell {
  background: #e1f5fe;
  color: #00aeef;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 8px;
  display: inline-block;
}

.date-cell {
  color: #666;
  font-size: 0.8rem;
}
</style>
