import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
  Alert,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  ActivityIndicator,
  IconButton,
  Portal,
  Modal,
} from "react-native-paper";
import {
  createAttendee,
  deleteAttendee,
  searchAttendees,
} from "@/services/api/attendeeService";
import { fetchEventById } from "@/services/api/eventService";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";
import LinkifyText from "@/app/utils/LinkifyText";

// --- Tipos ---

interface Event {
  price: any;
  _id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  styles: { eventImage: string };
  eventSections: {
    agenda: boolean;
    speakers: boolean;
    documents: boolean;
    ubication: boolean;
    certificate: boolean;
    posters: boolean;
  };
  isExternalRegistration: boolean;
  externalRegistrationUrl: string;
}

// --- Constantes ---

const SECTIONS_MAP = [
  { key: "agenda", label: "Agenda", route: "program" },
  { key: "speakers", label: "Conferencistas", route: "speakers" },
  { key: "documents", label: "Documentos", route: "documents" },
  { key: "ubication", label: "Ubicación", route: "venue" },
  { key: "certificate", label: "Certificados", route: "certificates" },
  { key: "posters", label: "Posters", route: "posterslist" },
] as const;

const SECTION_ICONS: Record<string, string> = {
  agenda: "calendar",
  speakers: "account-group",
  documents: "file-document",
  ubication: "map-marker",
  certificate: "certificate",
  posters: "image",
};

// --- Utilidades ---

const formatDate = (
  startDate: string | number | Date | dayjs.Dayjs | null | undefined,
  endDate: string | number | Date | dayjs.Dayjs | null | undefined,
): string => {
  if (!startDate || !endDate) return "";
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return start.isSame(end, "day")
    ? start.format("DD MMMM YYYY")
    : `${start.format("DD MMM")} - ${end.format("DD MMM YYYY")}`;
};

const formatDateForCalendar = (timestamp: number): string =>
  new Date(timestamp).toISOString().replace(/[-:]|\.\d{3}/g, "");

// --- Componente ---

