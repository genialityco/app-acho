# Firebase Analytics - Guía de Implementación

## ✅ Implementación Completada

Se ha integrado Firebase Analytics en tu app React Native Expo usando el **Firebase JS SDK** que ya tenías instalado (v10.14.1).

## 📦 Solución Implementada

**Google Analytics 4 Measurement Protocol** - Envío directo de eventos

Esta solución:
- ✅ Funciona en **web** con Firebase Analytics completo
- ✅ En **mobile** usa GA4 Measurement Protocol (envío HTTP directo)
- ✅ **NO requiere rebuild nativo** - funciona con `expo start`
- ✅ Compatible con Expo Go y builds estándar
- ✅ Los eventos aparecen correctamente en Firebase Console con nombres de pantalla
- ✅ Sin dependencias nativas problemáticas

## 🔧 Configuración IMPORTANTE

### Paso 1: Obtener API Secret de GA4

Para que los eventos se envíen correctamente desde mobile, necesitas configurar el API Secret:

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Analytics > Configuración > Flujos de datos**
4. Selecciona tu app Android
5. En **Measurement Protocol API secrets**, haz clic en **Create**
6. Copia el secret generado

### Paso 2: Configurar el Secret en el Código

Abre `services/analytics.ts` y reemplaza:

```typescript
const GA4_API_SECRET = 'YOUR_API_SECRET';
```

Por tu secret real:

```typescript
const GA4_API_SECRET = 'tu_secret_aqui';
```

**Ver instrucciones detalladas en:** `OBTENER_API_SECRET.md`

### Archivos Modificados

1. **services/firebaseConfig.ts**
   - Se agregó inicialización de Analytics
   - Exporta `analytics` para uso en web

2. **services/analytics.ts** (ACTUALIZADO)
   - Usa GA4 Measurement Protocol para mobile
   - Envía eventos HTTP directamente a Google Analytics
   - Genera client_id único por dispositivo
   - En web usa Firebase Analytics nativo

3. **context/AuthContext.tsx**
   - ✅ Tracking de `sign_up` al registrarse
   - ✅ Tracking de `login` al iniciar sesión
   - ✅ Tracking de `logout` al cerrar sesión
   - ✅ Tracking de `password_reset` al recuperar contraseña
   - ✅ Configuración de `userId` en Analytics

4. **app/(app)/(tabs)/home/index.tsx**
   - ✅ Tracking de pantalla `home_novedades`

5. **app/(app)/(tabs)/(index)/index.tsx**
   - ✅ Tracking de pantalla `eventos_proximos`
   - ✅ Tracking de `view_event` al hacer clic en un evento

6. **app/(app)/(tabs)/eventosbefore/index.tsx**
   - ✅ Tracking de pantalla `eventos_anteriores`
   - ✅ Tracking de pantalla `eventos_anteriores_memorias`
   - ✅ Tracking de `view_memorias` al ver memorias

7. **app/(app)/(tabs)/achoinfo.tsx**
   - ✅ Tracking de pantalla `acho_info`

8. **app/(app)/(tabs)/menu/index.tsx**
   - ✅ Tracking de pantalla `mi_perfil`

9. **app/(app)/(tabs)/menu/components/editprofile.tsx**
   - ✅ Tracking de pantalla `editar_perfil`
   - ✅ Tracking de `edit_profile` al actualizar perfil

10. **app/(app)/(tabs)/menu/components/myevents.tsx**
    - ✅ Tracking de `view_my_events`

11. **app/(app)/(tabs)/menu/components/mycertificates.tsx**
    - ✅ Tracking de `view_my_certificates`
    - ✅ Tracking de `download_certificate` al descargar

12. **app/(app)/(tabs)/menu/components/support.tsx**
    - ✅ Tracking de `view_support`

## 📊 Eventos Implementados

