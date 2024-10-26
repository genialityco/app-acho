import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, set, ref, db } from "../services/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  deleteUser as firebaseDeleteUser,
  sendPasswordResetEmail,
} from "firebase/auth";
import { ReactNode } from "react";
import { createUser, searchUsers } from "@/services/api/userService";
import { createMember } from "@/services/api/memberService";
import { Alert } from "react-native";
import { Database } from "firebase/database";

// Definición del contexto de autenticación
const AuthContext = createContext<{
  isLoggedIn: boolean;
  isLoading: boolean;
  idToken: string | null;
  userId: string | null;
  setUserId: (id: string | null) => void;
  uid: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    organizationId: string,
    memberData: object
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  authError: string | null;
}>({
  isLoggedIn: false,
  isLoading: true,
  idToken: null,
  userId: null,
  setUserId: () => {},
  uid: null,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  deleteAccount: async () => {},
  resetPassword: async () => {},
  authError: null,
});

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

  // Función para manejar el cambio de estado de autenticación en Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          await AsyncStorage.multiSet([
            ["userToken", token],
            ["userUid", user.uid],
          ]);
          setAuthState({
            isLoggedIn: true,
            isLoading: true,
            idToken: token,
            uid: user.uid,
            userId: null,
            authError: null,
          });
          await fetchUserData(user.uid);
        } catch (error) {
          console.error("Error al obtener el token:", error);
          handleAuthError(error);
        }
      } else {
        await handleSignOut();
      }
    });

    return () => unsubscribe();
  }, []);

  // Ultima función para obtener los datos del usuario desde la API y autenticar usuario
  const fetchUserData = async (uid: string) => {
    try {
      const response = await searchUsers({ firebaseUid: uid });
      if (response.data.items.length > 0) {
        setAuthState((prevState) => ({
          ...prevState,
          userId: response.data.items[0]._id,
          isLoading: false,
        }));
      }
    } catch (error) {
      Alert.alert("Error", "No podemos ingresar, intente más tarde");
      console.error("Error al obtener el usuario por UID:", error);
    }
  };

  const fetchUserByFirebaseUid = async (uid: string | null) => {
    try {
      const response = await searchUsers({ firebaseUid: uid });
      setAuthState((prevState) => ({
        ...prevState,
        userId: response.data.items[0]._id,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  // Función de registro de usuario
  const signUp = async (
    email: string,
    password: string,
    organizationId: string,
    memberData: object
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      const token = await user.getIdToken();

      // Guardar el token y el UID en AsyncStorage
      await AsyncStorage.multiSet([
        ["userToken", token],
        ["userUid", userCredential.user.uid],
      ]);

      // Crear usuario en la base de datos
      const response = await createUser({ firebaseUid: user.uid });
      const userCreated = response.data;

      const responseCreateMember = await createMember({
        userId: userCreated._id,
        organizationId: organizationId,
        properties: memberData,
      });

      if (!responseCreateMember.status) {
        Alert.alert(
          "Error",
          "No se pudo crear el miembro en la base de datos. Inténtalo nuevamente."
        );
        throw new Error("Error al crear el miembro en la base de datos.");
      }

      // Actualizar el estado de autenticación
      setAuthState((prevState) => ({
        ...prevState,
        isLoggedIn: true,
        idToken: token,
        uid: user.uid,
        userId: userCreated._id,
        authError: null,
      }));

      return true;
    } catch (error) {
      console.error("Error al registrar el usuario:", error);

      // Si falla la creación en la base de datos, eliminar el usuario de Firebase
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await firebaseDeleteUser(currentUser);
          const refLogs = ref(db, "logs");
          set(refLogs, {
            message: `Usuario eliminado de Firebase: ${currentUser.uid}`,
            createdAt: new Date().toISOString(),
          });
          console.log("Usuario eliminado de Firebase");
        } catch (deleteError) {
          console.error(
            "Error al eliminar el usuario de Firebase:",
            deleteError
          );
          Alert.alert(
            "Error",
            "Ocurrió un problema al eliminar el usuario de Firebase."
          );
        }
      }

      // Manejar el error de autenticación y mostrar alerta directamente
      handleAuthError(error);
      return false;
    }
  };

  // Función de inicio de sesión
  const signIn = async (email: string, password: string) => {
    try {
      await AsyncStorage.clear();

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

      await fetchUserByFirebaseUid(userCredential.user.uid);
      return true;
    } catch (error) {
      handleAuthError(error);
      return false;
    }
  };

  // Función de cierre de sesión
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      await handleSignOut();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Función para eliminar cuenta
  const deleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await firebaseDeleteUser(user);
        await handleSignOut();
        const refLogs = ref(db, "logs");
        set(refLogs, {
          message: `Ejecutando, deleteAccount: ${user.uid}`,
          createdAt: new Date().toISOString(),
        });
      } else {
        throw new Error("No hay un usuario autenticado para eliminar.");
      }
    } catch (error) {
      handleAuthError(error, "Error al eliminar la cuenta.");
    }
  };

  // Función para limpiar el estado y AsyncStorage
  const handleSignOut = async () => {
    await AsyncStorage.multiRemove(["userToken", "userUid"]);
    setAuthState({
      isLoggedIn: false,
      isLoading: false,
      idToken: null,
      uid: null,
      userId: null,
      authError: null,
    });
  };

  // Función para restaurar la contraseña
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Correo enviado",
        "Se ha enviado un correo electrónico para restablecer tu contraseña."
      );
    } catch (error) {
      handleAuthError(error);
    }
  };

  // Función para manejar errores de autenticación
  const handleAuthError = (error: any, customMessage?: string) => {
    const errorCode = error.code as keyof typeof errorMessages;
    const errorMessages = {
      "auth/wrong-password": "La contraseña es incorrecta.",
      "auth/user-not-found": "No se encontró una cuenta con este correo.",
      "auth/email-already-in-use": "Este correo ya está registrado.",
      "auth/weak-password": "La contraseña es demasiado débil.",
      "auth/invalid-credential":
        "Credenciales inválidas o el correo no esta registrado.",
      "auth/too-many-requests":
        "Demasiados intentos. Inténtalo de nuevo más tarde.",
    };

    // Obtener el mensaje de error
    const errorMessage =
      errorMessages[errorCode] ||
      customMessage ||
      "Ha ocurrido un error. Inténtalo de nuevo.";

    // Mostrar la alerta de error inmediatamente
    Alert.alert("Error", errorMessage);

    // Actualizar el estado con el mensaje de error
    setAuthState((prevState) => ({
      ...prevState,
      authError: errorMessage,
    }));
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
        deleteAccount,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
