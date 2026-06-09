const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyD4y8-tKiRVgAG5jesH9Jjq5YRRfDjSTyY",
  authDomain: "aaa-online-registration-e3833.firebaseapp.com",
  projectId: "aaa-online-registration-e3833",
  storageBucket: "aaa-online-registration-e3833.firebasestorage.app",
  messagingSenderId: "214068739537",
  appId: "1:214068739537:web:c9a3e94961600025d5b4f0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testLiveLogin() {
  try {
    console.log("Logging into live Firebase Auth...");
    const userCredential = await signInWithEmailAndPassword(auth, "admin@academy.com", "AAA123456");
    const token = await userCredential.user.getIdToken();
    console.log("Successfully logged in! UID:", userCredential.user.uid);
    
    console.log("Calling live /auth/me API...");
    const res = await fetch("https://api-tyweqke5oa-uc.a.run.app/auth/me", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    const text = await res.text();
    console.log("API Response Status:", res.status);
    console.log("API Response Body:", text);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

testLiveLogin();
