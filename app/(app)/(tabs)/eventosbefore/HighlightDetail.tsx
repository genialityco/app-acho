import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { ActivityIndicator } from "react-native-paper";
import { fetchHighlightById, Highlight } from "@/services/api/highlightService";
import { Ionicons } from "@expo/vector-icons"; // Importar íconos

type RouteParams = {
  params: {
    id: string;
  };
};

export default function HighlightDetail() {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const { id } = route.params;

  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getHighlightDetails();
    }
  }, [id]);

  // Obtener los detalles del highlight
  const getHighlightDetails = async () => {
    try {
      setLoading(true);
      const result = await fetchHighlightById(id);
      setHighlight(result.data);
    } catch (error) {
      console.error("Error al obtener los detalles del highlight:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!id) {
    return <Text style={styles.errorText}>ID no encontrado</Text>;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004D73" />
      </View>
    );
  }

  if (!highlight) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No se encontraron detalles del highlight.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Reproductor de video con WebView */}
        <View style={styles.videoContainer}>
          <WebView
            source={{ uri: highlight.vimeoUrl }}
            style={styles.video}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            onLoadEnd={() => setLoading(false)}
          />
        </View>

        {/* Nombre del Highlight */}
        <Text style={styles.title}>{highlight.name}</Text>

        {/* Nombre del evento */}
        <Text style={styles.eventName}>
          {highlight.eventId ? `Evento: ${highlight.eventId.name}` : "Evento no especificado"}
        </Text>

        {/* Descripción del Highlight */}
        <Text style={styles.description}>{highlight.description}</Text>

        {/* Botón para compartir */}
        {/* <TouchableOpacity style={styles.shareButton} onPress={() => alert("Compartir!")}>
          <Ionicons name="share-social-outline" size={20} color="#FFF" />
          <Text style={styles.shareButtonText}>Compartir</Text>
        </TouchableOpacity> */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  videoContainer: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#000",
    elevation: 5, // Sombra en Android
    shadowColor: "#000", // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: "#004D73",
    paddingHorizontal: 12,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#0088CC",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    textAlign: "justify",
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 18,
    color: "#B22222",
    textAlign: "center",
    marginTop: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#004D73",
    borderRadius: 8,
    marginTop: 20,
    elevation: 2, // Sombra en Android
    shadowColor: "#000", // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  shareButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
