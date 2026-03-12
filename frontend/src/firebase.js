import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const env = import.meta.env

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const firestore = initializeFirestore(app, {}, 'registration')

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app)
const auth = getAuth(app)


export { storage, firestore, auth, app }
