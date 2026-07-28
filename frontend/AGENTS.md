# AGENTS.md — micarrito

**Idioma de comunicación:** Siempre responder en español. Cliente frontend que se comunica con un backend PHP. Es una **app móvil híbrida** (WebView Android + frontend web).

## Repositorio / rutas del proyecto

**Monorepo único:** `C:\source\react\smartsoft\micarrito` — contiene TODO el proyecto.

```
micarrito/
├── frontend/    ← React/Vite (este directorio)
├── backend/     ← PHP API (api.php, apicode.php, firebase_sender.php, etc.)
├── android/     ← Proyecto Android Studio (WebView + FCM)
├── database/    ← Scripts de esquema y migración
├── README.md
└── .gitignore
```

- **Frontend:** `frontend/` — código React/Vite, se ejecuta con `npm run dev` desde esta carpeta.
- **Backend:** `backend/` — API PHP. En producción corre en el VPS (`https://almacenadorasaiver.com/micarrito`). Localmente se sirve vía XAMPP apuntando a esta carpeta.
- **Android:** `android/` — proyecto Android Studio, se abre desde esta carpeta. Embebe el frontend vía WebView.
- **Database:** `database/` — scripts `create_schema.php` y `create_admin.php`.

El build de producción del frontend (`npm run build` → `dist/`) es lo que consume la APK. En dev, el frontend habla con el backend vía el proxy de Vite (ver abajo).

## Comandos

- `npm run dev` — servidor de desarrollo (Vite).
- `npm run build` — build de producción (`vite build`).
- `npm run lint` — ESLint (`eslint .`). No hay typecheck ni tests configurados.
- `npm run preview` — sirve el build de producción.

No hay suite de tests. No ejecutar `npm test` (no existe).

## Arquitectura

- Entrada: `src/main.jsx` monta `<App>` dentro de `<ToastProvider>`. `src/App.jsx` alterna entre `Login` y `Engine` según la sesión en `sessionStorage`.
- Directorios de `src/`:
  - `components/` — UI reutilizable (`Core*`). Se importan vía el barrel `components/index.js`. Cada componente vive en su propia carpeta con `index.js` + `Componente.jsx`.
  - `system/` — pantallas/módulos de negocio (`Login`, `Engine`, `Categorias`, `Compras`, `Monedas`, `Configuracion`, `Favoritos`). `Engine` es el orquestador post-login; la navegación usa un **`navigationStackRef`** interno (no router, no `history.pushState`).
  - `hooks/` — `useLazyFetch` (fetch centralizado a la API) y `Toast`.
  - `util/` — `util.js` (sesión, handlers de botón back de Android, `backHandlerRegistry`, `getFcmToken()`, `isPushNotificationSupported()`), `constants.js`, `modalStack.js`, `focusNavigation.js`.
- Convención de carpetas: cada componente/módulo es una carpeta con `index.js` que re-exporta el default. Importar siempre desde el barrel, no desde la ruta interna, salvo excepciones explícitas (ej. `showConfirm` en `components/CoreConfirm/CoreConfirm`).

## Backend / API

- Todas las llamadas pasan por `useLazyFetch` → `fetchData(action, params, options)`. Hace POST JSON a `VITE_API_URL` (default `/api.php`) con cuerpo `{ action, params, token }`. El `token` es `sessionId` de la sesión.
- `fetchData` acepta un tercer parámetro `options`: `{ silent: true }` suprime el toast automático (útil para operaciones de fondo como `registerDevice`).
- En dev, Vite proxy `/api.php` → `http://localhost/smartsoft/micarrito/api.php` (`vite.config.js`). Requiere ese backend PHP corriendo localmente para que funcionen las llamadas.
- `base: './'` en Vite: rutas relativas en el build (para servir desde subdirectorio).

### Backend (PHP, `backend/`)

