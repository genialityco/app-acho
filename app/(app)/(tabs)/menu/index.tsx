import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Attendee, searchAttendees } from "@/services/api/attendeeService";
import { searchUsers } from "@/services/api/userService";
import { searchMembers } from "@/services/api/memberService";

export default function MenuScreen() {
  const [user, setUser] = useState<Attendee>({} as Attendee);
  const { signOut, uid } = useAuth();
  const router = useRouter();

  const fetchUserProfile = async () => {
    try {
      const filters = { firebaseUid: uid };
      const response = await searchUsers(filters);
      if (response.status === "success") {
        const member = await searchMembers({ userId: response.data.items[0]._id });
        setUser(member.data.items[0]);
      }
    } catch (error) {
      console.error(error);
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
        text: "Cerrar Sesión",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
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
  menuItemText: {
    color: "white",
    fontSize: 16,
    marginLeft: 15,
  },
});
