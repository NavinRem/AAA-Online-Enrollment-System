import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

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
const firestore = initializeFirestore(app, {}, 'registration')

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app)
const auth = getAuth(app)


export { storage, firestore, auth, app }