export default function EventDetail({ tab }: { tab: string }) {
  const { eventId, isMemberActive, memberId } = useLocalSearchParams();
  const { userId } = useAuth();
  const { width } = useWindowDimensions();

  const [showImageModal, setShowImageModal] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [attendee, setAttendee] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showUnregisterModal, setShowUnregisterModal] = useState(false);

  const fetchAttendeeData = useCallback(
    async (targetEventId: any) => {
      const response = await searchAttendees({ userId, eventId: targetEventId });
      if (
        response.status === "success" &&
        targetEventId === response.data.items[0].eventId._id
      ) {
        setAttendee(response.data.items[0]);
        setIsRegistered(true);
      } else {
        setAttendee(null);
        setIsRegistered(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    const loadEvent = async () => {
      setLoading(true);
      const response = await fetchEventById(eventId);
      if (response.status === "success") {
        setEvent(response.data);
        fetchAttendeeData(response.data._id);
      }
      setLoading(false);
    };
    loadEvent();
  }, [eventId, userId, fetchAttendeeData]);

  const handleRegister = async () => {
    setIsLoading(true);

    if (isMemberActive === "false" && !event?.isExternalRegistration) {
      setShowModal(true);
      setIsLoading(false);
      return;
    }

    if (
      event?.isExternalRegistration &&
      event?.externalRegistrationUrl &&
      isMemberActive === "false"
    ) {
      try {
        const supported = await Linking.canOpenURL(event.externalRegistrationUrl);
        if (supported) await Linking.openURL(event.externalRegistrationUrl);
        else Alert.alert("Error", "No se pudo abrir el enlace de inscripción.");
      } catch (error) {
        console.error("Error al abrir el enlace externo:", error);
        Alert.alert("Error", "Ocurrió un problema al intentar abrir el enlace.");
      }
      setIsLoading(false);
      return;
    }

    try {
      await createAttendee({ userId, eventId: event?._id, memberId, attended: false });
      setIsRegistered(true);
      fetchAttendeeData(event?._id);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error registering attendee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmUnregister = async () => {
    setIsLoading(true);
    setShowUnregisterModal(false);
    try {
      await deleteAttendee(attendee._id);
      setIsRegistered(false);
      fetchAttendeeData(event?._id);
    } catch (error) {
      console.error("Error unregistering attendee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!event?.startDate || !event?.endDate) {
      alert("Fechas no disponibles para este evento.");
      return;
    }

    const title = encodeURIComponent(event.name || "Evento");
    const description = encodeURIComponent(event.description || "");
    const startTs = new Date(event.startDate).getTime();
    const endTs = new Date(event.endDate).getTime();

    if (Platform.OS === "android") {
      const url = `http://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&dates=${formatDateForCalendar(startTs)}/${formatDateForCalendar(endTs)}`;
      Linking.openURL(url).catch(() =>
        alert("No se pudo abrir Google Calendar. Asegúrate de tener una aplicación de calendario instalada."),
      );
    } else if (Platform.OS === "ios") {
      Linking.openURL(`calshow:${startTs / 1000}`).catch(() =>
        alert("No se pudo abrir el calendario."),
      );
    } else {
      alert("Esta funcionalidad no es compatible con tu dispositivo.");
    }
  };

  // --- Estados de carga ---

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" color="#004D73" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: "#B22222", fontSize: 18 }}>
          No se encontró el evento.
        </Text>
      </View>
    );
  }

  // --- Cálculos de layout para secciones ---

  const availableSections = SECTIONS_MAP.filter((s) =>
    Boolean((event.eventSections as any)?.[s.key]),
  );
  const sectionCount = availableSections.length;
  const gutter = 3;
  const contentPadding = 32;
  const baseItemWidth = Math.floor((width - contentPadding - gutter * 2) / 3);
  const iconSize = Math.max(18, Math.floor(baseItemWidth * 0.28));
  const iconBubbleSize = Math.max(30, Math.floor(baseItemWidth * 0.45));
  const titleFontSize = width < 360 ? 18 : width < 420 ? 22 : 26;
  const sectionTitleFontSize = width < 360 ? 14 : 15;

  const visibleSections =
    sectionCount <= 3
      ? availableSections
      : [
          ...availableSections.slice(0, 2),
          { key: "more", label: "Más", isMore: true } as any,
        ];
  const remainingSections = availableSections.slice(2);

  // --- Render ---

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.imageContainer}
        activeOpacity={0.9}
        onPress={() => setShowImageModal(true)}
      >
        <Image source={{ uri: event.styles.eventImage }} style={styles.eventImage} />
      </TouchableOpacity>

      <View style={styles.topRightButton}>
        <IconButton
          icon="calendar"
          size={26}
          iconColor="#ffffff"
          onPress={handleAddToCalendar}
          accessibilityLabel="Agregar al calendario"
        />
      </View>

      <View style={styles.infoPanel}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
          <View style={styles.infoContent}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { fontSize: titleFontSize }]}>
                {event.name}
              </Text>
              <View style={styles.headerButtonWrap}>
                {tab === "(index)" &&
                  (isRegistered ? (
                    <Button
                      mode="contained"
                      onPress={() => setShowUnregisterModal(true)}
                      loading={isLoading}
                      disabled={isLoading}
                      style={styles.unregisterButton}
                      labelStyle={{ color: "#fff" }}
                    >
                      Cancelar
                    </Button>
                  ) : (
                    <Button
                      mode="contained"
                      onPress={handleRegister}
                      loading={isLoading}
                      disabled={isLoading}
                      style={styles.registerButton}
                      labelStyle={{ color: "#3F5216", fontSize: 12 }}
                    >
                      {event.isExternalRegistration && isMemberActive === "false"
                        ? "Pre inscribirme."
                        : "Inscribirme"}
                    </Button>
                  ))}
              </View>
            </View>

            <Text style={styles.eventDate}>
              {formatDate(event.startDate, event.endDate)}
            </Text>

            <View
              style={[
                styles.sectionsGrid,
                { justifyContent: sectionCount <= 2 ? "center" : "space-between" },
              ]}
            >
              {visibleSections.map((s) => (
                <View
                  key={s.key}
                  style={[
                    styles.sectionCell,
                    {
                      width: baseItemWidth,
                      marginHorizontal: sectionCount <= 2 ? gutter / 2 : 0,
                    },
                  ]}
                >
                  <View style={{ alignItems: "center" }}>
                    <View
                      style={[
                        styles.sectionIcon,
                        {
                          width: iconBubbleSize,
                          height: iconBubbleSize,
                          borderRadius: iconBubbleSize / 2,
                        },
                      ]}
                    >
                      <IconButton
                        icon={s.isMore ? "dots-horizontal" : (SECTION_ICONS[s.key] ?? "information")}
                        size={iconSize}
                        iconColor="#ffffff"
                        onPress={() =>
                          s.isMore
                            ? setShowSectionsModal(true)
                            : router.push(
                                `/${tab}/components/${s.route}?eventId=${event._id}&tab=${tab}` as any,
                              )
                        }
                      />
                    </View>
                    <Text style={[styles.sectionTitleSmall, { fontSize: sectionTitleFontSize }]}>
                      {s.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.descriptionContainer}>
              <LinkifyText description={event.description} styles={styles.description} />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Modal: Imagen ampliada */}
      <Portal>
        <Modal
          visible={showImageModal}
          onDismiss={() => setShowImageModal(false)}
          contentContainerStyle={styles.imageModalContainer}
        >
          <View style={styles.imageModalInner}>
            {event.styles.eventImage && (
              <Image
                source={{ uri: event.styles.eventImage }}
                style={styles.imageModalImage}
                resizeMode="contain"
              />
            )}
            <IconButton
              icon="close"
              size={28}
              onPress={() => setShowImageModal(false)}
              style={styles.imageModalCloseButton}
              iconColor="#fff"
            />
          </View>
        </Modal>
      </Portal>

      {/* Modal: Inscripción para no miembros */}
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>Inscripción a evento: {event.name}</Text>
          <Text style={styles.modalText}>Valor miembros: Gratuito</Text>
          <Text style={styles.modalText}>
            No miembros: $ {event.price?.toLocaleString("es-ES")}
          </Text>
          <Text
            style={[styles.modalLink, { color: "blue" }]}
            onPress={() => Linking.openURL("https://acho.com.co/como-ser-miembro-acho/")}
          >
            ¿Cómo ser miembro de la ACHO?
          </Text>
          <Button
            mode="contained"
            onPress={() => Linking.openURL("https://zonapagos.com/t_acho")}
            style={{ marginBottom: 5 }}
          >
            Pagar
          </Button>
          <Button mode="outlined" onPress={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal>
      </Portal>

      {/* Modal: Inscripción exitosa */}
      <Portal>
        <Modal
          visible={showSuccessModal}
          onDismiss={() => setShowSuccessModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>🎉 ¡Inscripción exitosa! 🎉</Text>
          <Text style={styles.modalText}>
            Te esperamos el día del evento: {formatDate(event.startDate, event.endDate)}
          </Text>
          <Text style={styles.modalText}>Recuerda agregarlo a tu calendario.</Text>
          <Button mode="contained" onPress={() => setShowSuccessModal(false)}>
            ¡Entendido!
          </Button>
        </Modal>
      </Portal>

      {/* Modal: Confirmar cancelación */}
      <Portal>
        <Modal
          visible={showUnregisterModal}
          onDismiss={() => setShowUnregisterModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>❌ Cancelar inscripción</Text>
          <Text style={styles.modalText}>
            ¿Estás seguro de que deseas cancelar tu inscripción en el evento{" "}
            <Text style={{ fontWeight: "bold" }}>{event.name}</Text>?
          </Text>
          <Button
            mode="contained"
            onPress={handleConfirmUnregister}
            loading={isLoading}
            disabled={isLoading}
            style={{ marginBottom: 10 }}
          >
            Sí, cancelar inscripción
          </Button>
          <Button mode="outlined" onPress={() => setShowUnregisterModal(false)}>
            No, mantener inscripción
          </Button>
        </Modal>
      </Portal>

      {/* Modal: Secciones adicionales */}
      <Portal>
        <Modal
          visible={showSectionsModal}
          onDismiss={() => setShowSectionsModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>Secciones</Text>
          {remainingSections.map((s: any) => (
            <Button
              key={s.key}
              mode="contained"
              onPress={() => {
                setShowSectionsModal(false);
                router.push(
                  `/${tab}/components/${s.route}?eventId=${event._id}&tab=${tab}` as any,
                );
              }}
              style={{ marginBottom: 8 }}
            >
              {s.label}
            </Button>
          ))}
          <Button mode="outlined" onPress={() => setShowSectionsModal(false)}>
            Cerrar
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

// --- Estilos ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  imageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  eventImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  topRightButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 40,
    backgroundColor: "rgba(2, 5, 2, 0.7)",
    borderRadius: 24,
    overflow: "hidden",
  },
  infoPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scrollView: {
    flexGrow: 1,
    maxHeight: 450,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  infoContent: {
    padding: 8,
    margin: 5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
    flex: 1,
    textTransform: "uppercase",
  },
  headerButtonWrap: {
    maxWidth: 150,
  },
  eventDate: {
    fontSize: 20,
    color: "#ffffff",
    marginBottom: 10,
  },
  sectionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  sectionCell: {
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  sectionTitleSmall: {
    fontSize: 12,
    color: "#ffffff",
    marginBottom: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionIcon: {
    backgroundColor: "rgba(60, 255, 0, 0.1)",
    borderRadius: 40,
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 20,
  },
  registerButton: {
    backgroundColor: "#5DA95A",
    padding: 4,
    marginRight: 8,
  },
  unregisterButton: {
    backgroundColor: "#B85A5A",
    padding: 4,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  modalLink: {
    textAlign: "center",
    marginBottom: 10,
    textDecorationLine: "underline",
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  imageModalInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalImage: {
    width: "100%",
    height: "100%",
  },
  imageModalCloseButton: {
    position: "absolute",
    top: 40,
    right: 12,
    zIndex: 100,
    elevation: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
});
