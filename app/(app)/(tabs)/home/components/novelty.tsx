import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, StyleSheet, Image, ScrollView } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import WebView from "react-native-webview";
import { fetchNewsById, News } from "@/services/api/newsService";

function NoveltyScreen() {
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const { newId } = useLocalSearchParams();

  // Función para obtener la novedad por ID
  const getNews = async () => {
    try {
      const response = await fetchNewsById(newId as string);
      setNews(response.data);
    } catch (error) {
      console.error("Error al obtener la novedad:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newId) {
      getNews();
    }
  }, [newId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (!news) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la novedad.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {typeof news.featuredImage === "string" && (
        <Image
          source={{ uri: news.featuredImage }}
          style={styles.headerImage}
        />
      )}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{news.title}</Text>
        <WebView
          originWhitelist={["*"]}
          source={{
            html: Array.isArray(news.content)
              ? news.content.join("")
              : news.content,
          }}
          style={styles.webview}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f9f9f9",
  },
  headerImage: {
    width: "100%",
    height: 160,
    marginBottom: 20,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333", // Color más oscuro para mejor contraste
    textAlign: "center",
  },
  webview: {
    height: 450,
    marginTop: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#B22222", // Rojo más oscuro para mejor contraste
  },
});

export default NoveltyScreen;
