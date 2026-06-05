// ╔══════════════════════════════════════════════════════════╗
// ║         THE GOLDENEST LANTERN — Firebase Config          ║
// ║  Replace the values below with your Firebase project     ║
// ║  config from: Firebase Console → Project Settings →      ║
// ║  "Your apps" → SDK setup and configuration               ║
// ╚══════════════════════════════════════════════════════════╝

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC5hKWwPwCqdphalrP38HGoeY-4MpWrp4s",
  authDomain: "goldenest-lantern.firebaseapp.com",
  projectId: "goldenest-lantern",
  storageBucket: "goldenest-lantern.firebasestorage.app",
  messagingSenderId: "940944947839",
  appId: "1:940944947839:web:d6b9877e35e521f04d1d4a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
