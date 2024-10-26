import { Stack } from "expo-router";
import { Image, View } from "react-native";
import React from "react";

const LOGO_URL_TEXT =
  "https://ik.imagekit.io/6cx9tc1kx/Imagenes%20App%20Prueba/LOGO_ACHO.png?updatedAt=1726756148659";
const LOGO_URL =
  "https://ik.imagekit.io/6cx9tc1kx/LOGOSIMBOLO_ASOCIACION.png?updatedAt=1727378755557";

export default function MenuLayout() {
  // Función para renderizar el logo en el centro del header
  const renderCenteredLogo = () => (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Image
        source={{ uri: LOGO_URL_TEXT }}
        style={{ width: 200, height: 50 }}
        resizeMode="contain"
      />
    </View>
  );

  // Función para renderizar el icono en la derecha del header
  const headerRight = () => (
    <Image
      source={{ uri: LOGO_URL }}
      style={{ width: 30, height: 30, marginRight: 10 }}
      resizeMode="contain"
    />
  );

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Perfil",
          headerShown: true,
          headerTitle: renderCenteredLogo,
        }}
      />
      <Stack.Screen
        name="components/myevents"
        options={{ title: "Mis eventos", headerRight }}
      />
      <Stack.Screen
        name="components/mycertificates"
        options={{ title: "Mis certificados", headerRight }}
      />
      <Stack.Screen
        name="components/editprofile"
        options={{ title: "Editar perfil", headerRight }}
      />
      <Stack.Screen
        name="components/support"
        options={{ title: "Soporte", headerRight }}
      />
    </Stack>
  );
}
