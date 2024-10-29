import React, { useState, useEffect } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Text, Button, ActivityIndicator, Chip } from "react-native-paper";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
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
  const { posterId, hasAlreadyVoted, isMemberActive } = useLocalSearchParams();
  const posterIdString = Array.isArray(posterId) ? posterId[0] : posterId;
  const [poster, setPoster] = useState<Poster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { userId } = useAuth();

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

  useEffect(() => {
    fetchPoster();
  }, [posterId]);

  const handleVote = async () => {
    setIsVoteLoading(true);
    if (userId === null) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para votar.");
      return;
    }

    try {
      await voteForPoster(posterIdString, userId);
      Alert.alert(
        "Voto registrado",
        `Has votado por el póster ${poster?.title}`
      );
      setHasVoted(true);
    } catch (error) {
      Alert.alert("Error", "No se pudo registrar tu voto. Inténtalo de nuevo.");
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
      Alert.alert("Descarga completa", `El archivo se guardó en: ${fileUri}`);

      // Preguntar si desea abrir el PDF
      Alert.alert(
        "Abrir PDF",
        "¿Deseas abrir el documento descargado?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Abrir", onPress: () => openPDF(uri) },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error("Error al descargar el archivo", error);
      Alert.alert("Error", "No se pudo descargar el archivo");
    } finally {
      setIsDownloading(false);
    }
  };

  // Abrir PDF con una aplicación externa en Android
  const openPDF = async (uri) => {
    if (Platform.OS === "android") {
      try {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1, // FLAG_ACTIVITY_NEW_TASK
          type: "application/pdf",
        });
      } catch (error) {
        console.error("Error al abrir el PDF en Android:", error);
        Alert.alert(
          "Error",
          "No se pudo abrir el PDF en una aplicación externa."
        );
      }
    } else {
      // En iOS, compartir el archivo descargado
      try {
        await Sharing.shareAsync(uri);
      } catch (error) {
        console.error("Error al compartir el PDF en iOS:", error);
        Alert.alert("Error", "No se pudo abrir el PDF en iOS.");
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Cargando póster...</Text>
      </View>
    );
  }

  if (!poster) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No se encontró el póster.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text
          style={styles.posterDetails}
        >{`${poster.category} / ${poster.topic}`}</Text>
        <Text style={styles.header}>{poster.title}</Text>
        <Text style={styles.authors}>
          Autor(es): {poster.authors.join(", ")}
        </Text>

        {/* Botones para votar y descargar */}
        <View style={styles.buttonContainer}>
          {hasVoted ? (
            <Chip icon="information" style={styles.votedChip}>
              Has votado por este póster
            </Chip>
          ) : (
            <Button
              mode="contained"
              onPress={handleVote}
              loading={isVoteLoading}
              disabled={
                isVoteLoading ||
                hasVoted ||
                hasAlreadyVoted === "true" ||
                isMemberActive === "false"
              }
              style={styles.voteButton}
            >
              {hasAlreadyVoted === "true"
                ? "Ya has votado"
                : "Votar por este poster"}
            </Button>
          )}
          <Button
            mode="contained-tonal"
            compact
            onPress={() => setIsFullScreen(true)}
          >
            Ver en pantalla completa
          </Button>
        </View>

        {/* Vista para visualizar el PDF usando WebView */}
        <View style={styles.pdfContainer}>
          {Platform.OS === "android" && (
            <WebView
              source={{
                uri: `https://genpdfviewer.netlify.app/?file=${poster.urlPdf}`,
              }}
              nestedScrollEnabled={true}
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
          )}
          {Platform.OS === "ios" && (
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
          )}
        </View>

        <Button
          mode="contained-tonal"
          onPress={handleDownload}
          loading={isDownloading}
          disabled={isDownloading}
          style={styles.saveButton}
        >
          Guardar
        </Button>

        {/* Modal para ver el PDF en pantalla completa */}
        <Modal visible={isFullScreen} animationType="slide" transparent>
          <View style={styles.fullScreenContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsFullScreen(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
            {Platform.OS === "android" && (
              <WebView
                source={{
                  uri: `https://genpdfviewer.netlify.app/?file=${poster.urlPdf}`,
                }}
                nestedScrollEnabled={true}
                style={styles.fullScreenPdf}
                startInLoadingState={true}
                renderLoading={() => (
                  <ActivityIndicator
                    animating={true}
                    size="large"
                    style={styles.loader}
                  />
                )}
              />
            )}
            {Platform.OS === "ios" && (
              <WebView
                source={{ uri: poster.urlPdf }}
                style={styles.fullScreenPdf}
                startInLoadingState={true}
                renderLoading={() => (
                  <ActivityIndicator
                    animating={true}
                    size="large"
                    style={styles.loader}
                  />
                )}
              />
            )}
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 5,
  },
  authors: {
    fontSize: 14,
    marginBottom: 10,
  },
  pdfContainer: {
    height: 400,
  },
  pdf: {
    flex: 1,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullScreenPdf: {
    flex: 1,
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  loader: {
    marginTop: 20,
  },
  noteText: {
    marginTop: 10,
    fontSize: 14,
    color: "#ff4444",
    textAlign: "center",
    fontWeight: "bold",
    padding: 10,
    backgroundColor: "#ffe0e0",
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginVertical: 10,
    gap: 10,
  },
  voteButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
    marginTop: 10,
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
  votedChip: {
    flex: 1,
  },
});
