<script setup>
import { ref } from 'vue'
import DashboardLayout from '../components/DashboardLayout.vue'
import AppTable from '../components/common/AppTable/AppTable.vue'
import StatusBadge from '../components/common/StatusBadge/StatusBadge.vue'

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
        <AppTable :headers="['ID', 'Parent', 'Amount', 'Method', 'Status', 'Date']">
          <tr v-for="item in payments" :key="item.id">
            <td>#{{ item.id }}</td>
            <td class="bold">{{ item.parent }}</td>
            <td class="amount">${{ item.amount }}</td>
            <td>{{ item.method }}</td>
            <td>
              <StatusBadge :status="item.status" />
            </td>
            <td>{{ item.date }}</td>
          </tr>
        </AppTable>
      </div>
    </div>
  </DashboardLayout>
</template>

<style scoped>
.table-card {
  background: white;
  border-radius: 20px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.bold {
  font-weight: 600;
}
.amount {
  font-weight: 700;
  color: #00aeef;
}
</style>
