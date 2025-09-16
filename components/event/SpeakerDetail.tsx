import React, { useEffect, useState } from "react";
import { View, Image, ScrollView, StyleSheet } from "react-native";
import { Text, Paragraph, ActivityIndicator } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { fetchSpeakerById } from "@/services/api/speakerService";
import { searchAgendas } from "@/services/api/agendaService";

dayjs.locale("es");

interface Speaker {
  _id: string;
  names: string;
  description: string;
  imageUrl: string;
  location: string;
  isInternational: boolean;
}

interface Session {
  _id: string;
  title: string;
  startDateTime: string;
  endDateTime: string;
  room: string;
  moduleId: any;
  speakers: Speaker[];
}

export default function SpeakerDetail() {
  const { speakerId, eventId } = useLocalSearchParams();
  const [speaker, setSpeaker] = useState<Speaker | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpeaker = async (id: string) => {
    try {
      const response = await fetchSpeakerById(id);
      setSpeaker(response.data);
    } catch (error) {
      console.error("Error fetching speaker:", error);
    }
  };

  const fetchAgenda = async (eventId: string, speakerId: string) => {
    try {
      const response = await searchAgendas({ eventId });
      const agendaSessions = response.data.items[0]?.sessions || [];
      const speakerSessions = agendaSessions.filter((session: Session) =>
        session.speakers.some(
          (speakerIdInSession) => speakerIdInSession._id === speakerId
        )
      );
      setSessions(speakerSessions);
    } catch (error) {
      console.error("Error fetching agenda:", error);
    }
  };

  useEffect(() => {
    if (speakerId) {
      fetchSpeaker(speakerId as string);
    }
  }, [speakerId]);

  useEffect(() => {
    if (speakerId && eventId) {
      fetchAgenda(eventId as string, speakerId as string);
    }
  }, [eventId, speakerId]);

  useEffect(() => {
    setLoading(false);
  }, [speaker, sessions]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Cargando conferencista...</Text>
      </View>
    );
  }

  if (!speaker) {
    return (
      <View style={styles.container}>
        <Text>No se encontró información del conferencista</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.speakerInfo}>
        <View style={styles.textContainer}>
          <Text style={styles.label}>CONFERENCISTA</Text>
          <Text style={styles.name}>{speaker.names.toUpperCase()}</Text>
          <Text style={styles.internationalText}>
            {speaker.isInternational ? "INTERNACIONAL" : "NACIONAL"}
          </Text>
        </View>
        <Image source={{ uri: speaker.imageUrl }} style={styles.image} />
      </View>

      <View>
        <Paragraph style={styles.bio}>{speaker.description}</Paragraph>
      </View>

      <View style={styles.sessionsContainer}>
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <View key={session._id} style={styles.sessionCard}>
              <Text style={styles.sessionIcon}>● Conferencia:</Text>
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionTime}>
                {dayjs(session.startDateTime).format("DD MMMM | hh:mm a")} -{" "}
                {dayjs(session.endDateTime).format("hh:mm a")}
                {session.room !== null ||
                  (session.room !== "" &&
                    `| Salón:
                ${session.room}`)}{" "}
                {session.moduleId?.title &&
                  `| Módulo: ${session.moduleId.title}`}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noSessionsText}>
            No hay sesiones disponibles para este conferencista.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  speakerInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00a8e8",
    marginBottom: 8,
  },
  image: {
    borderRadius: 60,
    width: 120,
    height: 120,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  internationalText: {
    fontSize: 14,
    color: "#7e7e7e",
    marginBottom: 16,
  },
  bio: {
    fontSize: 16,
    textAlign: "justify",
    marginTop: 8,
    color: "#424242",
  },
  sessionsContainer: {
    marginTop: 20,
    padding: 10,
    borderRadius: 10,
  },
  sessionCard: {
    marginBottom: 16,
  },
  sessionIcon: {
    fontSize: 14,
    color: "green",
    fontWeight: "bold",
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 10,
  },
  noSessionsText: {
    textAlign: "center",
    color: "#757575",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
