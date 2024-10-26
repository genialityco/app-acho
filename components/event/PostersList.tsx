import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Text, IconButton, ActivityIndicator } from "react-native-paper";
import { searchPosters, Poster } from "@/services/api/posterService";
import { router, useLocalSearchParams } from "expo-router";
import debounce from "lodash.debounce";
import { useAuth } from "@/context/AuthContext";

export default function PostersList() {
  const { tab, eventId, isMemberActive } = useLocalSearchParams();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(5);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");

  const { userId } = useAuth();
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState<boolean>(false);
  const [votedPoster, setVotedPoster] = useState<Poster | null>(null);

  // Debounce para controlar la frecuencia de búsqueda
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
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
        const postersData = response.data.items;

        // Verificar si el usuario ya ha votado por algún póster
        const userVotedPoster = postersData.find((poster) =>
          poster.voters.includes(userId)
        );

        if (userVotedPoster) {
          // Si el usuario ya votó, colocamos ese póster al inicio
          setVotedPoster(userVotedPoster);
          setHasAlreadyVoted(true);
          const filteredPosters = postersData.filter(
            (poster) => poster._id !== userVotedPoster._id
          );
          setPosters([userVotedPoster, ...filteredPosters]);
        } else {
          // Si no ha votado, mostramos la lista de pósters normal
          setPosters(postersData);
        }

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

  useEffect(() => {
    fetchFilteredPosters();
  }, [debouncedSearchTerm, eventId, page]);

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    setPage(1);
  };

  const renderPoster = (poster: Poster) => (
    <TouchableOpacity
      key={poster._id}
      onPress={() =>
        router.push(
          `/${tab}/components/posterdetail?posterId=${poster._id}&eventId=${eventId}&hasAlreadyVoted=${hasAlreadyVoted}&isMemberActive=${isMemberActive}`
        )
      }
    >
      <View
        key={poster._id}
        style={[
          styles.posterCard,
          votedPoster &&
            votedPoster._id === poster._id &&
            styles.votedPosterCard,
        ]}
      >
        <View style={styles.posterInfo}>
          <Text
            style={[
              styles.posterTitle,
              votedPoster &&
                votedPoster._id === poster._id &&
                styles.votedPosterTitle,
            ]}
          >
            {poster.title}
          </Text>
          <Text style={styles.posterDetails}>
            {poster.category}
            {poster.topic ? ` / ${poster.topic}` : ""}
          </Text>
          <Text style={styles.posterAuthors}>
            Autor(es): {poster.authors.join(", ")}
          </Text>
          {votedPoster && votedPoster._id === poster._id && (
            <Text style={styles.votedLabel}>Tu voto</Text>
          )}
        </View>
        <IconButton
          icon="eye"
          iconColor="white"
          containerColor="black"
          size={15}
          onPress={() =>
            router.push(
              `/${tab}/components/posterdetail?posterId=${poster._id}&eventId=${eventId}&hasAlreadyVoted=${hasAlreadyVoted}&isMemberActive=${isMemberActive}`
            )
          }
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar un poster..."
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  votedPosterCard: {
    backgroundColor: "#d1f7c4", // Color de fondo para indicar que es el póster votado
    borderColor: "#4caf50", // Borde verde para el póster votado
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
  votedPosterTitle: {
    color: "#4caf50", // Color verde para el título del póster votado
  },
  votedLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#4caf50",
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
