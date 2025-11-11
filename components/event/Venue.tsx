import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  PanResponder,
} from "react-native";
import { Card, Text, Button, ActivityIndicator } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { fetchEventById } from "@/services/api/eventService";
import ZoomableImage from "@/app/utils/ZoomableImage";

interface Event {
  name: string;
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    imageUrl?: string;
    address: string;
  };
}

export default function Venue() {
  const { eventId } = useLocalSearchParams();
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationPermissionGranted, setLocationPermissionGranted] =
    useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;

  const hasImage = event?.location?.imageUrl;
  // Obtener la ubicación actual del usuario con manejo de errores
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setLocationPermissionGranted(true);
          const userLocation = await Location.getCurrentPositionAsync({});
          setLocation(userLocation);
        } else {
          setLocationPermissionGranted(false);
          Alert.alert("Permiso denegado", "No se pudo acceder a tu ubicación.");
        }
      } catch (error) {
        console.error("Error al obtener la ubicación del usuario:", error);
        Alert.alert("Error", "No se pudo obtener la ubicación del usuario.");
      }
    };

    getUserLocation();
  }, []);

  // Obtener los datos del evento desde el servicio con manejo de errores
  useEffect(() => {
    const getEventData = async () => {
      try {
        const response = await fetchEventById(eventId);
        if (response.status === "success" && response.data.location) {
          setEvent(response.data);
        } else {
          setEvent(null);
          Alert.alert("Error", "No se encontraron datos del evento.");
        }
      } catch (error) {
        console.error("Error al obtener datos del evento:", error);
        Alert.alert("Error", "No se pudo cargar los datos del evento.");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      getEventData();
    } else {
      setLoading(false);
    }
  }, [eventId]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => zoomed,
      onMoveShouldSetPanResponder: () => zoomed,
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const handleToggleZoom = () => {
    Animated.spring(scale, {
      toValue: zoomed ? 1 : 2,
      useNativeDriver: true,
    }).start();
    setZoomed(!zoomed);
  };


  // Función para abrir Google Maps o Apple Maps con validación
  const getDirections = () => {
    if (!event || !event.location?.coordinates) {
      Alert.alert(
        "Error",
        "No se encontraron datos de la ubicación del evento."
      );
      return;
    }

    const userLatitude = location?.coords?.latitude;
    const userLongitude = location?.coords?.longitude;

    const url = Platform.select({
      ios: `maps://0,0?saddr=${userLatitude || ""},${
        userLongitude || ""
      }&daddr=${event.location.coordinates.latitude},${
        event.location.coordinates.longitude
      }`,
      android: `google.navigation:q=${event.location.coordinates.latitude},${
        event.location.coordinates.longitude
      }&origin=${userLatitude || ""},${userLongitude || ""}`,
    });

    if (url) {
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            Alert.alert("Error", "No se pudo abrir la aplicación de mapas.");
          }
        })
        .catch((error) => {
          console.error("Error al abrir la URL:", error);
          Alert.alert("Error", "No se pudo abrir la aplicación de mapas.");
        });
    } else {
      Alert.alert("Error", "URL inválida para obtener direcciones.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Cargando ubicación...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No se encontró ubicación del evento</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Mapa */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={{
              latitude: event.location.coordinates.latitude,
              longitude: event.location.coordinates.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: event.location.coordinates.latitude,
                longitude: event.location.coordinates.longitude,
              }}
              title={event.name}
              description={event.location.address}
            />
          </MapView>
        </View>

        <View style={styles.infoOverlayContainer}>
      <Card style={styles.venueCard}>
        <Card.Content>
          {/* Fila: texto a la izquierda, imagen a la derecha */}
          <View style={styles.row}>
            <View style={styles.textContainer}>
              <Text style={styles.venueTitle}>{event.name}</Text>
              <Text style={styles.venueDescription}>{event.location.address}</Text>
            </View>

            {hasImage && (
              <TouchableOpacity onPress={() => setModalVisible(true)}>
                <Image
                  source={{ uri: event.location.imageUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Botón centrado */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={getDirections}
              style={styles.directionsButton}
            >
              Obtener Indicaciones
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Modal de imagen a pantalla completa */}
      {hasImage && (
      <Modal
      visible={modalVisible}
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <ZoomableImage
        uri={event.location.imageUrl!}
        onClose={() => setModalVisible(false)}
      />
    </Modal>
      )}
    </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    width: "100%",
    height: 300,
    position: "relative",
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoOverlayContainer: {
    padding: 10,
  },
  venueCard: {
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  venueTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  venueDescription: {
    fontSize: 14,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  buttonContainer: {
    alignItems: "center", // Esto centra el botón horizontalmente
    marginTop: 10,
  },
  directionsButton: {
    width: 200, // Opcional: le das un ancho fijo para que se vea uniforme
  },

  fullscreenImage: {
    width: "90%",
    height: "90%",
  },
});
