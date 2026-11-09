import React from "react";
import {
  Modal,
  View,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";

import { useOpenAppLink } from "@/utils/appLinks";

type Props = {
  visible: boolean;
  onClose: () => void;
  imageUri?: string; // URL pública de la imagen
  videoUri?: string; // URL pública del video
  // Enlaces configurables desde el CMS: https://... o achoapp://... (ver utils/appLinks.ts)
  imageOnPressUrl?: string; // Enlace al presionar la imagen (vacío = sin acción)
  ctaUrl?: string; // Enlace del botón
  ctaText?: string; // Texto del botón (default: "Ir a la página")
  showButton?: boolean; // Mostrar botón CTA (default: false)
};

export function ImagePromoModal({
  visible,
  onClose,
  imageUri,
  videoUri,
  imageOnPressUrl,
  ctaUrl,
  ctaText,
  showButton = false,
}: Props) {
  const openAppLink = useOpenAppLink();
  const { width, height } = useWindowDimensions();

  // Tamaños responsivos - aumentamos altura para acomodar controles del video
  const cardWidth = Math.min(width - 32, 420); // 16px padding por lado
  const mediaHeight = Math.min(height * 0.6, 450); // 60% alto pantalla, máx 450
  const mediaWidth = cardWidth - 24; // por padding interno del card

  const openLink = async (url?: string) => {
    if (!url || !url.trim()) return;
    // Se cierra el modal antes de navegar para que la pantalla destino quede visible
    onClose();
    try {
      await openAppLink(url);
    } catch (error) {
      console.error("Error al abrir el enlace del modal promo:", error);
    }
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
        <video controls playsinline webkit-playsinline preload="metadata" style="width: 100%; height: 100%;">
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
                style={{ flex: 1, width: "100%", height: "100%", backgroundColor: "#000" }}
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={false}
                nestedScrollEnabled={false}
                originWhitelist={["*"]}
                mixedContentMode="always"
              />
            </View>
          ) : (
            <Pressable
              onPress={() => openLink(imageOnPressUrl)}
              disabled={!imageOnPressUrl}
            >
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
              onPress={() => openLink(ctaUrl)}
            >
              <Text style={styles.ctaText}>{ctaText?.trim() || "Ir a la página"}</Text>
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
