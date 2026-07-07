# Memoria del Proyecto — MiCarrito

## 1. Datos Generales

| Campo | Valor |
|---|---|
| Nombre | MiCarrito |
| Tipo | App híbrida (WebView nativo + Frontend React) |
| Frontend | React 19 + Vite 8 (JSX, sin TypeScript) |
| Backend | PHP + MySQL |
| Repositorio | `D:\Source\React\smartsoft\micarrito` |
| Proyecto Android | `C:\Users\Oscar\AndroidStudioProjects\MiCarrito` |
| Backend local | `C:\xampp\htdocs\smartsoft\micarrito\` |
| Backend producción | `https://almacenadorasaiver.com/micarrito/php/` |
| BD | `smartsoft_micarrito` |

## 2. Stack Tecnológico

### Frontend
- React 19 + Vite 8, JavaScript (no TypeScript)
- Estilos inline via objetos JS (sin CSS externo salvo `index.css`)
- Componentes Core desde base: `CoreWindow`, `CoreGroup`, `CoreText`, `CorePassword`, `CoreLabel`, `CoreVSep`, `CoreButton`, `CoreHeader`
- Hooks: `useLazyFetch` (API), `Toast` (notificaciones)
- `react-icons` para iconos
- Build target: `chrome69` (WebView del emulador es Chrome 69)

### Backend (PHP)
- `api.php` — Router principal, CORS, dispatch
- `apicode.php` — Funciones: `login`, `logout`, `isLoggedIn` (solo 3 funciones públicas)
- `common.php` — Helpers: `getResultObject`, `getUID`, `saveLog`
- `dbinfo.php` — Conexión MySQL (usuario `saiver_dbuser`)
- `mysql-data-manager.php` — Capa de acceso a BD
- `session-manager.php` — Manejo de sesiones
- `create-admin-user.php` — Script para crear admin inicial

### Android (Kotlin)
- Package: `com.example.micarrito`
- Min SDK: 28, Target SDK: 36
- Tema: `Theme.Material3.Light.NoActionBar` (siempre claro)
- WebView carga URL de producción
- Bridge JS ↔ Android via `@JavascriptInterface`

## 3. URLs y Entornos

| Entorno | URL | Cómo se define |
|---|---|---|
| Desarrollo (backend) | `http://192.168.1.20/micarrito/php/api.php` | Proxy Vite en `vite.config.js` |
| Desarrollo (Android) | `http://192.168.1.20/micarrito` | Constante comentada en `MainActivity.kt` |
| Producción (Android) | `https://almacenadorasaiver.com/micarrito` | `const val BASE_URL` en `MainActivity.kt` (activa) |
| API producción | `php/api.php` vía `.env.production` → `VITE_API_URL=php/api.php` |

## 4. Base de Datos — `smartsoft_micarrito`

### Tabla `usuarios`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | INT AUTO_INCREMENT | PK |
| `nickname` | VARCHAR(20) | Usuario login |
| `nombre` | VARCHAR(50) | Nombre completo |
| `email` | VARCHAR(50) | |
| `pwd` | TEXT | Hash SHA3-512 |
| `admin` | INT | 1 = admin |

Admin por defecto: `admin` / `admin` (hash SHA3-512).

## 5. Configuración de Vite

```js
// vite.config.js
build: { target: 'chrome69' }
base: './'
server: {
    host: '0.0.0.0',
    proxy: { '/api.php': { target: 'http://localhost', rewrite: '/smartsoft/micarrito/api.php' } }
}
```

```env
# .env.production
VITE_API_URL=php/api.php
```

## 6. Android — Configuración del WebView

| Característica | Estado |
|---|---|
| URL | Constante manual en `MainActivity.kt` (2 líneas: una commented, otra activa) |
| `buildFeatures { buildConfig }` | Eliminado — no se usa BuildConfig |
| `javaScriptEnabled` | true |
| `domStorageEnabled` | true |
| `loadWithOverviewMode` | true |
| `setUseWideViewPort` | true |
| `mixedContentMode` | `MIXED_CONTENT_ALWAYS_ALLOW` |
| `onReceivedSslError` | `handler?.proceed()` (para IP con HTTPS) |
| `shouldOverrideUrlLoading` | return false |
| `WebChromeClient.onConsoleMessage` | Logcat logging |
| Layout WebView | `match_parent` (como GRIM) |
| Splash | Logo + 2s delay |
| Error | Pantalla con reintento |
| Back button | `evaluateJavascript("javascript:onAndroidBack()", null)` |

