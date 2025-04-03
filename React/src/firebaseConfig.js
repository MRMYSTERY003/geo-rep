import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBW_Zdl6VYqGt1s8ZWldIHe3XQ8Iz_AxJc",
    authDomain: "loc-dashboard.firebaseapp.com",
    projectId: "loc-dashboard",
    storageBucket: "loc-dashboard.firebasestorage.app",
    messagingSenderId: "882615853798",
    appId: "1:882615853798:web:a7cc21f5ee5ea0aa2e1127"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
