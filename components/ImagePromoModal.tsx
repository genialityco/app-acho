import React from "react";
import {
  Modal,
  View,
  Image,
  Pressable,
  StyleSheet,
  Linking,
  Text,
  useWindowDimensions,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  imageUri: string; // URL pública de la imagen
  ctaUrl: string;
};

export function ImagePromoModal({ visible, onClose, imageUri, ctaUrl }: Props) {
  const { width, height } = useWindowDimensions();

  // Tamaños responsivos
  const cardWidth = Math.min(width - 32, 420); // 16px padding por lado
  const imageHeight = Math.min(height * 0.55, 420); // 55% alto pantalla, máx 420
  const imageWidth = cardWidth - 24; // por padding interno del card

  const goToPage = async () => {
    const can = await Linking.canOpenURL(ctaUrl);
    if (can) Linking.openURL(ctaUrl);
    else Linking.openURL(ctaUrl);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { width: cardWidth }]}>
          {/* X */}
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          {/* Imagen responsive */}
          <Image
            source={{ uri: imageUri }}
            style={{
              width: imageWidth,
              height: imageHeight,
              borderRadius: 10,
              marginTop: 24,
              marginBottom: 12,
            }}
            resizeMode="contain" // usa "cover" si prefieres que llene recortando
          />

          {/* CTA */}
          <Pressable
            style={[styles.ctaBtn, { width: imageWidth }]}
            onPress={goToPage}
          >
            <Text style={styles.ctaText}>Ir a la página</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.08)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeText: {
    fontSize: 18,
    fontWeight: "700",
  },
  ctaBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#00796b",
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
