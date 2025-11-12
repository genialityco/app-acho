import React, { useEffect, useState, useContext, useCallback } from "react";
import { Linking, ScrollView, StyleSheet, View } from "react-native";
import {
  Card,
  Button,
  Text,
  IconButton,
  ActivityIndicator,
  Portal,
  Modal,
} from "react-native-paper";
import { Image } from "react-native";
import { router } from "expo-router";
import { OrganizationContext } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { searchEvents } from "@/services/api/eventService";
import { searchAttendees } from "@/services/api/attendeeService";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import { searchMembers } from "@/services/api/memberService";

interface Event {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  styles: {
    eventImage: string;
    miniatureImage: string;
  };
  price?: number;
}

export default function EventosScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [isMemberActive, setIsMemberActive] = useState(false);
  const [loading, setLoading] = useState(false);
  // const [showModal, setShowModal] = useState(false);
  // const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const { organization } = useContext(OrganizationContext);
  const { userId, signOut } = useAuth();

  // Función para obtener los eventos y las inscripciones

  const fetchEventsAndAttendees = async (page = 1) => {
    if (loading) return;
    setLoading(true);

    try {
      const nowISO = new Date().toISOString();
      const payload = {
        page,
        limit: 20,
        filters: [
          { field: "organizationId", operator: "eq", value: organization._id },
          { field: "startDate", operator: "gte", value: nowISO },
        ],
        sorters: [{ field: "startDate", order: "asc" }],
      };

      const eventResponse = await searchEvents(payload);
      if (eventResponse.message === "No se encontraron eventos") {
        setEvents([]);
        setTotalPages(1);
        return;
      }

      const items = eventResponse.data.items ?? [];
      setEvents((prev) => (page === 1 ? items : [...prev, ...items]));
      setTotalPages(eventResponse.data.totalPages ?? 1);

      // asistentes / membresía (igual que antes)
      const attendeeResponse = await searchAttendees({ userId });
      if (attendeeResponse.message === "No se encontraron asistentes") {
        const memberData = await searchMembers({
          userId,
          organizationId: organization._id,
        });
        setMemberId(memberData.data.items?.[0]?._id ?? null);
        setIsMemberActive(!!memberData.data.items?.[0]?.memberActive);
      } else {
        const attendeeEventIds = attendeeResponse.data.items.map((a: any) => {
          setMemberId(a.memberId?._id ?? null);
          if (a.memberId?.memberActive) setIsMemberActive(true);
          return a.eventId?._id;
        });
        setRegisteredEvents(attendeeEventIds);
      }
    } catch (e) {
      console.error("Error fetching events or attendees:", e);
    } finally {
      setLoading(false);
    }
  };

  // Función para ordenar eventos por fecha
  const sortEventsByDate = (events: any[]) => {
    return events.sort(
      (
        a: { startDate: string | number | Date },
        b: { startDate: string | number | Date }
      ) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  };

  // Función para filtrar los eventos próximos
  const filterUpcomingEvents = (events: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = today.getTime();

    return events.filter((event) => {
      const startDate = new Date(
        event.startDate?.$date || event.startDate
      ).getTime();
      const endDate = new Date(event.endDate?.$date || event.endDate).getTime();

      return startDate >= now || (startDate <= now && endDate >= now);
    });
  };

  // Función para manejar cuando no hay asistentes registrados
  const handleNoAttendees = async (
    upcomingEvents: React.SetStateAction<Event[]>,
    totalPages: React.SetStateAction<number>
  ) => {
    setEvents(upcomingEvents);
    setTotalPages(totalPages);

    const filters = { userId, organizationId: organization._id };
    const memberData = await searchMembers(filters);

    setMemberId(memberData.data.items[0]._id);
    if (memberData.data.items[0]?.memberActive) {
      setIsMemberActive(true);
    }
  };

  // Función para manejar cuando hay asistentes registrados
  const handleAttendees = async (
    attendeeResponse: { data: { items: any[] } },
    upcomingEvents: React.SetStateAction<Event[]>,
    totalPages: React.SetStateAction<number>
  ) => {
    const attendeeEventIds = attendeeResponse.data.items.map(
      (attendee: {
        memberId: {
          _id: React.SetStateAction<string | null>;
          memberActive: any;
        };
        eventId: { _id: any };
      }) => {
        setMemberId(attendee.memberId._id);
        if (attendee.memberId.memberActive) {
          setIsMemberActive(true);
        }
        return attendee.eventId._id;
      }
    );

    setEvents(upcomingEvents);
    setRegisteredEvents(attendeeEventIds);
    setTotalPages(totalPages);
  };

  useFocusEffect(
    useCallback(() => {
      fetchEventsAndAttendees(currentPage); // y pásalo al payload como arriba
    }, [organization, userId, currentPage])
  );

  useFocusEffect(
    useCallback(() => {
      fetchEventsAndAttendees(currentPage);
    }, [organization, userId, currentPage])
  );

  const isRegistered = (eventId: string) => {
    return registeredEvents.includes(eventId);
  };

  const handleClicCard = (event: Event) => {
    // if (isMemberActive) {
    //   router.push(
    //     `/components/eventdetail?eventId=${event._id}&isMemberActive=${isMemberActive}&memberId=${memberId}`
    //   );
    // } else {
    //   setSelectedEvent(event);
    //   setShowModal(true);
    // }
    router.push(
      `/(index)/components/eventdetail?eventId=${event._id}&isMemberActive=${isMemberActive}&memberId=${memberId}`
    );
  };

  const formatDate = (
    startDate: string | number | Date | dayjs.Dayjs | null | undefined,
    endDate: string | number | Date | dayjs.Dayjs | null | undefined
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

  const loadMoreEvents = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  // const openPaymentLink = () => {
  //   Linking.openURL("https://zonapagos.com/t_acho");
  // };

  // const openComoSerMiembroLink = () => {
  //   Linking.openURL("https://acho.com.co/como-ser-miembro-acho/");
  // };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Cargando eventos...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No hay eventos disponibles</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View>
        {events.map((event) => (
          <Card
            key={event._id}
            style={styles.eventCard}
            onPress={() => handleClicCard(event)}
          >
            <View style={styles.row}>
              <View style={styles.contentColumnOne}>
                <Image
                  source={{ uri: event.styles.miniatureImage }}
                  style={styles.eventImage}
                />
              </View>

              <View style={styles.contentColumnTwo}>
                <View style={styles.headerContainer}>
                  <Text style={styles.eventDate}>
                    {formatDate(event.startDate, event.endDate)}
                  </Text>
                </View>

                <Text style={styles.eventTitle}>{event.name}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
            </View>

            <View style={styles.actionsContainer}>
              {/* {isRegistered(event._id) ? (
                <Button mode="outlined" disabled compact>
                  Estás inscrito
                </Button>
              ) : (
                <Button mode="contained" onPress={() => handleRegister(event)}>
                  Inscribirse
                </Button>
              )} */}
              <Button
                mode="outlined"
                onPress={() =>
                  router.push(
                    `/(index)/components/eventdetail?eventId=${event._id}&isMemberActive=${isMemberActive}&memberId=${memberId}`
                  )
                }
              >
                Detalles
              </Button>
            </View>
          </Card>
        ))}
      </View>

      {currentPage < totalPages ? (
        <Button
          mode="contained"
          onPress={loadMoreEvents}
          disabled={loading}
          loading={loading}
          style={styles.loadMoreButton}
        >
          Cargar más
        </Button>
      ) : (
        <Text style={styles.noMoreEventsText}>
          No hay más eventos por cargar
        </Text>
      )}

      {/* <Portal>
        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>
            Inscripción a evento: {selectedEvent?.name}
          </Text>
          <Text style={styles.modalText}>Valor miembros: Gratuito</Text>
          <Text style={styles.modalText}>
            No miembros: $ {selectedEvent?.price?.toLocaleString("es-ES")}
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
      </Portal> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 16,
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: 16,
  },
  row: {
    flexDirection: "row",
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  contentColumnOne: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  contentColumnTwo: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00AEEF",
  },
  iconButton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 50,
  },
  iconButtonRegister: {
    backgroundColor: "#00BCD4",
    borderRadius: 50,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#7D7D7D",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  loadMoreButton: {
    marginTop: 16,
  },
  noMoreEventsText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
    color: "#7D7D7D",
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal styles
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
});
