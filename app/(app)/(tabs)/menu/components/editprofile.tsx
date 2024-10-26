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
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { searchMembers, updateMember } from "@/services/api/memberService";
import { ActivityIndicator, Button, TextInput } from "react-native-paper";
import { fetchOrganizationById } from "@/services/api/organizationService";
import { useOrganization } from "@/context/OrganizationContext";
import { Picker } from "@react-native-picker/picker";
import RNPickerSelect from "react-native-picker-select";
import { set } from "firebase/database";

export default function EditProfileScreen() {
  const { userId } = useAuth();
  const { organization } = useOrganization();
  const [memberId, setMemberId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
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
        setMemberId(response.data.items[0]._id);
        setFullName(userData.fullName);
        setEmail(userData.email);
        setSpecialty(userData.specialty);
        setIdNumber(userData.idNumber);
        setPhone(userData.phone);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large"/>
        <Text style={styles.loadingText}>Cargando datos del perfil...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.headerText}>Editar Perfil</Text>

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

          <Button
            mode="contained"
            onPress={handleUpdateProfile}
            style={styles.updateButton}
            disabled={saveLoading}
            loading={saveLoading}
          >
            Actualizar Perfil
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
  updateButton: {
    width: "100%",
    paddingVertical: 10,
    marginTop: 10,
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
