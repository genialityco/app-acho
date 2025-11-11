import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { searchMembers, updateMember } from "@/services/api/memberService";
import { ActivityIndicator, Button, TextInput, Switch } from "react-native-paper";
import { fetchOrganizationById } from "@/services/api/organizationService";
import { useOrganization } from "@/context/OrganizationContext";
import { Picker } from "@react-native-picker/picker";
import RNPickerSelect from "react-native-picker-select";
import { set } from "firebase/database";
import { deleteUser } from "@/services/api/userService";
import { router } from "expo-router";

export default function EditProfileScreen() {
  const { userId, deleteAccount } = useAuth();
  const { organization } = useOrganization();
  const [memberId, setMemberId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [dataTreatmentConsent, setDataTreatmentConsent] = useState(true)
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    fetchUserData();
    fetchOrganizationSpecialties();
  }, [userId, organization._id]);

  const fetchUserData = async () => {
    try {
      const filters = { userId };
      const response = await searchMembers(filters);
      if (response.status === "success" && response.data.items.length > 0) {
        const userData = response.data.items[0].properties;
        console.log("user data", userData)
        setMemberId(response.data.items[0]._id);
        setFullName(userData.fullName);
        setEmail(userData.email);
        setSpecialty(userData.specialty);
        setIdNumber(userData.idNumber);
        setPhone(userData.phone);
        setDataTreatmentConsent(userData?.dataTreatmentConsent)
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "No se pudo obtener los datos del usuario.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationSpecialties = async () => {
    try {
      const response = await fetchOrganizationById(organization._id);
      if (response.status === "success") {
        const specialtiesDefinition = response.data.propertiesDefinition.find(
          (field: any) =>
            field.fieldName === "specialty" && field.type === "list"
        );
        if (specialtiesDefinition) {
          setSpecialties(specialtiesDefinition.options);
        }
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
      Alert.alert("Error", "No se pudieron cargar las especialidades.");
    }
  };

  const handleUpdateProfile = async () => {
    if (fullName && email && specialty && idNumber && phone) {
      if (memberId) {
        try {
          setSaveLoading(true);
          const userData = {
            properties: {
              fullName,
              email,
              specialty,
              idNumber,
              phone,
              dataTreatmentConsent,
            },
          };
          const response = await updateMember(memberId, userData);
          if (response.status === "success") {
            Alert.alert(
              "Perfil actualizado",
              "Los datos del perfil se han actualizado correctamente."
            );
          } else {
            Alert.alert("Error", "No se pudo actualizar el perfil.");
          }
        } catch (error) {
          console.error("Error updating user data:", error);
          Alert.alert("Error", "No se pudo actualizar el perfil.");
        } finally {
          setSaveLoading(false);
        }
      } else {
        Alert.alert("Error", "No se pudo obtener el ID del usuario.");
      }
    } else {
      Alert.alert("Error", "Todos los campos son obligatorios.");
    }
  };

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
              if (userId) {
                await deleteAccount();
                await deleteUser(userId);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.loadingText}>Cargando datos del perfil...</Text>
      </View>
    );
  }
  const handleOpenLink = () => {
    Linking.openURL("https://acho.com.co/proteccion-de-datos/"); // Cambia por tu URL
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>

          <TextInput
            label="Nombre Completo"
            mode="outlined"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
          />
          <TextInput
            label="Email"
            mode="outlined"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />

          {/* Selector de especialidad */}
          {Platform.OS === "ios" ? (
            <View style={styles.pickerWrapper}>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={styles.pickerButton}
              >
                <Text style={styles.pickerButtonText}>
                  {specialty || "Seleccione una especialidad"}
                </Text>
              </TouchableOpacity>

              <Modal visible={showPicker} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={specialty}
                      onValueChange={(value) => {
                        setSpecialty(value);
                        setShowPicker(false);
                      }}
                      style={styles.picker}
                    >
                      <Picker.Item
                        label="Seleccione una especialidad"
                        value=""
                      />
                      {specialties.map((option, index) => (
                        <Picker.Item
                          key={index}
                          label={option}
                          value={option}
                        />
                      ))}
                    </Picker>
                    <Button onPress={() => setShowPicker(false)}>Cerrar</Button>
                  </View>
                </View>
              </Modal>
            </View>
          ) : (
            <View style={styles.pickerWrapper}>
              <RNPickerSelect
                onValueChange={setSpecialty}
                items={specialties.map((option) => ({
                  label: option,
                  value: option,
                }))}
                placeholder={{
                  label: "Seleccione una especialidad",
                  value: "",
                }}
                value={specialty}
                style={pickerSelectStyles}
              />
            </View>
          )}

          <TextInput
            label="Documento Identidad"
            mode="outlined"
            value={idNumber}
            onChangeText={setIdNumber}
            style={styles.input}
          />
          <TextInput
            label="Teléfono"
            mode="outlined"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
          />

          {/* Switch de Consentimiento de Tratamiento de Datos */}
          <View style={styles.switchContainer}>
      <View style={styles.switchTextContainer}>
        <Text style={styles.switchLabel}>
          Puede solicitar el retiro de su información de acuerdo a lo establecido en la política que la encuentran en la{" "}
          <Text style={styles.link} onPress={handleOpenLink}>
            página web
          </Text>
          .
        </Text>
      </View>
    </View>
          <Button
            mode="contained"
            onPress={handleUpdateProfile}
            style={styles.updateButton}
            disabled={saveLoading}
            loading={saveLoading}
          >
            Actualizar Perfil
          </Button>
          <Button
            buttonColor="red"
            textColor="white"
            icon="delete"
            onPress={handleDeleteAccount}
            style={styles.deleteButton}
          >
            Eliminar Cuenta
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  input: {
    width: "100%",
    marginBottom: 15,
  },
  pickerWrapper: {
    width: "100%",
    marginBottom: 15,
  },
  pickerButton: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    backgroundColor: "#f5f5f5",
    width: "100%",
  },
  pickerButtonText: {
    color: "#666",
  },
  picker: {
    width: "100%",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  switchContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 13,
    color: "#666",
  },
  updateButton: {
    width: "100%",
    paddingVertical: 10,
    marginTop: 10,
  },
  deleteButton: {
    width: "100%",
    paddingVertical: 10,
    marginTop: 30,
  },
  link: {
    color: "#007bff",
    textDecorationLine: "underline",
  },
});

const pickerSelectStyles = {
  inputIOS: {
    width: "100%" as unknown as number,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#888",
    marginBottom: 15,
  },
  inputAndroid: {
    width: "100%" as unknown as number,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#888",
    marginBottom: 15,
  },
  
};