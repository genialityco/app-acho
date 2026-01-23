import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Linking,
  Share,
  FlatList,
} from "react-native";
import { ActivityIndicator, Button, List, Text } from "react-native-paper";
import WebView from "react-native-webview";
import { fetchNewsById, News } from "@/services/api/newsService";
import {
  createAttendee,
  searchAttendees,
  deleteAttendee,
} from "@/services/api/attendeeService";
import { searchMembers } from "@/services/api/memberService";
import { useAuth } from "@/context/AuthContext";

function normalizeMediaUrl(url: any): string | null {
  if (typeof url !== "string") return null;

  let u = url.trim();
  if (!u || u.toLowerCase() === "null") return null;

  // %25XX -> %XX (por ejemplo %2520 -> %20)
  u = u.replace(/%25([0-9A-Fa-f]{2})/g, "%$1");

  // espacios sueltos -> %20
  u = u.replace(/ /g, "%20");

  return u;
}

function normalizeVideos(html: string) {
  if (!html) return html;

  // Caso 1: <video src="..."></video>
  let out = html.replace(
    /<video([^>]*?)\ssrc="([^"]+)"([^>]*)>\s*<\/video>/gi,
    (_match, pre, src, post) => {
      const safeSrc = normalizeMediaUrl(src);
      if (!safeSrc) return ""; // no renderizar videos rotos

      const prePost = `${pre} ${post}`;

      // Unifica style
      const styleMatch = prePost.match(/\sstyle="([^"]*)"/i);
      const existingStyle = styleMatch?.[1] ?? "";
      const mergedStyle =
        `${existingStyle}; max-width:100%; display:block; margin:10px auto; background:#000;`
          .replace(/;;+/g, ";")
          .trim();

      // Quitamos el style anterior para no duplicar y lo ponemos mergeado
      const prePostNoStyle = prePost.replace(/\sstyle="[^"]*"/i, "");

      return `
<video ${prePostNoStyle}
  controls
  muted
  playsinline
  webkit-playsinline
  preload="metadata"
  style="${mergedStyle}"
>
  <source src="${safeSrc}" type="video/mp4" />
</video>
      `.trim();
    },
  );

  out = out.replace(
    /<source([^>]*?)\ssrc="([^"]+)"([^>]*?)\/?>/gi,
    (_m, a, src, b) => {
      const safeSrc = normalizeMediaUrl(src);
      if (!safeSrc) return ""; // elimina source inválido
      return `<source${a} src="${safeSrc}"${b} />`;
    },
  );

  return out;
}