## 7. Launcher Icon

- Adaptive icon con fondo blanco (`@android:color/white`)
- Foreground: `micarrito_icon.png` (isotipo) via `ic_launcher_foreground_logo.xml` con 20% inset
- Archivos clave:
  - `drawable/ic_launcher_foreground_logo.xml` — InsetDrawable (20%)
  - `mipmap-anydpi/ic_launcher.xml` — AdaptiveIcon (fondo blanco)
  - `mipmap-anydpi/ic_launcher_round.xml` — Ídem versión redonda

## 8. Login

- Simplificado: solo nickname + password, sin empresa, sin ForgotPassword
- Logo: `micarrito_logo.png` (con tipografía)
- API: `POST php/api.php { action: "login", params: { nickname, pwd }, token }`
- Sesión guardada en sessionStorage via `setSessionData`

## 9. API — CORS

Orígenes permitidos en `api.php`:

```
http://localhost:5173
http://192.168.1.20:5173
http://192.168.1.20
https://163.245.209.2
https://almacenadorasaiver.com
```

## 10. Rutas de Archivos Clave

```
Frontend:
  D:\Source\React\smartsoft\micarrito\
    vite.config.js
    .env.production
    src/util/constants.js
    src/util/util.js
    src/hooks/useLazyFetch/useLazyFetch.jsx
    src/system/Login/Login.jsx
    src/system/Engine/Engine.jsx
    src/App.jsx
    src/main.jsx
    src/assets/micarrito_logo.png

Backend:
  C:\xampp\htdocs\smartsoft\micarrito\
    api.php
    apicode.php
    common.php
    dbinfo.php
    mysql-data-manager.php
    session-manager.php
    create-admin-user.php
    vendor/

Android:
  C:\Users\Oscar\AndroidStudioProjects\MiCarrito\
    app/src/main/java/com/example/micarrito/MainActivity.kt
    app/src/main/res/layout/activity_main.xml
    app/src/main/res/drawable/ic_launcher_foreground_logo.xml
    app/src/main/res/mipmap-anydpi/ic_launcher.xml
    app/src/main/res/mipmap-anydpi/ic_launcher_round.xml
    app/src/main/res/values/colors.xml
    app/build.gradle.kts
```

## 11. Decisiones de Arquitectura

| # | Decisión | Fecha |
|---|---|---|
| 1 | URL manual en `MainActivity.kt` (2 líneas: una comentada, otra activa) — sin BuildConfig | 2026-07-06 |
| 2 | `build.target: 'chrome69'` para compatibilidad con WebView antiguo | 2026-07-07 |
| 3 | `match_parent` en WebView/errorLayout (como GRIM) en lugar de `0dp`+constraints | 2026-07-07 |
| 4 | Icono launcher con fondo blanco (`@android:color/white`) — sin fondo oscuro | 2026-07-07 |
| 5 | API backend en `micarrito/php/` en producción | — |
| 6 | Login sin empresa, sin ForgotPassword | 2026-07-06 |

## 12. Lecciones Aprendidas

1. **`VITE_API_URL` en `.env.production`** — La ruta debe ser relativa (`php/api.php`) y NO absoluta (`/api.php`) cuando el frontend está en un subdirectorio del servidor.
2. **`build.target`** — El WebView del emulador usa Chrome 69 que no soporta `??` ni `?.`. Fijar `build.target: 'chrome69'` en `vite.config.js`.
3. **CORS** — Agregar el dominio de producción a `$allowedOrigins` en `api.php`.
4. **Layout WebView** — En ConstraintLayout, `match_parent` funciona correctamente para que el WebView ocupe toda la pantalla (como en GRIM).
5. **OPcache** — Después de subir PHP nuevos a producción, reiniciar PHP-FPM o tocar los archivos para invalidar caché.

## 13. Historial de Commits

| Hash | Mensaje | Fecha |
|---|---|---|
| `db8a347` | chore: initial scaffold with Vite + React 19 | 2026-07-06 |
| `b25d42c` | docs: add project memory (MEMORIA.md) | 2026-07-06 |
