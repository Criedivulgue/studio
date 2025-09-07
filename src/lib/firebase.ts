// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3qOq0uWY2DnmmN08A6L8Gn0_qYvfIatI",
  authDomain: "omniflow-ai-mviw9.firebaseapp.com",
  projectId: "omniflow-ai-mviw9",
  storageBucket: "omniflow-ai-mviw9.firebasestorage.app",
  messagingSenderId: "904294888593",
  appId: "1:904294888593:web:2b8ad0686d59f65d07bb30"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
