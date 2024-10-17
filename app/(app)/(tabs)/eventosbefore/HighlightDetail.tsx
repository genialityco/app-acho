import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { WebView } from "react-native-webview";

type RouteParams = {
  params: {
    id: string;
  };
};

export default function HighlightDetail() {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const { id } = route.params;

  if (!id) {
    return <Text style={styles.errorText}>Id no encontrado</Text>;
  }

  const vimeoVideoUrl = `https://player.vimeo.com/video/982835404`;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Reproductor de video con WebView */}
        <View style={styles.videoContainer}>
          <WebView
            source={{ uri: vimeoVideoUrl }}
            style={styles.video}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>

        {/* Mostrar los detalles del highlight */}
        <Text style={styles.title}>Nombre del highlight</Text>
        <Text style={styles.eventName}>Nombre del evento</Text>

        {/* Sección de descripción */}
        <Text style={styles.description}>
          En esta conferencia, exploramos los últimos avances tecnológicos y
          cómo están cambiando el mundo. Con la participación de expertos de la
          industria, este evento ofrece una visión detallada sobre el impacto de
          las nuevas tecnologías en diversas áreas.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f0f0f0",
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
  },
  video: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  eventName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    color: "#555",
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
    textAlign: "justify",
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 18,
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
});
