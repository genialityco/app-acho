import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Alert,
  Linking,
  Platform,
  ScrollView,
} from "react-native";
import { Card, Text, Button, ActivityIndicator } from "react-native-paper";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { fetchEventById } from "@/services/api/eventService";

interface Event {
  name: string;
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
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

  // Obtener la ubicación actual del usuario
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se pudo acceder a tu ubicación.");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  // Obtener los datos del evento desde el servicio
  useEffect(() => {
    const getEventData = async () => {
      try {
        const response = await fetchEventById(eventId);
        if (response.status === "success" && response.data.location !== null) {
          setEvent(response.data);
        } else {
          setEvent(null);
        }
      } catch (error) {
        console.error(error);
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

  // Función para abrir Google Maps o Apple Maps con indicaciones
  const getDirections = () => {
    if (!location || !event) {
      Alert.alert(
        "Error",
        "No se pudo obtener tu ubicación o los datos del evento."
      );
      return;
    }

    const userLatitude = location.coords.latitude;
    const userLongitude = location.coords.longitude;

    const url = Platform.select({
      ios: `maps://0,0?saddr=${userLatitude},${userLongitude}&daddr=${event.location.coordinates.latitude},${event.location.coordinates.longitude}`,
      android: `google.navigation:q=${event.location.coordinates.latitude},${event.location.coordinates.longitude}&origin=${userLatitude},${userLongitude}`,
    });

    if (url) {
      Linking.openURL(url).catch(() =>
        Alert.alert("Error", "No se pudo abrir la aplicación de mapas.")
      );
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
          {event && (
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
          )}
        </View>

        {/* Información del Evento */}
        <View style={styles.infoOverlayContainer}>
          {event && (
            <Card style={styles.venueCard}>
              <Card.Content>
                <Text style={styles.venueTitle}>{event.name}</Text>
                <Text style={styles.venueDescription}>
                  {event.location.address}
                </Text>
                <Button
                  mode="contained"
                  onPress={getDirections}
                  style={styles.directionsButton}
                >
                  Obtener Indicaciones
                </Button>
              </Card.Content>
            </Card>
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
  infoOverlayContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  venueCard: {
    marginBottom: 16,
    borderRadius: 10,
  },
  venueTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  venueDescription: {
    fontSize: 12,
  },
  directionsButton: {
    marginTop: 10,
  },
});
