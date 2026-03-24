import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import RenderHighlights from "./RenderHighlights"; 
import RenderEvents from "./RenderEvents";
import { searchEvents, Event as ApiEvent } from "@/services/api/eventService";
import { OrganizationContext } from "@/context/OrganizationContext";
import { useFocusEffect } from "expo-router";
import EventsHighlighs from "./EventsHighlighs";

export default function EventsBeforeScreen() {
  const [activeTab, setActiveTab] = useState("pastEvents");
  const { organization } = useContext(OrganizationContext);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pastEvents, setPastEvents] = useState<ApiEvent[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const fetchEvents = async (page = 1, reset = false) => {
    // Si no hay más datos y no es reset, no hacer la petición
    if (page > 1 && !hasMore) return;

    // Mostrar loading solo en la primera carga o reset
    if (page === 1 || reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const filters = {
        organizationId: organization._id,
        page,
        limit: pageSize,
      };
      const eventResponse = await searchEvents(filters);

      const sortedEvents = eventResponse.data.items.sort(
        (a: { startDate: string | number | Date; }, b: { startDate: string | number | Date; }) => 
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      if (reset || page === 1) {
        // Reset: reemplazar todos los eventos
        setPastEvents(sortedEvents);
      } else {
        // Append: agregar nuevos eventos al final
        setPastEvents(prev => [...prev, ...sortedEvents]);
      }

      // Actualizar estados de paginación
      setHasMore(sortedEvents.length === pageSize);
      setCurrentPage(page);

    } catch (error) {
      console.error("Error fetching events:", error);
      if (reset || page === 1) {
        setPastEvents([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreEvents = () => {
    if (!loadingMore && hasMore && activeTab === "pastEvents") {
      fetchEvents(currentPage + 1, false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "pastEvents") {
      // Reset events when switching back to pastEvents tab
      setCurrentPage(1);
      setHasMore(true);
      fetchEvents(1, true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "pastEvents") {
        fetchEvents(1, true);
      }
    }, [organization])
  );

  if (loading && activeTab === "pastEvents") {
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
          onPress={() => handleTabChange("memorias")}
        >
          Memorias
        </Button>
        <Button
          style={styles.button}
          mode={activeTab === "pastEvents" ? "contained" : "contained-tonal"}
          compact
          onPress={() => handleTabChange("pastEvents")}
        >
          Eventos Anteriores
        </Button>
      </View>

      {/* Contenido dinámico según el tab seleccionado */}
      <View style={styles.contentContainer}>
        {activeTab === "memorias" ? (
          <View style={styles.gridContainer}>
            <EventsHighlighs />
          </View>
        ) : (
          <RenderEvents 
            events={pastEvents} 
            onLoadMore={loadMoreEvents}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />
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
    flex: 1,
    paddingTop: 5,
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 16,
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