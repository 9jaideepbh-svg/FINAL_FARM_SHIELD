// Firebase Configuration for FarmShield

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDRkslNmdXJNII1G9Tx6mW9I3DjBmgZd6w",
    authDomain: "agri-farm-e4219.firebaseapp.com",
    projectId: "agri-farm-e4219",
    storageBucket: "agri-farm-e4219.firebasestorage.app",
    messagingSenderId: "980586953511",
    appId: "1:980586953511:web:271352044fa43426fdc702"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;