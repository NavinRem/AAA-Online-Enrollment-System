import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
  apiKey: 'AIzaSyD4y8-tKiRVgAG5jesH9Jjq5YRRfDjSTyY',
  authDomain: 'aaa-online-registration-e3833.firebaseapp.com',
  projectId: 'aaa-online-registration-e3833',
  storageBucket: 'aaa-online-registration-e3833.firebasestorage.app',
  messagingSenderId: '214068739537',
  appId: '1:214068739537:web:c9a3e94961600025d5b4f0',
  measurementId: 'G-STBQTJMMVY',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app)
const db = getFirestore(app)

if (location.hostname === 'localhost') {
  // Connect to Emulators
  connectFirestoreEmulator(db, 'localhost', 8080)
  console.log('Running in development mode with Firebase Emulators')
}

export { storage, db, app }
