// src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDgXsIIkLbfZqBJvwh8lSncOQ1nbJxKDJk",
  authDomain: "parking-4cd30.firebaseapp.com",
  projectId: "parking-4cd30",
  storageBucket: "parking-4cd30.firebasestorage.app",
  messagingSenderId: "875862407798",
  appId: "1:875862407798:web:5ab8233709ba26314efd57",
  measurementId: "G-JFYEHEB816"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
