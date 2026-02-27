<script setup>
import { ref } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'

const payments = ref([
  {
    id: 1,
    parent: 'Diana Holmes',
    amount: 180,
    method: 'Credit Card',
    status: 'Paid',
    date: '2026-02-15',
  },
  {
    id: 2,
    parent: 'Johnny Depp',
    amount: 180,
    method: 'Bank Transfer',
    status: 'Pending',
    date: '2026-02-15',
  },
])
</script>

<template>
  <DashboardLayout>
    <div class="page-container">
      <div class="table-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Parent</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in payments" :key="item.id">
              <td>#{{ item.id }}</td>
              <td class="bold">{{ item.parent }}</td>
              <td class="amount">${{ item.amount }}</td>
              <td>{{ item.method }}</td>
              <td>
                <span class="status-badge" :class="item.status.toLowerCase()">{{
                  item.status
                }}</span>
              </td>
              <td>{{ item.date }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.table-card {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.data-table th {
  padding-bottom: 15px;
  color: #999;
  border-bottom: 1px solid #f0f0f0;
}

.data-table td {
  padding: 15px 0;
  border-bottom: 1px solid #f8f8f8;
}

.bold {
  font-weight: 600;
}
.amount {
  font-weight: 700;
  color: #00aeef;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge.paid {
  background: #e1f5fe;
  color: #4caf50;
}
.status-badge.pending {
  background: #fffde7;
  color: #fbc02d;
}
</style>
