import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { WebView } from "react-native-webview";

// Visor del PDF de un póster: botón de pantalla completa, vista embebida y descarga.
export default function PosterPdfViewer({ urlPdf }: { urlPdf: string }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const fileUri = FileSystem.documentDirectory + "poster.pdf";

      // Descargar el PDF
      const { uri } = await FileSystem.downloadAsync(urlPdf, fileUri);
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
  const openPDF = async (uri: string) => {
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

  // Android no renderiza PDFs en WebView, así que pasa por el visor web.
  const viewerUri =
    Platform.OS === "android"
      ? `https://genpdfviewer.netlify.app/?file=${encodeURIComponent(urlPdf)}`
      : urlPdf;

  const renderLoading = () => (
    <ActivityIndicator animating={true} size="large" style={styles.loader} />
  );

  return (
    <>
      <Button
        mode="contained-tonal"
        icon="fullscreen"
        onPress={() => setIsFullScreen(true)}
        style={styles.fullScreenButton}
      >
        Ver en pantalla completa
      </Button>

      {/* Vista para visualizar el PDF usando WebView */}
      <View style={styles.pdfContainer}>
        <WebView
          source={{ uri: viewerUri }}
          style={styles.pdf}
          nestedScrollEnabled={true}
          startInLoadingState={true}
          renderLoading={renderLoading}
          onError={(error) => {
            console.log(error);
            Alert.alert("Error", "No se pudo cargar el PDF");
          }}
        />
      </View>

      <Button
        mode="contained-tonal"
        icon="download"
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
          <WebView
            source={{ uri: viewerUri }}
            nestedScrollEnabled={true}
            style={styles.fullScreenPdf}
            startInLoadingState={true}
            renderLoading={renderLoading}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fullScreenButton: {
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
  saveButton: {
    marginTop: 10,
    marginBottom: 20,
  },
});
