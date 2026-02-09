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
import { updateExpoPushToken } from "@/services/api/userService";
import { useNotifications } from "@/context/NotificationsContext";
import Constants from "expo-constants";
import { ActivityIndicator } from "react-native-paper";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import * as Application from "expo-application";
import { Linking } from "react-native";
import { ImagePromoModal } from "@/components/ImagePromoModal"; // si lo sacas a componente

const { width } = Dimensions.get("window");

export default function ProtectedLayout() {
  const [showPromo, setShowPromo] = useState(true);
  const { isLoggedIn, isLoading, userId } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<any | null>(
    null,
  );
  const { organization } = useOrganization();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const { addNotification, markAsRead } = useNotifications();
  const [isAppReady, setIsAppReady] = useState(false);
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
        "Debe usar un dispositivo físico para recibir notificaciones push.",
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
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId: projectId
            ? projectId
            : "7b771362-c331-49ce-94fd-f43d171a309e",
        })
      ).data;

      if (pushTokenString && userId) {
        await updateExpoPushToken(userId, pushTokenString);
        console.log("Expo push token guardado en el backend");
      }
    } catch (error) {
      console.error("Error al obtener o guardar el expoPushToken:", error);
    }
  };

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          "Actualización disponible",
          "Se ha encontrado una actualización. Se aplicará ahora.",
          [
            {
              text: "Aceptar",
              onPress: async () => await Updates.reloadAsync(),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Error verificando actualizaciones OTA:", error);
    }
  };

  const cleanIOSVersion = (versionString: string) => {
    const match = versionString.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : "0.0.0";
  };

  const compareVersions = (v1: string, v2: string): number => {
    const v1Parts = v1.split(".").map(Number);
    const v2Parts = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const num1 = v1Parts[i] || 0;
      const num2 = v2Parts[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  };

  const checkStoreVersion = async () => {
    try {
      let storeUrl = "";
      let latestVersion = "0.0.0";

      if (Device.osName === "iOS") {
        const response = await fetch(
          `https://itunes.apple.com/lookup?bundleId=${Application.applicationId}`,
        );
        const data = await response.json();
        latestVersion = cleanIOSVersion(data.results[0]?.version ?? "0.0.0");
        storeUrl = data.results[0]?.trackViewUrl;
      } else if (Device.osName === "Android") {
        storeUrl = `https://play.google.com/store/apps/details?id=${Application.applicationId}`;
        latestVersion = "1.0.8";
      }

      // Obtenemos la versión actual desde OTA o la versión nativa
      let currentVersion =
        Updates.runtimeVersion ||
        Application.nativeApplicationVersion ||
        "0.0.0";

      // Si `Updates.runtimeVersion` es un hash, usamos `Application.nativeApplicationVersion`
      if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) {
        currentVersion = Application.nativeApplicationVersion || "0.0.0";
      }

      console.log(
        `📢 Versión instalada: ${currentVersion}, Versión en la tienda: ${latestVersion}`,
      );

      // Comparar versiones numéricamente
      if (compareVersions(currentVersion, latestVersion) < 0) {
        Alert.alert(
          "Nueva versión disponible",
          "Debes actualizar la aplicación para continuar.",
          [{ text: "Actualizar", onPress: () => Linking.openURL(storeUrl) }],
        );
      }
    } catch (error) {
      console.error("❌ Error verificando la versión en la tienda:", error);
    }
  };

  useEffect(() => {
    const verifyAppVersion = async () => {
      await checkForUpdates();
      await checkStoreVersion();
    };

    verifyAppVersion();
  }, []);

  useEffect(() => {
    async function prepareApp() {
      try {
        // Evita que la splash screen se oculte automáticamente
        await SplashScreen.preventAutoHideAsync();

        if (userId && organization) {
          await fetchSurveys();
          await registerAndSavePushToken();
        }

        // Simula una pequeña espera para garantizar transiciones suaves
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (e) {
        console.error("Error durante la inicialización de la app:", e);
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepareApp();
  }, [userId, organization]);

  useEffect(() => {
    if (userId && organization) {
      // Listener para notificaciones entrantes
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notificación recibida: ", notification);
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
            notificationListener.current,
          );
        }
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(
            responseListener.current,
          );
        }
      };
    }
  }, [userId, organization]);

  useEffect(() => {
    const drawerStatusRef = ref(db, "drawer-status-acho");

    const unsubscribe = onValue(drawerStatusRef, (snapshot) => {
      const isDrawerVisible = snapshot.val();
      setDrawerVisible(isDrawerVisible);
    });

    return () => unsubscribe();
  }, []);

  const handleCloseNotification = () => {
    if (currentNotification) {
      try {
        markAsRead(currentNotification._id);
        setShowNotificationModal(false);

        if (currentNotification.data?.route) {
          router.push(currentNotification.data.route);
        }

        setCurrentNotification(null);
      } catch (error) {
        console.error("Error al marcar la notificación como leída:", error);
      }
    }
  };

  if (!isAppReady || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} size="large" />
        <Text>Cargando...</Text>
      </View>
    );
  }

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
      <ImagePromoModal
        visible={showPromo}
        onClose={() => setShowPromo(false)}
        imageUri={
          "https://firebasestorage.googleapis.com/v0/b/global-auth-49737.appspot.com/o/imagenACHO.jpeg?alt=media&token=a33b3f58-8a98-41e3-9e0b-dcb079ad99d8"
        } // <-- tu imagen
        ctaUrl={"https://esmosummit2026.acho.com.co/registro/"}
      />
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
