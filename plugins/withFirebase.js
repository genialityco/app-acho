const { withPlugins } = require('@expo/config-plugins');

/**
 * Plugin personalizado para React Native Firebase
 * Este plugin asegura que los archivos de configuración de Firebase
 * se incluyan correctamente en el build
 */
const withFirebase = (config) => {
  // Los archivos google-services.json y GoogleService-Info.plist
  // ya están configurados en ios.googleServicesFile y android.googleServicesFile
  // No necesitamos hacer nada más aquí
  return config;
};

module.exports = withFirebase;
