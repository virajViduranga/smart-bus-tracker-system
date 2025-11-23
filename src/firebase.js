// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your actual configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBBNNHVMyD-2UYFOXoW8xVBb7w_05dO78k',
  authDomain: 'buslink-44e17.firebaseapp.com',
  projectId: 'buslink-44e17',
  storageBucket: 'buslink-44e17.firebasestorage.app',
  messagingSenderId: '359293752566',
  appId: '1:359293752566:web:dce31ab914fe51384888d7',
  measurementId: 'G-Q7SCBZ23LJ',
};

// Initialise Firebase app
const app = initializeApp(firebaseConfig);

// Firestore + Auth instances
export const db = getFirestore(app);
export const auth = getAuth(app);

// Used if you ever need a stable app id in paths
export const appId = 'buslink-44e17';