function wrapHtml(bodyHtml: string) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
    />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; padding: 0; margin: 0; }
      img { max-width: 100%; height: auto; }
      video { background: #000; width: 100%; }
      a { color: #007BFF; }
    </style>
  </head>
  <body>
    ${bodyHtml || ""}
  </body>
</html>
  `.trim();
}

function NoveltyScreen() {
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const { newId } = useLocalSearchParams();

  const { userId } = useAuth();
  const [attendedId, setAttendeeId] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [isMemberActive, setIsMemberActive] = useState(false);

  useEffect(() => {
    if (newId) getNews();
  }, [newId]);

  useEffect(() => {
    getMemberStatus();
  }, [userId]);

  useEffect(() => {
    if (news?.eventId) getAttendeeData(news.eventId);
  }, [news?.eventId]);

  const handleOpenDocument = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn("No se puede abrir la URL:", url);
      }
    } catch (err) {
      console.error("Error al abrir documento:", err);
    }
  }, []);

  const handleShareDocument = useCallback(async (url: string) => {
    try {
      await Share.share({
        url,
        message: `Échale un vistazo a este documento: ${url}`,
      });
    } catch (err) {
      console.error("Error al compartir documento:", err);
    }
  }, []);

  const getMemberStatus = async () => {
    try {
      const filters = { userId };
      const response = await searchMembers(filters);
      if (response.status === "success" && response.data.items.length > 0) {
        setIsMemberActive(response.data.items[0].memberActive);
        setMemberId(response.data.items[0]._id);
      }
    } catch (error) {
      console.error("Error al verificar membresía:", error);
    }
  };

  const getAttendeeData = async (eventId: string) => {
    try {
      const filters = { userId, eventId };
      const response = await searchAttendees(filters);
      if (response.status === "success" && response.data.items.length > 0) {
        setAttendeeId(response.data.items[0]._id);
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
      }
    } catch (error) {
      console.error("Error al obtener el estado de inscripción:", error);
    }
  };

  const getNews = async () => {
    try {
      const response = await fetchNewsById(newId as string);
      setNews(response.data);
    } catch (error) {
      console.error("Error al obtener la novedad:", error);
    } finally {
      setLoading(false);
    }
  };

  const modifiedContent = useMemo(() => {
    const base = news?.eventId
      ? news.content.replace(
          /(- Miembros activos ACHO - GRATIS)(\s*<\/br>)/,
          `$1 
        ${
          isMemberActive
            ? `<a href="#" id="registerMember" style="color: #007BFF; text-decoration: underline; margin-left: 10px;">
                ${
                  isRegistered
                    ? "Ya estás inscrito, cancelar inscripción"
                    : "Inscribirme como miembro activo"
                }
              </a>`
            : ""
        }$2`
      ) +
      `
    <script>
      document.addEventListener("DOMContentLoaded", function() {
        var registerLink = document.getElementById("registerMember");
        function updateRegisterText(isRegistered) {
          if (registerLink) {
            registerLink.innerText = isRegistered
              ? "Ya estás inscrito, cancelar inscripción"
              : "Inscribirme como miembro activo";
          }
        }

        if (registerLink) {
          registerLink.addEventListener("click", function(event) {
            event.preventDefault();
            if (registerLink.innerText === "Inscribirme como miembro activo") {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                action: "register",
                userId: "${userId}",
                eventId: "${news.eventId}"
              }));
            } else if (registerLink.innerText === "Ya estás inscrito, cancelar inscripción") {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                action: "unregister",
                attendeeId: "${attendedId}"
              }));
            }
          });
        }

        window.addEventListener("message", function(event) {
          try {
            var message = JSON.parse(event.data);
            if (message.action === "updateRegisterStatus") {
              updateRegisterText(message.isRegistered);
            }
          } catch (error) {
            console.error("Error al actualizar el estado de inscripción:", error);
          }
        });
      });
    </script>
    `
    : news?.content || "";

    const normalized = normalizeVideos(base);
    return wrapHtml(normalized);
  }, [
    news?.content,
    news?.eventId,
    isMemberActive,
    isRegistered,
    userId,
    attendedId,
  ]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  if (!news) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudo cargar la novedad.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {typeof news.featuredImage === "string" && (
        <Image
          source={{ uri: news.featuredImage }}
          style={styles.headerImage}
        />
      )}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{news.title}</Text>
        <WebView
          originWhitelist={["*"]}
          source={{ html: modifiedContent }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          mediaPlaybackRequiresUserAction={true}
          mixedContentMode="always"
          onMessage={async (event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data);

              if (message.action === "register") {
                setIsLoading(true);
                await createAttendee({
                  userId: message.userId,
                  eventId: message.eventId,
                  memberId,
                  attended: false,
                });
                setIsRegistered(true);
                getAttendeeData(message.eventId);
              }

              if (message.action === "unregister") {
                setIsLoading(true);
                await deleteAttendee(attendedId);
                setIsRegistered(false);
                setAttendeeId("");
              }
            } catch (error) {
              console.error(
                "Error al procesar el mensaje desde WebView:",
                error
              );
            } finally {
              setIsLoading(false);
            }
          }}
        />
        {/* Nueva sección de Documentos */}
        {news.documents && news.documents.length > 0 && (
          <View style={styles.documentsContainer}>
            <Text style={styles.documentsTitle}>Documentos</Text>
            <FlatList
              data={news.documents}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <List.Item
                  title={item.name}
                  description={item.type}
                  onPress={() => handleOpenDocument(item.url)}
                  right={() => (
                    <Button
                      compact
                      onPress={() => handleShareDocument(item.url)}
                    >
                      Compartir
                    </Button>
                  )}
                />
              )}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  headerImage: {
    width: "100%",
    height: 160,
    marginBottom: 20,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -30,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#B22222",
  },
  documentsContainer: {
    marginTop: 24,
    marginBottom: 8,
  },
  documentsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
});

export default NoveltyScreen;
