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
import { searchHighlights, Highlight } from "@/services/api/highlightService";

export default function RenderHighlights() {
  const { organization } = useOrganization();
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filteredHighlights, setFilteredHighlights] = useState<Highlight[]>([]);
  const [searchText, setSearchText] = useState<string>(""); // Estado para la búsqueda
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (organization?._id) {
      fetchHighlights();
    }
  }, [organization]);

  // Función para obtener los highlights filtrados por organizationId
  const fetchHighlights = async () => {
    setLoading(true);
    try {
      const filters = { organizationId: organization._id };
      const results = await searchHighlights(filters);
      if (results?.data?.items?.length > 0) {
        setHighlights(results.data.items);
        setFilteredHighlights(results.data.items);
      } else {
        setHighlights([]);
        setFilteredHighlights([]);
      }
    } catch (error) {
      console.error("Error al obtener los highlights:", error);
      setHighlights([]);
      setFilteredHighlights([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el cambio en el texto de búsqueda
  const handleSearch = (text: string) => {
    setSearchText(text);

    if (text.trim() === "") {
      setFilteredHighlights(highlights);
    } else {
      const filtered = highlights.filter((highlight) =>
        highlight.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredHighlights(filtered);
    }
  };

  // Renderizar cada item de la lista de highlights
  const renderItem = ({ item }: { item: Highlight }) => (
    <TouchableOpacity
      key={item._id}
      style={styles.highlightCard}
      onPress={() => {
        router.push(`/eventosbefore/HighlightDetail?id=${item._id}`);
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.textOverlay}>
        <Text style={styles.text}>{item.name}</Text>
        <Text style={styles.textEvent}>{item.eventId.name}</Text>
      </View>
    </TouchableOpacity>
  );

  // Mostrar indicador de carga mientras se obtienen los highlights
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b4d352" />
      </View>
    );
  }

  // Renderizar la vista principal
  return (
    <View style={{ flex: 1, padding: 10 }}>
      {/* Barra de búsqueda siempre visible */}
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar..."
        value={searchText}
        onChangeText={handleSearch}
      />

      {/* Mensaje o resultados */}
      {filteredHighlights.length === 0 ? (
        <View style={styles.noHighlightsContainer}>
          <Text style={styles.noHighlightsText}>
            No hay videos destacados disponibles.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHighlights}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={[styles.container, { paddingBottom: 150 }]} 
          showsVerticalScrollIndicator={true}
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
  highlightCard: {
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
  },
  textEvent: {
    color: "#b4d352",
    fontWeight: "bold",
    fontSize: 10,
  },
  noHighlightsContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  noHighlightsText: {
    fontSize: 16,
    color: "#777",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
});
