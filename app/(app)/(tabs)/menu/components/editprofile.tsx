import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { searchMembers, updateMember } from "@/services/api/memberService";
import { ActivityIndicator } from "react-native-paper";

export default function EditProfileScreen() {
  const { userId } = useAuth();
  const [memberId, setMemberId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const filters = { userId };
      const response = await searchMembers(filters);
      if (response.status === "success") {
        setMemberId(response.data.items[0]._id);
        setFullName(response.data.items[0].properties.fullName);
        setEmail(response.data.items[0].properties.email);
        setSpecialty(response.data.items[0].properties.specialty);
        setIdNumber(response.data.items[0].properties.idNumber);
        setPhone(response.data.items[0].properties.phone);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const handleUpdateProfile = async () => {
    if (fullName && email && specialty && idNumber && phone) {
      if (memberId) {
        try {
          const userData = {
            properties: {
              fullName,
              email,
              specialty,
              idNumber,
              phone,
            }
          }
          const response = await updateMember(memberId, userData)
          if (response.status === "success") {
            Alert.alert("Perfil actualizado", "Los datos del perfil se han actualizado correctamente.");
          } else {
            Alert.alert("Error", "No se pudo actualizar el perfil.");
          }
        } catch (error) {
          console.error("Error updating user data:", error);
          Alert.alert("Error", "No se pudo actualizar el perfil.");
        }
      } else {
        Alert.alert("Error", "No se pudo obtener el ID del usuario.");
      }
    } else {
      Alert.alert("Error", "Todos los campos son obligatorios.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Cargando datos del perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Nombre Completo"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Especialidad"
          value={specialty}
          onChangeText={setSpecialty}
        />
        <TextInput
          style={styles.input}
          placeholder="Documento Identidad"
          value={idNumber}
          onChangeText={setIdNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateProfile}
        >
          <Text style={styles.buttonText}>Actualizar Perfil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  updateButton: {
    backgroundColor: "#00BCD4",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
