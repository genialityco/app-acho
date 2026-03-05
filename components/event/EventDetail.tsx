import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  Image,
  StyleSheet,
  ScrollView,
  Platform,
  Linking,
  Alert,
  Clipboard,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
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
//import { logViewEvent, logRegisterEvent } from "@/services/analyticsService";

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    minHeight: 200,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  heroOverlay: {
    backgroundColor: "transparent",
    height: "100%",
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  topRightButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 40,
    backgroundColor: "#E9F1D7",
    borderRadius: 24,
    overflow: "hidden",
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: "#779d2c", // dark green background for content
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleUpper: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
    marginRight: 12,
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroDate: {
    color: "white",
    fontSize: 14,
    marginTop: 6,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  headerButtonWrap: {
    minWidth: 120,
  },
  sectionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  sectionColumn: {
    marginBottom: 12,
  },
  sectionCell: {
    alignItems: "center",
    justifyContent: "center", // Centra el contenido verticalmente
    padding: 8,
    textAlign: "center", // Asegura que el texto esté centrado horizontalmente
  },
  sectionTitleSmall: {
    fontSize: 12,
    color: "#E9F1D7",
    marginBottom: 6,
    fontWeight: "600",
    textAlign: "center", // Centra el texto horizontalmente
  },
  sectionLabelIcon: {
    fontSize: 12,
    color: "#333",
  },
  sectionLabel: {
    color: "#fff",
    marginBottom: 8,
  },
  descriptionContainer: {
    marginTop: 8,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  date: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 20,
  },
  container: {
    flex: 1,
    height: "auto",
    justifyContent: "center",
    alignItems: "center",
    alignContent: "center",
    padding: 16,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    alignContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  buttonWrapper: {
    alignItems: "center",
  },
  label: {
    marginTop: 5,
    fontSize: 15,
    color: "white",
  },
  fixedButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "white",
    padding: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  registerButton: {
    backgroundColor: "#C8DA9A",
    padding: 5,
    marginRight: 15,
  },
  unregisterButton: {
    backgroundColor: "#FF6347",
    padding: 5,
    marginRight: 15,
  },
  calendarButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  sectionIcon: {
    backgroundColor: "#E9F1D7",
    borderRadius: 40,
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
});

interface Event {
  price: any;
  _id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  styles: {
    eventImage: string;
  };
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

export default function EventDetail({ tab }: { tab: string }) {
  const { eventId, isMemberActive, memberId } = useLocalSearchParams();
  const { userId } = useAuth();
  const { width, height } = useWindowDimensions();
  // Prefer 16:9 (1920x1080) aspect ratio based on available width, but cap height to half the screen
  const desiredAspectHeight = Math.round((width * 9) / 16);
  const maxHeroHeight = 600; // máximo razonable para hero
  const heroHeight = Math.round(
    Math.min(desiredAspectHeight, Math.round(height * 0.5), maxHeroHeight),
  );
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

  const getAttendeeData = async (eventId: any) => {
    const filters = { userId, eventId };
    const response = await searchAttendees(filters);
    if (
      response.status === "success" &&
      eventId === response.data.items[0].eventId._id
    ) {
      setAttendee(response.data.items[0]);
      setIsRegistered(true);
    } else {
      setAttendee(null);
      setIsRegistered(false);
    }
  };

  useEffect(() => {
    const eventData = async () => {
      setLoading(true);
      const response = await fetchEventById(eventId);
      if (response.status === "success") {
        setEvent(response.data);
        // logViewEvent(String(response.data._id), response.data.name).catch(
        //   () => {},
        // );
        getAttendeeData(response.data._id);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    eventData();
  }, [eventId, userId]);

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
        const supported = await Linking.canOpenURL(
          event.externalRegistrationUrl,
        );
        if (supported) {
          await Linking.openURL(event.externalRegistrationUrl);
        } else {
          Alert.alert("Error", "No se pudo abrir el enlace de inscripción.");
        }
      } catch (error) {
        console.error("Error al abrir el enlace externo:", error);
        Alert.alert(
          "Error",
          "Ocurrió un problema al intentar abrir el enlace.",
        );
      }
      setIsLoading(false);
      return;
    }

    try {
      const attendeeData = {
        userId,
        eventId: event?._id,
        memberId,
        attended: false,
      };
      await createAttendee(attendeeData);
      setIsRegistered(true);
      // logRegisterEvent(String(event?._id), event?.name ?? "").catch(() => {});

      // Consultar nuevamente los datos de inscripción
      getAttendeeData(event?._id);

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
      getAttendeeData(event?._id);
    } catch (error) {
      console.error("Error unregistering attendee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleUnregister = async () => {
  //   setIsLoading(true);
  //   try {
  //     await deleteAttendee(attendee._id);
  //     setIsRegistered(false);

  //     // Consultar nuevamente los datos de inscripción
  //     getAttendeeData(event?._id);
  //   } catch (error) {
  //     console.error("Error unregistering attendee:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  // const handleCopyUrl = () => {
  //   if (event?.externalRegistrationUrl) {
  //     Clipboard.setString(event.externalRegistrationUrl);
  //     Alert.alert(
  //       "Copiado",
  //       "El enlace de inscripción ha sido copiado al portapapeles.",
  //     );
  //   }
  // };

  // const formatDate = (startDate: string) => {
  //   const start = dayjs(startDate);
  //   const formattedDate = start.format("MMM, DD, YYYY - HH:mm A");
  //   return formattedDate;
  // };

  const formatDate = (
    startDate: string | number | Date | dayjs.Dayjs | null | undefined,
    endDate: string | number | Date | dayjs.Dayjs | null | undefined,
  ) => {
    if (!startDate || !endDate) return "";

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (start.isSame(end, "day")) {
      return start.format("DD MMMM YYYY");
    } else {
      return `${start.format("DD MMM")} - ${end.format("DD MMM YYYY")}`;
    }
  };

  const handleAddToCalendar = async () => {
    if (!event?.startDate || !event?.endDate) {
      alert("Fechas no disponibles para este evento.");
      return;
    }

    const title = encodeURIComponent(event.name || "Evento");
    const description = encodeURIComponent(event.description || "");
    const startDate = new Date(event.startDate).getTime();
    const endDate = new Date(event.endDate).getTime();

    if (Platform.OS === "android") {
      // Usar la URL explícita de Google Calendar
      const url = `http://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&dates=${formatDateForCalendar(
        startDate,
      )}/${formatDateForCalendar(endDate)}`;

      Linking.openURL(url).catch((err) => {
        console.error("Error al abrir el calendario en Android:", err);
        alert(
          "No se pudo abrir Google Calendar. Asegúrate de tener una aplicación de calendario instalada.",
        );
      });
    } else if (Platform.OS === "ios") {
      // URL para iOS usando `calshow`
      const url = `calshow:${startDate / 1000}`;
      Linking.openURL(url).catch((err) => {
        console.error("Error al abrir el calendario en iOS:", err);
        alert("No se pudo abrir el calendario.");
      });
    } else {
      alert("Esta funcionalidad no es compatible con tu dispositivo.");
    }
  };

  // Función para formatear fechas para Google Calendar
  const formatDateForCalendar = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toISOString().replace(/[-:]|\.\d{3}/g, "");
  };

  const openPaymentLink = () => {
    Linking.openURL("https://zonapagos.com/t_acho");
  };

  const openComoSerMiembroLink = () => {
    Linking.openURL("https://acho.com.co/como-ser-miembro-acho/");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Cargando evento...</Text>
      </View>
    );
  }

  // Si no hay evento (posiblemente por error en la consulta)
  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No se encontró el evento.</Text>
      </View>
    );
  }

  // Mostrar el contenido del evento cuando ya está cargado
  const sectionsMap = [
    { key: "agenda", label: "Agenda", route: "program" },
    { key: "speakers", label: "Conferencistas", route: "speakers" },
    { key: "documents", label: "Documentos", route: "documents" },
    { key: "ubication", label: "Ubicación", route: "venue" },
    { key: "certificate", label: "Certificados", route: "certificates" },
    { key: "posters", label: "Posters", route: "posterslist" },
  ];

  const availableSections = sectionsMap.filter((s) =>
    Boolean((event?.eventSections as any)?.[s.key]),
  );

  const sectionCount = availableSections.length;
  let numColumns = sectionCount <= 2 ? sectionCount || 1 : 3;
  const gutter = 12;
  const contentPadding = 16 * 2; // left + right padding from styles.content
  const itemWidth = Math.floor(
    (width - contentPadding - gutter * (numColumns - 1)) / numColumns,
  );
  // Force icon/button sizes to match the 3-column layout regardless of actual columns
  const baseNumColumns = 3;
  const baseItemWidth = Math.floor(
    (width - contentPadding - gutter * (baseNumColumns - 1)) / baseNumColumns,
  );
  const iconSize = Math.max(28, Math.floor(baseItemWidth * 0.35));
  const iconBubbleSize = Math.max(48, Math.floor(baseItemWidth * 0.6));
  const titleFontSize = width < 360 ? 18 : width < 420 ? 22 : 26;
  const sectionTitleFontSize = width < 360 ? 11 : 12;
  const remainingSections = availableSections.slice(2);
  const visibleSections =
    sectionCount <= 3
      ? availableSections
      : [
          ...availableSections.slice(0, 2),
          { key: "more", label: "Más", isMore: true } as any,
        ];

  const getIconName = (key: string) => {
    switch (key) {
      case "agenda":
        return "calendar";
      case "speakers":
        return "account-group";
      case "documents":
        return "file-document";
      case "ubication":
        return "map-marker";
      case "certificate":
        return "certificate";
      case "posters":
        return "image";
      default:
        return "information";
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Hero image header (tocar para ampliar) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => setShowImageModal(true)}
      >
        <ImageBackground
          source={{ uri: event?.styles?.eventImage }}
          style={[styles.hero, { height: heroHeight }]}
          imageStyle={{ resizeMode: "contain", alignSelf: "flex-end" }}
        >
          <View style={styles.heroOverlay}>
            {/* Hero only shows the image now; title and actions moved below */}
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {/* Calendar icon in top-right (global) */}
      <View style={styles.topRightButton}>
        <IconButton
          icon="calendar"
          size={26}
          onPress={handleAddToCalendar}
          accessibilityLabel="Agregar al calendario"
        />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Title + register button (moved below hero) */}
          <View style={styles.headerRow}>
            <Text style={[styles.title, { flex: 1, fontSize: titleFontSize }]}>
              {event?.name}
            </Text>
            <View style={styles.headerButtonWrap}>
              {tab === "(index)" &&
                (!isRegistered ? (
                  <Button
                    mode="contained"
                    onPress={handleRegister}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.registerButton}
                    labelStyle={{ color: "#3F5216" }}
                  >
                    {event.isExternalRegistration && isMemberActive === "false"
                      ? "Pre inscribirme"
                      : "Inscribirme"}
                  </Button>
                ) : (
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
                ))}
            </View>
          </View>

          {/* Sections grid: 3 icon buttons */}
          <View
            style={[
              styles.sectionsGrid,
              {
                justifyContent: sectionCount <= 2 ? "center" : "space-between",
              },
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
                        borderRadius: Math.round(iconBubbleSize / 2),
                      },
                    ]}
                  >
                    {s.isMore ? (
                      <IconButton
                        icon="dots-horizontal"
                        size={iconSize}
                        iconColor="#064e3b"
                        onPress={() => setShowSectionsModal(true)}
                      />
                    ) : (
                      <IconButton
                        icon={getIconName(s.key)}
                        size={iconSize}
                        iconColor="#064e3b"
                        onPress={() =>
                          router.push(
                            `/${tab}/components/${s.route}?eventId=${event?._id}&tab=${tab}` as any,
                          )
                        }
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.sectionTitleSmall,
                      { fontSize: sectionTitleFontSize, textAlign: "center" },
                    ]}
                  >
                    {s.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Descripción */}
          <View style={styles.descriptionContainer}>
            <LinkifyText
              description={event?.description}
              styles={styles.date}
            />
          </View>
        </View>
      </ScrollView>

      {/* bottom calendar button removed as requested */}

      {/* Modals */}
      <Portal>
        <Modal
          visible={showImageModal}
          onDismiss={() => setShowImageModal(false)}
          contentContainerStyle={styles.imageModalContainer}
        >
          <View style={styles.imageModalInner}>
            {event?.styles?.eventImage ? (
              <Image
                source={{ uri: event.styles.eventImage }}
                style={styles.imageModalImage}
                resizeMode="contain"
              />
            ) : null}
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
      <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>
            Inscripción a evento: {event?.name}
          </Text>
          <Text style={styles.modalText}>Valor miembros: Gratuito</Text>
          <Text style={styles.modalText}>
            No miembros: $ {event?.price?.toLocaleString("es-ES")}
          </Text>
          <Text
            style={[styles.modalLink, { color: "blue" }]}
            onPress={openComoSerMiembroLink}
          >
            ¿Cómo ser miembro de la ACHO?
          </Text>
          <Button
            mode="contained"
            onPress={openPaymentLink}
            style={{ marginBottom: 5 }}
          >
            Pagar
          </Button>
          <Button mode="outlined" onPress={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal>
      </Portal>
      <Portal>
        <Modal
          visible={showSuccessModal}
          onDismiss={() => setShowSuccessModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>🎉 ¡Inscripción exitosa! 🎉</Text>
          <Text style={styles.modalText}>
            Te esperamos el día del evento:{" "}
            {formatDate(event?.startDate, event?.endDate)}
          </Text>
          <Text style={styles.modalText}>
            Recuerda agregarlo a tu calendario.
          </Text>
          <Button mode="contained" onPress={() => setShowSuccessModal(false)}>
            ¡Entendido!
          </Button>
        </Modal>
      </Portal>
      <Portal>
        <Modal
          visible={showUnregisterModal}
          onDismiss={() => setShowUnregisterModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>❌ Cancelar inscripción</Text>
          <Text style={styles.modalText}>
            ¿Estás seguro de que deseas cancelar tu inscripción en el evento{" "}
            <Text style={{ fontWeight: "bold" }}>{event?.name}</Text>?
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
                  `/${tab}/components/${s.route}?eventId=${event?._id}&tab=${tab}` as any,
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
