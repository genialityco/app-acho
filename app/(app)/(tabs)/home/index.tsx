import { useOrganization } from "@/context/OrganizationContext";
import { News, searchNews } from "@/services/api/newsService";
import React, { useCallback, useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, Button, Avatar, Divider } from "react-native-paper";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { router, useFocusEffect } from "expo-router";

dayjs.locale("es");

function HomeScreen() {
  const [news, setNews] = useState<News[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { organization } = useOrganization();

  const notifications = [
    {
      id: 1,
      message: "Contesta la encuesta de Hematología y Oncología.",
    },
    {
      id: 2,
      message: "No olvides completar tu perfil para acceder a más beneficios.",
    },
    {
      id: 3,
      message: "Nuevo simposio disponible: Genitourinarios inscribete.",
    },
  ];

  const fetchNews = async () => {
    try {
      const filteres = {
        organizationId: organization._id,
      };
      const response = await searchNews(filteres);
      setNews(response.data.items);
    } catch (error) {
      console.error("Error al obtener las noticias:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNews();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      {/* <TouchableOpacity
        onPress={() => setShowNotifications(!showNotifications)}
      >
        <View style={styles.notificationBanner}>
          <Avatar.Icon size={36} icon="bell" style={styles.notificationIcon} />
          <Text style={styles.notificationBannerText}>
            {notifications.length} notificaciones no leídas
          </Text>
        </View>
      </TouchableOpacity>

      {showNotifications && (
        <View>
          {notifications.map((notification) => (
            <View key={notification.id} style={styles.notification}>
              <Avatar.Icon
                size={36}
                icon="bell"
                style={styles.notificationIcon}
              />
              <Text style={styles.notificationText}>
                {notification.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Divider style={{ marginVertical: 16 }} /> */}

      <View>
        <Text style={styles.sectionTitle}>Novedades</Text>
        {news.map((item) => (
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
              {/* <Text style={styles.cardDescription}>{item.content}</Text> */}
            </Card.Content>
            <Card.Actions>
              <Button
                onPress={() =>
                  router.push(`/home/components/novelty?newId=${item._id}`)
                }
              >
                Leer más
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
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
  sectionTitle: {
    fontSize: 20,
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
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
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
  notificationIcon: {
    marginRight: 10,
    backgroundColor: "#00796b",
  },
  notificationText: {
    fontSize: 14,
    color: "#333",
    flexShrink: 1,
  },
});

export default HomeScreen;
