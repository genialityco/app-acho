import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../services/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";

const AuthContext = createContext<{
  isLoggedIn: boolean;
  isLoading: boolean;
  idToken: string | null;
  userId: string | null;
  setUserId: (id: string | null) => void;
  uid: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<false | { status: boolean; uid: string }>;
  signOut: () => Promise<void>;
  authError: string | null;
}>({
  isLoggedIn: false,
  isLoading: true,
  idToken: null,
  userId: null,
  setUserId: (id: string | null) => {},
  uid: null,
  signIn: async (email: string, password: string) => false,
  signUp: async (email: string, password: string) => false,
  signOut: async () => {},
  authError: null,
});

import { ReactNode } from "react";
import { searchUsers } from "@/services/api/userService";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<{
    isLoggedIn: boolean;
    isLoading: boolean;
    idToken: string | null;
    userId: string | null;
    uid: string | null;
    authError: string | null;
  }>({
    isLoggedIn: false,
    isLoading: true,
    idToken: null,
    userId: null,
    uid: null,
    authError: null,
  });

  useEffect(() => {
    const fetchUserData = async (uid: string) => {
      try {
        const response = await searchUsers({ firebaseUid: uid });
        if (response.data.items.length > 0) {
          const user = response.data.items[0];
          setAuthState((prevState) => ({
            ...prevState,
            userId: user._id,
          }));
        }
      } catch (error) {
        console.error('Error fetching user by Firebase UID:', error);
      }
    };
  
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        await AsyncStorage.multiSet([
          ["userToken", token],
          ["userUid", user.uid],
        ]);
        setAuthState((prevState) => ({
          ...prevState,
          isLoggedIn: true,
          isLoading: false,
          idToken: token,
          uid: user.uid,
        }));
  
        // Llamar a la función para buscar el usuario en la API con el UID de Firebase
        await fetchUserData(user.uid);
      } else {
        await AsyncStorage.multiRemove(["userToken", "userUid"]);
        setAuthState((prevState) => ({
          ...prevState,
          isLoggedIn: false,
          isLoading: false,
          idToken: null,
          uid: null,
          userId: null,
        }));
      }
    });
  
    return () => unsubscribe();
  }, []);
  

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.multiSet([
        ["userToken", token],
        ["userUid", userCredential.user.uid],
      ]);
      setAuthState((prevState) => ({
        ...prevState,
        isLoggedIn: true,
        idToken: token,
        uid: userCredential.user.uid,
        authError: null,
      }));
      return true;
    } catch (error) {
      const errorMessage = handleFirebaseError(error);
      setAuthState((prevState) => ({ ...prevState, authError: errorMessage }));
      return false;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.multiSet([
        ["userToken", token],
        ["userUid", userCredential.user.uid],
      ]);
      setAuthState((prevState) => ({
        ...prevState,
        isLoggedIn: true,
        idToken: token,
        uid: userCredential.user.uid,
        authError: null,
      }));
      return {status: true, uid: userCredential.user.uid};
    } catch (error) {
      const errorMessage = handleFirebaseError(error);
      setAuthState((prevState) => ({ ...prevState, authError: errorMessage }));
      return false;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await AsyncStorage.multiRemove(["userToken", "userUid"]);
      setAuthState((prevState) => ({
        ...prevState,
        isLoggedIn: false,
        idToken: null,
        uid: null,
      }));
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleFirebaseError = (error: unknown) => {
    const errorCode = (error as { code: keyof typeof errorMessages }).code;
    const errorMessages = {
      "auth/wrong-password": "La contraseña es incorrecta.",
      "auth/user-not-found": "No se encontró una cuenta con este correo.",
      "auth/email-already-in-use":
        "Este correo electrónico ya está registrado.",
      "auth/weak-password": "La contraseña es demasiado débil.",
      "auth/invalid-credential": "Credenciales inválidas.",
      "auth/too-many-requests":
        "Demasiados intentos. Inténtalo de nuevo más tarde.",
    };
    return (
      errorMessages[errorCode] || "Ha ocurrido un error. Inténtalo de nuevo."
    );
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        setUserId: (id: any) =>
          setAuthState((prevState) => ({ ...prevState, userId: id })),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
