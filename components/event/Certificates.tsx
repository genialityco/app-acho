import { searchAttendees } from "@/services/api/attendeeService";
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
} from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import WebView from "react-native-webview";

interface CertificatesProps {
  eventId: string;
  userId: string;
}

export default function Certificates({ eventId, userId }: CertificatesProps) {
  // URL dinámica del certificado
  const url = `https://gen-certificados.netlify.app/certificate/${eventId}/${userId}`;
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchUserCertificate = async () => {
    try {
      setLoading(true);
      const filters = { userId, eventId, attended: true };
      const response = await searchAttendees(filters);
      if (response?.data?.items?.length > 0) {
        setCertificate(response.data.items[0]);
      }
    } catch (error) {
      console.error("Error al cargar el certificado:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCertificate();
  }, [eventId, userId]);

  // Función para abrir la URL en el navegador externo
  const openInBrowser = async () => {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "No se puede abrir la URL en el navegador");
    }
  };

  if (loading) {
    return (
      <View style={styles.containerNotCertificates}>
        <ActivityIndicator size="large" />
        <Text>Cargando información</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* WebView envuelta en TouchableOpacity para manejar el clic */}
      {certificate && (
        <TouchableOpacity
          style={styles.webviewContainer}
          onPress={openInBrowser}
        >
          <WebView
            source={{ uri: url }}
            style={styles.webview}
            startInLoadingState={true}
            originWhitelist={["*"]}
            scrollEnabled={false}
          />
        </TouchableOpacity>
      )}
      {!certificate && (
        <View style={styles.containerNotCertificates}>
          <Text>No tiene certificados disponibles</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  containerNotCertificates: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