### Autenticación
- `sign_up` - Registro de usuario
- `login` - Inicio de sesión
- `logout` - Cierre de sesión
- `password_reset` - Recuperación de contraseña

### Navegación (screen_view)
- `home_novedades` - Tab Novedades
- `eventos_proximos` - Tab Próximos
- `eventos_anteriores` - Tab Anteriores
- `eventos_anteriores_memorias` - Memorias
- `acho_info` - Tab ACHO
- `mi_perfil` - Tab Mi Perfil
- `editar_perfil` - Editar Perfil

### Interacciones
- `view_event` - Ver detalle de evento (incluye tipo: próximo/anterior)
- `view_memorias` - Ver memorias
- `view_my_events` - Ver mis eventos
- `view_my_certificates` - Ver mis certificados
- `download_certificate` - Descargar certificado
- `edit_profile` - Actualizar perfil
- `view_support` - Ver soporte

## 🚀 Cómo Usar

### Configuración Inicial (IMPORTANTE)
1. **Obtén el API Secret** siguiendo las instrucciones en `OBTENER_API_SECRET.md`
2. **Configura el secret** en `services/analytics.ts`
3. **Reinicia la app**

### Iniciar la App
```bash
# Funciona inmediatamente sin rebuild
npx expo start
```

### En Web (Analytics Completo)
1. Presiona `w` para abrir en navegador
2. Los eventos se envían a Firebase Analytics
3. Verifica en Firebase Console → Analytics → Events

### En Mobile (GA4 Measurement Protocol)
1. Presiona `a` para Android o `i` para iOS
2. Los eventos se envían directamente a GA4 vía HTTP
3. También aparecen en logs como:
   ```
   [Analytics] screen_view { screen_name: 'home_novedades' }
   ```
4. Verifica en Firebase Console → Analytics → DebugView (tiempo real)
5. O en Analytics → Events (reportes con 24h de delay)

## 🎯 Eventos Adicionales Disponibles

Métodos que puedes usar en otros componentes:

```typescript
import { Analytics } from '@/services/analytics';

// Eventos de contenido
Analytics.logViewSpeaker(speakerId, speakerName);
Analytics.logViewPoster(posterId, posterTitle);
Analytics.logViewDocument(documentId, documentName);
Analytics.logViewProgram(eventId);

// Notificaciones
Analytics.logNotificationReceived(notificationId);
Analytics.logNotificationOpened(notificationId);

// Propiedades de usuario
Analytics.setUserProperties({
  specialty: 'Oncología',
  member_type: 'active'
});

// Control
Analytics.setAnalyticsEnabled(false); // Deshabilitar
```

## 📱 Opciones para Analytics Nativo en Mobile

Si necesitas analytics nativo completo en iOS/Android:

### Opción 1: Expo Dev Client + React Native Firebase
```bash
# Instalar dev client
npx expo install expo-dev-client

# Instalar Firebase nativo
npm install @react-native-firebase/app @react-native-firebase/analytics

# Agregar a app.json plugins:
"@react-native-firebase/app",
"@react-native-firebase/analytics"

# Crear build de desarrollo
npx eas build --profile development --platform android
```

### Opción 2: Enviar a tu Backend
Modifica el helper `logEvent` en `services/analytics.ts`:
```typescript
const logEvent = async (eventName: string, params?: any) => {
  if (Platform.OS !== 'web') {
    // Enviar a tu API
    await fetch('https://tu-api.com/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: eventName, 
        params, 
        userId,
        timestamp: new Date().toISOString()
      })
    });
  }
};
```

