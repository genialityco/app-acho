import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Attendee, searchAttendees } from "@/services/api/attendeeService";
import {
  deleteUser,
  searchUsers,
  updateUser,
} from "@/services/api/userService"; // Añade updateUser para actualizar el usuario
import { searchMembers } from "@/services/api/memberService";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

export default function MenuScreen() {
  const [user, setUser] = useState<Attendee>({} as Attendee);
  const [isPushEnabled, setIsPushEnabled] = useState(false); // Estado para el toggle de notificaciones
  const { signOut, uid, deleteAccount } = useAuth();
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      const filters = { firebaseUid: uid };
      const response = await searchUsers(filters);
      if (response.status === "success") {
        const member = await searchMembers({
          userId: response.data.items[0]._id,
        });
        setUser(member.data.items[0]);

        // Verifica si el usuario ya tiene un expoPushToken
        setIsPushEnabled(!!member.data.items[0]?.expoPushToken);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Función para manejar el cambio del toggle
  const handleToggleChange = async (value: boolean) => {
    setIsPushEnabled(value);

    if (value) {
      // Habilitar notificaciones
      const token = await registerForPushNotifications();
      if (token) {
        await updateUserExpoPushToken(token);
      } else {
        Alert.alert("Error", "No se pudo habilitar las notificaciones.");
        setIsPushEnabled(false);
      }
    } else {
      // Deshabilitar notificaciones y eliminar el token
      await removeUserExpoPushToken();
    }
  };

  // Función para registrar y obtener el Expo Push Token
  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      Alert.alert("Error", "Debe usar un dispositivo físico.");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert("Error", "Permisos de notificación denegados.");
      return null;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        Alert.alert(
          "Error",
          "No se pudieron dar permisos para las notificaciones push."
        );
      }
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId
            ? projectId
            : "7b771362-c331-49ce-94fd-f43d171a309e",
        })
      ).data;
      return pushTokenString;
    } catch (error) {
      console.error("Error obteniendo el Expo Push Token:", error);
      return null;
    }
  };

  // Función para actualizar el Expo Push Token en el backend
  const updateUserExpoPushToken = async (token: string) => {
    try {
      await updateUser(user.userId, { expoPushToken: token });
      Alert.alert(
        "Notificaciones Habilitadas",
        "Las notificaciones se han habilitado."
      );
    } catch (error) {
      console.error("Error actualizando el token de usuario:", error);
      Alert.alert("Error", "No se pudo actualizar el token de usuario.");
    }
  };

  // Función para eliminar el Expo Push Token del usuario
  const removeUserExpoPushToken = async () => {
    try {
      await updateUser(user.userId, { expoPushToken: null });
      Alert.alert(
        "Notificaciones Deshabilitadas",
        "Las notificaciones se han deshabilitado."
      );
    } catch (error) {
      console.error("Error eliminando el token de usuario:", error);
      Alert.alert("Error", "No se pudo eliminar el token de usuario.");
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Función para cerrar sesión
  const handleLogout = async () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Confirmar",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
        style: "destructive",
      },
    ]);
  };

  // Función para eliminar cuenta
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Confirma la eliminación",
      "¿Estás seguro de que deseas eliminar tu cuenta?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          onPress: async () => {
            try {
              if (user && user.userId) {
                await deleteAccount();
                await deleteUser(user.userId);
                Alert.alert(
                  "Cuenta Eliminada",
                  "Tu cuenta ha sido eliminada correctamente."
                );
              }

              router.replace("/login");
            } catch (error) {
              console.error("Error eliminando la cuenta:", error);
              Alert.alert(
                "Error",
                "No se pudo eliminar la cuenta. Inténtalo de nuevo."
              );
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleProfilePhoto = () => {
    if (user.properties?.profilePhoto) {
      return user.properties.profilePhoto;
    } else {
      return "https://ik.imagekit.io/6cx9tc1kx/Imagenes%20App%20Prueba/defaultprofile.png?updatedAt=1727898583399";
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {user && (
        <View style={styles.menuContainer}>
          {/* Header del menú */}
          <View style={styles.menuHeader}>
            <Image
              source={{
                uri: handleProfilePhoto(),
              }}
              style={styles.avatar}
            />
            <Text style={styles.userName}>{user.properties?.fullName}</Text>
          </View>

          {/* Menú de opciones */}
          <View style={styles.menuItems}>
            {/* Toggle para notificaciones */}
            {/* <View style={styles.menuItemToggle}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="notifications" size={24} color="white" />
                <Text style={styles.menuItemText}>Notificaciones Push</Text>
              </View>
              <Switch
                value={isPushEnabled}
                onValueChange={handleToggleChange}
                trackColor={{ false: "#767577", true: "#81b0ff" }}
                thumbColor={isPushEnabled ? "#f5dd4b" : "#f4f3f4"}
              />
            </View> */}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                router.push("/menu/components/myevents");
              }}
            >
              <Ionicons name="calendar" size={24} color="white" />
              <Text style={styles.menuItemText}>Mis Eventos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                router.push("/menu/components/mycertificates");
              }}
            >
              <Ionicons name="ribbon" size={24} color="white" />
              <Text style={styles.menuItemText}>Mis Certificados</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                router.push("/menu/components/editprofile");
              }}
            >
              <Ionicons name="person" size={24} color="white" />
              <Text style={styles.menuItemText}>Editar Perfil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                router.push("/menu/components/support");
              }}
            >
              <Ionicons name="help-circle" size={24} color="white" />
              <Text style={styles.menuItemText}>Soporte</Text>
            </TouchableOpacity>

            {/* Botón para eliminar cuenta */}
            {/* <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash" size={24} color="white" />
              <Text style={styles.menuItemText}>Eliminar Cuenta</Text>
            </TouchableOpacity> */}

            {/* Botón de cerrar sesión */}
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out" size={24} color="white" />
              <Text style={styles.menuItemText}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  menuContainer: {
    flex: 1,
    backgroundColor: "#00BCD4",
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  menuHeader: {
    backgroundColor: "white",
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 10,
  },
  userName: {
    color: "black",
    fontSize: 18,
    fontWeight: "bold",
  },
  menuItems: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff30",
  },
  menuItemToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff30",
    justifyContent: "space-between",
  },
  menuItemText: {
    color: "white",
    fontSize: 16,
    marginLeft: 15,
  },
});
