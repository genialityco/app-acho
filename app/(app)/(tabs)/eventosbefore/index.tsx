import React, { useCallback, useContext, useEffect, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Button } from "react-native-paper"; // Mantengo solo los elementos necesarios
import RenderHighlights from "./RenderHighlights";
import RenderEvents from "./RenderEvents";
import { searchEvents } from "@/services/api/eventService";
import { OrganizationContext } from "@/context/OrganizationContext";
import { useFocusEffect } from "expo-router";

export default function EventsBeforeScreen() {
  const [activeTab, setActiveTab] = useState("highlights");
  const { organization } = useContext(OrganizationContext);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  // const [highlights, setHighlights] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);

  const fetchEvents = async (page = 1) => {
    try {
      const filters = {
        organizationId: organization._id,
        page,
        limit: 10,
      };
      const eventResponse = await searchEvents(filters);

      const sortedEvents = eventResponse.data.items.sort(
        (
          a: { startDate: string | number | Date },
          b: { startDate: string | number | Date }
        ) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      setPastEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchEvents(currentPage);
    }, [organization, currentPage])
  );

  // Datos simulados para highlights y eventos anteriores
  const highlights = [
    {
      id: "1",
      title: "Conferencia de Tecnología",
      image: require("../../../../assets/images/APP_ACHO_HIGHLISGT_01.png"),
    },
    {
      id: "2",
      title: "Feria de Innovación",
      image: require("../../../../assets/images/APP_ACHO_HIGHLISGT_02.png"),
    },
    {
      id: "3",
      title: "Taller de Desarrollo Web",
      image: require("../../../../assets/images/APP_ACHO_HIGHLISGT_03.png"),
    },
    {
      id: "4",
      title: "Seminario de Inteligencia Artificial",
      image: require("../../../../assets/images/APP_ACHO_HIGHLISGT_04.png"),
    },
    {
      id: "5",
      title: "Congreso de Ciberseguridad",
      image: require("../../../../assets/images/APP_ACHO_HIGHLISGT_01.png"),
    },
    {
      id: "6",
      title: "Jornada de Emprendimiento",
      image: require("../../../../assets/images/APP_ACHO_HIGHLISGT_02.png"),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Botones superiores para Highlights y Eventos Anteriores */}
      <View style={styles.tabContainer}>
        <Button
          style={styles.button}
          mode={activeTab === "highlights" ? "contained" : "contained-tonal"}
          compact
          onPress={() => setActiveTab("highlights")}
        >
          Highlights
        </Button>
        <Button
          style={styles.button}
          mode={activeTab === "pastEvents" ? "contained" : "contained-tonal"}
          compact
          onPress={() => setActiveTab("pastEvents")}
        >
          Eventos Anteriores
        </Button>
      </View>

      {/* Contenido dinámico según el tab seleccionado */}
      <ScrollView style={styles.contentContainer}>
        {activeTab === "highlights" ? (
          <View style={styles.gridContainer}>
            <RenderHighlights highlights={highlights} />
          </View>
        ) : (
          <RenderEvents events={pastEvents} />
        )}
      </ScrollView>
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
  contentContainer: {
    paddingTop: 16,
  },
  gridContainer: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    borderRadius: 5,
    width: "45%",
  },
});