### Opción 3: Google Analytics 4 Measurement Protocol
Envía eventos directamente a GA4:
```typescript
const GA4_MEASUREMENT_ID = 'G-3741K6QH0J';
const GA4_API_SECRET = 'tu_api_secret'; // Obtener de GA4 Admin

await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`, {
  method: 'POST',
  body: JSON.stringify({
    client_id: userId,
    events: [{ name: eventName, params }]
  })
});
```

## 🔍 Verificar que Funciona

### En Web (Inmediato)
1. `npx expo start` → presiona `w`
2. Abre DevTools → Console
3. Realiza acciones (login, navegar)
4. Ve a Firebase Console → Analytics → DebugView
5. Deberías ver eventos en tiempo real

### En Mobile (Con GA4 Measurement Protocol)
1. **Configura el API Secret** (ver `OBTENER_API_SECRET.md`)
2. `npx expo start` → presiona `a` o `i`
3. Navega por la app (login, cambiar tabs, ver eventos)
4. Ve a Firebase Console → Analytics → DebugView
5. Deberías ver eventos con nombres correctos:
   - `screen_view` con `screen_name: home_novedades`
   - `screen_view` con `screen_name: eventos_proximos`
   - `login`, `view_event`, etc.

### Verificar en Páginas y Pantallas
1. Ve a Firebase Console → Analytics → Engagement → Páginas y pantallas
2. Deberías ver las rutas:
   - `home_novedades`
   - `eventos_proximos`
   - `eventos_anteriores`
   - `mi_perfil`
   - etc.

**Nota:** Los reportes pueden tardar hasta 24 horas. Usa DebugView para ver eventos en tiempo real.

## 🎨 Habilitar Debug Mode

### Android
```bash
adb shell setprop debug.firebase.analytics.app com.geniality.achoapp
```

### iOS
En Xcode, edita el scheme y agrega argumento:
```
-FIRAnalyticsDebugEnabled
```

## 💡 Ventajas de esta Solución

- ✅ **Sin rebuild nativo** - Funciona con `expo start`
- ✅ **Compatible con Expo Go** - Prueba inmediata
- ✅ **Analytics completo en web** - Ideal para PWA
- ✅ **Eventos reales en mobile** - Aparecen en Firebase Console con nombres correctos
- ✅ **Sin dependencias problemáticas** - Usa HTTP directo
- ✅ **Debugging simple** - Console logs + Firebase DebugView
- ✅ **Páginas y pantallas correctas** - Verás las rutas reales en reportes

## 📈 Métricas en Firebase Console

Una vez que los eventos lleguen a Firebase, podrás ver:
- Usuarios activos (diarios/mensuales)
- Retención de usuarios
- Pantallas más visitadas
- Flujo de navegación
- Conversión (registro → eventos → certificados)
- Dispositivos y versiones
- Tiempo de sesión

## 🔐 Privacidad

- ✅ Consentimiento implementado (`dataTreatmentConsent`)
- ✅ No se envían datos personales (solo IDs)
- ✅ Puedes deshabilitar: `Analytics.setAnalyticsEnabled(false)`

## 🆘 Troubleshooting

**No veo eventos en Firebase Console:**
- ✅ **Configura el API Secret** (ver `OBTENER_API_SECRET.md`)
- Verifica que `GA4_MEASUREMENT_ID` sea `G-3741K6QH0J`
- Espera 5-10 minutos (puede haber delay inicial)
- Usa DebugView para ver eventos en tiempo real

**Veo "MainActivity" o "(not set)" en lugar de nombres de pantalla:**
- ✅ **Esto se soluciona con GA4 Measurement Protocol**
- Asegúrate de tener el API Secret configurado
- Los eventos ahora incluyen `screen_name` correcto

**Error al importar analytics:**
- Ya está configurado en `services/firebaseConfig.ts`
- Importa desde `@/services/analytics`

**Los eventos no tienen el formato correcto:**
- Verifica que estés usando la versión actualizada de `services/analytics.ts`
- Debe usar `sendToGA4` para mobile

## 📚 Recursos

- [Firebase Analytics Web](https://firebase.google.com/docs/analytics/get-started?platform=web)
- [Expo Dev Client](https://docs.expo.dev/development/introduction/)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Firebase Console](https://console.firebase.google.com/)
