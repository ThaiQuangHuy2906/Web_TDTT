// Firebase SDK imports
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate configuration
const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
];

for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
        throw new Error(
            `Missing required environment variable: ${envVar}. ` +
            `Please check your .env file and restart the dev server.`
        );
    }
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence for Firestore
// This allows the app to work offline and reduces network calls
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('⚠️ Firestore persistence: Multiple tabs open. Only the first tab has offline support.');
    } else if (err.code === 'unimplemented') {
        // The current browser doesn't support persistence
        console.warn('⚠️ Firestore persistence: Not supported in this browser.');
    } else {
        console.error('❌ Firestore persistence error:', err);
    }
});

// Export app instance (rarely needed, but available)
export default app;