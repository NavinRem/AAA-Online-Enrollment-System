import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { initializeFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

import { config } from './config'

const firebaseConfig = config.firebase

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const firestore = initializeFirestore(app, {}, 'registration')

// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app)
const auth = getAuth(app)


export { storage, firestore, auth, app }
