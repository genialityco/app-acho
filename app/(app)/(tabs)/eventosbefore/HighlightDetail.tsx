import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { fetchHighlightById, Highlight } from "@/services/api/highlightService";

type RouteParams = {
  params: {
    id: string;
    time?: string;
  };
};

export default function HighlightDetail() {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const { id, time } = route.params;

  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getHighlightDetails();
    }
  }, [id]);

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

    // Generamos la URL del video con el tiempo
    const videoUrl = time
    ? `${highlight.vimeoUrl}?autoplay=1#t=${time.replace(":", "m").replace(":", "s")}`
    : highlight.vimeoUrl + "?autoplay=1";

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: videoUrl }}
        style={styles.video}
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
      />

      {/* Mostrar información solo cuando el video está en pausa */}
        <View style={styles.topOverlay}>
          <Text style={styles.title}>{highlight.name}</Text>
          <Text style={styles.eventName}>
            {highlight.eventId
              ? `Evento: ${highlight.eventId.name}`
              : "Evento no especificado"}
          </Text>
          <Text style={styles.description}>{highlight.description}</Text>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  topOverlay: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "flex-start",
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
    paddingVertical: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "left",
    color: "white",
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    color: "#00FFFF",
    textAlign: "left",
  },
  description: {
    fontSize: 14,
    color: "white",
    textAlign: "left",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    fontSize: 18,
    color: "#B22222",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
