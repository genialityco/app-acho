import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { Button, TextInput as PaperInput } from "react-native-paper";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function LoginScreen() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Estado para visibilidad de contraseña
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Manejar inicio de sesión
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor, completa todos los campos.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Error", "Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setIsLoggingIn(true);
    const success = await signIn(email, password);
    setIsLoggingIn(false);

    if (success) {
      router.push("/(app)");
    }
  };

  // Manejar la recuperación de contraseña
  const handleForgotPassword = async () => {
    if (!resetEmail) {
      Alert.alert("Error", "Por favor, ingresa tu correo electrónico.");
      return;
    }

    try {
      await resetPassword(resetEmail);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error al enviar el correo de restablecimiento:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        source={require("../assets/images/APP_ACHO_SLIDER_01.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View style={styles.card}>
          <Text style={styles.headerText}>Bienvenido a la ACHO</Text>
          <Text style={styles.descriptionText}>
            Si ya te has registrado, por favor continúa iniciando sesión
          </Text>

          <PaperInput
            label="Correo electrónico"
            mode="outlined"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            left={<PaperInput.Icon icon="email" />}
          />

          <PaperInput
            label="Contraseña"
            mode="outlined"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            style={styles.input}
            left={<PaperInput.Icon icon="lock" />}
            right={
              <PaperInput.Icon
                icon={() => (
                  <Icon
                    name={isPasswordVisible ? "visibility" : "visibility-off"}
                    size={24}
                  />
                )}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoggingIn}
            disabled={isLoggingIn}
            style={styles.loginButton}
            contentStyle={styles.buttonContent}
          >
            Iniciar Sesión
          </Button>

          <TouchableOpacity onPress={() => router.push("/register")}>
            <Text style={styles.linkText}>
              ¿No tienes una cuenta? Regístrate
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsModalVisible(true)}>
            <Text style={styles.forgotPasswordText}>Olvidé mi contraseña</Text>
          </TouchableOpacity>
        </View>

        {/* Modal para la recuperación de contraseña */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Recuperar Contraseña</Text>

              <PaperInput
                label="Correo electrónico"
                mode="outlined"
                value={resetEmail}
                onChangeText={setResetEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.inputModal}
                left={<PaperInput.Icon icon="email" />}
              />

              <Button
                mode="contained"
                onPress={handleForgotPassword}
                style={styles.resetButton}
              >
                Enviar Enlace
              </Button>

              <Button
                mode="text"
                onPress={() => setIsModalVisible(false)}
                style={styles.cancelButton}
              >
                Cancelar
              </Button>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginHorizontal: 20,
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
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  loginButton: {
    marginVertical: 10,
  },
  buttonContent: {
    height: 50,
  },
  linkText: {
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
  },
  forgotPasswordText: {
    color: "#007AFF",
    textAlign: "center",
    fontSize: 15,
    marginTop: 15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  resetButton: {
    marginTop: 10,
    width: "100%",
  },
  cancelButton: {
    marginTop: 10,
    width: "100%",
  },
  inputModal: {
    marginBottom: 15,
    width: "100%",
    height: 50,
  },
});
