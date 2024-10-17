import React from "react";
import { View, Image, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Text, Card } from "react-native-paper";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import WebView from "react-native-webview";

export default function Certificates() {
  // Simulación de URL de descarga de un certificado
  // const downloadUri = "https://firebasestorage.googleapis.com/v0/b/global-auth-49737.appspot.com/o/certificado_ejemplo-1.pdf?alt=media&token=1aa2097a-d152-469c-b3cd-66dc386138d1";

  // const handleDownload = async () => {
  //   try {
  //     // Definir la ruta para guardar el archivo en el sistema local
  //     const fileUri = FileSystem.documentDirectory + "certificado.pdf";

  //     // Descargar el archivo
  //     const { uri } = await FileSystem.downloadAsync(downloadUri, fileUri);

  //     // Preguntar al usuario si desea abrir el archivo
  //     Alert.alert(
  //       "Descarga completada",
  //       "¿Quieres abrir el archivo?",
  //       [
  //         {
  //           text: "Cerrar",
  //           onPress: () => console.log("Archivo cerrado"),
  //           style: "cancel",
  //         },
  //         {
  //           text: "Abrir",
  //           onPress: () => handleOpenFile(uri),
  //         },
  //       ],
  //       { cancelable: false }
  //     );
  //   } catch (error) {
  //     console.error("Error al descargar el archivo:", error);
  //     Alert.alert("Error", "No se pudo descargar el archivo");
  //   }
  // };

  // const handleOpenFile = async (fileUri: string) => {
  //   try {
  //     // Verificar si la funcionalidad de compartir está disponible
  //     if (!(await Sharing.isAvailableAsync())) {
  //       Alert.alert("Error", "El dispositivo no soporta compartir este archivo");
  //       return;
  //     }

  //     // Compartir o abrir el archivo descargado con la aplicación adecuada
  //     await Sharing.shareAsync(fileUri);
  //   } catch (error) {
  //     console.error("Error al abrir el archivo:", error);
  //     Alert.alert("Error", "No se pudo abrir el archivo");
  //   }
  // };

  const url =
    "https://gen-certificados.netlify.app/certificate/66df7014fa60af41a1bea05b/6707e563aac44fe74fc12ce4";

  return (
    // <View style={styles.container}>
    //   {/* Imagen del Certificado */}
    //   <Card>
    //     <Image
    //       source={require("../../assets/images/certificado_ejemplo.png")}
    //       style={styles.image}
    //     />
    //   </Card>

    //   {/* Botón de Descargar */}
    //   <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
    //     <Text style={styles.downloadText}>Descargar</Text>
    //   </TouchableOpacity>
    // </View>

    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        style={styles.webview}
        startInLoadingState={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    borderRadius: 10,
  },
  downloadButton: {
    backgroundColor: "#A1D68B",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  downloadText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  webview: {
    height: "100%",
    width: "100%",
  },
});
