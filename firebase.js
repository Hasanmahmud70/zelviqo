import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBiN8DvUWmkd5T579LHiP4aAWgLvZ44HcI",
  authDomain: "zelviqo-f9531.firebaseapp.com",
  projectId: "zelviqo-f9531",
  storageBucket: "zelviqo-f9531.firebasestorage.app",
  messagingSenderId: "886553994948",
  appId: "1:886553994948:web:2e3c0fb3d1ccb81a7c0b91",
  measurementId: "G-WSNEJPW7FQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.db = db;
