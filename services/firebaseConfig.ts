import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, set, get } from "firebase/database";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";

// Configuración de Firebase obtenida desde Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyC6QR5gKslC8JqrZTG8xJq4Kafdz0tnq6U",
  authDomain: "global-auth-49737.firebaseapp.com",
  databaseUrl: "https://global-auth-49737-default-rtdb.firebaseio.com",
  projectId: "global-auth-49737",
  storageBucket: "global-auth-49737.appspot.com",
  messagingSenderId: "818786178354",
  appId: "1:818786178354:web:d3b43d220141ab4b55b32b",
  measurementId: "G-3741K6QH0J",
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

const db = getDatabase(app);

// Exportar servicios de autenticación
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { db, ref, push, onValue, set, get };