- `api.php` es el único endpoint: valida CORS (orígenes permitidos fijos), método POST, formato del `action` (solo `[A-Za-z_][A-Za-z0-9_]*`) y formato del `token` (UUID v1-v5). Despacha por `call_user_func($action, ...)`.
- `apicode.php` define todas las funciones de la API. Respuestas siempre vía `getResultObject($status, $message, $data)` → `{status, message, data}`. El frontend depende de esta forma.
- **Acciones públicas** (sin token): `login`, `logout`, `isLoggedIn`, `loginBiometric`. **Privadas** (requieren token válido): `getCategorias`, `saveCategoria`, `deleteCategoria`, `getCompras`, `saveCompra`, `deleteCompra`, `changeEstadoCompra`, `duplicateCompra`, `getCategoriasCompra`, `getProductosCategoria`, `saveProducto`, `deleteProducto`, `changeEstadoProducto`, `copiarCategoria`, `getMonedas`, `saveMoneda`, `deleteMoneda`, `getConfig`, `saveConfig`, `changePassword`, `createUsuario`, `registerBiometric`, `disableBiometric`, `registerDevice`, `unregisterDevice`, `shareCompra`, `aceptarComparticion`, `rechazarComparticion`, `getFavoritos`, `saveFavorito`, `deleteFavorito`, `getContadorComprasRecibidas`.
- `session-manager.php`: sesiones en archivos `data/sessions/<token>.json` (no DB). `login` devuelve la sesión con `sessionId`; el frontend la guarda en `sessionStorage`. TTL e idle timeout están en 0 (sin expiración por tiempo).
- `mysql-data-manager.php`: wrapper mysqli propio (`Query`, `BeginTransaction`, `CommitTransaction`, `RollbackTransaction`, `Escape`). **Las consultas usan concatenación de strings con `$conn->Escape()` (`mysqli_real_escape_string()`)** — escapa `\`, `'`, `"`, `\n`. No cambiar este patrón sin revisar todo el backend.
- `dbinfo.php` lee credenciales de MySQL desde env (`SAIVERNET_MYSQL_HOST/PORT/USER/PWD`), DB `smartsoft_micarrito`. **No commitear credenciales.**
- `getUserNicknameFromToken($token)` — helper que retorna el nickname del usuario a partir del token de sesión. Usado por funciones que necesitan enviar notificaciones con datos del usuario.
- Tablas principales: `usuarios` (login, pwd en `sha3-512`, `admin` 0/1, `bio_token` VARCHAR(255) NULL — token del dispositivo para login biométrico), `categorias` (por `idusu`), `compras` (`estado` 0/1, `idmon`, `id_usuario_origen` INT NULL — NULL=propia, ID=remitente si compartida, `estado_comparticion` 0=normal, 1=recibida_pendiente, 2=aceptada, 3=rechazada), `productos` (`comprado` 0/1, `prioridad` 0/1, `idcom`, `idcat`), `monedas` (`id_usu`, `siglas`, `simbolo`), `config` (fila `id=1`, `contraercategorias`), `user_devices` (tokens FCM: `idusu`, `fcm_token` VARCHAR(500), `platform`, `active` 0/1, `fecha_registro`, `fecha_actualizacion`), `favoritos` (id, `idusu`, `nickname`, `id_usuario_favorito`, `fecha`; UNIQUE en `idusu`+`id_usuario_favorito`). Un usuario puede tener múltiples dispositivos.
- IDs autoincrementales generados manualmente (SELECT MAX id + 1) dentro de transacción. Patrón consistente en todas las tablas: `SELECT t.id FROM <table> AS t ORDER BY t.id DESC LIMIT 1`, default `1` si vacío, `max + 1` si hay registros.

### Compartir compras y Favoritos

