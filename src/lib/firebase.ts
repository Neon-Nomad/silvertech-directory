import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Placeholder configuration - Replace with actual values from Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY_FROM_FIREBASE_CONSOLE",
    authDomain: "silvertech-directory.firebaseapp.com",
    projectId: "silvertech-directory",
    storageBucket: "silvertech-directory.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID_FROM_FIREBASE",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
