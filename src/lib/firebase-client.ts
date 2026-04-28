import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, connectAuthEmulator, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy_api_key_for_build',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

if (typeof window !== 'undefined' && firebaseConfig.apiKey === 'dummy_api_key_for_build') {
  console.error("🔥 CRITICAL: Firebase API Key is missing! The app is using a dummy key.");
}
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Connect to Emulators if running locally
if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
    // Only connect if not already connected (prevents errors on hot reload)
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log(`📡 Connected to Firebase Emulators (Auth: 9099, Firestore: 8080)`);
    } catch (e) {
      console.log('ℹ️ Emulators already connected or connection failed');
    }
  }
}

export const signOut = () => firebaseSignOut(auth);

const wrappedSignInWithPopup = async (authObj: any, provider: any) => {
  if (firebaseConfig.apiKey === 'dummy_api_key_for_build') {
    const msg = "Firebase API Key is missing in this environment. Ensure NEXT_PUBLIC_FIREBASE_API_KEY is set in your production host (e.g., Vercel) before building.";
    alert(msg);
    throw new Error(msg);
  }
  return signInWithPopup(authObj, provider);
};

export { app, auth, db, googleProvider, wrappedSignInWithPopup as signInWithPopup };
