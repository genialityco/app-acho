import { View, TouchableOpacity, Image, StyleSheet } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native"; // Importa el hook para la navegación
import { router } from "expo-router";

interface Highlight {
  id: string;
  title: string;
  image: any;
}

export default function RenderHighlights({
  highlights,
}: {
  highlights: Highlight[];
}) {
  const navigation = useNavigation(); // Hook para acceder a la navegación

  return highlights.map((highlight) => (
    <TouchableOpacity
      key={highlight.id}
      style={styles.highlightCard}
      onPress={() => {
        router.push(`/eventosbefore/HighlightDetail?id=${highlight.id}`);
      }}
    >
      <Image source={highlight.image} style={styles.image} />
      <View style={styles.textOverlay}>
        <Text style={styles.text}>{highlight.title}</Text>
        <Text  style={styles.textEvent}>
          Nombre evento
        </Text>
      </View>
      <IconButton
        icon="pencil"
        size={20}
        style={styles.iconButton}
        onPress={() => {
          console.log(`Edit ${highlight.title}`);
        }}
      />
    </TouchableOpacity>
  ));
}

const styles = StyleSheet.create({
  highlightCard: {
    width: "47%",
    height: 180,
    marginBottom: 16,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  textOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  text: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  textEvent: {
    color: "#b4d352",
    fontWeight: "bold",
    fontSize: 10,
  },
  iconButton: {
    backgroundColor: "#E0E0E0",
    borderRadius: 50,
  },
});