- **`shareCompra($params, $token)`**: copia completa de compra (productos, categorías) al usuario destino. Resolución de categorías por nombre entre usuarios (si el destino no tiene una categoría con ese nombre, la crea). Envía FCM data payload `{ type: 'compra_recibida', compraId }` al destino.
- **`aceptarComparticion($params, $token)`**: cambia `estado_comparticion` a 2. Envía FCM notification al remitente.
- **`rechazarComparticion($params, $token)`**: elimina compra compartida + productos. Envía FCM notification al remitente.
- **`getFavoritos($params, $token)`**: retorna lista de favoritos del usuario.
- **`saveFavorito($params, $token)`**: agrega favorito (valida nickname, duplicados, no a sí mismo).
- **`deleteFavorito($params, $token)`**: elimina favorito por ID.
- **`getContadorComprasRecibidas($params, $token)`**: retorna count de compras con `estado_comparticion = 1` (pendientes de aceptar). Usado para badge.

### APK Android (WebView, `android/`)

- Proyecto Android Studio (Kotlin). La única `Activity` es `MainActivity.kt` (paquete `com.example.micarrito`).
- Es un **WebView puro**: carga la URL `BASE_URL` (en `MainActivity.kt:93`, hoy `https://almacenadorasaiver.com/micarrito`; hay una URL local comentada `http://192.168.1.20/micarrito`). No embebe el `dist/` local; sirve el frontend desde el servidor web.
- Puente JS↔Android vía `addJavascriptInterface(WebAppInterface, "Android")`:
  - El frontend detecta WebView con `window.Android.showToast` (`isRunningInWebView()` en `util/util.js`). El backend PHP/orígenes permitidos deben coincidir.
  - `Android.showToast(message, duration)` muestra un Toast nativo (usado por `useLazyFetch` para mensajes de API).
  - `Android.getFcmToken()` retorna el FCM token actual (string vacío si no hay token).
  - `Android.scanQR()` abre selector de imagen para escanear código QR (ML Kit Barcode Scanning). El resultado se pasa al frontend vía `window.onQRScanned(nickname)`.
  - El botón back de Android llama a `window.onAndroidBack()` (definido en `src/main.jsx`) a través de `evaluateJavascript`.
- `QrScannerHelper.kt` — maneja permisos de cámara y escaneo QR con ML Kit Barcode Scanning (dependencia `mlkit-barcode` v17.3.0). Usa `ActivityResultContracts` para permisos y selector de imagen. Procesa QR de imagen seleccionada y retorna el contenido al WebView.
- `AndroidManifest.xml` usa `usesCleartextTraffic="true"`, `INTERNET` + `ACCESS_NETWORK_STATE` + `POST_NOTIFICATIONS` + `CAMERA` y `screenOrientation="portrait"` (orientación forzada a vertical). `<uses-feature android:name="android.hardware.camera" android:required="false" />`. Splash screen (2s) y pantalla de error de red con botón reintentar. Servicio `MiCarritoFirebaseMessagingService` para FCM.
- `build.gradle.kts`: `minSdk=28`, `targetSdk=36`, `compileSdk=37`, namespace `com.example.micarrito`. APK release sin optimización (`optimization.enable=false`). Firebase BOM 33.7.0 + firebase-messaging + mlkit-barcode. Google services plugin.
- Ícono de notificación: `res/drawable/ic_notification.xml` (carrito vectorial monocromático blanco). `MiCarritoFirebaseMessagingService` usa `setSmallIcon(R.drawable.ic_notification)` + `setLargeIcon(micarrito_icon)`.
- Cambiar la URL de producción se hace editando `BASE_URL` en `MainActivity.kt` (no en el frontend). El despliegue consiste en subir el `dist/` del frontend al servidor apuntado por `BASE_URL`.
- **Menú contextual de selección de texto (Copiar/Compartir/Seleccionar todo):** el CSS `user-select: none` global en `index.css` NO basta; el action mode nativo del WebView se dispara igual por long-press. La solución definitiva es en la APK: `MainActivity.kt` sobreescribe `startActionMode` para retornar `null`. Requiere recompilar y subir la APK.
- **Índice seguro de la barra de navegación Android:** `index.html` usa `viewport-fit=cover`; el botón flotante `+` del detalle de compra usa `bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))'`.

