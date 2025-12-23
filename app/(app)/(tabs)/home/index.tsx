import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Text, Card, Avatar, Divider, ActivityIndicator } from "react-native-paper";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { News, searchNews } from "@/services/api/newsService";
import { useNotifications } from "@/context/NotificationsContext";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "expo-router";

dayjs.locale("es");

type Row =
  | { type: "header"; title: string }
  | { type: "item"; item: News };

function HomeScreen() {
  const [news, setNews] = useState<News[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { userId } = useAuth();
  const { organization } = useOrganization();
  const { notifications, unreadCount, markAsRead, refreshNotifications } =
    useNotifications();
  const router = useRouter();

  const fetchNews = async (pageNum: number, reset: boolean = false) => {
    if (pageNum > 1 && !hasMore) return;

    if (pageNum === 1) setLoadingNews(true);
    else setLoadingMore(true);

    try {
      const filters = {
        organizationId: organization._id,
        pageSize: 10,
        current: pageNum,
        isPublic: true,
      };

      const response = await searchNews(filters);
      const newNews = (response?.data?.items || []).flat();

      if (reset) setNews(newNews);
      else setNews((prev) => [...prev, ...newNews]);

      setHasMore(newNews.length === filters.pageSize);
      setPage(pageNum);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (error) {
      console.error("Error al obtener las novedades:", error);
      if (reset) setNews([]);
    } finally {
      setLoadingNews(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (userId && organization) {
      fetchNews(1, true);
      refreshNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, organization?._id]);

  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) await markAsRead(notification._id);
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  const handleCloseModal = () => {
    setShowNotificationModal(false);
    setSelectedNotification(null);
  };

  const handleRouteRedirect = (route: string) => {
    handleCloseModal();
    router.push(route as any);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNews(1, true);
      await refreshNotifications();
    } catch (error) {
      console.error("Error al refrescar:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMoreNews = () => {
    if (!loadingMore && hasMore) fetchNews(page + 1, false);
  };

  // ✅ Separar “Novedades” (hasta ahora) vs “Futuras”
  const { published, future, rows } = useMemo(() => {
    const nowMs = Date.now();

    const publishedItems: News[] = [];
    const futureItems: News[] = [];

    for (const n of news) {
      // Si tiene publishedAt, usamos esa como “fecha oficial”
      // Si no tiene, caemos a createdAt para mostrar como “Publicado”
      const pubMs = n.publishedAt ? dayjs(n.publishedAt).valueOf() : null;
      const createdMs = n.createdAt ? dayjs(n.createdAt).valueOf() : null;

      // “Futuras” solo si tiene publishedAt y está después de ahora
      if (pubMs && pubMs > nowMs) {
        futureItems.push(n);
        continue;
      }

      // “Novedades”: si publishedAt <= ahora, o si no hay publishedAt (fallback a createdAt)
      const effectiveMs = pubMs ?? createdMs ?? 0;
      if (effectiveMs <= nowMs) publishedItems.push(n);
    }

    // (opcional) ordenar
    publishedItems.sort((a, b) => {
      const aMs = dayjs(a.publishedAt ?? a.createdAt).valueOf();
      const bMs = dayjs(b.publishedAt ?? b.createdAt).valueOf();
      return bMs - aMs;
    });

    futureItems.sort((a, b) => {
      const aMs = dayjs(a.publishedAt).valueOf();
      const bMs = dayjs(b.publishedAt).valueOf();
      return aMs - bMs; // futuras en orden ascendente (más próxima primero)
    });

    const listRows: Row[] = [];

    // Solo mostrar headers si hay items (o si quieres siempre, quita condiciones)
    if (publishedItems.length > 0) {
      listRows.push({ type: "header" as const, title: "Novedades" });
      listRows.push(...publishedItems.map((item) => ({ type: "item" as const, item })));
    }

    if (futureItems.length > 0) {
      listRows.push({ type: "header" as const, title: "Futuras" });
      listRows.push(...futureItems.map((item) => ({ type: "item" as const, item })));
    }

    return { published: publishedItems, future: futureItems, rows: listRows };
  }, [news]);

  const renderNewsCard = (item: News) => (
    <TouchableOpacity
      key={item._id}
      onPress={() => router.push(`/home/components/novelty?newId=${item._id}`)}
    >
      <Card style={styles.card}>
        {!!item.featuredImage && (
          <Card.Cover source={{ uri: item.featuredImage }} style={styles.cardImage} />
        )}

        <Card.Content>
          <Text style={styles.cardTitle}>{item.title}</Text>

          <Text style={styles.cardDescription}>
            {item.publishedAt && dayjs(item.publishedAt).isAfter(dayjs()) ? "Se publicará: " : "Publicado: "}
            {item.publishedAt
              ? dayjs(item.publishedAt).format("DD [de] MMMM [de] YYYY")
              : dayjs(item.createdAt).format("DD [de] MMMM [de] YYYY")}
          </Text>
        </Card.Content>

        <Card.Actions>
          <Text style={styles.readMore}>Leer más</Text>
        </Card.Actions>
      </Card>
    </TouchableOpacity>
  );

  const renderRow = ({ item }: { item: Row }) => {
    if (item.type === "header") {
      return <Text style={styles.sectionTitle}>{item.title}</Text>;
    }
    return renderNewsCard(item.item);
  };

  const keyExtractor = (row: Row, idx: number) =>
    row.type === "header" ? `h-${row.title}-${idx}` : row.item._id;

  const listEmpty =
    loadingNews ? (
      <View style={styles.loadingIndicator}>
        <ActivityIndicator animating={true} size="small" color="#00796b" />
        <Text style={styles.loadingText}>Cargando novedades...</Text>
      </View>
    ) : (
      <View style={styles.loadingIndicator}>
        <Text style={styles.loadingText}>No hay novedades disponibles</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        renderItem={renderRow}
        keyExtractor={keyExtractor}
        ListHeaderComponent={
          <>
            {/* Banner notificaciones */}
            <TouchableOpacity
              onPress={() => setShowNotifications(!showNotifications)}
              style={styles.notificationBanner}
            >
              <Avatar.Icon size={36} icon="bell" style={styles.notificationIcon} />
              <Text style={styles.notificationBannerText}>
                {notifications.length} notificaciones ({unreadCount} sin leer)
              </Text>
            </TouchableOpacity>

            {showNotifications && (
              <View style={styles.notificationsContainer}>
                <ScrollView style={styles.notificationsScroll} nestedScrollEnabled>
                  {notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification._id}
                      onPress={() => handleNotificationPress(notification)}
                      style={[
                        styles.notification,
                        notification.isRead && styles.notificationRead,
                      ]}
                    >
                      <Avatar.Icon size={36} icon="bell" style={styles.notificationIcon} />
                      <Text style={styles.notificationText}>
                        {notification.title} {notification.body} - ver
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Divider style={{ marginVertical: 16 }} />
              </View>
            )}

            {/* Si quieres mostrar contadores */}
            {(published.length > 0 || future.length > 0) && (
              <Text style={styles.metaText}>
                {published.length} publicadas {future.length > 0 ? `| ${future.length} futuras` : ""}
              </Text>
            )}
          </>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator animating={true} size="small" color="#00796b" />
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.list}
        onEndReached={loadMoreNews}
        onEndReachedThreshold={0.5}
      />

      {/* Modal notificación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNotificationModal}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {selectedNotification?.title || "Notificación"}
            </Text>
            <Text style={styles.modalBody}>
              {selectedNotification?.body || "Sin contenido"}
            </Text>

            <View style={styles.modalButtonsRow}>
              {selectedNotification?.data?.route && (
                <Pressable
                  style={styles.routeButton}
                  onPress={() => handleRouteRedirect(selectedNotification.data.route)}
                >
                  <Text style={styles.routeButtonText}>Ver</Text>
                </Pressable>
              )}
              <Pressable style={styles.closeButton} onPress={handleCloseModal}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  list: { padding: 16, paddingBottom: 20 },

  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  loadingText: { marginLeft: 8, fontSize: 16, color: "#555" },

  notificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    marginBottom: 10,
  },
  notificationBannerText: { fontSize: 16, color: "#00796b", fontWeight: "bold" },

  notificationsContainer: { marginTop: 10 },
  notificationsScroll: { maxHeight: 280 },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  notificationRead: { opacity: 0.5 },
  notificationIcon: { marginRight: 10, backgroundColor: "#00796b" },
  notificationText: { fontSize: 14, color: "#333", flexShrink: 1 },

  metaText: { marginBottom: 10, color: "#555" },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalBody: { fontSize: 16, marginBottom: 20 },
  modalButtonsRow: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  routeButton: { padding: 10, backgroundColor: "#00796b", borderRadius: 8 },
  routeButtonText: { color: "#fff", fontSize: 16 },
  closeButton: { padding: 10, backgroundColor: "#555", borderRadius: 8 },
  closeButtonText: { color: "#fff", fontSize: 16 },

  sectionTitle: { fontSize: 24, fontWeight: "bold", marginBottom: 12, marginTop: 8 },

  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: "#ffffff",
  },
  cardImage: { borderTopLeftRadius: 8, borderTopRightRadius: 8, height: 150 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginTop: 8 },
  cardDescription: { fontSize: 16, color: "#555", marginBottom: 8 },
  readMore: { color: "#00796b", fontWeight: "bold" },

  footerLoading: { paddingVertical: 20, alignItems: "center" },
});

export default HomeScreen;
