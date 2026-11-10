import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { Text, ActivityIndicator, IconButton } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { searchAgendas } from "@/services/api/agendaService";
import { fetchSpeakers, searchSpeakers } from "@/services/api/speakerService";

import AgendaDaySelector from "./agenda/AgendaDaySelector";
import SessionCard from "./agenda/SessionCard";
import {
  AGENDA_MAX_WIDTH,
  AgendaSession,
  SpeakerIndex,
  buildSpeakerIndex,
  formatDayHeading,
  getSessionKey,
  sortChronologically,
  useAgendaLayout,
} from "./agenda/utils";
import { agendaColors } from "./agenda/theme";

export default function Program() {
  const { eventId } = useLocalSearchParams();

  const [selectedDay, setSelectedDay] = useState<string>("");
  const [agenda, setAgenda] = useState<Record<string, AgendaSession[]>>({});
  const [days, setDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Expansión por id estable de sesión (varias pueden estar abiertas)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // ✅ Indice global: speakerId -> speakerName
  const [speakerIndex, setSpeakerIndex] = useState<SpeakerIndex>({});
  const [showSpecialNotice, setShowSpecialNotice] = useState(true);

  const layout = useAgendaLayout();

  const toggleSession = useCallback((key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // =========================================================
  // Normalizador: solo asegurar subSessions array
  // (NO creamos fallback fake)
  // =========================================================
  const normalizeSession = (session: any): AgendaSession => ({
    ...session,
    subSessions: Array.isArray(session?.subSessions) ? session.subSessions : [],
  });

  // =========================================================
  // Fetch agenda + speakers
  // =========================================================
  const fetchAgenda = useCallback(async () => {
    try {
      setLoading(true);

      // ✅ 1) Cargar speakers primero (para resolver IDs en subSessions)
      let speakersList: any[] = [];
      try {
        if (eventId) {
          // El search está paginado: pedimos todos para resolver los IDs
          const spRes = await searchSpeakers({ eventId, limit: 1000 });
          speakersList =
            spRes?.data?.items || spRes?.data || spRes?.items || [];
        } else {
          const spRes = await fetchSpeakers();
          speakersList =
            spRes?.data?.items || spRes?.data || spRes?.items || [];
        }
      } catch (e) {
        console.log("⚠️ No se pudo cargar speakers, continuo igual:", e);
      }

      setSpeakerIndex(buildSpeakerIndex(speakersList));

      // ✅ 2) Cargar agenda
      const filters = { eventId: eventId };
      const response = await searchAgendas(filters);

      if (!response || response?.message === "No se encontraron agendas") {
        setAgenda({});
        setDays([]);
        setSelectedDay("");
        return;
      }

      const agendaItems = response?.data?.items || [];
      const allSessionsRaw = agendaItems.flatMap((a: any) => a?.sessions || []);

      const sessions: AgendaSession[] = allSessionsRaw.map(normalizeSession);

      // Agrupar por día
      const groupedByDay = sessions.reduce<Record<string, AgendaSession[]>>(
        (acc, session) => {
          const sessionDay = dayjs(session.startDateTime).format("YYYY-MM-DD");
          if (!acc[sessionDay]) acc[sessionDay] = [];
          acc[sessionDay].push(session);
          return acc;
        },
        {},
      );

      // Ordenar: inicio, luego fin, luego `order` (sesiones paralelas)
      for (const day in groupedByDay) {
        groupedByDay[day] = sortChronologically(groupedByDay[day]);
      }

      setAgenda(groupedByDay);

      const dayKeys = Object.keys(groupedByDay).sort((a, b) =>
        dayjs(a).isBefore(dayjs(b)) ? -1 : 1,
      );
      setDays(dayKeys);
      setSelectedDay(dayKeys[0] || "");
    } catch (error) {
      console.error("Error fetching agenda:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setExpanded({});
    fetchAgenda();
  }, [fetchAgenda]);

  // ✅ Mensaje fijo para evento especial (SIN ocultar agenda)
  const SPECIAL_EVENT_ID = "6876c799539413079ae753a7";
  const HEMATOLOGY_URL = "https://www.hematology.org/Highlights-LA";

  const openHematologyLink = async () => {
    try {
      const supported = await Linking.canOpenURL(HEMATOLOGY_URL);
      if (supported) await Linking.openURL(HEMATOLOGY_URL);
      else Alert.alert("Error", "No se pudo abrir el enlace.");
    } catch {
      Alert.alert("Error", "Ocurrió un problema al intentar abrir el enlace.");
    }
  };

  const visibleSessions = useMemo(
    () => agenda[selectedDay] || [],
    [agenda, selectedDay],
  );

  const renderAgenda = () => {
    if (!agenda[selectedDay]) {
      return (
        <Text style={styles.emptyText}>
          No hay sesiones disponibles para este día.
        </Text>
      );
    }
    if (!visibleSessions.length) {
      return <Text style={styles.emptyText}>No hay sesiones disponibles.</Text>;
    }
    return visibleSessions.map((session, index) => {
      const key = getSessionKey(session, index);
      return (
        <SessionCard
          key={key}
          sessionKey={key}
          session={session}
          expanded={!!expanded[key]}
          onToggle={toggleSession}
          speakerIndex={speakerIndex}
          layout={layout}
        />
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Cargando agenda...</Text>
      </View>
    );
  }

  if (days.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No hay agenda disponible.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selector de días */}
      <View style={styles.dayTabContainer}>
        <AgendaDaySelector
          days={days}
          selectedDay={selectedDay}
          onSelect={setSelectedDay}
        />
      </View>

      {/* Agenda: lista vertical de tarjetas */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.list}>
          {!!selectedDay && (
            <View style={styles.dayHeading}>
              <Ionicons
                name="calendar-outline"
                size={22}
                color={agendaColors.navy}
              />
              <Text style={styles.dayHeadingText}>
                {formatDayHeading(selectedDay)}
              </Text>
            </View>
          )}
          {renderAgenda()}
        </View>
      </ScrollView>

      {/* ✅ Aviso fijo abajo para evento especial (sin ocultar agenda) */}
      {String(eventId) === SPECIAL_EVENT_ID && showSpecialNotice && (
        <View style={styles.specialNotice}>
          <IconButton
            icon="close"
            size={18}
            onPress={() => setShowSpecialNotice(false)}
            style={styles.specialNoticeClose}
          />

          <Text style={styles.specialNoticeText}>
            La programación está sujeta a cambios.
          </Text>

          <Text style={styles.specialNoticeText}>
            Por favor, consulte la versión más actualizada{" "}
            <Text style={styles.specialNoticeLink} onPress={openHematologyLink}>
              aqui
            </Text>
            .
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: agendaColors.page },
  specialNotice: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#00BCD4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    position: "relative", // ✅ para que la X se ubique bien
  },

  specialNoticeClose: {
    position: "absolute",
    top: 2,
    right: 2,
    zIndex: 10,
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ Notice superior para evento especial

  specialNoticeText: {
    fontSize: 16,
    lineHeight: 22,
    color: "#333",
    textAlign: "center",
    fontWeight: "700",
  },
  specialNoticeLink: {
    color: "blue",
    textDecorationLine: "underline",
    fontWeight: "700",
  },

  dayTabContainer: {
    width: "100%",
    maxWidth: AGENDA_MAX_WIDTH,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },

  scrollContainer: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  list: { width: "100%", maxWidth: AGENDA_MAX_WIDTH, alignSelf: "center" },
  dayHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  dayHeadingText: {
    flexShrink: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
    color: agendaColors.text,
  },
  emptyText: { fontSize: 15, lineHeight: 20, color: agendaColors.muted },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

});