### Convención del botón Atrás de Android (crítica)

- **El botón Atrás del teléfono SIEMPRE debe actuar como el botón "cancelar" activo** (cerrar el modal/confirmación superior). No navega el historial si hay un modal abierto.
- Mecanismo en `src/util/util.js` → `backHandlerRegistry`: tiene una **pila de modales** (`_modalStack`) que `invoke()` consulta **primero**; si hay un modal/confirm abierto, lo cierra y no ejecuta el handler de pantalla.
- `CoreModal.jsx` (usado por todos los modales: `ModalCompra`, `ModalProducto`, `ModalDuplicar`, `ModalCopiar`, `ModalCompartir`) registra `pushModalBackHandler(() => closeModal())` al abrirse y lo quita al cerrarse.
- `CoreConfirm.jsx` registra un handler que **cancela** la confirmación (cierra + ejecuta `cancelAction`).
- El handler de pantalla (ej. `Compras.jsx`, `Engine.jsx`, `Favoritos.jsx`) queda como `handler` simple y solo se ejecuta cuando la pila de modales está vacía (para expandir/contraer categorías o salir del detalle).
- `window.onAndroidBack` (en `src/main.jsx`) llama `backHandlerRegistry.invoke()`; si retorna `false`, nulifica el handler (no hay fallback a `window.history.back()`).

### Sistema de navegación por pila (Engine.jsx) — v2.0

- `Engine.jsx` usa un **`navigationStackRef`** (array) como pila de secciones. `handleSelectSection` empuja la sección actual (`selectedSection`) a la pila antes de cambiar.
- **`goBack()`**: pop de la pila → `setSelectedSection(prev)`. Si la pila está vacía → `handleLogoutConfirm()`.
- Cada sub-pantalla recibe `goBack` como prop y la usa en su `setBackHandler()` al final del flujo (modales → editing → expanded → salir de pantalla).
- **No se usa `window.history.pushState` ni `window.history.back()` en ningún sitio**. La navegación es 100% controlada por React state.
- `main.jsx`: si `backHandlerRegistry.invoke()` retorna `false`, solo hace `handler = null` (no hay navegador que poppear).
- **Compras.jsx**: maneja detalle↔lista internamente con `selectedCompra` state. El back handler verifica `selectedCompraRef.current` antes de llamar `goBack()` — si hay una compra seleccionada, primero vuelve a la lista.
- **Unified logout**: tanto el botón "Cerrar Sesion" como el back button en el menú principal llaman `handleLogoutConfirm()`, que ejecuta `showConfirm()` para confirmar.

## Cuenta, usuarios y login biométrico

### Cambio de contraseña
- Backend: `changePassword` (privada) en `apicode.php` — valida clave actual (`sha3-512`) y actualiza `usuarios.pwd`. Registrada en `api.php`.
- Frontend: `src/system/Configuracion/ModalCambiarClave.jsx` (CoreModal > CoreWindow > CoreGroup + 3 CorePassword). Botón "Cambiar contraseña" en `Configuracion.jsx` (grupo "Cuenta").

### Crear usuario (solo admin)
- Backend: `createUsuario` (privada, exige que el usuario logueado sea `admin`) en `apicode.php`. Inserta en `usuarios` (nickname, nombre, email, pwd `sha3-512`, admin).
- Frontend: `src/system/Configuracion/ModalCrearUsuario.jsx` (campos CoreText con entryMode: **nickname = LOWER**, **nombre = UPPER**, **email = LOWER**, separados por `CoreVSep`; CorePassword + CoreToggle "Administrador"). Botón "Crear usuario" en `Configuracion.jsx` **solo si `sessionData.user.admin`** (login devuelve la fila completa de `usuarios`, incluido `admin`).
- `login` hace `unset($session['user']['pwd'])`; el backend NUNCA devuelve la pwd.

