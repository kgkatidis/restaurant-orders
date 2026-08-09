import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC__6aqMbjD7bhmlNpgNXseilYA2mdiWY0",
  authDomain: "restaurant-orders-app.firebaseapp.com",
  databaseURL: "https://restaurant-orders-app-default-rtdb.firebaseio.com",
  projectId: "restaurant-orders-app",
  storageBucket: "restaurant-orders-app.firebasestorage.app",
  messagingSenderId: "180630641680",
  appId: "1:180630641680:web:d6e5e7b475c582066cfe95"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
