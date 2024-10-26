import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView } from "react-native";
import {
  Card,
  IconButton,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import dayjs from "dayjs";

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
}
interface RenderEventsProps {
  events: Event[];
}

export default function RenderEvents({ events }: RenderEventsProps) {
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const now = dayjs();
    // Filtrar los eventos que son anteriores a la fecha actual
    const filteredEvents = events.filter((event) =>
      dayjs(event.startDate).isBefore(now)
    );
    setPastEvents(filteredEvents);
    setLoading(false);
  }, [events]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00AEEF" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      {pastEvents.map((event) => (
        <Card key={event._id} style={styles.eventCard}>
          <View style={styles.row}>
            {/* Columna para la imagen */}
            <View style={styles.contentColumnOne}>
              <Image
                source={{ uri: event.styles.miniatureImage }}
                style={styles.eventImage}
              />
              {/* <IconButton
                disabled
                icon="star"
                size={24}
                style={styles.iconButton}
                onPress={() => {}}
              /> */}
            </View>

            {/* Columna para el contenido */}
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
            <Button mode="contained" disabled onPress={() => {}}>
              Finalizado
            </Button>
            <Button
              mode="outlined"
              onPress={() =>
                router.push(
                  `/eventosbefore/components/eventdetailb?eventId=${event._id}`
                )
              }
            >
              Detalles
            </Button>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: "#fff",
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
    color: "#00BCD4",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: "#555",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  noMoreEventsText: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 16,
    color: "#7D7D7D",
  },
  iconButton: {
    marginTop: 10,
  },
});
