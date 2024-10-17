import React, { useState, useEffect } from "react";
import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Dimensions, Text, View, StyleSheet } from "react-native";
import CustomDrawer from "@/components/CustomDrawer";
import { db, ref, onValue, set } from "@/services/firebaseConfig";
import { useOrganization } from "@/context/OrganizationContext";
import { Survey ,searchSurveys } from "@/services/api/surveyService";

const { width } = Dimensions.get("window");

export default function ProtectedLayout() {
  const { isLoggedIn, isLoading, userId } = useAuth();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const { organization } = useOrganization();

  const fetchSurveys = async () => {
    try {
      const filters = {
        organizationId: organization._id,
      };
      const response = await searchSurveys(filters);
      setSurveys(response.data.items);
    } catch (error) {
      console.error("Error fetching surveys:", error);
    }
  };

  useEffect(() => {
    // Referencia global en Firebase para la visibilidad del drawer
    const drawerStatusRef = ref(db, "drawer-status-acho");

    // Listener para cambios en el estado de visibilidad del drawer
    const unsubscribe = onValue(drawerStatusRef, (snapshot) => {
      const isDrawerVisible = snapshot.val();
      setDrawerVisible(isDrawerVisible);
    });

    // Obtener las encuestas de la organización
    fetchSurveys();

    // Limpiar el listener al desmontar el componente
    return () => unsubscribe();
  }, []);

  const toggleDrawerVisibility = () => {
    const newState = !drawerVisible;
    setDrawerVisible(newState);
  };

  if (isLoading) {
    return <Text>Cargando...</Text>;
  }

  if (!isLoggedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <View style={styles.mainContent}>
      {drawerVisible && (
        <CustomDrawer
          onClose={() => toggleDrawerVisibility()}
          surveyConfig={surveys}
          userId={userId ?? ""}
        />
      )}
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.9,
    elevation: 4,
    paddingVertical: 20,
    zIndex: 10,
  },
});
