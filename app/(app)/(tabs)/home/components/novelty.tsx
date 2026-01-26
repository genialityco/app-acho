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

/**
 * Normaliza URLs para evitar problemas típicos en iOS/WebView
 * - corrige doble encoding (%2520 -> %20)
 * - reemplaza espacios por %20
 */
function normalizeMediaUrl(url: any): string | null {
  if (typeof url !== "string") return null;

  let u = url.trim();
  if (!u || u.toLowerCase() === "null") return null;

  // %25XX -> %XX (ej: %2520 -> %20)
  u = u.replace(/%25([0-9A-Fa-f]{2})/g, "%$1");

  // espacios -> %20
  u = u.replace(/ /g, "%20");

  return u;
}

/**
 * Convierte <video src="..."></video> a un bloque robusto con:
 * - <video controls playsinline webkit-playsinline preload="metadata" muted>
 * - <source src="..." type="video/mp4" />
 * y agrega overlay "Cargando" + "Toca para reproducir"
 *
 * Además:
 * - normaliza <source src="..."> si ya viene incluido
 */
function normalizeVideos(html: string) {
  if (!html) return html;

  // Caso A: <video ... src="...">...</video>  (sin <source>)
  let out = html.replace(
    /<video([^>]*?)\ssrc="([^"]+)"([^>]*)>\s*<\/video>/gi,
    (_match, pre, src, post) => {
      const safeSrc = normalizeMediaUrl(src);
      if (!safeSrc) return "";

      // Quitamos atributos que no queremos duplicar o que estorban
      const rawAttrs = `${pre || ""} ${post || ""}`
        .replace(/\sstyle="[^"]*"/gi, "")
        .replace(/\sautoplay(="")?/gi, "")
        .replace(/\sloop(="")?/gi, "")
        .replace(/\smuted(="")?/gi, "")
        .replace(/\splaysinline(="")?/gi, "")
        .replace(/\swebkit-playsinline(="")?/gi, "")
        .replace(/\spreload="[^"]*"/gi, "")
        .replace(/\scontrols(="")?/gi, "")
        .trim();

      return `
<div class="videoWrap">
  <video ${rawAttrs}
    controls
    muted
    playsinline
    webkit-playsinline
    preload="metadata"
  >
    <source src="${safeSrc}" type="video/mp4" />
  </video>

  <div class="videoLoader">Cargando video…</div>
  <button class="tapToPlay" type="button">Toca para reproducir</button>
</div>
      `.trim();
    },
  );

  // Caso B: normaliza cualquier <source src="..."> existente
  out = out.replace(
    /<source([^>]*?)\ssrc="([^"]+)"([^>]*?)\/?>/gi,
    (_m, a, src, b) => {
      const safeSrc = normalizeMediaUrl(src);
      if (!safeSrc) return "";
      const attrs = `${a || ""} ${b || ""}`.trim();

      // Si no tiene type, forzamos video/mp4 (siempre y cuando sea mp4 en tu backend)
      const hasType = /type\s*=/i.test(attrs);
      return `<source${a || ""} src="${safeSrc}"${b || ""}${
        hasType ? "" : ' type="video/mp4"'
      } />`;
    },
  );

  // Caso C: si existe <video>...</video> sin wrapper, lo envolvemos
  // (evita envolver si ya viene dentro de un .videoWrap)
  out = out.replace(
    /(<div[^>]*class="[^"]*videoWrap[^"]*"[^>]*>[\s\S]*?<\/div>)|(<video[\s\S]*?<\/video>)/gi,
    (match, wrapped, plainVideo) => {
      if (wrapped) return wrapped;
      if (!plainVideo) return match;

      let fixed = plainVideo;

      // Asegura atributos iOS
      if (!/controls/i.test(fixed))
        fixed = fixed.replace("<video", "<video controls");
      if (!/muted/i.test(fixed))
        fixed = fixed.replace("<video", "<video muted");
      if (!/playsinline/i.test(fixed))
        fixed = fixed.replace("<video", "<video playsinline");
      if (!/webkit-playsinline/i.test(fixed))
        fixed = fixed.replace("<video", "<video webkit-playsinline");
      if (!/preload=/i.test(fixed))
        fixed = fixed.replace("<video", '<video preload="metadata"');

      return `
<div class="videoWrap">
  ${fixed}
  <div class="videoLoader">Cargando video…</div>
  <button class="tapToPlay" type="button">Toca para reproducir</button>
</div>
      `.trim();
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; padding: 0; margin: 0; }
      img { max-width: 100%; height: auto; }
      a { color: #007BFF; }

      .videoWrap { position: relative; width: 100%; margin: 10px auto; }
      .videoWrap video { width: 100%; max-width: 100%; display: block; background: #000; }
      .videoLoader {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.35);
        color: #fff; font-size: 16px; font-family: Arial;
        pointer-events: none;
      }
      .tapToPlay {
        position: absolute; inset: 0;
        display: none;
        border: 0; background: rgba(0,0,0,0.35);
        color: #fff; font-size: 16px; font-family: Arial;
      }
    </style>
  </head>
  <body>
    ${bodyHtml || ""}

    <script>
      (function () {
        function initWrap(wrap) {
          var v = wrap.querySelector("video");
          var loader = wrap.querySelector(".videoLoader");
          var tapBtn = wrap.querySelector(".tapToPlay");
          if (!v || !loader || !tapBtn) return;

          function hideAll() { loader.style.display = "none"; tapBtn.style.display = "none"; }
          function showLoader(txt){ loader.style.display = "flex"; loader.innerText = txt || "Cargando video…"; tapBtn.style.display = "none"; }
          function showTap(txt){ loader.style.display = "none"; tapBtn.style.display = "block"; if (txt) tapBtn.innerText = txt; }

          showLoader("Cargando video…");

          var fallback = setTimeout(function(){ showTap(); }, 6000);

          ["loadedmetadata","loadeddata","canplay","playing"].forEach(function(ev){
            v.addEventListener(ev, function(){
              clearTimeout(fallback);
              hideAll();
            }, { once: true });
          });

          v.addEventListener("waiting", function(){ showLoader("Cargando…"); });
          v.addEventListener("stalled", function(){ showLoader("La conexión está lenta…"); });
          v.addEventListener("error", function(){
            clearTimeout(fallback);
            showTap("No se pudo cargar. Toca para reintentar");
          });

          tapBtn.addEventListener("click", function () {
            try { v.play(); } catch(e) {}
          });
        }

        var wraps = document.querySelectorAll(".videoWrap");
        for (var i = 0; i < wraps.length; i++) initWrap(wraps[i]);
      })();
    </script>
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

  const [memberId, setMemberId] = useState("");
  const [isMemberActive, setIsMemberActive] = useState(false);

  useEffect(() => {
    if (newId) getNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newId]);

  useEffect(() => {
    if (userId) getMemberStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (news?.eventId) getAttendeeData(news.eventId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news?.eventId]);

  const handleOpenDocument = useCallback(async (url: string) => {
    const safe = normalizeMediaUrl(url);
    if (!safe) return;

    try {
      const supported = await Linking.canOpenURL(safe);
      if (supported) await Linking.openURL(safe);
      else console.warn("No se puede abrir la URL:", safe);
    } catch (err) {
      console.error("Error al abrir documento:", err);
    }
  }, []);

  const handleShareDocument = useCallback(async (url: string) => {
    const safe = normalizeMediaUrl(url);
    if (!safe) return;

    try {
      await Share.share({
        url: safe,
        message: `Échale un vistazo a este documento: ${safe}`,
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
        setIsMemberActive(Boolean(response.data.items[0].memberActive));
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
        setAttendeeId("");
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
    if (!news) return wrapHtml("");

    // Inyecta link para inscripción SOLO si hay eventId
    const base = news.eventId
      ? news.content.replace(
          /(- Miembros activos ACHO - GRATIS)(\s*<\/br>)/,
          `$1
          ${
            isMemberActive
              ? `<a href="#" id="registerMember" style="color:#007BFF; text-decoration:underline; margin-left:10px;">
                  ${
                    isRegistered
                      ? "Ya estás inscrito, cancelar inscripción"
                      : "Inscribirme como miembro activo"
                  }
                </a>`
              : ""
          }$2`,
        ) +
        `
<script>
  document.addEventListener("DOMContentLoaded", function() {
    var registerLink = document.getElementById("registerMember");

    function updateRegisterText(isRegistered) {
      if (!registerLink) return;
      registerLink.innerText = isRegistered
        ? "Ya estás inscrito, cancelar inscripción"
        : "Inscribirme como miembro activo";
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
        } else {
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
      } catch (error) {}
    });
  });
</script>
        `
      : news.content || "";

    const normalized = normalizeVideos(base);
    return wrapHtml(normalized);
  }, [news, isMemberActive, isRegistered, userId, attendedId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating size="large" />
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
      {typeof news.featuredImage === "string" && news.featuredImage && (
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
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          // ✅ CLAVE iOS: permite reproducción sin tap cuando esté muted
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="always"
          onMessage={async (event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data);

              if (message.action === "register") {
                await createAttendee({
                  userId: message.userId,
                  eventId: message.eventId,
                  memberId,
                  attended: false,
                });
                setIsRegistered(true);
                await getAttendeeData(message.eventId);
              }

              if (message.action === "unregister") {
                await deleteAttendee(attendedId);
                setIsRegistered(false);
                setAttendeeId("");
              }
            } catch (error) {
              console.error(
                "Error al procesar el mensaje desde WebView:",
                error,
              );
            }
          }}
        />

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
