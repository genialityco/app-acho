import React, { useEffect, useState } from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Text } from "react-native-paper";
import { router } from "expo-router";
import { useOrganization } from "@/context/OrganizationContext";
import { fetchEvents, searchEvents } from "@/services/api/eventService";
import { eventHasHighlights } from "@/services/api/highlightService";

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

export default function EventsHighlighs() {
  const { organization } = useOrganization();
  const [allEvents, setAllEvents] = useState<Event[]>([]); // Todos los eventos sin filtrar
  const [eventsWithHighlights, setEventsWithHighlights] = useState<Event[]>([]); // Solo eventos con highlights
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]); // Eventos filtrados por búsqueda
  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [highlightsCount, setHighlightsCount] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (organization?._id) {
      fetchEventsData(1, true);
    }
  }, [organization]);

  // Este useEffect se ejecuta cuando se actualiza highlightsCount
  useEffect(() => {
    const eventsWithHighlightsFiltered = allEvents.filter((event: Event) => 
      highlightsCount[event._id] && highlightsCount[event._id] > 0
    );
    
    setEventsWithHighlights(eventsWithHighlightsFiltered);
    
    // Si no hay texto de búsqueda, mostrar todos los eventos con highlights
    if (searchText.trim() === "") {
      setFilteredEvents(eventsWithHighlightsFiltered);
    } else {
      // Si hay búsqueda, filtrar dentro de los eventos con highlights
      const searchFiltered = eventsWithHighlightsFiltered.filter((event) =>
        event.name.toLowerCase().includes(searchText.toLowerCase()) ||
        event.description.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredEvents(searchFiltered);
    }
  }, [highlightsCount, allEvents, searchText]);

  // Función para obtener los eventos filtrados por organizationId
  const fetchEventsData = async (pageNum: number, reset: boolean = false) => {
    if (pageNum > 1 && !hasMore) return;

    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const filters = { 
        organizationId: organization._id,
        pageSize: 10,
        current: pageNum,
        sorters: [
          {field: "startDate", order: "desc"}
        ]
      };
      
      const results = await searchEvents(filters);
      const newEvents = results?.data?.items || [];

      if (newEvents.length > 0) {
        // Obtener información de highlights para los nuevos eventos
        const hasHighlights = await eventHasHighlights(
          newEvents.map((e: Event) => ({ eventId: e._id }))
        );
        
        // Actualizar el contador de highlights
        setHighlightsCount(prev => ({ 
          ...prev, 
          ...hasHighlights.data.hasHighlights 
        }));
      }

      // Actualizar la lista de todos los eventos
      if (reset) {
        setAllEvents(newEvents);
        setPage(1);
      } else {
        setAllEvents(prev => [...prev, ...newEvents]);
        setPage(pageNum);
      }

      setHasMore(newEvents.length === filters.pageSize);

    } catch (error) {
      console.error("Error al obtener los eventos:", error);
      if (reset) {
        setAllEvents([]);
        setEventsWithHighlights([]);
        setFilteredEvents([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Función para formatear las fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para buscar eventos
  const handleSearch = (text: string) => {
    setSearchText(text);
    // El filtrado se manejará en el useEffect que escucha cambios en searchText
  };

  // Función para cargar más eventos
  const loadMoreEvents = () => {
    if (!loadingMore && hasMore) {
      fetchEventsData(page + 1, false);
    }
  };

  // Renderizar cada item de la lista de eventos
  const renderItem = ({ item }: { item: Event }) => (
    <TouchableOpacity
      key={item._id}
      style={styles.eventCard}
      onPress={() => {
        router.push(`/eventosbefore/Memorias?eventId=${item._id}`);
      }}
    >
      <Text style={styles.textMemories}>
        {highlightsCount[item._id] || 0} Memorias
      </Text>
      <Image 
        source={{ uri: item.styles.miniatureImage || item.styles.eventImage }} 
        style={styles.image} 
      />
      <View style={styles.textOverlay}>
        <Text style={styles.text}>{item.name}</Text>
        <Text style={styles.textDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.textDate}>
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Mostrar indicador de carga mientras se obtienen los eventos
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00AEEF" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  // Renderizar la vista principal
  return (
    <View style={{ flex: 1, padding: 10 }}>
      {/* Barra de búsqueda siempre visible */}
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar eventos..."
        value={searchText}
        onChangeText={handleSearch}
      />

      {/* Mensaje o resultados */}
      {filteredEvents.length === 0 ? (
        <View style={styles.noEventsContainer}>
          <Text style={styles.noEventsText}>
            {searchText ? 
              "No se encontraron eventos con highlights." : 
              "No hay eventos con memorias disponibles."
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.container, { paddingBottom: 20 }]}
          showsVerticalScrollIndicator={true}
          onEndReached={loadMoreEvents}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#b4d352" />
                <Text style={styles.loadingText}>Cargando más eventos...</Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  eventCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 3,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  textOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 2,
  },
  textDescription: {
    color: "#e0e0e0",
    fontSize: 10,
    marginBottom: 2,
  },
  textDate: {
    color: "#b4d352",
    fontWeight: "bold",
    fontSize: 10,
  },
  noEventsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noEventsText: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  footerLoading: {
    paddingVertical: 10,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  textMemories: {
    position: "absolute",
    top: 5,
    right: 5,
    fontSize: 10,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "#00FFFF",
    paddingHorizontal: 6,
    zIndex: 1,
  }
});