import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
export const auth = getAuth(app);


// if i am changeing method in right side panal then it should cnange in folder method for relevent mehtod also show in right side sleected method and give optio to make global variable it is taken by to resposne and set to variable as like for token handle also  this handle all edge casses make same as postman and show at top active method on top onright side a cross button and small point show save or unsave when user tab contrl + save the make it save and rmve that  point 