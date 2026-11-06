import React, { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { Text, Button, ActivityIndicator, Chip } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import {
  fetchPosterById,
  Poster,
  voteForPoster,
} from "@/services/api/posterService";
import { useAuth } from "@/context/AuthContext";
import { getGenPapersSections } from "@/services/api/genPapersService";
import GenPaperDetail from "./GenPaperDetail";
import PosterPdfViewer from "./PosterPdfViewer";

// Los posters de Gen. Papers llegan con slug + paperId; el resto son posters de Mongo.
export default function PosterDetail() {
  const { eventId, slug, paperId } = useLocalSearchParams();
  const section = getGenPapersSections(eventId)?.find((s) => s.slug === slug);
  if (section && paperId) {
    return <GenPaperDetail section={section} paperId={String(paperId)} />;
  }
  return <MongoPosterDetail />;
}

function MongoPosterDetail() {
  const { posterId, hasAlreadyVoted, isMemberActive } = useLocalSearchParams();
  const posterIdString = Array.isArray(posterId) ? posterId[0] : posterId;
  const [poster, setPoster] = useState<Poster | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  const { userId } = useAuth();

  const fetchPoster = async () => {
    try {
      const response = await fetchPosterById(posterIdString);
      setPoster(response.data);

      // Verificar si el usuario ya ha votado
      if (userId && response.data.voters.includes(userId)) {
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
        </View>

        <PosterPdfViewer urlPdf={poster.urlPdf} />
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
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginVertical: 10,
    gap: 10,
  },
  voteButton: {
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
  votedChip: {
    flex: 1,
  },
});
