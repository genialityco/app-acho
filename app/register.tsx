import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ImageBackground,
  KeyboardAvoidingView,
} from "react-native";
import { ActivityIndicator, Button, TextInput, Checkbox } from "react-native-paper";
import RNPickerSelect from "react-native-picker-select";
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
import Icon from "react-native-vector-icons/MaterialIcons";

export default function RegisterScreen() {
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [organizationData, setOrganizationData] =
    useState<InterfaceOrganization>();
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { signUp, authError, uid } = useAuth();
  const { organization } = useOrganization();

  useEffect(() => {
    fetchOrganization();
  }, []);

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

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    setFieldErrors({ ...fieldErrors, [name]: false });
  };

  const handleRegister = async () => {
    const { propertiesDefinition } = organizationData || {};

    // Validar solo los campos dinámicos que son requeridos según propertiesDefinition
    const requiredFields =
      propertiesDefinition?.filter((field) => field.required && field.show) || [];
    
    const missingFields = requiredFields.filter((field) => {
      const fieldValue = formData[field.fieldName];
      
      // Validación para checkboxes: deben estar checkeados (valor "true")
      if (field.type === "checkbox") {
        return fieldValue !== "true";
      }
      
      // Validación para otros campos: no pueden estar vacíos o null
      return !fieldValue || String(fieldValue).trim() === "";
    });

    // Resaltar campos faltantes y mostrar alerta
    if (missingFields.length > 0) {
      const missingFieldNames = missingFields
        .map((field) => field.label)
        .join(", ");
      
      // Actualizar estado de errores
      const errorMap = missingFields.reduce((acc, field) => {
        acc[field.fieldName] = true;
        return acc;
      }, {} as { [key: string]: boolean });
      
      setFieldErrors(errorMap);
      
      Alert.alert(
        "Error de Validación",
        `Los siguientes campos son obligatorios:\n\n${missingFieldNames}`
      );
      return;
    }
    
    // Limpiar errores si la validación pasó
    setFieldErrors({});

    setIsRegistering(true);

    try {
      const setDataTreatmentConsent = {...formData, dataTreatmentConsent: formData["dataTreatmentConsent"] == "true"}
      
      // Obtener email del formulario
      const email = formData["email"];
      
      // Si existe el campo idNumber, usarlo como contraseña, si no usar el campo password
      const idNumberField = propertiesDefinition?.find((field) => field.fieldName === "idNumber");
      const password = idNumberField ? formData["idNumber"] : formData["password"];
      
      // Validar que email y password existan
      if (!email || email.trim() === "") {
        Alert.alert("Error", "El email es requerido para registrarse");
        setIsRegistering(false);
        return;
      }
      
      if (!password || password.trim() === "") {
        const fieldLabel = idNumberField ? idNumberField.label : "contraseña";
        Alert.alert("Error", `${fieldLabel} es requerido para registrarse`);
        setIsRegistering(false);
        return;
      }

      console.log("Intentando registrar con:", { email, organizationId: organization._id });
      
      const success = await signUp(email, password, organization._id, setDataTreatmentConsent);

      if (success) {
        Alert.alert("Registro Exitoso", "Usuario registrado correctamente.", [
          { text: "OK", onPress: () => router.push("/(app)/(tabs)/home") },
        ]);
      }
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("Error", authError || "Error al registrar el usuario.");
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text>Cargando formulario de registro...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/APP_ACHO_SLIDER_01.png")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          <Text style={styles.headerText}>Crear una Cuenta</Text>

          {organizationData?.propertiesDefinition
            .filter((field) => field.show)
            .map((field) => {
              const isFieldRequired = field.required;
              const fieldError = fieldErrors[field.fieldName];

              // Nuevo: Renderizar campo tipo checkbox
              if (field.type === "checkbox") {
                return (
                  <View
                    key={field.fieldName}
                    style={[
                      { flexDirection: "row", alignItems: "center", marginBottom: 15 },
                      fieldError && { 
                        borderWidth: 2, 
                        borderColor: "#ff3333", 
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: "#ffe6e6"
                      }
                    ]}
                  >
                    <Checkbox
                      status={formData[field.fieldName] ? "checked" : "unchecked"}
                      onPress={() =>
                        handleInputChange(
                          field.fieldName,
                          formData[field.fieldName] ? "" : "true"
                        )
                      }
                    />
                    <Text>
                      {field.label}
                      {isFieldRequired && <Text style={styles.asterisk}>*</Text>}
                    </Text>
                    {fieldError && (
                      <Text style={{ color: "#ff3333", fontSize: 12, marginLeft: "auto" }}>
                        Requerido
                      </Text>
                    )}
                  </View>
                );
              }

              if (field.fieldName === "specialty" && field.type === "list") {
                return Platform.OS === "ios" ? (
                  <View key={field.fieldName}>
                    <TouchableOpacity
                      onPress={() => setShowPicker(true)}
                      style={[
                        styles.pickerButton,
                        fieldError && { 
                          borderColor: "#ff3333", 
                          borderWidth: 2,
                          backgroundColor: "#ffe6e6"
                        }
                      ]}
                    >
                      <Text>
                        {formData[field.fieldName] ||
                          "Seleccione una especialidad"}
                        {isFieldRequired && (
                          <Text style={styles.asterisk}>*</Text>
                        )}
                      </Text>
                    </TouchableOpacity>
                    {fieldError && (
                      <Text style={{ color: "#ff3333", fontSize: 12, marginBottom: 10 }}>
                        Este campo es obligatorio
                      </Text>
                    )}

                    <Modal
                      visible={showPicker}
                      animationType="slide"
                      transparent
                    >
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
                            {field.options.map(
                              (option: string, index: number) => (
                                <Picker.Item
                                  key={index}
                                  label={option}
                                  value={option}
                                />
                              )
                            )}
                          </Picker>
                          <Button onPress={() => setShowPicker(false)}>
                            Cerrar
                          </Button>
                        </View>
                      </View>
                    </Modal>
                  </View>
                ) : (
                  <View key={field.fieldName}>
                    <RNPickerSelect
                      onValueChange={(value) =>
                        handleInputChange(field.fieldName, value)
                      }
                      items={field.options.map((option: string) => ({
                        label: option,
                        value: option,
                      }))}
                      placeholder={{
                        label: "Seleccione una especialidad",
                        value: "",
                      }}
                      value={formData[field.fieldName]}
                      style={{
                        ...pickerSelectStyles,
                        inputAndroid: [
                          pickerSelectStyles.inputAndroid,
                          fieldError && {
                            borderColor: "#ff3333",
                            borderWidth: 2,
                            backgroundColor: "#ffe6e6"
                          }
                        ],
                        inputIOS: [
                          pickerSelectStyles.inputIOS,
                          fieldError && {
                            borderColor: "#ff3333",
                            borderWidth: 2,
                            backgroundColor: "#ffe6e6"
                          }
                        ]
                      }}
                    />
                    {fieldError && (
                      <Text style={{ color: "#ff3333", fontSize: 12, marginBottom: 10 }}>
                        Este campo es obligatorio
                      </Text>
                    )}
                  </View>
                );
              }

              // Renderizar campo de contraseña con visibilidad de contraseña
              if (field.type === "password") {
                return (
                  <TextInput
                    key={field.fieldName}
                    label={field.label}
                    mode="outlined"
                    secureTextEntry={!isPasswordVisible}
                    value={formData[field.fieldName] || ""}
                    onChangeText={(value) =>
                      handleInputChange(field.fieldName, value)
                    }
                    style={styles.input}
                    error={fieldError}
                    right={
                      <TextInput.Icon
                        icon={() => (
                          <Icon
                            name={
                              isPasswordVisible
                                ? "visibility"
                                : "visibility-off"
                            }
                            size={24}
                          />
                        )}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      />
                    }
                  />
                );
              }

              return (
                <View key={field.fieldName}>
                  <TextInput
                    label={field.label}
                    mode="outlined"
                    secureTextEntry={field.type === "password"}
                    keyboardType={
                      field.type === "email" ? "email-address" : "default"
                    }
                    value={formData[field.fieldName] || ""}
                    onChangeText={(value) =>
                      handleInputChange(field.fieldName, value)
                    }
                    style={styles.input}
                    autoCapitalize={field.type === "email" ? "none" : "sentences"}
                    error={fieldError}
                  />
                  {fieldError && (
                    <Text style={{ color: "#ff3333", fontSize: 12, marginBottom: 10 }}>
                      Este campo es obligatorio{isFieldRequired && "*"}
                    </Text>
                  )}
                </View>
              );
            })}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={isRegistering}
            disabled={isRegistering}
            style={styles.registerButton}
          >
            Registrarme
          </Button>

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.linkText}>
              Ya tengo una cuenta. Iniciar Sesión
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  // Estilos existentes, sin cambios
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  registerButton: {
    marginTop: 10,
  },
  linkText: {
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerButton: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
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
  asterisk: {
    color: "red",
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#888",
    marginBottom: 15,
  },
  inputAndroid: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 8,
    color: "#888",
    marginBottom: 15,
  },
});
