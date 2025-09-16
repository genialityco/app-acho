import { searchSpeakers } from "@/services/api/speakerService";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Card, IconButton, Text, ActivityIndicator } from "react-native-paper";

interface Speaker {
  _id: string;
  names: string;
  description: string;
  imageUrl: string;
  location: string;
  isInternational: boolean;
}

export default function Speakers() {
  const { eventId, tab } = useLocalSearchParams();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchSpeakers = async (pageNum: number, reset: boolean = false) => {
    if (pageNum > 1 && !hasMore) return;

    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await searchSpeakers({ 
        eventId: eventId, 
        pageSize: 10, 
        current: pageNum 
      });
      const newSpeakers = response.data.items || [];

      if (reset) {
        setSpeakers(newSpeakers);
      } else {
        setSpeakers((prev) => [...prev, ...newSpeakers]);
      }

      setHasMore(newSpeakers.length === 10);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching speakers:", error);
      if (reset) {
        setSpeakers([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchSpeakers(1, true);
    }
  }, [eventId]);

  const loadMoreSpeakers = () => {
    if (!loadingMore && hasMore) {
      fetchSpeakers(page + 1, false);
    }
  };

  const renderConferencista = ({ item }: { item: Speaker }) => (
    <Card style={styles.card}>
      <TouchableOpacity
        onPress={() =>
          router.push(
            `/${tab}/components/speakerdetail?speakerId=${item._id}&eventId=${eventId}`
          )
        }
      >
        <View style={styles.cardContent}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
          <View style={styles.overlay}>
            <Text style={styles.name}>{item.names}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>
          <IconButton
            icon="eye"
            iconColor="white"
            size={12}
            style={styles.iconButton}
            onPress={() =>
              router.push(
                `/${tab}/components/speakerdetail?speakerId=${item._id}&eventId=${eventId}`
              )
            }
          />
        </View>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" color="#b4d352" />
        <Text>Cargando conferencistas...</Text>
      </View>
    );
  }

  if (speakers.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No hay conferencistas disponibles</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={speakers}
        renderItem={renderConferencista}
        keyExtractor={(item) => item._id.toString()}
        numColumns={2}
        contentContainerStyle={styles.list}
        onEndReached={loadMoreSpeakers}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator animating={true} size="small" color="#b4d352" />
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    paddingBottom: 10,
  },
  card: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    overflow: "scroll",
  },
  cardContent: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 250,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: 5,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "left",
    marginBottom: 5,
  },
  description: {
    fontSize: 10,
    color: "#fff",
    textAlign: "left",
    marginBottom: 10,
  },
  iconButton: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: "center",
  },
});