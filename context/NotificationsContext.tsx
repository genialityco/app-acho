import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import {
  Notification,
  fetchUserNotifications,
  markNotificationAsRead,
} from "@/services/api/notificationService";
import { useAuth } from "@/context/AuthContext";

interface NotificationsContextProps {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  refreshNotifications: () => void;
  addNotification: (newNotification: Notification) => void;
}

export const NotificationsContext = createContext<NotificationsContextProps>({
  notifications: [],
  unreadCount: 0,
  markAsRead: () => {},
  refreshNotifications: () => {},
  addNotification: () => {},
});

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { userId } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Obtener notificaciones del usuario
  const fetchNotifications = useCallback(async () => {
    try {
      if (userId) {
        const response = await fetchUserNotifications(userId);
        setNotifications(response);
        setUnreadCount(
          response.filter((n: { isRead: any }) => !n.isRead).length
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [userId]);

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Añadir una nueva notificación
  const addNotification = (newNotification: Notification) => {
    setNotifications((prev) => [newNotification, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  // Refrescar notificaciones
  const refreshNotifications = () => {
    fetchNotifications();
  };

  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [fetchNotifications, userId]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        refreshNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  return useContext(NotificationsContext);
};