### Login biométrico (huella/rostro del dispositivo)
- **Principio:** el teléfono ya tiene los datos biométricos (SO). La app guarda solo el `nickname` + un `bioToken` aleatorio (NO la contraseña) en `SharedPreferences` plain (sin cifrar). La seguridad es a nivel de aplicación: `BiometricPrompt` bloquea el acceso al token antes de leerlo. El backend solo da sesión si `nickname` + `bio_token` coinciden.
- **NO usar `EncryptedSharedPreferences` ni `MasterKey`**: causaban crashes nativos (SIGABRT) que `try-catch` no atrapa. La `SecretKey` con `setUserAuthenticationRequired(true)` del AndroidKeyStore persiste entre reinstalaciones (ligada al certificado de firma) y genera "keystore error" permanente. `security-crypto` fue eliminado de `build.gradle.kts` y `libs.versions.toml`.
- Backend: `registerBiometric` (privada, guarda `bio_token` del dispositivo para el usuario) + `loginBiometric` (pública, matchea `nickname`+`bio_token` y devuelve sesión sin pwd ni `bio_token`). Migración `update_db.php` (idempotente, agrega la columna `bio_token` a `usuarios`).
- Android: `BiometricHelper.kt` (~124 líneas) — simplificado. Genera `bioToken` con `UUID.randomUUID()`, guarda en `SharedPreferences` (`micarrito_prefs`). `BiometricPrompt` usa `BIOMETRIC_STRONG` en API 28-29, `BIOMETRIC_STRONG | DEVICE_CREDENTIAL` en API 30+ (combo soportado desde `Build.VERSION_CODES.R`). **NO usar `canAuthenticate()`**: es poco confiable (devuelve `-2` NO_HARDWARE o `-1` NONE_ENROLLED en dispositivos con hardware funcional). Usa `Build.VERSION.SDK_INT` para elegir authenticators. `WebAppInterface` expone `isBiometricAvailable()`, `hasBiometricHardware()`, `getBiometricDiag()`, `enableBiometric(nickname)`, `authenticateBiometric()`, `disableBiometric()`, `scanQR()` — todos con safety-net `try-catch` en `runOnUiThread`. `webView` es constructor param de `WebAppInterface` (necesario para `evaluateJavascript`).
- Frontend: `App.jsx` define handlers globales `window.onFcmTokenReceived(token)` → `registerDevice` con `{ silent: true }` (sin toast); `window.onBiometricEnabled(bioToken)` → `registerBiometric` (sin toast automático); `window.onBiometricAuth(nickname, bioToken)` → `loginBiometric` + setea sesión; `window.onBiometricError(msg)` → toast; `window.onFcmDataReceived(type, compraId)` → dispatch CustomEvent `fcmdata`. `Login.jsx` muestra botón **"Entrar con huella"** (con icono `LuFingerprint`) cuando `Android.hasBiometricHardware()` es true Y aún no hay biométricos registrados (`!bioRegistered`). Al activar el toggle "Activar identificación biométrica" y hacer login exitoso, llama `Android.enableBiometric(nickname)` con `setTimeout(500ms)` para evitar crashear React. `enableBiometric` tiene early return si `prefBioEnabled` ya es `true` para no re-registrar.
- `Configuracion.jsx`: grupo **"Biométrico"** con botón "Eliminar datos biométricos" que llama `fetchData('disableBiometric')` + `Android.disableBiometric()`. Solo se muestra si `Android.hasBiometricHardware()` es true.
- El APK (WebView) no tiene acceso a biometría: siempre lo gestiona la capa nativa y pasa el resultado al frontend vía el puente JS.
- Diagnóstico: `Android.getBiometricDiag()` desde la consola WebView (`chrome://inspect`) muestra `api=<level> prefBioEnabled=<bool> nickname=<str> hasToken=<bool>`.

