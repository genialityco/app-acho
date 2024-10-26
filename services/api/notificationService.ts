import api from "./api";

// Interfaz para la notificación
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead?: boolean;
  iconUrl?: string;
}

// Obtener todas las notificaciones de un usuario
export const fetchUserNotifications = async (userId: string) => {
  try {
    const response = await api.get(`/notifications/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching notifications for user ID ${userId}:`, error);
    throw error;
  }
};

// Crear una nueva notificación
export const createNotification = async (
  notificationData: Partial<Notification>
) => {
  try {
    const response = await api.post("/notifications/create", notificationData);
    return response.data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Marcar una notificación como leída
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error(
      `Error marking notification ID ${notificationId} as read:`,
      error
    );
    throw error;
  }
};

// Marcar todas las notificaciones de un usuario como leídas
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const response = await api.put(`/notifications/${userId}/mark-all-read`);
    return response.data;
  } catch (error) {
    console.error(
      `Error marking all notifications for user ID ${userId} as read:`,
      error
    );
    throw error;
  }
};

// Enviar una notificación push individual
export const sendPushNotification = async (notificationData: any) => {
  try {
    const response = await api.post("/notifications/send", notificationData);
    return response.data;
  } catch (error) {
    console.error("Error sending push notification:", error);
    throw error;
  }
};

// Enviar notificaciones push masivas
export const sendMassivePushNotifications = async (notificationData: any) => {
  try {
    const response = await api.post(
      "/notifications/send-massive",
      notificationData
    );
    return response.data;
  } catch (error) {
    console.error("Error sending massive push notifications:", error);
    throw error;
  }
};
