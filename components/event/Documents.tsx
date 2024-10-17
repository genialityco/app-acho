import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { Card, Text, Button, ActivityIndicator } from "react-native-paper";
import * as FileSystem from 'expo-file-system';  
import * as Sharing from 'expo-sharing';
import {
  DocumentInterface,
  searchDocuments,
} from "@/services/api/documentService";
import { useLocalSearchParams } from "expo-router";

export default function Documents() {
  const { eventId } = useLocalSearchParams();
  const [documents, setDocuments] = useState<DocumentInterface[]>([]);
  const [loading, setLoading] = useState(true); // Estado de carga

  const fetchDocumentsByEventId = async () => {
    setLoading(true);
    try {
      const response = await searchDocuments({ eventId: eventId });
      if(response.status === 'success'){
      setDocuments(response.data.items);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchDocumentsByEventId();
  }, [eventId]);

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const downloadDir = FileSystem.documentDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(fileUrl, downloadDir);

      Alert.alert(
        'Descarga completa',
        '¿Quieres abrir el archivo?',
        [
          {
            text: 'Cerrar',
            onPress: () => console.log('Archivo cerrado'),
            style: 'cancel',
          },
          {
            text: 'Abrir',
            onPress: () => handleOpenFile(uri),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error al descargar el archivo:', error);
      Alert.alert('Error', 'No se pudo descargar el archivo');
    }
  };

  const handleOpenFile = async (fileUri: string) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'El dispositivo no soporta compartir este archivo');
        return;
      }
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Error al abrir el archivo:', error);
      Alert.alert('Error', 'No se pudo abrir el archivo');
    }
  };

  const renderDocumento = ({ item }: { item: DocumentInterface }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <Button
          icon={() => <Ionicons name="download" size={24} color="black" />}
          mode="text"
          onPress={() => handleDownload(item.documentUrl, `${item.name}.pdf`)} 
          contentStyle={styles.buttonContent}
        >
          Descargar
        </Button>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Cargando documentos...</Text>
      </View>
    );
  }

  if (!documents.length) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No hay documentos disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={documents}
        renderItem={renderDocumento}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingBottom: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 10,
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
  buttonContent: {
    flexDirection: "row-reverse",
  },
});
