import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import {
  Text,
  Card,
  Avatar,
  Divider,
  ActivityIndicator,
} from "react-native-paper";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { News, searchNews } from "@/services/api/newsService";
import { useNotifications } from "@/context/NotificationsContext";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { useRouter } from "expo-router";

dayjs.locale("es");

function HomeScreen() {
  const [news, setNews] = useState<News[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(
    null
  );
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const { userId } = useAuth();
  const { organization } = useOrganization();
  const { notifications, unreadCount, markAsRead, refreshNotifications } =
    useNotifications();
  const router = useRouter();

  // Obtener novedades de la organización
  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const filters = { organizationId: organization._id };
      const response = await searchNews(filters);
      setNews(response.data.items);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (error) {
      console.error("Error al obtener las novedades:", error);
    } finally {
      setLoadingNews(false);
    }
  };

  useEffect(() => {
    if (userId && organization) {
      fetchNews();
      refreshNotifications();
    }
  }, [userId, organization]);

  // Manejar clic en una notificación para mostrar el modal
  const handleNotificationPress = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setSelectedNotification(notification);
    setShowNotificationModal(true);
  };

  // Cerrar el modal
  const handleCloseModal = () => {
    setShowNotificationModal(false);
    setSelectedNotification(null);
  };

  // Redirigir según la ruta de la notificación
  const handleRouteRedirect = (route: string) => {
    handleCloseModal();
    router.push(route);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Sección de notificaciones */}
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
                <Avatar.Icon
                  size={36}
                  icon="bell"
                  style={styles.notificationIcon}
                />
                <Text style={styles.notificationText}>
                  {notification.title} - ver
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Divider style={{ marginVertical: 16 }} />
        </View>
      )}

      {/* Modal para mostrar la notificación */}
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
            {selectedNotification?.data?.route && (
              <Pressable
                style={styles.routeButton}
                onPress={() =>
                  handleRouteRedirect(selectedNotification.data.route)
                }
              >
                <Text style={styles.routeButtonText}>
                  Ir a {selectedNotification.data.route}
                </Text>
              </Pressable>
            )}
            <Pressable style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Sección de novedades */}
      {loadingNews ? (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator animating={true} size="small" />
          <Text style={styles.loadingText}>Cargando novedades...</Text>
        </View>
      ) : (
        <View>
          <Text style={styles.sectionTitle}>Novedades</Text>
          {news.map((item) => (
            <TouchableOpacity
              key={item._id}
              onPress={() => {
                router.push(`/home/components/novelty?newId=${item._id}`);
              }}
            >
              <Card key={item._id} style={styles.card}>
                <Card.Cover
                  source={{ uri: item.featuredImage }}
                  style={styles.cardImage}
                />
                <Card.Content>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>
                    Publicado:{" "}
                    {dayjs(item.createdAt).format("DD [de] MMMM [de] YYYY")}
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Text style={styles.readMore}>Leer más</Text>
                </Card.Actions>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  loadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#555",
  },
  notificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
  },
  notificationBannerText: {
    fontSize: 16,
    color: "#00796b",
    fontWeight: "bold",
  },
  notificationsContainer: {
    marginTop: 10,
  },
  notificationsScroll: {
    maxHeight: 200, // Limita la altura para hacerla scrolleable
  },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  notificationRead: {
    opacity: 0.5,
  },
  notificationIcon: {
    marginRight: 10,
    backgroundColor: "#00796b",
  },
  notificationText: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 16,
    marginBottom: 20,
  },
  routeButton: {
    padding: 10,
    backgroundColor: "#00796b",
    borderRadius: 8,
    marginBottom: 10,
  },
  routeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  closeButton: {
    padding: 10,
    backgroundColor: "#555",
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: "#ffffff",
  },
  cardImage: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    height: 150,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: "#555",
    marginBottom: 8,
  },
  readMore: {
    color: "#00796b",
    fontWeight: "bold",
  },
});

export default HomeScreen;
