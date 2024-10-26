import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Card, Text, Button, ActivityIndicator } from "react-native-paper";
import { WebView } from "react-native-webview";
import { useAuth } from "@/context/AuthContext"; // Contexto de autenticación
import { searchAttendees } from "@/services/api/attendeeService";
import Icon from "react-native-vector-icons/MaterialIcons";

interface Certificate {
  id: number;
  title: string;
  date: string;
  eventId: string;
}

export default function MyCertificatesScreen() {
  const { userId } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadCertificates(userId);
    }
  }, [userId]);

  // Función para cargar los certificados del usuario
  const loadCertificates = async (userId: string) => {
    try {
      setLoading(true);
      const filters = { userId, attended: true };
      const attendees = await searchAttendees(filters);

      if (attendees?.data?.items?.length > 0) {
        const userCertificates = attendees.data.items.map(
          (attendee: any, index: number) => ({
            id: index + 1,
            title: `Certificado del Evento: ${attendee.eventId.name}`,
            date: new Date(attendee.createdAt).toLocaleDateString(),
            eventId: attendee.eventId,
          })
        );
        setCertificates(userCertificates);
      }
    } catch (error) {
      console.error("Error al cargar los certificados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrDownload = (certificate: Certificate) => {
    const certificateUrl = `https://gen-certificados.netlify.app/certificate/${certificate.eventId}/${userId}`;
    Linking.openURL(certificateUrl);
  };

  const goBackToList = () => {
    setSelectedCertificate(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00AEEF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {selectedCertificate ? (
        // WebView para mostrar el certificado seleccionado
        <View style={styles.webViewContainer}>
          <Button
            mode="contained-tonal"
            onPress={goBackToList}
            style={styles.backButton}
          >
            Volver a mis certificados
          </Button>
          <TouchableOpacity
            style={styles.webViewTouchable}
            onPress={() => handleViewOrDownload(selectedCertificate)}
          >
            <WebView
              source={{
                uri: `https://gen-certificados.netlify.app/certificate/${selectedCertificate.eventId}/${userId}`,
              }}
              startInLoadingState={true}
              originWhitelist={["*"]}
              style={styles.certificateWebView}
            />
          </TouchableOpacity>
        </View>
      ) : (
        // Mostrar lista de certificados
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {certificates.length > 0 ? (
            certificates.map((certificate: Certificate) => (
              <Card key={certificate.id} style={styles.certificateCard}>
                <View style={styles.row}>
                  {/* Columna izquierda: Icono y fecha */}
                  <View style={styles.leftColumn}>
                    <Icon
                      name="description"
                      size={40}
                      color="#00AEEF"
                      style={styles.certificateIcon}
                    />
                    <Text style={styles.certificateDate}>{certificate.date}</Text>
                  </View>
                  
                  {/* Columna derecha: Título y botón */}
                  <View style={styles.rightColumn}>
                    <Text style={styles.certificateTitle}>
                      {certificate.title}
                    </Text>
                    <Button
                      mode="contained"
                      onPress={() => handleViewOrDownload(certificate)}
                      style={styles.viewButton}
                    >
                      Ver o descargar
                    </Button>
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Text style={styles.noCertificatesText}>
              No hay certificados disponibles.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
  },
  certificateCard: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    elevation: 2,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftColumn: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "30%",
  },
  rightColumn: {
    flexDirection: "column",
    justifyContent: "center",
    width: "65%",
  },
  certificateIcon: {
    marginBottom: 8,
  },
  certificateDate: {
    fontSize: 14,
    color: "#6b6b6b",
    textAlign: "center",
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  viewButton: {
    marginTop: 4,
  },
  webViewContainer: {
    flex: 1,
  },
  backButton: {
    margin: 16,
    alignSelf: "center",
  },
  webViewTouchable: {
    flex: 1,
  },
  certificateWebView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noCertificatesText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 20,
  },
});
