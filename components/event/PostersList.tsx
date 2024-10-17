import React, { useState, useEffect } from "react";
import { View, TextInput, ScrollView, StyleSheet } from "react-native";
import { Text, IconButton, ActivityIndicator } from "react-native-paper";
import { searchPosters, Poster } from "@/services/api/posterService";
import { router, useLocalSearchParams } from "expo-router";
import debounce from "lodash.debounce";

export default function PostersList() {
  const { tab, eventId } = useLocalSearchParams();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(5);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  // Debounce para controlar la frecuencia de búsqueda
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Espera 500 ms antes de hacer la búsqueda
    handler();
    return () => {
      handler.cancel();
    };
  }, [searchTerm]);

  // Función para buscar los posters según el término de búsqueda
  const fetchFilteredPosters = async () => {
    if (!debouncedSearchTerm && !eventId) return;
    setLoading(true);
    try {
      const filters = {
        eventId,
        search: debouncedSearchTerm,
        page,
        limit,
      };
      const response = await searchPosters(filters);

      if (response.status === "success") {
        setPosters(response.data.items);
        setTotalPages(response.data.totalPages);
      } else {
        setPosters([]);
      }
    } catch (error) {
      setPosters([]);
    } finally {
      setLoading(false);
    }
  };

  // Se ejecuta cuando cambian debouncedSearchTerm, eventId o page
  useEffect(() => {
    fetchFilteredPosters();
  }, [debouncedSearchTerm, eventId, page]);

  // Resetea la paginación cuando cambia el término de búsqueda
  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    setPage(1);
  };

  const renderPoster = (poster: Poster) => (
    <View key={poster._id} style={styles.posterCard}>
      <View style={styles.posterInfo}>
        <Text style={styles.posterTitle}>{poster.title}</Text>
        <Text style={styles.posterDetails}>
          {`${poster.category} / ${poster.topic} / ${poster.institution}`}
        </Text>
        <Text style={styles.posterAuthors}>
          Autor(es): {poster.authors.join(", ")}
        </Text>
      </View>
      <IconButton
        icon="eye"
        iconColor="white"
        containerColor="black"
        size={15}
        onPress={() =>
          router.push(
            `/${tab}/components/posterdetail?posterId=${poster._id}&eventId=${eventId}`
          )
        }
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar posters por título, autores, tema, institución"
        placeholderTextColor="#888"
        value={searchTerm}
        onChangeText={handleSearchChange}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
          <Text>Cargando posters...</Text>
        </View>
      ) : posters.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text>No se encontraron posters.</Text>
        </View>
      ) : (
        <ScrollView>{posters.map((poster) => renderPoster(poster))}</ScrollView>
      )}
      {/* Navegación entre páginas */}
      {posters.length > 0 && (
        <View style={styles.paginationContainer}>
          <IconButton
            icon="chevron-left"
            onPress={() => setPage(page - 1)}
            disabled={page === 1 || loading}
          />
          <Text>{`Página ${page} de ${totalPages}`}</Text>
          <IconButton
            icon="chevron-right"
            onPress={() => setPage(page + 1)}
            disabled={page === totalPages || loading}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    margin: 10,
  },
  posterCard: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  posterInfo: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 5,
  },
  posterTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  posterDetails: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },
  posterAuthors: {
    fontSize: 12,
    marginTop: 5,
    color: "#555",
  },
  paginationContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
