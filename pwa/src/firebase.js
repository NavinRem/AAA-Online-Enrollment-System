// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// Use the SAME Firebase project config as the admin portal
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForTestingAndEmulators123',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-aaa-enrollment',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-aaa-enrollment.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
}

const app = initializeApp(firebaseConfig)

const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
  experimentalForceLongPolling: true,
})

const auth = getAuth(app)
const storage = getStorage(app)

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}

export { app, auth, firestore, storage }