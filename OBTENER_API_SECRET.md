# Cómo Obtener el API Secret de Google Analytics 4

Para que los eventos de mobile se envíen correctamente a Firebase Analytics, necesitas configurar el API Secret de GA4 Measurement Protocol.

## Pasos para Obtener el API Secret

### 1. Ir a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **global-auth-49737**

### 2. Navegar a Analytics
1. En el menú lateral, haz clic en **Analytics**
2. Luego en **DebugView** o **Events**

### 3. Ir a Google Analytics 4
1. En la parte superior, haz clic en el ícono de engranaje ⚙️ (Configuración)
2. O ve directamente a: **Analytics > Configuración**

### 4. Acceder a Data Streams
1. En la columna izquierda, busca **Flujos de datos** (Data Streams)
2. Verás tu app Android listada: `com.geniality.achoapp`
3. Haz clic en ella

### 5. Crear API Secret
1. Desplázate hacia abajo hasta la sección **Measurement Protocol API secrets**
2. Haz clic en **Create** o **Crear**
3. Dale un nombre descriptivo: `Mobile Analytics Secret`
4. Haz clic en **Create** o **Crear**
5. **COPIA EL SECRET** que aparece (solo se muestra una vez)

### 6. Configurar en el Código

Abre el archivo `services/analytics.ts` y reemplaza:

```typescript
const GA4_API_SECRET = 'YOUR_API_SECRET'; // ← Pega aquí tu secret
```

Por:

```typescript
const GA4_API_SECRET = 'tu_secret_copiado_aqui';
```

## Ejemplo

Si tu API Secret es `abc123XYZ`, el código quedaría:

```typescript
const GA4_MEASUREMENT_ID = 'G-3741K6QH0J';
const GA4_API_SECRET = 'abc123XYZ';
```

## Verificar que Funciona

1. Guarda el archivo `services/analytics.ts`
2. Reinicia la app: `npx expo start`
3. Navega por la app (login, cambiar tabs, etc.)
4. Ve a Firebase Console → Analytics → DebugView
5. Deberías ver eventos con los nombres de pantalla correctos:
   - `screen_view` con `screen_name: home_novedades`
   - `screen_view` con `screen_name: eventos_proximos`
   - etc.

## Notas Importantes

- El API Secret es **opcional** pero recomendado para producción
- Sin el secret, los eventos igual se envían pero sin validación
- Puedes crear múltiples secrets (uno para dev, otro para prod)
- Los secrets no expiran pero puedes revocarlos en cualquier momento

## Troubleshooting

**No encuentro "Data Streams":**
- Asegúrate de estar en la sección de Analytics (no en Project Settings)
- Busca en la configuración de Google Analytics 4, no en Firebase

**No veo mi app Android:**
- Verifica que `google-services.json` esté configurado correctamente
- Puede tardar unos minutos en aparecer después de la primera instalación

**Los eventos no aparecen:**
- Espera 5-10 minutos (puede haber delay)
- Verifica que el `GA4_MEASUREMENT_ID` sea correcto: `G-3741K6QH0J`
- Revisa los logs de la consola para errores
