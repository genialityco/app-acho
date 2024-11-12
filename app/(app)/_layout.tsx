import React, { useState, useEffect, useRef } from "react";
import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
  Dimensions,
  Text,
  View,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import CustomDrawer from "@/components/CustomDrawer";
import { db, ref, onValue } from "@/services/firebaseConfig";
import { useOrganization } from "@/context/OrganizationContext";
import { Survey, searchSurveys } from "@/services/api/surveyService";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { updateExpoPushToken } from "@/services/api/userService";
import { createNotification } from "@/services/api/notificationService";
import { useNotifications } from "@/context/NotificationsContext";
import Constants from "expo-constants";
import { ActivityIndicator } from "react-native-paper";

const { width } = Dimensions.get("window");

export default function ProtectedLayout() {
  const { isLoggedIn, isLoading, userId } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any | null>(
    null
  );
  const { organization } = useOrganization();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { addNotification, markAsRead } = useNotifications();
  const router = useRouter();

  const fetchSurveys = async () => {
    try {
      const filters = { organizationId: organization._id };
      const response = await searchSurveys(filters);
      setSurveys(response.data.items);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    }
  };

  const registerAndSavePushToken = async () => {
    if (!Device.isDevice) {
      console.error(
        "Debe usar un dispositivo físico para recibir notificaciones push."
      );
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.error("No se concedieron permisos para las notificaciones push.");
      return;
    }

    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        Alert.alert(
          "Error",
          "No se pudieron dar permisos para las notificaciones push."
        );
      }
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId
            ? projectId
            : "7b771362-c331-49ce-94fd-f43d171a309e",
        })
      ).data;
      console.log("Expo Push Token obtenido: ", pushTokenString);

      if (pushTokenString && userId) {
        await updateExpoPushToken(userId, pushTokenString);
        console.log("Expo push token guardado en el backend");
      }
    } catch (error) {
      console.error("Error al obtener o guardar el expoPushToken:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      registerAndSavePushToken();

      // Listener para notificaciones entrantes
      notificationListener.current =
        Notifications.addNotificationReceivedListener(async (notification) => {
          console.log("Notificación recibida: ", notification);

          if (userId) {
            const notificationData = {
              userId,
              title: notification.request.content.title ?? "Nueva notificación",
              body: notification.request.content.body ?? "Sin contenido",
              data: notification.request.content.data,
              isRead: false,
            };

            try {
              const response = await createNotification(notificationData);
              if (response) {
                addNotification(response);
                setCurrentNotification(response);
                setShowNotificationModal(true);
              }
            } catch (error) {
              console.error("Error al guardar la notificación:", error);
            }
          }
        });

      // Listener para respuestas a notificaciones
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const { data } = response.notification.request.content;
          if (data?.route) {
            router.push(data.route);
          }
        });

      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(
            notificationListener.current
          );
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(
            responseListener.current
          );
        }
      };
    }
  }, [userId]);

  useEffect(() => {
    const drawerStatusRef = ref(db, "drawer-status-acho");

    const unsubscribe = onValue(drawerStatusRef, (snapshot) => {
      const isDrawerVisible = snapshot.val();
      setDrawerVisible(isDrawerVisible);
    });

    fetchSurveys();

    return () => unsubscribe();
  }, []);

  const handleCloseNotification = () => {
    if (currentNotification) {
      try {
        markAsRead(currentNotification._id);
        setShowNotificationModal(false);

        // Redirigir si hay una ruta en la data
        if (currentNotification.data?.route) {
          router.push(currentNotification.data.route);
        }

        setCurrentNotification(null);
      } catch (error) {
        console.error("Error al marcar la notificación como leída:", error);
      }
    }
  };

  // if (isLoading) {
  //   return (
  //     <View style={styles.loadingContainer}>
  //       <ActivityIndicator animating={true} size="large" />
  //       <Text>Cargando...</Text>
  //     </View>
  //   );
  // }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.mainContent}>
      {drawerVisible && (
        <CustomDrawer
          onClose={() => setDrawerVisible(false)}
          surveyConfig={surveys}
          userId={userId ?? ""}
        />
      )}

      {/* Modal para mostrar notificaciones */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNotificationModal}
        onRequestClose={handleCloseNotification}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {currentNotification?.title || "Nueva notificación"}
            </Text>
            <Text style={styles.modalBody}>
              {currentNotification?.body || "Sin contenido"}
            </Text>
            <Pressable
              style={styles.closeButton}
              onPress={handleCloseNotification}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
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
  closeButton: {
    padding: 10,
    backgroundColor: "#00796b",
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
