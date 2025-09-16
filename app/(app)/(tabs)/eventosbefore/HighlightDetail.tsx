import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  TouchableOpacity,
  Animated,
  ScrollView // Agregamos ScrollView
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { fetchHighlightById, Highlight } from "@/services/api/highlightService";

type RouteParams = {
  params: {
    id: string;
    time?: string;
  };
};

export default function HighlightDetail() {
  const route = useRoute<RouteProp<RouteParams, "params">>();
  const { id, time } = route.params;
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [loading, setLoading] = useState(true);
  const [accordionExpanded, setAccordionExpanded] = useState(true);
  const [accordionAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (id) {
      getHighlightDetails();
    }
  }, [id]);

  const getHighlightDetails = async () => {
    try {
      setLoading(true);
      const result = await fetchHighlightById(id);
      setHighlight(result);
    } catch (error) {
      console.error("Error al obtener los detalles del highlight:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = () => {
    const toValue = accordionExpanded ? 0 : 1;
    setAccordionExpanded(!accordionExpanded);
    
    Animated.timing(accordionAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004D73" />
      </View>
    );
  }

  if (!highlight) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          No se encontraron detalles del highlight.
        </Text>
      </View>
    );
  }

  const videoUrl = time
    ? `${highlight.vimeoUrl}?autoplay=1#t=${time.replace(":", "m").replace(":", "s")}`
    : highlight.vimeoUrl + "?autoplay=1";

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <WebView
          source={{ uri: videoUrl }}
          style={styles.video}
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>

      <View style={styles.accordionContainer}>
        <TouchableOpacity 
          style={styles.accordionHeader} 
          onPress={toggleAccordion}
          activeOpacity={0.8}
        >
          <Text style={styles.accordionHeaderText}>Información del Video</Text>
          <Text style={styles.accordionIcon}>
            {accordionExpanded ? "▼" : "▲"}
          </Text>
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.accordionContent,
            {
              maxHeight: accordionAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 500], // Aumentamos el maxHeight para más contenido
              }),
              opacity: accordionAnimation,
            }
          ]}
        >
          <ScrollView // Agregamos ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.infoContent}>
              <Text style={styles.title}>{highlight.name}</Text>
              <Text style={styles.eventName}>
                {highlight.eventId
                  ? `Evento: ${highlight.eventId.name}`
                  : "Evento no especificado"}
              </Text>
              <Text style={styles.description}>{highlight.description}</Text>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
    minHeight: 200,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  accordionContainer: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 0,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  accordionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  accordionIcon: {
    fontSize: 16,
    color: "#00FFFF",
    fontWeight: "bold",
  },
  accordionContent: {
    overflow: "hidden", // Cambiamos de 'scroll' a 'hidden' ya que el scroll lo maneja ScrollView
    
  },
  scrollView: {
    flexGrow: 0, // Evita que el ScrollView crezca más de lo necesario
  },
  scrollViewContent: {
    paddingBottom: 80, // Padding inferior para evitar que el menú oculte contenido
  },
  infoContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  eventName: {
    fontSize: 16,
    color: "#00FFFF",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#B22222",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});