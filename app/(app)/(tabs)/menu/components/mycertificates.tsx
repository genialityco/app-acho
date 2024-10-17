import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Modal, Pressable } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { Image } from "react-native";

import { ImageSourcePropType } from "react-native";

interface Certificate {
  id: number;
  title: string;
  date: string;
  image: ImageSourcePropType; // URL de la imagen o archivo del certificado
}

export default function MyCertificatesScreen() {
  const [selectedCertificate, setSelectedCertificate] =
    useState<Certificate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Simulación de los certificados que tiene el usuario
  const certificates: Certificate[] = [
    {
      id: 1,
      title: "Certificado de Participación en Taller de React Native",
      date: "2023-07-15",
      image: require("../../../../../assets/images/certificado_ejemplo.png"),
    },
    {
      id: 2,
      title: "Certificado de Finalización del Curso de Node.js",
      date: "2023-08-20",
      image: require("../../../../../assets/images/certificado_ejemplo.png"),
    },
  ];

  const openModal = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedCertificate(null);
  };

  const downloadCertificate = (certificate: Certificate) => {};

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View>
        {certificates.map((certificate: Certificate) => (
          <Card key={certificate.id} style={styles.certificateCard}>
            <View style={styles.row}>
              {/* Columna para la imagen */}
              <View style={styles.contentColumnOne}>
                <Image
                  source={certificate.image}
                  style={styles.certificateImage}
                />
              </View>

              {/* Columna para el contenido */}
              <View style={styles.contentColumnTwo}>
                <Text style={styles.certificateDate}>{certificate.date}</Text>
                <Text style={styles.certificateTitle}>{certificate.title}</Text>
                <View style={styles.buttonContainer}>
                  <Button
                    mode="contained"
                    onPress={() => openModal(certificate)}
                  >
                    Ver
                  </Button>
                  <Button
                    mode="contained"
                    onPress={() => downloadCertificate(certificate)}
                  >
                    Descargar
                  </Button>
                </View>
              </View>
            </View>
          </Card>
        ))}
      </View>

      {/* Modal para visualizar el certificado */}
      {selectedCertificate && (
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={closeModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Pressable onPress={closeModal} style={styles.closeButton}>
                <Text style={styles.closeText}>Cerrar</Text>
              </Pressable>
              <Image
                source={selectedCertificate.image}
                style={styles.modalImage}
              />
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: {
    padding: 16,
  },
  certificateCard: {
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    elevation: 4, // sombra en Android
    shadowOpacity: 0.3, // sombra en iOS
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: 16,
  },
  row: {
    flexDirection: "row",
  },
  certificateImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  contentColumnOne: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  contentColumnTwo: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  certificateDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00AEEF",
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // Fondo semitransparente
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalImage: {
    width: 300,
    height: 300,
    resizeMode: "contain",
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  closeText: {
    fontSize: 16,
    color: "#007AFF",
  },
});
