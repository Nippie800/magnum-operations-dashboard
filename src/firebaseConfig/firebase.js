import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBKeusuUehnFPfey6q0XnOerVETrvUiiFw",
  authDomain: "industrial-inventory-dashboard.firebaseapp.com",
  projectId: "industrial-inventory-dashboard",
  storageBucket: "industrial-inventory-dashboard.appspot.com",
  messagingSenderId: "609665879192",
  appId: "1:609665879192:web:88f4bb460e768aa3c4d4ed",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Core services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