### Notificaciones Push (Firebase Cloud Messaging)
- **Infraestructura FCM** implementada. Backend envía vía HTTP v1 API de FCM usando `file_get_contents` + `stream_context_create` (sin curl ni dependencias PHP externas).
- **Archivos backend:** `firebase_sender.php` (servicio de envío), `firebase_config.php` (config del service account, gitignored), `firebase_config.php.example` (template). El service account JSON (`micarrito-*.json`) también está gitignored.
- **Tabla `user_devices`:** almacena tokens FCM por usuario. Soporta múltiples dispositivos por usuario. Columnas: `id`, `idusu`, `fcm_token`, `platform`, `active`, `fecha_registro`, `fecha_actualizacion`.
- **Flujo de registro:** Android obtiene FCM token → lo envía al WebView via `evaluateJavascript("window.onFcmTokenReceived(token)")` → `App.jsx` llama `fetchData('registerDevice', { fcmToken }, { silent: true })` al VPS (sin toast). Si no hay sesión activa, el token se guarda en `pendingFcmTokenRef` y se registra al hacer login.
- **Flujo de notificaciones data (real-time):** Backend envía FCM data payload (no notification) → `MiCarritoFirebaseMessagingService.onMessageReceived` → broadcast `FCM_DATA_RECEIVED` → `MainActivity.fcmDataReceiver` → `evaluateJavascript("window.onFcmDataReceived(type, compraId)")` → `App.jsx` dispatch CustomEvent `fcmdata` → componentes escuchan (`MenuPrincipal` refresca badge, `Compras` refresca lista).
- **WebAppInterface** expone `getFcmToken()` (retorna token actual o string vacío), `scanQR()` (abre selector de imagen para escanear QR). `WebAppInterface` recibe un lambda `tokenProvider` para acceder a `currentFcmToken` de `MainActivity`.
- **`MiCarritoFirebaseMessagingService.kt`:** recibe `onNewToken` (guarda en SharedPreferences + notifica al WebView) y `onMessageReceived` (crea canal `micarrito_notifications`, muestra notificación con PendingIntent a MainActivity). El tap abre la app sin deep link. Para data payloads, envía broadcast `FCM_DATA_RECEIVED` con `type` y `compraId`.
- **`AndroidManifest.xml`:** permisos `POST_NOTIFICATIONS` (runtime en Android 13+) + `CAMERA` (para QR), servicio `MiCarritoFirebaseMessagingService` con `MESSAGING_EVENT`.
- **Frontend:** `util.js` exporta `getFcmToken()` e `isPushNotificationSupported()`.
- **Backend actions:** `registerDevice` (registra/actualiza token, retorna mensaje "Dispositivo registrado" — se llama con `{ silent: true }` para no mostrar toast), `unregisterDevice` (marca `active=0`).
- **Archivos sensibles NUNCA se commitean:** `google-services.json` (Android), `firebase_service_account.json` / `firebase_config.php` / `micarrito-*.json` (backend).
- **Prerrequisito:** crear proyecto Firebase, descargar `google-services.json` → `android/app/`, generar service account → `backend/`.

