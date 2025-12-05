import React, { useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Text } from "react-native-paper";
import { Image } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { searchAttendees } from "@/services/api/attendeeService";
import dayjs from "dayjs";
import { CertificateContext } from "@/context/CertificateContext";

interface Event {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  styles: {
    eventImage: string;
    miniatureImage: string;
  };
}

export default function MyEventsScreen() {
  const { userId } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const {certificates, setCertificates} = useContext(CertificateContext);

  useFocusEffect(
    React.useCallback(() => {
      const fetchRegisteredEvents = async () => {
        try {
          const filters = { userId };
          const response = certificates.filter(attendee => attendee.userId === userId);
          if (response.length > 0) {
            const userEvents = response;
            const mappedEvents = userEvents.map((attendee: any) => {
              const event = attendee.eventId;
              return {
                _id: event._id,
                name: event.name,
                description: event.description,
                startDate: event.startDate,
                styles: {
                  eventImage: event.styles.eventImage,
                  miniatureImage: event.styles.miniatureImage,
                },
              };
            });
            setEvents(mappedEvents);
          }
        } catch (error) {
          console.error("Error fetching registered events:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchRegisteredEvents();
    }, [userId])
  );

  const checkEventStatus = (eventDate: string) => {
    const currentDate = new Date();
    const eventDateObj = new Date(eventDate);
    return eventDateObj < currentDate;
  };

  const handleEventClick = (event: Event) => {
    const currentDate = new Date();
    const eventDate = new Date(event.startDate);

    if (eventDate < currentDate) {
      router.push(
        `/(tabs)/eventosbefore/components/eventdetailb?eventId=${event._id}`
      );
    } else {
      router.push(
        `/(tabs)/(index)/components/eventdetail?eventId=${event._id}`
      );
    }
  };

  const formatDate = (
    startDate: string | number | Date | dayjs.Dayjs | null | undefined
  ) => {
    return dayjs(startDate).format("MMM, DD, YYYY");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando eventos...</Text>
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.noEventsContainer}>
        <Text style={styles.noEventsText}>
          No estás inscrito en ningún evento actualmente.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View>
        {events.map((event: Event) => {
          const isEventFinished = checkEventStatus(event.startDate);
          return (
            <Card
              key={event._id}
              style={styles.eventCard}
              onPress={() => handleEventClick(event)}
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
                      {formatDate(event.startDate)}
                    </Text>
                  </View>

                  <Text style={styles.eventTitle}>{event.name}</Text>
                  <Text style={styles.eventDescription}>
                    {event.description}
                  </Text>
                  <Text
                    style={[
                      styles.eventStatus,
                      {
                        color: isEventFinished ? "#8B0000" : "#008000",
                      },
                    ]}
                  >
                    {isEventFinished
                      ? "Este evento ya finalizó"
                      : "Este evento sigue vigente"}
                  </Text>
                </View>
              </View>
            </Card>
          );
        })}
      </View>
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
  noEventsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noEventsText: {
    fontSize: 18,
    color: "#888",
    textAlign: "center",
    padding: 20,
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
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: "#7D7D7D",
  },
  eventStatus: {
    marginTop: 8,
    fontSize: 14,
    fontStyle: "italic",
  },
});
