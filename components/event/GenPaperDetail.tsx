import React, { useEffect, useState } from "react";
import { ScrollView, View, StyleSheet, Alert } from "react-native";
import { Text, Button, ActivityIndicator, Chip } from "react-native-paper";
import {
  castGenPaperVote,
  fetchGenPaperById,
  fetchGenPaperFields,
  fetchGenPapersEvent,
  formatPaperAttribute,
  GenPaper,
  GenPaperField,
  GenPapersEvent,
  GenPapersSection,
  GenPapersVoteError,
  getStoredGenPaperVote,
  storeGenPaperVote,
  StoredGenPaperVote,
} from "@/services/api/genPapersService";
import { useMemberIdNumber } from "@/hooks/useMemberIdNumber";
import PosterPdfViewer from "./PosterPdfViewer";

interface Props {
  section: GenPapersSection;
  paperId: string;
}

export default function GenPaperDetail({ section, paperId }: Props) {
  const { slug, label } = section;
  const [paper, setPaper] = useState<GenPaper | null>(null);
  const [event, setEvent] = useState<GenPapersEvent | null>(null);
  const [fields, setFields] = useState<GenPaperField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoteLoading, setIsVoteLoading] = useState(false);
  const [storedVote, setStoredVote] = useState<StoredGenPaperVote | null>(null);
  const idNumber = useMemberIdNumber();

  useEffect(() => {
    const load = async () => {
      try {
        const [paperData, eventData, fieldsData] = await Promise.all([
          fetchGenPaperById(slug, paperId),
          fetchGenPapersEvent(slug),
          fetchGenPaperFields(slug),
        ]);
        setPaper(paperData);
        setEvent(eventData);
        setFields(fieldsData);
      } catch (error) {
        console.error("Error al obtener el póster de Gen. Papers:", error);
        Alert.alert("Error", "No se pudo obtener el póster.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [slug, paperId]);

  useEffect(() => {
    if (!idNumber) return;
    getStoredGenPaperVote(slug, idNumber).then(setStoredVote);
  }, [slug, idNumber]);

  const rememberVote = (vote: StoredGenPaperVote) => {
    setStoredVote(vote);
    if (idNumber) storeGenPaperVote(slug, idNumber, vote);
  };

  const submitVote = async () => {
    if (!paper || !idNumber) return;
    setIsVoteLoading(true);
    try {
      await castGenPaperVote(slug, idNumber, paper.id);
      rememberVote({ paperId: paper.id, paperTitle: paper.title });
      Alert.alert("Voto registrado", `Has votado por el póster ${paper.title}`);
    } catch (error) {
      if (error instanceof GenPapersVoteError && error.code === "already-exists") {
        const paperTitle = error.paperTitle || "";
        rememberVote({
          paperId: paperTitle === paper.title ? paper.id : undefined,
          paperTitle,
        });
        Alert.alert(
          "Ya votaste",
          paperTitle
            ? `Ya votaste en ${label} por: ${paperTitle}`
            : `Ya registraste tu voto en ${label}.`
        );
      } else {
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "No se pudo registrar tu voto. Inténtalo de nuevo."
        );
      }
    } finally {
      setIsVoteLoading(false);
    }
  };

  const handleVote = () => {
    if (!idNumber) {
      Alert.alert(
        "Sin documento",
        "Tu perfil no tiene número de documento. Actualízalo en Mi perfil para poder votar."
      );
      return;
    }
    Alert.alert(
      "Confirmar voto",
      `Solo puedes votar por 1 póster de ${label}. ¿Confirmas tu voto por "${paper?.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Votar", onPress: submitVote },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Cargando póster...</Text>
      </View>
    );
  }

  if (!paper) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No se encontró el póster.</Text>
      </View>
    );
  }

  const details = fields
    .map((f) => {
      const value = formatPaperAttribute(f, paper.attributes[f.id]);
      return value ? `${f.label}: ${value}` : "";
    })
    .filter(Boolean);
  const votedThis = storedVote?.paperId === paper.id;
  const votingStatus = event?.votingStatus ?? "upcoming";
  const votingOpen = votingStatus === "open";

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.posterDetails}>{label}</Text>
        <Text style={styles.header}>{paper.title}</Text>
        <Text style={styles.authors}>Autor(es): {paper.authors.join(", ")}</Text>
        {paper.institution ? (
          <Text style={styles.authors}>{paper.institution}</Text>
        ) : null}
        {details.length > 0 && (
          <Text style={styles.posterDetails}>{details.join(" · ")}</Text>
        )}

        <View style={styles.buttonContainer}>
          {votedThis ? (
            <Chip icon="information" style={styles.votedChip}>
              Has votado por este póster
            </Chip>
          ) : votingStatus !== "upcoming" ? (
            <Button
              mode="contained"
              onPress={handleVote}
              loading={isVoteLoading}
              disabled={isVoteLoading || !votingOpen || !!storedVote}
              style={styles.voteButton}
            >
              {votingStatus === "closed"
                ? "La votación ha cerrado"
                : storedVote
                ? `Ya votaste en ${label}`
                : "Votar por este poster"}
            </Button>
          ) : null}
          {storedVote && !votedThis && storedVote.paperTitle ? (
            <Text style={styles.votedNote}>
              Tu voto en {label}: {storedVote.paperTitle}
            </Text>
          ) : null}
        </View>

        <PosterPdfViewer urlPdf={paper.urlPdf} />
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
  votedNote: {
    fontSize: 12,
    color: "#555",
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
