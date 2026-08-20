import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Linking,
  TouchableOpacity,
} from "react-native";
import { Card, Text, Button, ActivityIndicator, Menu } from "react-native-paper";
import { WebView } from "react-native-webview";
import { useAuth } from "@/context/AuthContext"; 
import { searchAttendees } from "@/services/api/attendeeService";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import Analytics from "@/services/analytics";
import { EVENT_TYPES, getEventTypeLabel } from "@/constants/eventTypes";

interface Certificate {
  id: number;
  title: string;
  date: string;
  eventId: string | { _id: string };
  type: string | null;
}

export default function MyCertificatesScreen() {
  const { userId } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  // "" = todos los tipos
  const [selectedType, setSelectedType] = useState<string>("");
  const [typeMenuVisible, setTypeMenuVisible] = useState(false);

  // Trackear visualización de Mis Certificados
  useFocusEffect(
    React.useCallback(() => {
      Analytics.logViewMyCertificates();
    }, [])
  );

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
            type: attendee.eventId?.type ?? null,
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

  const filteredCertificates = selectedType
    ? certificates.filter((certificate) => certificate.type === selectedType)
    : certificates;

  const selectType = (type: string) => {
    setSelectedType(type);
    setTypeMenuVisible(false);
  };

  const handleViewOrDownload = (certificate: Certificate) => {
    const eventId = typeof certificate.eventId === "object" ? certificate.eventId._id : certificate.eventId;
    const certificateUrl = `https://gen-certificados.netlify.app/certificate/${eventId}/${userId}`;
    
    // Trackear descarga de certificado
    Analytics.logDownloadCertificate(eventId, certificate.title);

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
        <View style={styles.listContainer}>
          {/* Filtro por tipo de evento */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Tipo de eventos:</Text>
            <Menu
              visible={typeMenuVisible}
              onDismiss={() => setTypeMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  icon="menu-down"
                  contentStyle={styles.filterButtonContent}
                  style={styles.filterButton}
                  labelStyle={styles.filterButtonLabel}
                  onPress={() => setTypeMenuVisible(true)}
                >
                  {selectedType ? getEventTypeLabel(selectedType) : "Todos"}
                </Button>
              }
              anchorPosition="bottom"
            >
              <Menu.Item
                title="Todos"
                titleStyle={selectedType === "" ? styles.menuItemSelected : undefined}
                onPress={() => selectType("")}
              />
              {EVENT_TYPES.map((type) => (
                <Menu.Item
                  key={type}
                  title={getEventTypeLabel(type)}
                  titleStyle={selectedType === type ? styles.menuItemSelected : undefined}
                  onPress={() => selectType(type)}
                />
              ))}
            </Menu>
          </View>

          <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {filteredCertificates.length > 0 ? (
            filteredCertificates.map((certificate: Certificate) => (
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
                    {!!certificate.type && (
                      <Text style={styles.certificateType}>
                        {getEventTypeLabel(certificate.type)}
                      </Text>
                    )}
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
              {selectedType
                ? `No hay certificados de tipo ${getEventTypeLabel(selectedType)}.`
                : "No hay certificados disponibles."}
            </Text>
          )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  filterContainer: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  filterButton: {
    alignSelf: "flex-start",
    borderColor: "#00AEEF",
    borderRadius: 8,
  },
  filterButtonContent: {
    flexDirection: "row-reverse",
  },
  filterButtonLabel: {
    color: "#00AEEF",
    fontWeight: "600",
  },
  menuItemSelected: {
    color: "#00AEEF",
    fontWeight: "700",
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
    marginBottom: 4,
  },
  certificateType: {
    fontSize: 13,
    color: "#00AEEF",
    fontWeight: "600",
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
