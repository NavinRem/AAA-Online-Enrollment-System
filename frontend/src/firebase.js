import { initializeApp } from 'firebase/app'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getAuth, connectAuthEmulator } from 'firebase/auth'

import { config } from './config'

const firebaseConfig = config.firebase

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const firestore = initializeFirestore(app, {})
const storage = getStorage(app)
const auth = getAuth(app)

// Connect to emulators if running locally
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  connectFirestoreEmulator(firestore, '127.0.0.1', 8080)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  console.log('Connected to Firebase Emulators')
}

export { storage, firestore, auth, app }
