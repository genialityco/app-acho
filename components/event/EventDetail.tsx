import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import { Button, FAB, ActivityIndicator } from "react-native-paper";
import {
  createAttendee,
  deleteAttendee,
  searchAttendees,
} from "@/services/api/attendeeService";
import { fetchEventById } from "@/services/api/eventService";
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";

interface Event {
  _id: number;
  name: string;
  description: string;
  startDate: string;
  styles: {
    eventImage: string;
  };
}

export default function EventDetail({ tab }: { tab: string }) {
  const { eventId, isMemberActive, memberId } = useLocalSearchParams();
  const { userId } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendee, setAttendee] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    try {
      const attendeeData = {
        userId,
        eventId: event?._id,
        memberId,
      };
      await createAttendee(attendeeData);
      setIsRegistered(true);

      // Consultar nuevamente los datos de inscripción
      getAttendeeData(event?._id);
    } catch (error) {
      console.error("Error registering attendee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async () => {
    setIsLoading(true);
    try {
      await deleteAttendee(attendee._id);
      setIsRegistered(false);

      // Consultar nuevamente los datos de inscripción
      getAttendeeData(event?._id);
    } catch (error) {
      console.error("Error unregistering attendee:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (startDate: string) => {
    const start = dayjs(startDate);
    const formattedDate = start.format("MMM, DD, YYYY - HH:mm A");
    return formattedDate;
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
  return (
    <ImageBackground
      source={{ uri: event?.styles?.eventImage }}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.content}>
            <Text style={styles.title}>{event?.name}</Text>
            <Text style={styles.date}>{event?.description}</Text>
            <Text style={styles.date}>{formatDate(event?.startDate)}</Text>

            <View style={styles.container}>
              <View style={styles.buttonRow}>
                <View style={styles.buttonWrapper}>
                  <FAB
                    icon="format-list-text"
                    color="white"
                    style={styles.fab}
                    onPress={() => {
                      router.push(
                        `/${tab}/components/program?eventId=${event._id}&tab=${tab}`
                      );
                    }}
                  />
                  <Text style={styles.label}>Programa</Text>
                </View>
                <View style={styles.buttonWrapper}>
                  <FAB
                    icon="account"
                    color="white"
                    style={styles.fab}
                    onPress={() => {
                      router.push(
                        `/${tab}/components/speakers?eventId=${event._id}&tab=${tab}`
                      );
                    }}
                  />
                  <Text style={styles.label}>Conferencistas</Text>
                </View>
                <View style={styles.buttonWrapper}>
                  <FAB
                    icon="file-document"
                    color="white"
                    style={styles.fab}
                    onPress={() => {
                      router.push(
                        `/${tab}/components/documents?eventId=${event._id}`
                      );
                    }}
                  />
                  <Text style={styles.label}>Documentos</Text>
                </View>
              </View>

              <View style={styles.buttonRow}>
                <Link href={`/${tab}/components/venue?eventId=${event._id}`}>
                  <View style={styles.buttonWrapper}>
                    <FAB icon="map-marker" color="white" style={styles.fab} />
                    <Text style={styles.label}>Ubicación</Text>
                  </View>
                </Link>
                <Link
                  href={`/${tab}/components/certificates?eventId=${event._id}`}
                >
                  <View style={styles.buttonWrapper}>
                    <FAB icon="certificate" color="white" style={styles.fab} />
                    <Text style={styles.label}>Certificado</Text>
                  </View>
                </Link>
                <Link href={`/${tab}/components/posterslist?eventId=${event._id}&tab=${tab}`}>
                  <View style={styles.buttonWrapper}>
                    <FAB icon="post" color="white" style={styles.fab} />
                    <Text style={styles.label}>Posters</Text>
                  </View>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>

        {tab === "(index)" && isMemberActive && (
          <View style={styles.fixedButtonContainer}>
            {!isRegistered ? (
              <Button
                mode="contained"
                compact
                style={styles.registerButton}
                onPress={handleRegister}
                loading={isLoading}
                disabled={isLoading}
              >
                Inscribirme
              </Button>
            ) : (
              <Button
                mode="contained"
                compact
                style={styles.unregisterButton}
                onPress={handleUnregister}
                loading={isLoading}
                disabled={isLoading}
              >
                Cancelar inscripción
              </Button>
            )}
            <Button
              mode="contained-tonal"
              compact
              style={styles.calendarButton}
            >
              Añadir a Mi Calendario
            </Button>
          </View>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: "contain",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  date: {
    color: "white",
    fontSize: 16,
    marginBottom: 20,
  },
  container: {
    justifyContent: "center",
    padding: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  buttonWrapper: {
    alignItems: "center",
  },
  fab: {
    backgroundColor: "#00BCD4",
    borderRadius: 50,
  },
  label: {
    marginTop: 5,
    fontSize: 12,
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
});
