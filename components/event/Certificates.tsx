import { CertificateContext, useCertificate } from "@/context/CertificateContext";
//import { searchAttendees } from "@/services/api/attendeeService";
import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  TouchableOpacity,
} from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import WebView from "react-native-webview";

type CertificatesParams = {
  params: {
  eventId: string;
  userId: string;
  }
}

export default function Certificates() {
  // URL dinámica del certificado
  const route = useRoute<RouteProp<CertificatesParams, "params">>();
  const { eventId, userId } = route.params;
  const url = `https://gen-certificados.netlify.app/certificate/${eventId}/${userId}`;
  const [certificate, setCertificate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { certificates, currentCertificate, setCurrentCertificate } = useContext(CertificateContext);

  const fetchUserCertificate = () => {
    try {
      setLoading(true);
      //console.log("Cargando certificado...", certificates);
      //console.log("Buscando certificado para usuario:", userId, "evento:", eventId);
  
  
  
      // Buscar el certificado en el contexto (ya cargado previamente)
      const foundCertificate = certificates.find(cert => {
        const certEventId = cert.eventId?._id || cert.eventId;
        console.log("Comparando certificado:", cert._id, "eventoId:", certEventId, "asistió:", cert.attended);
        const match = certEventId === eventId && cert.attended === true;
        
        if (match) {
          console.log("✅ Certificado encontrado en contexto:", cert._id);
        }
        
        return match;
      });
  
      if (foundCertificate) {
        setCertificate(foundCertificate);
        setCurrentCertificate(foundCertificate); // También actualizar el contexto
        console.log(`Certificado cargado: ${foundCertificate.typeAttendee}, ${foundCertificate.certificationHours} horas`);
      } else {
        console.log("❌ No se encontró certificado para este evento");
        setCertificate(null);
        setCurrentCertificate(null);
      }
    } catch (error) {
      console.error("Error al cargar el certificado:", error);
      setCertificate(null);
      setCurrentCertificate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserCertificate();
  }, []);

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
