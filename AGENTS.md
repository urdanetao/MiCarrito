# MiCarrito — Project Memory

## Directiva de Idioma
**IMPORTANTE**: Responder SIEMPRE en español. Esta directiva es obligatoria y no se debe olvidar.

## Overview
Monorepo with React/Vite frontend, PHP backend, and Android WebView APK target. App name: MiCarrito.

## Recent Work — v2.0 Release (COMPLETE)

### Navigation Stack (Engine.jsx)
- Replaced `history.pushState` + `popstate` listener with a `navigationStackRef` (array) in Engine.jsx
- `handleSelectSection` pushes current section to stack before changing
- `goBack()` pops from stack → `setSelectedSection(prev)`. If stack empty → `handleLogoutConfirm()`
- All sub-screens receive `goBack` as prop
- **No `window.history.pushState` or `window.history.back()` used anywhere** — navigation is 100% React state controlled
- Fixed `clearRestoreHandler` alias bug that nuked back handlers for all sub-screens
- Unified logout confirmation: both back button and "Cerrar Sesion" button call the same `handleLogoutConfirm`
- `CoreMenuPopup` registers in `_modalStack` for proper back button handling
- Files: `Engine.jsx`, `main.jsx`, `util/util.js`, `CoreMenuPopup.jsx`, all sub-screens

### Database Schema Verified
- `database/create_schema.php` is 100% aligned with backend (`apicode.php`)
- All 8 tables present: usuarios, categorias, monedas, compras, productos, config, user_devices, favoritos
- All columns, indexes, and keys match actual backend usage
- `update_db.php` is consistent — only adds incremental migrations already reflected in `create_schema.php`

### Push Notification System (COMPLETE)
- FCM HTTP v1 API via `file_get_contents` (no curl dependency)
- `firebase_sender.php`: `sendPushToUser()`, `sendFcmPush()`, UNREGISTERED token cleanup via `deactivateUnregisteredToken()`
- `useLazyFetch` `{ silent: true }` fix: errors always show, only success suppressed
- Background notification channel created in `MainActivity.onCreate()` (not just in `onMessageReceived`)
- Frontend: `fcmdata` CustomEvent dispatch for real-time badge/list refresh

### QR Scanner (CameraX)
- `QrScannerHelper.kt`: CameraX live barcode scanning with `ProcessCameraProvider`, `ImageAnalysis`, `PreviewView`
- `PreviewView` created lazily in `startScanning()` only
- ML Kit Barcode Scanning (`mlkit-barcode` v17.3.0)

### Biometric Login
- `BiometricHelper.kt`: `BIOMETRIC_STRONG` (API 28-29), `BIOMETRIC_STRONG | DEVICE_CREDENTIAL` (API 30+)
- Backend: `registerBiometric` + `loginBiometric` (public)
- `bio_token` stored in `SharedPreferences` plain (NOT EncryptedSharedPreferences — causes SIGABRT)
- `security-crypto` removed from dependencies

### Favoritos Screen (COMPLETE)
- Full CRUD with `showConfirm` for delete
- QR scan (`Android.scanQR()`) + QR display overlay
- `getFavoritos` backend JOINs with `usuarios` for `nombre_completo`

### Bug Fixes
- Badge not updating after accept/reject: dispatch `fcmdata` CustomEvent locally
- Type coercion: `Number(compra.estado_comparticion) === 1` for MySQL string comparison
- APK white screen: `textColor` changed to `@android:color/black`
- CoreConfirm dialog working (verified in production APK)

## ⚠️ ADVERTENCIA CRÍTICA: Comparaciones con MySQL
**PROBLEMA RECURRENTE**: MySQL devuelve campos numéricos como STRINGS en JSON.

**REGLAS OBLIGATORIAS**:
1. **NUNCA** usar `===` para comparar valores de MySQL con números
2. **SIEMPRE** usar `Number(valor) === valorEsperado` o `parseInt()`
3. **SIEMPRE** usar `normalizeBool()` para campos booleanos/string

## APK Build Notes
- Android SDK not available locally (no JAVA_HOME) — build/test APK in Android Studio
- Use `./gradlew assembleDebug` to compile after making native code changes

## Key Files
- `android/app/src/main/java/com/example/micarrito/QrScannerHelper.kt` — CameraX QR scanner
- `android/app/src/main/java/com/example/micarrito/MainActivity.kt` — Native Android integration
- `android/app/src/main/res/layout/activity_main.xml` — Android layout
- `frontend/src/util/util.js` — backHandlerRegistry, navigation handlers
- `frontend/src/system/Favoritos/Favoritos.jsx` — Favoritos screen
- `frontend/src/system/Engine/Engine.jsx` — Navigation stack + logout
- `backend/apicode.php` — Backend API (all actions)
- `backend/firebase_sender.php` — Push notification service (FCM HTTP v1)
- `database/create_schema.php` — Database schema (verified up to date)
