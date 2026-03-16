import React, { useState, useContext, useCallback } from "react";
import { ScrollView, StyleSheet, View, Image } from "react-native";
import { Card, Button, Text, ActivityIndicator } from "react-native-paper";
import { router } from "expo-router";
import { OrganizationContext } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { searchEvents } from "@/services/api/eventService";
import { searchAttendees } from "@/services/api/attendeeService";
import { searchMembers } from "@/services/api/memberService";
import LinkifyText from "@/app/utils/LinkifyText";
import dayjs from "dayjs";
import { useFocusEffect } from "@react-navigation/native";
import Analytics from "@/services/analytics";

// --- Tipos ---

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

// --- Utilidades ---

const cleanDescriptionUrls = (description: string): string => {
  return description
    .replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g, "")
    .replace(/(?<!\]\()https?:\/\/[^\s\)]+/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
};

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

// --- Componente ---

export default function EventosScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [isMemberActive, setIsMemberActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const { organization } = useContext(OrganizationContext);
  const { userId } = useAuth();

  const fetchEventsAndAttendees = async (page = 1) => {
    if (loading) return;
    setLoading(true);

    try {
      const eventResponse = await searchEvents({
        page,
        limit: 20,
        filters: [
          { field: "organizationId", operator: "eq", value: organization._id },
          { field: "startDate", operator: "gte", value: new Date().toISOString() },
        ],
        sorters: [{ field: "startDate", order: "asc" }],
      });

      const items = eventResponse.data?.items ?? [];
      if (items.length === 0) {
        setEvents([]);
        setTotalPages(1);
        return;
      }

      setEvents((prev) => (page === 1 ? items : [...prev, ...items]));
      setTotalPages(eventResponse.data.totalPages ?? 1);

      const attendeeResponse = await searchAttendees({ userId });
      const attendeeItems = attendeeResponse.data?.items ?? [];

      if (attendeeItems.length === 0) {
        const memberData = await searchMembers({ userId, organizationId: organization._id });
        setMemberId(memberData.data.items?.[0]?._id ?? null);
        setIsMemberActive(!!memberData.data.items?.[0]?.memberActive);
      } else {
        attendeeItems.forEach((a: any) => {
          setMemberId(a.memberId?._id ?? null);
          if (a.memberId?.memberActive) setIsMemberActive(true);
        });
      }
    } catch (e) {
      console.error("Error fetching events or attendees:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEventsAndAttendees(currentPage);
      Analytics.logScreenView('eventos_proximos', 'EventosScreen');
    }, [organization, userId, currentPage]),
  );

  const navigateToEvent = (eventId: string) => {
    
    router.push(
      `/(index)/components/eventdetail?eventId=${eventId}&isMemberActive=${isMemberActive}&memberId=${memberId}` as any,
    );
  };

  const loadMoreEvents = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  // --- Estados de carga ---

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

  // --- Render ---

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      {events.map((event) => (
        <Card
          key={event._id}
          style={styles.eventCard}
          onPress={() => navigateToEvent(event._id)}
        >
          <View style={styles.row}>
            <Image source={{ uri: event.styles.miniatureImage }} style={styles.eventImage} />
            <View style={styles.contentColumn}>
              <Text style={styles.eventDate}>
                {formatDate(event.startDate, event.endDate)}
              </Text>
              <Text style={styles.eventTitle}>{event.name}</Text>
              <LinkifyText
                description={cleanDescriptionUrls(event.description)}
                styles={styles.eventDescription}
              />
            </View>
          </View>

          <Button
            mode="outlined"
            onPress={() => navigateToEvent(event._id)}
            style={styles.detailsButton}
          >
            Detalles y Agenda
          </Button>
        </Card>
      ))}

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
        <Text style={styles.noMoreEventsText}>No hay más eventos por cargar</Text>
      )}
    </ScrollView>
  );
}

// --- Estilos ---

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
  contentColumn: {
    flex: 1,
    justifyContent: "space-between",
  },
  eventDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00AEEF",
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
  detailsButton: {
    marginTop: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});