### Despliegue (crítico — leer antes de tocar backend)
- El APK carga el frontend y llama al backend desde `BASE_URL` (producción `https://almacenadorasaiver.com/micarrito`). El teléfono SIEMPRE prueba contra el backend de producción, no contra el XAMPP local.
- Para aplicar cambios de backend: subir `api.php` + `apicode.php` (+ `update_db.php`) al servidor, abrir `update_db.php` una vez (crea columnas), y **reiniciar PHP / OPcache**. Si el servidor tiene `opcache.validate_timestamps = 0` (común en producción), subir el archivo NUEVO NO tiene efecto: PHP sigue sirviendo el bytecode viejo (sin la acción nueva) hasta reiniciar opcache/FPM.
- `update_db.php` es idempotente: verifica si la columna/objeto ya existe antes de crearla. Puede ejecutarse múltiples veces sin efectos adversos. Cubre: tabla `user_devices`, columnas de comparticion en `compras`, tabla `favoritos`, columna `bio_token` en `usuarios`, columna `prioridad` en `productos`.
- Frontend: `npm run build` y subir `dist/`.
- `dbinfo.php` usa credenciales de env (`SAIVERNET_MYSQL_*`); en este equipo de desarrollo no están seteadas, por lo que el MySQL local da "Unknown database". Para probar el backend localmente se puede levantar un MySQL con esas credenciales y crear la BD `smartsoft_micarrito`.

### Database schema (verificado v2.0)
- `database/create_schema.php` contiene las 8 tablas completas con todas las columnas, índices y keys que el backend necesita.
- `database/update_db.php` solo agrega migraciones incrementales que ya están reflejadas en `create_schema.php`.
- Si se crea una BD nueva con `create_schema.php`, no es necesario ejecutar `update_db.php` después.

### Diagnóstico de errores de API
- `"Acceso denegado"` (string exacto, sin sufijo) sale SOLO de la rama "función no permitida" en `api.php` (acción no registrada en `$publicFunctions`/`$privateFunctions`). Significa que el backend que responde NO tiene la acción → backend viejo / no desplegado / opcache sin reiniciar. El backend local ya está correcto y fue probado end-to-end con el servidor integrado de PHP.
- `"Acceso denegado: token inválido o sesión expirada"` (con sufijo) = token inválido/expirado (`isActive` false).
- Los mensajes de validación de datos (ej. "La clave actual es incorrecta") vienen de la función, no de `api.php`.

### Modal y teclado del teléfono
- `CoreModal.jsx` es **consciente del teclado**: cuando un input recibe foco dentro del modal (solo en WebView vía `isRunningInWebView()`), reserva ~45% inferior (`paddingBottom`) y alinea el contenido arriba, además de `scrollIntoView` del campo enfocado. Esto evita que el teclado tape campos (el `100vh` del WebView no se reduce al abrir el teclado). No depende de `visualViewport` (que en algunos WebViews no dispara).
- `CorePassword` usa `type="text"` + `WebkitTextSecurity: 'disc'` en vez de `type="password"`: en Android el tipo `password` agrega una fila de números al teclado, haciendo más alto el teclado y tapando el botón "Iniciar Sesión" en Login.
- `CoreButton` soporta prop `icon` (acepta elementos React, se renderiza antes del children).

## Convenciones de UI

- **Iconos de acción tinted (editar/eliminar):** se usan en `Monedas.jsx`, `Categorias.jsx`, `Compras.jsx` (detalle) y `Favoritos.jsx`. En vez de `CoreButtonSquare` sólido, se usa un `<div>` con fondo `COLOR + '19'` (opacidad 10%), color `COLOR`, tamaño 34x34, border-radius 8px, centrado con flex. Más liviano visualmente.
- **Logo de Login/MenuPrincipal:** `borderRadius: 12px` + `boxShadow: '0 4px 15px rgba(25, 118, 210, 0.4)'` (sombra azul).
- **Botón de filtro en detalle de Compras:** `CoreMenuPopup` con opciones "Mostrar todo" / "Solo pendientes" / "Solo comprados" / "Cancelar" (rojo). Se alinea con `alignItems: 'flex-end'` en el searchBarStyles para que borde inferior del botón quede alineado con el del input. CoreText usa `wrapperStyle={{ flex: '1 1 auto', minWidth: 0 }}` para ocupar todo el espacio disponible.
- **`showConfirm`** recibe un **objeto** `{ text, okAction }`, NO argumentos posicionales.
- **ModalProducto layout:** Cantidad (flex `0 0 40%`) y Precio (flex `1 1 0`) en una fila (con `inputStyle={{ width: '100%' }}` para que el input interno del CoreNumber ocupe el wrapper). CoreVSep de separación entre filas. Prioridad y Comprado (toggles CoreToggle) en la fila siguiente, alineados con `gap`.
- **ModalCompra layout:** Fecha, Descripción y Moneda separados por `CoreVSep` para espaciado vertical.
- **Productos de alta prioridad:** `prioridad` 0/1. En la UI, productos con `prioridad = 1` muestran borde izquierdo verde (`#16a34a`), fondo verde claro (`#f0fdf4`), y sombra verde (`rgba(22,163,74,0.15)`). El backend ordena por `prioridad DESC, nombre ASC`.
- **Badge de notificaciones en Menú Principal:** tarjeta de Compras muestra badge rojo con contador de compras recibidas pendientes (`getContadorComprasRecibidas`). Se actualiza al recibir FCM data payload de tipo `compra_recibida` o `comparticion_respondida`.

