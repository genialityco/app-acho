import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import {
  Text,
  IconButton,
  ActivityIndicator,
  SegmentedButtons,
} from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import debounce from "lodash.debounce";
import {
  fetchGenPaperFields,
  fetchGenPapers,
  fetchGenPapersEvent,
  formatPaperAttribute,
  GenPaper,
  GenPaperField,
  GenPapersEvent,
  GenPapersSection,
  getStoredGenPaperVote,
  StoredGenPaperVote,
} from "@/services/api/genPapersService";
import { useMemberIdNumber } from "@/hooks/useMemberIdNumber";

const PAGE_SIZE = 10;

// Sin tildes ni mayúsculas, para buscar igual que la web.
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

interface Props {
  eventId: string;
  tab: string;
  sections: GenPapersSection[];
}

export default function GenPapersList({ eventId, tab, sections }: Props) {
  const [slug, setSlug] = useState(sections[0].slug);
  const [event, setEvent] = useState<GenPapersEvent | null>(null);
  const [fields, setFields] = useState<GenPaperField[]>([]);
  const [papers, setPapers] = useState<GenPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [storedVote, setStoredVote] = useState<StoredGenPaperVote | null>(null);
  const idNumber = useMemberIdNumber();

  useEffect(() => {
    const handler = debounce(() => setDebouncedSearchTerm(searchTerm), 500);
    handler();
    return () => handler.cancel();
  }, [searchTerm]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(false);
      setPapers([]);
      try {
        const [eventData, fieldsData, papersData] = await Promise.all([
          fetchGenPapersEvent(slug),
          fetchGenPaperFields(slug),
          fetchGenPapers(slug),
        ]);
        if (cancelled) return;
        setEvent(eventData);
        setFields(fieldsData);
        setPapers(papersData);
      } catch (e) {
        console.error("Error al obtener los posters de Gen. Papers:", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Se relee al volver del detalle, por si el usuario acaba de votar.
  useFocusEffect(
    React.useCallback(() => {
      if (!idNumber) return;
      getStoredGenPaperVote(slug, idNumber).then(setStoredVote);
    }, [slug, idNumber])
  );

  const filtered = useMemo(() => {
    const term = normalize(debouncedSearchTerm.trim());
    const list = term
      ? papers.filter(
          (p) =>
            normalize(p.title).includes(term) ||
            p.authors.some((a) => normalize(a).includes(term)) ||
            normalize(String(p.attributes.codigo ?? "")).includes(term)
        )
      : papers;
    // El póster votado va de primero, como en la lista de Mongo.
    const votedId = storedVote?.paperId;
    const voted = votedId ? list.find((p) => p.id === votedId) : undefined;
    return voted ? [voted, ...list.filter((p) => p.id !== votedId)] : list;
  }, [papers, debouncedSearchTerm, storedVote]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const sectionLabel = sections.find((s) => s.slug === slug)?.label ?? "";

  const changeSection = (value: string) => {
    setSlug(value);
    setStoredVote(null);
    setPage(1);
  };

  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    setPage(1);
  };

  const openPaper = (paper: GenPaper) =>
    router.push(
      `/${tab}/components/posterdetail?eventId=${eventId}&tab=${tab}&slug=${slug}&paperId=${paper.id}` as any
    );

  const paperSubtitle = (paper: GenPaper) =>
    fields
      .filter((f) => f.id !== "anio" && f.id !== "pais")
      .map((f) => {
        const value = formatPaperAttribute(f, paper.attributes[f.id]);
        return value ? (f.id === "codigo" ? `N.º ${value}` : value) : "";
      })
      .filter(Boolean)
      .join(" / ");

  const renderPaper = (paper: GenPaper) => {
    const isVoted = storedVote?.paperId === paper.id;
    return (
      <TouchableOpacity key={paper.id} onPress={() => openPaper(paper)}>
        <View style={[styles.posterCard, isVoted && styles.votedPosterCard]}>
          <View style={styles.posterInfo}>
            <Text style={[styles.posterTitle, isVoted && styles.votedPosterTitle]}>
              {paper.title}
            </Text>
            {paperSubtitle(paper) ? (
              <Text style={styles.posterDetails}>{paperSubtitle(paper)}</Text>
            ) : null}
            <Text style={styles.posterAuthors}>
              Autor(es): {paper.authors.join(", ")}
            </Text>
            {isVoted && <Text style={styles.votedLabel}>Tu voto</Text>}
          </View>
          <IconButton
            icon="eye"
            iconColor="white"
            containerColor="black"
            size={15}
            onPress={() => openPaper(paper)}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={slug}
        onValueChange={changeSection}
        buttons={sections.map((s) => ({ value: s.slug, label: s.label }))}
        style={styles.segmented}
      />
      {!loading && event && (
        <Text style={styles.voteInfo}>
          {!event.votingOpen
            ? `La votación de ${sectionLabel} no está abierta.`
            : storedVote
            ? `Ya votaste en ${sectionLabel} por: ${storedVote.paperTitle}`
            : `Puedes votar por 1 póster de ${sectionLabel}.`}
        </Text>
      )}
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar por título, autor o número..."
        placeholderTextColor="#888"
        value={searchTerm}
        onChangeText={handleSearchChange}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
          <Text>Cargando posters...</Text>
        </View>
      ) : error ? (
        <View style={styles.noResultsContainer}>
          <Text>No se pudieron cargar los posters.</Text>
        </View>
      ) : pageItems.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text>No se encontraron posters.</Text>
        </View>
      ) : (
        <ScrollView>{pageItems.map(renderPaper)}</ScrollView>
      )}
      {pageItems.length > 0 && (
        <View style={styles.paginationContainer}>
          <IconButton
            icon="chevron-left"
            onPress={() => setPage(page - 1)}
            disabled={page === 1}
          />
          <Text>{`Página ${page} de ${totalPages}`}</Text>
          <IconButton
            icon="chevron-right"
            onPress={() => setPage(page + 1)}
            disabled={page === totalPages}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  segmented: {
    marginHorizontal: 10,
    marginTop: 10,
  },
  voteInfo: {
    marginHorizontal: 10,
    marginTop: 8,
    fontSize: 12,
    color: "#555",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    margin: 10,
  },
  posterCard: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  votedPosterCard: {
    backgroundColor: "#d1f7c4",
    borderColor: "#4caf50",
  },
  posterInfo: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 5,
  },
  posterTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  votedPosterTitle: {
    color: "#4caf50",
  },
  votedLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#4caf50",
    fontWeight: "bold",
  },
  posterDetails: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },
  posterAuthors: {
    fontSize: 12,
    marginTop: 5,
    color: "#555",
  },
  paginationContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
