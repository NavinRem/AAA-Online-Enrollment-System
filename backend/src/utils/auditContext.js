const { AsyncLocalStorage } = require('node:async_hooks')
const auditStore = new AsyncLocalStorage()

/**
 * Returns the currently active admin user snapshot from the async context store.
 * Format: { uid, name, email, role, timestamp }
 */
function getAuditSnapshot() {
  const store = auditStore.getStore()
  if (!store) return null
  return {
    ...store,
    timestamp: new Date().toISOString(),
  }
}

module.exports = {
  auditStore,
  getAuditSnapshot,
}
