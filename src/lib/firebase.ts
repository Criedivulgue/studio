import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  "projectId": "omniflow-ai-mviw9",
  "appId": "1:904294888593:web:2b8ad0686d59f65d07bb30",
  "storageBucket": "omniflow-ai-mviw9.firebasestorage.app",
  "apiKey": "AIzaSyB3qOq0uWY2DnmmN08A6L8Gn0_qYvfIatI",
  "authDomain": "omniflow-ai-mviw9.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "904294888593"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export { app };
