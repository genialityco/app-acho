import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Text, Button, ActivityIndicator, Chip } from "react-native-paper";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { WebView } from "react-native-webview";
import { useLocalSearchParams } from "expo-router";
import {
  fetchPosterById,
  Poster,
  voteForPoster,
} from "@/services/api/posterService";
import { useAuth } from "@/context/AuthContext";

export default function PosterDetail() {
  const { posterId } = useLocalSearchParams();
  const posterIdString = Array.isArray(posterId) ? posterId[0] : posterId;
  const [poster, setPoster] = useState<Poster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const { userId } = useAuth();

  // Función para obtener el póster desde la API
  const fetchPoster = async () => {
    try {
      const response = await fetchPosterById(posterIdString);
      setPoster(response.data);

      // Verificar si el usuario ya ha votado
      if (response.data.voters.includes(userId)) {
        setHasVoted(true);
      }
    } catch (error) {
      console.error("Error al obtener el póster:", error);
      Alert.alert("Error", "No se pudo obtener el póster.");
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para cargar los datos del póster al montar el componente
  useEffect(() => {
    fetchPoster();
  }, [posterId]);

  // Función para votar por el póster
  const handleVote = async () => {
    setIsVoteLoading(true);
    if (userId === null) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para votar.");
      return;
    }

    try {
      const response = await voteForPoster(posterIdString, userId);
      Alert.alert(
        "Voto registrado",
        `Has votado por el póster ${poster?.title}`
      );

      // Actualizar el estado para reflejar que el usuario ha votado
      setHasVoted(true);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as any).response === "object" &&
        "data" in (error as any).response &&
        typeof (error as any).response.data === "object" &&
        "message" in (error as any).response.data &&
        "You have already voted for this poster"
      ) {
        Alert.alert("Error", "Ya has votado por este póster.");
      } else {
        Alert.alert(
          "Error",
          "No se pudo registrar tu voto. Inténtalo de nuevo."
        );
      }
    } finally {
      setIsVoteLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const downloadUri = poster?.urlPdf;
      const fileUri = FileSystem.documentDirectory + "poster.pdf";

      // Descargar el PDF
      const { uri } = await FileSystem.downloadAsync(downloadUri!, fileUri);
      Alert.alert("Descarga completa", `El archivo se guardó en: ${uri}`);

      // Compartir el archivo descargado
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert(
          "No se puede compartir",
          "La función de compartir no está disponible."
        );
      }
    } catch (error) {
      console.error("Error al descargar el archivo", error);
      Alert.alert("Error", "No se pudo descargar el archivo");
    } finally {
      setIsDownloading(false);
    }
  };

  // Si el póster está cargando, mostrar el indicador de carga
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Cargando póster...</Text>
      </View>
    );
  }

  // Si no se pudo obtener el póster, muestra un mensaje de error
  if (!poster) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No se encontró el póster.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.posterDetails}>
        {`${poster.category} / ${poster.topic} / ${poster.institution}`}
      </Text>
      <Text style={styles.header}>{poster.title}</Text>
      <Text style={styles.authors}>Autor(es): {poster.authors.join(", ")}</Text>

      {/* Vista para visualizar el PDF usando WebView */}
      <View style={styles.pdfContainer}>
        <WebView
          source={{ uri: poster.urlPdf }}
          style={styles.pdf}
          startInLoadingState={true}
          renderLoading={() => (
            <ActivityIndicator
              animating={true}
              size="large"
              style={styles.loader}
            />
          )}
          onError={(error) => {
            console.log(error);
            Alert.alert("Error", "No se pudo cargar el PDF");
          }}
        />
      </View>

      {/* Botones para votar y guardar */}
      <View style={styles.buttonContainer}>
        {hasVoted ? (
          <Chip icon="information">Has votado por este póster</Chip>
        ) : (
          <Button
            mode="contained"
            onPress={handleVote}
            loading={isVoteLoading}
            disabled={isVoteLoading}
            style={styles.voteButton}
          >
            Votar
          </Button>
        )}
        <Button
          mode="contained-tonal"
          onPress={handleDownload}
          loading={isDownloading}
          disabled={isDownloading}
          style={styles.saveButton}
        >
          Guardar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  authors: {
    fontSize: 14,
    marginBottom: 10,
  },
  pdfContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  loader: {
    marginTop: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  voteButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  posterDetails: {
    fontSize: 12,
    color: "#777",
    marginBottom: 5,
  },
  votedText: {
    fontSize: 16,
    fontStyle: "italic",
    flex: 1,
    textAlign: "center",
  },
});
