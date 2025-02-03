import React from "react";
import { ThemeProvider, DefaultTheme } from "@react-navigation/native";
import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import theme from "@/theme";
import { AuthProvider } from "@/context/AuthContext";
// import * as SplashScreen from "expo-splash-screen";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { NotificationsProvider } from "@/context/NotificationsContext";

export default function RootLayout() {
  // Evitar que el splash screen se cierre automáticamente
  // React.useEffect(() => {
  //   SplashScreen.preventAutoHideAsync();
  // }, []);

  return (
    <OrganizationProvider>
      <AuthProvider>
        <NotificationsProvider>
        <PaperProvider theme={theme}>
          <ThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(app)" />
              <Stack.Screen name="login" />
            </Stack>
          </ThemeProvider>
        </PaperProvider>
        </NotificationsProvider>
      </AuthProvider>
    </OrganizationProvider>
  );
}
