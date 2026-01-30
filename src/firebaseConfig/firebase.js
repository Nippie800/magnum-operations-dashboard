import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { signInAnonymously } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyBKeusuUehnFPfey6q0XnOerVETrvUiiFw",
  authDomain: "industrial-inventory-dashboard.firebaseapp.com",
  projectId: "industrial-inventory-dashboard",
  storageBucket: "industrial-inventory-dashboard.firebasestorage.app",
  messagingSenderId: "609665879192",
  appId: "1:609665879192:web:88f4bb460e768aa3c4d4ed"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);


// auto sign in anonymously
signInAnonymously(auth).catch(console.error);
