import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBj_4TCzRAltGTx_DrMBgWP5d0DQ-syKaw",
  authDomain: "thegem-b13c7.firebaseapp.com",
  projectId: "thegem-b13c7",
  storageBucket: "thegem-b13c7.firebasestorage.app",
  messagingSenderId: "796465363200",
  appId: "1:796465363200:web:a507852db3d85d3c049be5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);