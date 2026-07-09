const admin = require('firebase-admin')
const { getFirestore } = require('firebase-admin/firestore')
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') })

if (process.env.INTERNAL_FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST =
    process.env.INTERNAL_FIRESTORE_EMULATOR_HOST
}
if (process.env.INTERNAL_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST =
    process.env.INTERNAL_AUTH_EMULATOR_HOST
}

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: process.env.INTERNAL_PROJECT_ID,
    storageBucket: process.env.INTERNAL_STORAGE_BUCKET,
  })
}

const db = getFirestore()
db.settings({ ignoreUndefinedProperties: true })

const { getAuditSnapshot } = require('../utils/auditContext')
const {
  CollectionReference,
  DocumentReference,
  Transaction,
  WriteBatch,
  FieldValue,
} = require('firebase-admin/firestore')

function injectAuditMetadata(data, isCreate = false) {
  const baseSnapshot = getAuditSnapshot()
  if (!baseSnapshot || !data || typeof data !== 'object' || Array.isArray(data)) {
    return data
  }
  let action = baseSnapshot.action || (isCreate ? 'Created Record' : 'Edited Details')
  if (isCreate) {
    action = 'Created Record'
  } else if (data.status) {
    const sLower = String(data.status).toLowerCase()
    if (sLower.includes('cancel') || sLower.includes('drop')) {
      action = 'Cancelled Enrollment'
    } else {
      action = `Status -> ${data.status}`
    }
  } else if (data.paymentStatus) {
    action = `Payment -> ${data.paymentStatus}`
  } else if (data.classId || data.schedule) {
    action = 'Transferred / Updated Class'
  }

  const snapshot = {
    ...baseSnapshot,
    action,
    timestamp: new Date().toISOString()
  }
  const copy = { ...data }
  if (isCreate && !copy.createdBy) {
    copy.createdBy = snapshot
  }
  copy.modifiedBy = snapshot
  if (isCreate && !copy.auditHistory) {
    copy.auditHistory = [snapshot]
  } else if (!isCreate) {
    try {
      copy.auditHistory = FieldValue.arrayUnion(snapshot)
    } catch (err) {
      console.debug('[Audit] FieldValue fallback:', err.message)
    }
  }
  return copy
}

if (CollectionReference && CollectionReference.prototype) {
  const origAdd = CollectionReference.prototype.add
  CollectionReference.prototype.add = function (data) {
    return origAdd.call(this, injectAuditMetadata(data, true))
  }
}

if (DocumentReference && DocumentReference.prototype) {
  const origSet = DocumentReference.prototype.set
  DocumentReference.prototype.set = function (data, options) {
    const isCreate = !options || !options.merge
    return origSet.call(this, injectAuditMetadata(data, isCreate), options)
  }

  const origUpdate = DocumentReference.prototype.update
  DocumentReference.prototype.update = function (data, ...args) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      return origUpdate.call(this, injectAuditMetadata(data, false), ...args)
    }
    return origUpdate.call(this, data, ...args)
  }
}

if (Transaction && Transaction.prototype) {
  const origTxSet = Transaction.prototype.set
  Transaction.prototype.set = function (ref, data, options) {
    const isCreate = !options || !options.merge
    return origTxSet.call(
      this,
      ref,
      injectAuditMetadata(data, isCreate),
      options,
    )
  }

  const origTxUpdate = Transaction.prototype.update
  Transaction.prototype.update = function (ref, data, ...args) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      return origTxUpdate.call(
        this,
        ref,
        injectAuditMetadata(data, false),
        ...args,
      )
    }
    return origTxUpdate.call(this, ref, data, ...args)
  }
}

if (WriteBatch && WriteBatch.prototype) {
  const origBatchSet = WriteBatch.prototype.set
  WriteBatch.prototype.set = function (ref, data, options) {
    const isCreate = !options || !options.merge
    return origBatchSet.call(
      this,
      ref,
      injectAuditMetadata(data, isCreate),
      options,
    )
  }

  const origBatchUpdate = WriteBatch.prototype.update
  WriteBatch.prototype.update = function (ref, data, ...args) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      return origBatchUpdate.call(
        this,
        ref,
        injectAuditMetadata(data, false),
        ...args,
      )
    }
    return origBatchUpdate.call(this, ref, data, ...args)
  }
}

const COLLECTIONS = {
  ADMIN: 'admins',
  BRANCH: 'branches',
  CATEGORY: 'categories',
  CLASS: 'classes',
  ENROLLMENT: 'enrollments',
  LEVEL: 'levels',
  PARENT: 'parents',
  PAYMENT: 'payments',
  PROGRAM: 'programs',
  SCHEDULE: 'schedules',
  STUDENT: 'students',
  TEACHER: 'teachers',
  TERM: 'terms',
  TRIAL: 'trials',
}

module.exports = {
  db,
  COLLECTIONS,
}

