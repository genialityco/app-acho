import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, FlatList } from "react-native";
import {
  Card,
  IconButton,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import dayjs from "dayjs";

interface Event {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  styles: {
    eventImage: string;
    miniatureImage: string;
  };
}

interface RenderEventsProps {
  events: Event[];
  onLoadMore: () => void;
  loadingMore: boolean;
  hasMore: boolean;
}

export default function RenderEvents({ 
  events, 
  onLoadMore, 
  loadingMore, 
  hasMore 
}: RenderEventsProps) {
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const now = dayjs();
    // Filtrar eventos pasados y ordenarlos de más recientes a más antiguos
    const filteredEvents = events
    .filter(event => dayjs(event.startDate).isBefore(now))
    .sort((a, b) => dayjs(b.startDate).valueOf() - dayjs(a.startDate).valueOf());
    setPastEvents(filteredEvents);
    setLoading(false);
  }, [events]);

  const formatDate = (
    startDate: string | number | Date | dayjs.Dayjs | null | undefined,
    endDate: string | number | Date | dayjs.Dayjs | null | undefined
  ) => {
    if (!startDate || !endDate) return "";

    const start = dayjs(startDate);
    const end = dayjs(endDate);

    if (start.isSame(end, "day")) {
      return start.format("DD MMMM YYYY");
    } else {
      return `${start.format("DD MMM")} - ${end.format("DD MMM YYYY")}`;
    }
  };

  // Renderizar cada evento
  const renderEventItem = ({ item }: { item: Event }) => (
    <Card key={item._id} style={styles.eventCard}>
      <View style={styles.row}>
        {/* Columna para la imagen */}
        <View style={styles.contentColumnOne}>
          <Image
            source={{ uri: item.styles.miniatureImage }}
            style={styles.eventImage}
          />
        </View>

        {/* Columna para el contenido */}
        <View style={styles.contentColumnTwo}>
          <View style={styles.headerContainer}>
            <Text style={styles.eventDate}>
              {formatDate(item.startDate, item.endDate)}
            </Text>
          </View>

          <Text style={styles.eventTitle}>{item.name}</Text>
          <Text style={styles.eventDescription}>
            {item.description ? item.description : "No hay descripcion disponible\n"}
          </Text>
        </View>
      </View>
      <View style={styles.actionsContainer}>
        <Button mode="contained" disabled onPress={() => {}}>
          Finalizado
        </Button>
        <Button
          mode="outlined"
          onPress={() =>
            router.push(
              `/eventosbefore/components/eventdetailb?eventId=${item._id}`
            )
          }
        >
          Detalles
        </Button>
      </View>
    </Card>
  );

  // Footer component para mostrar loading
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoading}>
         <ActivityIndicator size="small" color="#b4d352" />
        <Text style={styles.loadingText}>Cargando más eventos...</Text>
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay eventos disponibles</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00AEEF" />
        <Text style={styles.loadingText}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
     
      <FlatList
        data={pastEvents}
        renderItem={renderEventItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={true}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        // Optimizaciones de performance
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  eventCard: {
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 16,
  },
  row: {
    flexDirection: "row",
  },
  eventImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  contentColumnOne: {
    flexDirection: "column",
    justifyContent: "space-between",
  },
  contentColumnTwo: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00BCD4",
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    paddingBottom: 10,
    color: "#555",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  iconButton: {
    marginTop: 10,
  },
  
  
});