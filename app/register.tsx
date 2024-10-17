import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  Button,
} from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  InterfaceOrganization,
  fetchOrganizationById,
} from "@/services/api/organizationService";
import { useOrganization } from "@/context/OrganizationContext";
import { createUser } from "@/services/api/userService";
import { createMember } from "@/services/api/memberService";

export default function RegisterScreen() {
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [organizationData, setOrganizationData] =
    useState<InterfaceOrganization>();
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const { signUp, uid, setUserId, authError } = useAuth();
  const { organization } = useOrganization();

  const fetchOrganization = async () => {
    try {
      const response = await fetchOrganizationById(organization._id);
      setOrganizationData(response.data);
    } catch (error) {
      console.error("Error fetching organization:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const handleInputChange = (name: any, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async () => {
    const { propertiesDefinition } = organizationData || {};
    const { email, password } = formData;

    // Verificar que todos los campos obligatorios estén completos
    const requiredFields =
      propertiesDefinition?.filter((field) => field.required) || [];
    const isValid = requiredFields.every(
      (field) => formData[field.fieldName] && formData[field.fieldName] !== ""
    );

    if (!isValid) {
      Alert.alert(
        "Error",
        "Todos los campos obligatorios deben ser completados."
      );
      return;
    }

    setIsRegistering(true);

    try {
      // Llamar a signUp y esperar a que sea exitoso
      const success = await signUp(email, password);
      if (!success || !success.status) {
        Alert.alert("Error", authError || "Error al registrar el usuario.");
        setIsRegistering(false);
        return;
      }

      if (!success.uid) {
        Alert.alert("Error", "Hubo un error intenta nuevamente.");
        setIsRegistering(false);
        return;
      }

      // Registrar usuario en el backend
      const response = await createUser({ firebaseUid: success.uid });
      const userCreated = response.data;
      setUserId(userCreated._id);

      // Crear miembro con la información de la organización
      await createMember({
        userId: userCreated._id,
        organizationId: organization._id,
        properties: formData,
      });

      Alert.alert("Registro Exitoso", "Usuario registrado correctamente.", [
        {
          text: "OK",
          onPress: () => router.push("/(app)"),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", authError || "Error al registrar el usuario.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Cargando póster...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Crear una Cuenta</Text>

      {organizationData?.propertiesDefinition.map((field) => {
        if (field.fieldName === "specialty" && field.type === "list") {
          return Platform.OS === "ios" ? (
            <View key={field.fieldName}>
              <TouchableOpacity
                onPress={() => setShowPicker(true)}
                style={styles.pickerButton}
              >
                <Text>
                  {formData[field.fieldName] || "Seleccione una especialidad"}
                </Text>
              </TouchableOpacity>
              <Modal visible={showPicker} animationType="slide" transparent>
                <View style={styles.modalContainer}>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData[field.fieldName] || ""}
                      onValueChange={(value) => {
                        handleInputChange(field.fieldName, value);
                        setShowPicker(false);
                      }}
                    >
                      <Picker.Item
                        label="Seleccione una especialidad"
                        value=""
                      />
                      {field.options.map((option: string, index: number) => (
                        <Picker.Item
                          key={index}
                          label={option}
                          value={option}
                        />
                      ))}
                    </Picker>
                    <Button
                      title="Cerrar"
                      onPress={() => setShowPicker(false)}
                    />
                  </View>
                </View>
              </Modal>
            </View>
          ) : (
            <View
              key={field.fieldName}
              style={{
                borderWidth: 1,
                borderRadius: 10,
                height: 50,
                marginBottom: 15,
                borderColor: "#ccc",
              }}
            >
              <Picker
                dropdownIconColor={"#00BCD4"}
                selectedValue={formData[field.fieldName] || ""}
                onValueChange={(value) =>
                  handleInputChange(field.fieldName, value)
                }
              >
                <Picker.Item label="Seleccione una especialidad" value="" />
                {field.options.map((option: string, index: number) => (
                  <Picker.Item key={index} label={option} value={option} />
                ))}
              </Picker>
            </View>
          );
        }

        return (
          <TextInput
            key={field.fieldName}
            style={styles.input}
            placeholder={field.label}
            placeholderTextColor="#888"
            secureTextEntry={field.type === "password"}
            keyboardType={field.type === "email" ? "email-address" : "default"}
            value={formData[field.fieldName] || ""}
            onChangeText={(value) => handleInputChange(field.fieldName, value)}
          />
        );
      })}

      <TouchableOpacity
        style={styles.registerButton}
        onPress={handleRegister}
        disabled={isRegistering}
      >
        {isRegistering ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Registrarme</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/login")}>
        <Text style={styles.linkText}>Ya tengo una cuenta. Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: "#00BCD4",
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  linkText: {
    color: "#00BCD4",
    textAlign: "center",
    fontWeight: "bold",
  },
  pickerButton: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    justifyContent: "center",
    marginBottom: 15,
    backgroundColor: "#f5f5f5",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
