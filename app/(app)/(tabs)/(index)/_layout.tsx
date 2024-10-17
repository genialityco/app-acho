import { Stack } from "expo-router";
import { Image } from "react-native";
import React from "react";

const LOGO_URL =
  "https://ik.imagekit.io/6cx9tc1kx/LOGOSIMBOLO_ASOCIACION.png?updatedAt=1727378755557";

export default function EventosLayout() {
  const headerRight = () => (
    <Image source={{ uri: LOGO_URL }} style={{ width: 40, height: 40 }} />
  );

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Próximos eventos", headerRight }}
      />
      <Stack.Screen
        name="components/eventdetail"
        options={{ title: "Detalles del Evento", headerRight }}
      />
      <Stack.Screen
        name="components/program"
        options={{ title: "Agenda", headerRight }}
      />
      <Stack.Screen
        name="components/speakers"
        options={{ title: "Conferencistas", headerRight }}
      />
      <Stack.Screen
        name="components/speakerdetail"
        options={{ title: "Detalles del Conferencista", headerRight }}
      />
      <Stack.Screen
        name="components/documents"
        options={{ title: "Documentos", headerRight }}
      />
      <Stack.Screen
        name="components/certificates"
        options={{ title: "Certificado", headerRight }}
      />
      <Stack.Screen
        name="components/venue"
        options={{ title: "Ubicación", headerRight }}
      />
      <Stack.Screen
        name="components/posterslist"
        options={{ title: "Posters", headerRight }}
      />
      <Stack.Screen
        name="components/posterdetail"
        options={{ title: "Detalles del Poster", headerRight }}
      />
    </Stack>
  );
}
