module.exports = {
  expo: {
    name: "AchoApp",
    slug: "gen-notifications",
    version: "1.0.10",
    orientation: "portrait",
    icon: "./assets/icons/icon-android.png",
    scheme: "achoapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/icons/APP_ACHO_SPLASH_FULL.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.acho.eventosactualidad",
      // googleServicesFile: "./GoogleService-Info.plist", // Comentado hasta tener el archivo
      buildNumber: "1.0.10",
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "AchoApp requiere acceso a la ubicación mientras se utiliza para personalizar la experiencia.",
        UIBackgroundModes: [
          "fetch",
          "remote-notification",
          "fetch",
          "remote-notification"
        ],
        ITSAppUsesNonExemptEncryption: false
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_API_KEY
      }
    },
    android: {
      // versionCode se maneja automáticamente por EAS (appVersionSource: remote)
      package: "com.geniality.achoapp",
      googleServicesFile: "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/icons/icon-android.png",
        backgroundColor: "#ffffff"
      },
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_API_KEY
        }
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/icons/icon-android.png"
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: true,
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0"
          }
        }
      ],
      "./plugins/withFirebase",
      "expo-router",
      "react-native-video",
      "expo-notifications"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      eas: {
        projectId: "7b771362-c331-49ce-94fd-f43d171a309e"
      }
    },
    owner: "geniality",
    runtimeVersion: "1.0.10",
    updates: {
      url: "https://u.expo.dev/7b771362-c331-49ce-94fd-f43d171a309e"
    }
  }
};
