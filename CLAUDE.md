# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About

AchoApp is a React Native (Expo) mobile app for ACHO (Asociación Colombiana de Hematología y Oncología). It serves as an event management platform for medical professionals: upcoming events, past events, agendas, speakers, documents, posters, and certificates.

## Commands

```bash
# Start the dev server
npm start

# Run on Android (requires emulator or device)
npm run android

# Run on iOS (requires macOS + simulator)
npm run ios

# Run tests
npm test

# Run a single test file
npx jest --testPathPattern="ThemedText"

# Lint
npm run lint

# EAS builds
eas build --profile development --platform android
eas build --profile production --platform all
eas update --channel production   # OTA update
```

## Architecture

### Routing (Expo Router file-based)

```
app/
  _layout.tsx            # Root: wraps all providers (OrganizationProvider > AuthProvider > NotificationsProvider > PaperProvider)
  login.tsx              # Public auth screens
  register.tsx
  (app)/
    _layout.tsx          # Protected guard: redirects to /login if not auth'd; handles push token registration, OTA update check, store version check, Firebase drawer listener, promo modal
    (tabs)/
      _layout.tsx        # Tab bar: Novedades | Anteriores | Próximos | ACHO | Mi Perfil
      home/              # "Novedades" tab — news/highlights feed
      (index)/           # "Próximos" tab — upcoming events
      eventosbefore/     # "Anteriores" tab — past events
      achoinfo/          # "ACHO" tab — organization info
      menu/              # "Mi Perfil" tab — user profile & settings
```

Each tab group has its own `_layout.tsx` (Stack navigator) and a `components/` subfolder for its screens. The `(index)` and `eventosbefore` tabs share the same screen logic but route differently via the `tab` prop passed to shared components in `components/event/`.

### Shared event components pattern

Screens under `(index)/components/` and `eventosbefore/components/` are thin wrappers that import from `components/event/` and pass a `tab` prop (`"(index)"` or `"eventosbefore"`). Navigation between sub-screens uses `router.push` with relative paths based on the tab string.

### State / Context

| Context | File | What it holds |
|---|---|---|
| `AuthContext` | `context/AuthContext.tsx` | Firebase auth state, `userId` (MongoDB `_id`), `uid` (Firebase UID), sign-in/up/out |
| `OrganizationContext` | `context/OrganizationContext.tsx` | Current org `_id` — hardcoded to ACHO (`66f1d236ee78a23c67fada2a`) |
| `NotificationsContext` | `context/NotificationsContext.tsx` | Push notification list, unread count, mark-as-read |

Auth flow: Firebase Auth → on state change → fetch user from backend by `firebaseUid` → store MongoDB `_id` as `userId`.

### API Layer

`services/api/api.ts` — Axios instance pointing to `https://lobster-app-uy9hx.ondigitalocean.app` (DigitalOcean backend). All services follow the same pattern: call `api.get/post/put/delete` and return `response.data`. Paginated responses use the `SearchData<T>` generic (`{ data: { items, totalItems, totalPages, currentPage } }`).

Services: `eventService`, `agendaService`, `speakerService`, `attendeeService`, `certificateService`, `documentService`, `highlightService`, `memberService`, `notificationService`, `organizationService`, `posterService`, `surveyService`, `userService`, `newsService`.

### Firebase

`services/firebaseConfig.ts` — Firebase Auth (with AsyncStorage persistence) and Realtime Database. Firebase is used for:
- Authentication (email/password)
- `drawer-status-acho` RTDB node: toggles an in-app drawer visible to all users in real-time

### Theme

`theme.tsx` — MD3 React Native Paper theme. Primary color is teal (`rgb(0, 105, 115)`). Import `theme` and use `theme.colors.*` for consistent colors.

## Key conventions

- `@/` path alias maps to the project root.
- The app is Spanish-language UI (all user-facing strings are in Spanish).
- Event sections (`agenda`, `speakers`, `documents`, `ubication`, `certificate`, `posters`) are feature flags on each event object — check `event.eventSections.<key>` before rendering navigation buttons.
- `dayjs` is used for all date formatting.
- `expo-notifications` push tokens are saved to the backend on login via `updateExpoPushToken` in `userService`.
- OTA updates use `expo-updates`; the app checks for updates and store version on every protected layout mount.
