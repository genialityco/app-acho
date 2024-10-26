import React from "react";
import { Tabs } from "expo-router";
import { useWindowDimensions } from "react-native";
import { TabBarIcon } from "@/components/navigation/TabBarIcon";
import theme from "@/theme";
import { useNotifications } from "@/context/NotificationsContext";

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const { unreadCount } = useNotifications();

  // Ajuste responsivo para el estilo de las tabs
  const isLargeScreen = width > 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.backdrop,
        tabBarStyle: {
          borderRadius: isLargeScreen ? 40 : 20,
          margin: isLargeScreen ? 10 : 5,
          paddingHorizontal: isLargeScreen ? 20 : 5,
        },
        headerShown: false,
        headerTitleContainerStyle: {
          width: "100%",
        },
        tabBarLabelStyle: {
          fontSize: isLargeScreen ? 16 : 12,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "home" : "home-outline"}
              color={color}
            />
          ),
          // Mostrar el badge solo si hay notificaciones no leídas
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tabs.Screen
        name="eventosbefore"
        options={{
          title: "Anteriores",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(index)"
        options={{
          title: "Próximos",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "calendar" : "calendar-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="achoinfo"
        options={{
          title: "ACHO",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "help-circle" : "help-circle-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Mi Perfil",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "person-circle" : "person-circle-outline"}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
