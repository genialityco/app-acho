import React, { useEffect, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { RouteProp, useRoute } from "@react-navigation/native";
import { searchHighlights } from "@/services/api/highlightService";

export interface Highlight {
  _id: string;
  name: string;
  eventId: string;
  description: string;
  imageUrl: string;
  vimeoUrl: string;
  transcription: string;
  createdAt?: string;
  updatedAt?: string;
  transcriptionMatches?: { time: string; phrase: string }[];
}

type RouteParams = {
  params: {
    eventId: string;
  };
};

export default function Highlights() {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const { eventId } = route.params;

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [filteredHighlights, setFilteredHighlights] = useState<Highlight[]>([]);
  const [searchText, setSearchText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [showAllMatches, setShowAllMatches] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (eventId) {
      fetchHighlightsData(1, true);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [eventId]);

  const fetchHighlightsData = async (pageNum: number, reset: boolean = false, searchQuery?: string) => {
    if (pageNum > 1 && !hasMore) return;

    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = {
        pageSize: 10,
        current: pageNum,
        filters: [
          {
            field: "eventId",
            operator: "eq",
            value: eventId,
          },
        ] as any[],
      };

      if (searchQuery && searchQuery.trim() !== "") {
        params.filters.push({
          field: "name",
          operator: "contains",
          value: searchQuery.trim(),
        });
      }

      const results = await searchHighlights(params);
      const newHighlights = results?.data?.items || [];
      
      if (reset) {
        setHighlights(newHighlights);
        setFilteredHighlights(newHighlights);
        setShowAllMatches({});
      } else {
        setHighlights((prev) => [...prev, ...newHighlights]);
        setFilteredHighlights((prev) => [...prev, ...newHighlights]);
      }

      setHasMore(newHighlights.length === params.pageSize);
      setPage(pageNum);
    } catch (error) {
      console.error("Error al obtener las Memorias:", error);
      if (reset) {
        setHighlights([]);
        setFilteredHighlights([]);
        setShowAllMatches({});
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatTimeForVimeo = (time: string) => {
    const [hours, minutes, seconds] = time.split(":");
    const secondsWithoutMs = Math.floor(parseFloat(seconds));
    if (hours === "00") {
      return `${parseInt(minutes, 10)}m${secondsWithoutMs}s`;
    }
    return `${parseInt(hours, 10)}h${parseInt(minutes, 10)}m${secondsWithoutMs}s`;
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) ? (
        <Text key={index} style={{ backgroundColor: "#ffeb3b", fontWeight: "bold" }}>
          {part}
        </Text>
      ) : (
        <Text key={index}>{part}</Text>
      )
    );
  };

  const handleSearch = (text: string) => {
    setSearchText(text);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (text.trim() === "") {
      fetchHighlightsData(1, true);
    } else {
      const timeoutId = setTimeout(() => {
        const filtered = highlights
          .map((highlight) => {
            let matches: { time: string; phrase: string }[] = [];
            if (highlight.transcription) {
              const lines = highlight.transcription.split("\n");
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].toLowerCase().includes(text.toLowerCase())) {
                  const timeMatch = lines[i - 1]?.match(/(\d{2}:\d{2}:\d{2}\.\d{3})/);
                  if (timeMatch) {
                    matches.push({
                      time: formatTimeForVimeo(timeMatch[1]),
                      phrase: lines[i],
                    });
                  }
                }
              }
            }
            const isMatch =
              highlight.name.toLowerCase().includes(text.toLowerCase()) ||
              highlight.description.toLowerCase().includes(text.toLowerCase()) ||
              matches.length > 0;
            return isMatch ? { ...highlight, transcriptionMatches: matches } : null;
          })
          .filter((item) => item !== null);
        setFilteredHighlights(filtered as Highlight[]);
        setShowAllMatches({});
      }, 500);

      setSearchTimeout(timeoutId);
    }
  };

  const loadMoreHighlights = () => {
    if (!loadingMore && hasMore) {
      fetchHighlightsData(page + 1, false, searchText);
    }
  };

  const toggleShowMatches = (highlightId: string) => {
    setShowAllMatches((prev) => ({
      ...prev,
      [highlightId]: !prev[highlightId],
    }));
  };

  const renderItem = ({ item }: { item: Highlight }) => {
    const matches = item.transcriptionMatches ?? [];
    const showAll = showAllMatches[item._id] || false;
    const displayedMatches = showAll ? matches : matches;

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.highlightCard}
          onPress={() => router.push(`/eventosbefore/HighlightDetail?id=${item._id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.videoContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnailImage} />
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.titleText} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.descriptionText} numberOfLines={3}>
              {item.description}
            </Text>
          </View>
        </TouchableOpacity>
        {matches.length > 0 && (
          <View style={styles.matchesFooter}>
            <ScrollView
              style={styles.matchesScroll}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {displayedMatches.map((match, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    router.push(`/eventosbefore/HighlightDetail?id=${item._id}&time=${match.time}`);
                  }}
                >
                  <Text style={styles.matchText}>
                    {`[${match.time}] `}
                    {highlightText(match.phrase, searchText)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar en memorias..."
        placeholderTextColor="#999"
        value={searchText}
        onChangeText={handleSearch}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b4d352" />
        </View>
      ) : filteredHighlights.length === 0 ? (
        <View style={styles.noHighlightsContainer}>
          <Text style={styles.noHighlightsText}>
            {searchText ? "No se encontraron memorias." : "No hay memorias disponibles para este evento."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHighlights}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onEndReached={loadMoreHighlights}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#b4d352" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  searchBar: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  separator: {
    height: 12,
  },
  itemContainer: {
    marginHorizontal: 4,
  },
  highlightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 120,
    maxHeight: 140,
  },
  videoContainer: {
    width: 140,
    minHeight: 120,
    maxHeight: '100%',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  matchesFooter: {
    marginTop: 2,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
  },
  matchesScroll: {
    flex: 1,
  },
  matchText: {
    color: '#ff9800',
    fontSize: 13,
    marginBottom: 4,
    paddingVertical: 2,
  },
  toggleButtonText: {
    color: '#007bff',
    fontSize: 13,
    fontWeight: '600',
    marginVertical: 4,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noHighlightsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noHighlightsText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    lineHeight: 24,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});