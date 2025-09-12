import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import RenderHighlights from "./RenderHighlights"; // Podrías renombrarlo a RenderMemorias si lo deseas
import RenderEvents from "./RenderEvents";
import { searchEvents } from "@/services/api/eventService";
import { OrganizationContext } from "@/context/OrganizationContext";
import { useFocusEffect } from "expo-router";

export default function EventsBeforeScreen() {
  // Tab principal: "Eventos Anteriores" (pastEvents)
  // Y el otro tab se renombra a "Memorias" (antes "Destacados")
  const [activeTab, setActiveTab] = useState("pastEvents");
  const { organization } = useContext(OrganizationContext);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pastEvents, setPastEvents] = useState([]);

  const fetchEvents = async (page = 1) => {
    setLoading(true);
    try {
      const filters = {
        organizationId: organization._id,
        page,
        limit: 10,
      };
      const eventResponse = await searchEvents(filters);

      const sortedEvents = eventResponse.data.items.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      setPastEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents(currentPage);
    }, [organization, currentPage])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
        <Text>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Botones superiores para Memorias y Eventos Anteriores */}
      <View style={styles.tabContainer}>
        <Button
          style={styles.button}
          mode={activeTab === "memorias" ? "contained" : "contained-tonal"}
          compact
          onPress={() => setActiveTab("memorias")}
        >
          Memorias
        </Button>
        <Button
          style={styles.button}
          mode={activeTab === "pastEvents" ? "contained" : "contained-tonal"}
          compact
          onPress={() => setActiveTab("pastEvents")}
        >
          Eventos Anteriores
        </Button>
      </View>

      {/* Contenido dinámico según el tab seleccionado */}
      <View style={styles.contentContainer}>
        {activeTab === "memorias" ? (
          <View style={styles.gridContainer}>
            <RenderHighlights />
          </View>
        ) : (
          <RenderEvents events={pastEvents} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  contentContainer: {
    paddingTop: 5,
  },
  gridContainer: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    borderRadius: 5,
    width: "45%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
