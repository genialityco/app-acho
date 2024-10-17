import { Stack } from "expo-router";
import { Image } from "react-native";

const LOGO_URL =
  "https://ik.imagekit.io/6cx9tc1kx/LOGOSIMBOLO_ASOCIACION.png?updatedAt=1727378755557";

export default function EventosBeforeLayout() {
  const headerRight = () => (
    <Image source={{ uri: LOGO_URL }} style={{ width: 40, height: 40 }} />
  );

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Inicio", headerRight }} />
      <Stack.Screen
        name="components/novelty"
        options={{ title: "Novedad", headerRight }}
      />
    </Stack>
  );
}