## Pantallas / Módulos

### Favoritos (`src/system/Favoritos/Favoritos.jsx`)
- Pantalla completa (patrón Monedas): header con título + botón+, lista de tarjetas, input de agregar, botones QR.
- Tarjetas con borde naranja (`#f57c00`), icono estrella, nickname, botón eliminar (rojo tinted) con `showConfirm`.
- **Bottom buttons:** "Escanear QR" (azul, `IoCamera`) y "Mostrar QR" (naranja, `IoQrCode`).
- **Escanear QR:** llama `Android.scanQR()` → abre selector de imagen → ML Kit lee QR → `window.onQRScanned(nickname)` llena el input.
- **Mostrar QR:** overlay con QR generado desde `https://api.qrserver.com/v1/create-qr-code/?data={nickname}&size=200x200`.
- Back handler: cierra QR overlay primero, luego confirma si hay input activo,最后 vuelve al menú.

### ModalCompartir (`src/system/Compras/ModalCompartir.jsx`)
- CoreText (nickname destino, lowercase) + botón estrella → CoreMenuPopup con favoritos + CoreToggle "Agregar a favoritos" + confirmación antes de enviar.
- Al enviar: llama `shareCompra` → backend copia compra + envía FCM data payload.

### Compras compartidas (`src/system/Compras/Compras.jsx`)
- Compartidas (con `id_usuario_origen`): vista bloqueada con candado naranja + botones Aceptar/Rechazar.
- Aceptar → `aceptarComparticion` → FCM notification al remitente.
- Rechazar → `rechazarComparticion` → elimina compra + FCM notification al remitente.
- Escucha `fcmdata` CustomEvent para refrescar lista al recibir respuesta.

## Entorno / quirks

- `vite.config.js` habilita React Compiler vía `@rolldown/plugin-babel` + `reactCompilerPreset`. Afecta rendimiento de dev/build (ver README).
- `build.target: 'chrome69'`.
- La app corre también dentro de un WebView Android: `isRunningInWebView()` detecta `window.Android.showToast`. El botón back de Android se maneja con `window.onAndroidBack` y `backHandlerRegistry` en `main.jsx`/`util.js`.
- `react-icons` es la única librería de UI además de React. No hay UI kit (Material, etc.); los estilos son inline en cada componente usando constantes de `util/constants.js` (`COLOR_MAP`, `FORMSTATE`, etc.).

## Convenciones de estilo

- ESLint plano (`eslint.config.js`): reglas recomendadas de JS + `react-hooks` + `react-refresh`. Sólo archivos `.js`/`.jsx` (no TypeScript). `Android` está declarado como global `readonly` en la config (puente WebView).
- Estilos inline (objetos de estilo en el componente), no CSS modules ni Tailwind.
- Componentes son funcionales con props con valores por defecto y validación defensiva de tipos en runtime (ver `CoreButton`).
