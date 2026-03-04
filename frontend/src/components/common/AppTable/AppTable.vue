<template>
  <div class="table-container">
    <div v-if="loading" class="loading-state">
      <slot name="loading">Loading data...</slot>
    </div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th v-for="(col, index) in headers" :key="index">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <slot></slot>
        <tr v-if="empty">
          <td :colspan="headers.length" class="empty-state">
            <slot name="empty">No records found.</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script src="./AppTable.js"></script>
<style src="./AppTable.css" scoped></style>
