import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBKkIgYyPqGNirX_K4DFklYh-I_HvHKCFg",
    authDomain: "legaltechsolution-3f4e5.firebaseapp.com",
    projectId: "legaltechsolution-3f4e5",
    storageBucket: "legaltechsolution-3f4e5.firebasestorage.app",
    messagingSenderId: "287309577955",
    appId: "1:287309577955:web:d024203b05be9b01580fd6",
    measurementId: "G-88RRSP2L7E"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
