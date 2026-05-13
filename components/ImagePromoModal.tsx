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
import { WebView } from "react-native-webview";

type Props = {
  visible: boolean;
  onClose: () => void;
  imageUri?: string; // URL pública de la imagen
  videoUri?: string; // URL pública del video
  imageOnPressUrl: string; // URL que se abre al presionar la imagen/video
  ctaUrl?: string; // URL que se abre al presionar el botón
  showButton?: boolean; // Mostrar botón CTA (default: false)
};

export function ImagePromoModal({
  visible,
  onClose,
  imageUri,
  videoUri,
  imageOnPressUrl,
  ctaUrl,
  showButton = false,
}: Props) {
  const { width, height } = useWindowDimensions();

  // Tamaños responsivos - aumentamos altura para acomodar controles del video
  const cardWidth = Math.min(width - 32, 420); // 16px padding por lado
  const mediaHeight = Math.min(height * 0.6, 450); // 60% alto pantalla, máx 450
  const mediaWidth = cardWidth - 24; // por padding interno del card

  const openMediaUrl = async () => {
    const can = await Linking.canOpenURL(imageOnPressUrl);
    if (can) Linking.openURL(imageOnPressUrl);
    else Linking.openURL(imageOnPressUrl);
  };

  const openCtaUrl = async () => {
    if (!ctaUrl) return;
    const can = await Linking.canOpenURL(ctaUrl);
    if (can) Linking.openURL(ctaUrl);
    else Linking.openURL(ctaUrl);
  };

  const videoHtml = videoUri
    ? `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
        <style>
          * { box-sizing: border-box; }
          html, body { 
            margin: 0; 
            padding: 0; 
            width: 100%; 
            height: 100%; 
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          video { 
            width: 100%;
            height: 100%; 
            object-fit: contain;
            max-width: 100%;
            max-height: 100%;
          }
        </style>
      </head>
      <body>
        <video controls preload="metadata" style="width: 100%; height: 100%;">
          <source src="${videoUri}" type="video/mp4" />
          Tu navegador no soporta videos HTML5.
        </video>
      </body>
    </html>
    `
    : "";

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.card, { width: cardWidth, maxHeight: height * 0.85 }]}
        >
          {/* X */}
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          {/* Video o Imagen */}
          {videoUri ? (
            <View
              style={{
                marginTop: 24,
                marginBottom: 12,
                borderRadius: 10,
                overflow: "hidden",
                width: mediaWidth,
                height: mediaHeight,
                backgroundColor: "#000",
              }}
            >
              <WebView
                source={{ html: videoHtml }}
                style={{ flex: 1, width: "100%", height: "100%" }}
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                allowsFullscreenVideo={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={false}
                nestedScrollEnabled={false}
              />
            </View>
          ) : (
            <Pressable onPress={openMediaUrl}>
              <Image
                source={{ uri: imageUri }}
                style={{
                  width: mediaWidth,
                  height: mediaHeight,
                  borderRadius: 10,
                  marginTop: 24,
                  marginBottom: 12,
                }}
                resizeMode="contain"
              />
            </Pressable>
          )}

          {/* CTA - opcional */}
          {showButton && (
            <Pressable
              style={[styles.ctaBtn, { width: mediaWidth }]}
              onPress={openCtaUrl}
            >
              <Text style={styles.ctaText}>Ir a la página</Text>
            </Pressable>
          )}
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
    marginBottom: 12,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
