import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Button, Card, Text, Menu } from "react-native-paper";
import RenderEvents from "./RenderEvents";
import { searchEvents, Event as ApiEvent } from "@/services/api/eventService";
import { OrganizationContext } from "@/context/OrganizationContext";
import { useFocusEffect } from "expo-router";
import EventsHighlighs from "./EventsHighlighs";

type EventType = "WEBINAR" | "SEMINARIO" | "CONGRESO" | "SIMPOSIO" | "CURSO" | "OTRO";

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  WEBINAR: "Webinar",
  SEMINARIO: "Seminario",
  CONGRESO: "Congreso",
  SIMPOSIO: "Simposio",
  CURSO: "Curso",
  OTRO: "Otro",
};

export default function EventsBeforeScreen() {
  const [activeTab, setActiveTab] = useState("pastEvents");
  const { organization } = useContext(OrganizationContext);

  const [eventType, setEventType] = useState<EventType>("CONGRESO");
  const [menuVisible, setMenuVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pastEvents, setPastEvents] = useState<ApiEvent[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 10;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleTypeSelect = (type: EventType) => {
    setEventType(type);
    closeMenu();
  };

  const fetchEvents = async (page = 1, reset = false) => {
    if (page > 1 && !hasMore) return;

    if (page === 1 || reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const filters = {
        organizationId: organization._id,
        page,
        limit: pageSize,
      };

      const eventResponse = await searchEvents(filters);

      const sortedEvents = eventResponse.data.items.sort(
        (a: ApiEvent, b: ApiEvent) =>
          new Date(a.startDate).getTime() -
          new Date(b.startDate).getTime()
      );

      if (reset || page === 1) {
        setPastEvents(sortedEvents);
      } else {
        setPastEvents((prev) => [...prev, ...sortedEvents]);
      }

      setHasMore(sortedEvents.length === pageSize);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching events:", error);
      if (reset || page === 1) {
        setPastEvents([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreEvents = () => {
    if (!loadingMore && hasMore && activeTab === "pastEvents") {
      fetchEvents(currentPage + 1, false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setEventType("CONGRESO");

    if (tab === "pastEvents") {
      setCurrentPage(1);
      setHasMore(true);
      fetchEvents(1, true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (activeTab === "pastEvents") {
        fetchEvents(1, true);
      }
    }, [organization])
  );

  const filteredPastEvents = useMemo(() => {
    return pastEvents.filter((event) => {
      return event.type === eventType;
    });
  }, [pastEvents, eventType]);

  if (loading && activeTab === "pastEvents") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Button
          style={styles.button}
          mode={activeTab === "memorias" ? "contained" : "contained-tonal"}
          compact
          onPress={() => handleTabChange("memorias")}
        >
          Memorias
        </Button>
        <Button
          style={styles.button}
          mode={activeTab === "pastEvents" ? "contained" : "contained-tonal"}
          compact
          onPress={() => handleTabChange("pastEvents")}
        >
          Eventos Anteriores
        </Button>
      </View>

      {/* Dropdown de tipo de evento */}
      {activeTab === "pastEvents" && (
  <View style={styles.dropdownContainer}>
    <Menu
      visible={menuVisible}
      onDismiss={closeMenu}
      contentStyle={styles.menuContent}
      anchor={
        <Button
          mode="outlined"
          onPress={openMenu}
          style={styles.dropdownButton}
          contentStyle={styles.dropdownButtonContent}
          icon="chevron-down"
          labelStyle={styles.dropdownButtonLabel}
        >
          {EVENT_TYPE_LABELS[eventType]}
        </Button>
      }
    >
      {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((type) => (
        <Menu.Item
          key={type}
          onPress={() => handleTypeSelect(type)}
          title={EVENT_TYPE_LABELS[type]}
          titleStyle={
            eventType === type 
              ? styles.selectedMenuItem 
              : styles.menuItemTitle
          }
          style={eventType === type ? styles.selectedMenuItemContainer : undefined}
        />
      ))}
    </Menu>
  </View>
)}


      <View style={styles.contentContainer}>
        {activeTab === "memorias" ? (
          <View style={styles.gridContainer}>
            <EventsHighlighs />
          </View>
        ) : (
          <RenderEvents
            events={filteredPastEvents}
            onLoadMore={loadMoreEvents}
            loadingMore={loadingMore}
            hasMore={hasMore}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  button: {
    borderRadius: 5,
    width: "45%",
  },
  contentContainer: {
    flex: 1,
    paddingTop: 5,
  },
  gridContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    paddingHorizontal: 5,
    paddingVertical: 5,
    alignItems: "center",
  },
  dropdownButton: {
    minWidth: "100%",
    borderColor: "#00BCD4",
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownButtonContent: {
    flexDirection: "row-reverse",
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  dropdownButtonLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00BCD4",
    letterSpacing: 0.3,
  },
  menuContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minWidth: 220,
  },
  menuItemTitle: {
    fontSize: 15,
    color: "#333",
  },
  selectedMenuItem: {
    color: "#00BCD4",
    fontWeight: "700",
    fontSize: 15,
  },
  selectedMenuItemContainer: {
    backgroundColor: "#E0F7FA",
  },
});