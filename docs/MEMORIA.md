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
- Componentes Core desde base: `CoreWindow`, `CoreGroup`, `CoreText`, `CorePassword`, `CoreLabel`, `CoreVSep`, `CoreButton`, `CoreHeader`, `CoreCard`, `CoreConfirm`
- Hooks: `useLazyFetch` (API), `Toast` (notificaciones)
- `react-icons` para iconos
- Build target: `chrome69` (WebView del emulador es Chrome 69)
- React Compiler habilitado via Babel plugin

### Backend (PHP)
- `api.php` — Router principal, CORS, dispatch
- `apicode.php` — Funciones: `login`, `logout`, `isLoggedIn`, `get_categorias`, `save_categoria`, `delete_categoria`
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

### Tabla `categorias`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | INT(10) AUTO_INCREMENT | PK |
| `idusu` | INT(10) | FK → usuarios.id (cada usuario tiene sus categorías) |
| `descrip` | VARCHAR(30) | Descripción de la categoría |

- Las categorías se muestran ordenadas alfabéticamente por `descrip`
- CRUD completo: crear, editar, eliminar
- Todas las operaciones filtran por `idusu` del token de sesión

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

## 9. Módulo Categorías

- Pantalla CRUD dentro de `CoreWindow` con color verde (`#388e3c`)
- Tarjetas (`CoreCard`) con icono `IoPricetagOutline` por categoría
- Grid responsive: `repeat(auto-fill, minmax(220px, 1fr))`
- Formulario: `CoreText` con `entryMode=UPPER`, `maxLength=30`
- Estados: agregar (botón Guardar), editar (botón Modificar/Cancelar)
- Eliminar con `CoreConfirm` de confirmación
- API acciones: `get_categorias`, `save_categoria`, `delete_categoria`
- Botón atrás del teléfono manejado vía `history.pushState` + `popstate`
  - Si CoreConfirm abierto → dismissConfirm
  - Si editando → cancelar edición
  - Si nada → volver al menú principal

## 9. API — CORS

Orígenes permitidos en `api.php`:

```
http://localhost:5173
http://192.168.1.20:5173
http://192.168.1.20
https://163.245.209.2
https://almacenadorasaiver.com
```

## 10. Navegación entre Pantallas

- `Engine.jsx` maneja estado `selectedSection` (null = menú principal)
- `MenuPrincipal` recibe `onSelect(key)` para opciones no-logout
- Renderizado condicional: `selectedSection === 'categorias'` → `<Categorias />`
- Cada pantalla recibe `onBack` para volver al menú
- Patrón reutilizable para futuras pantallas (config, compras)

## 11. Rutas de Archivos Clave

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
| 7 | Edge-to-Edge con padding para respetar barra de estado (`WindowInsetsCompat`) | 2026-07-11 |
| 8 | Validación proactiva de conectividad con `ConnectivityManager.NetworkCallback` | 2026-07-11 |
| 9 | Toast nativo de Android via JS Interface (`Android.showToast()`) en lugar de toast React | 2026-07-11 |
| 10 | ErrorModal solo para errores críticos/debug, mensajes de usuario con toast nativo | 2026-07-11 |
| 11 | Eliminar `setErrorModal` de errores HTTP y catch general — solo quedan para JSON inválido y respuesta ilegible | 2026-07-11 |

## 12. Notas del Usuario

- **Teclado en inglés**: El usuario escribe sin acentos porque su teclado está en inglés. Siempre colocar acentos correctos en textos visibles al usuario (strings, mensajes de error, etc.).

## 13. Directivas de Desarrollo

- **ErrorModal**: Solo se usa para mostrar errores críticos de la aplicación con fines de depuración. Si el sistema funciona correctamente, nunca se muestra. Los mensajes al usuario se muestran con toast nativo de Android (`Android.showToast()`), NO con el toast de React ni con ErrorModal.
- **Toast nativo**: En `useLazyFetch`, usar `Android.showToast(message, durationMs)` con fallback a `toast.showToast()` para desarrollo en navegador. El toast de React NO se usa en producción.
- **Mensajes al usuario**: Siempre con acentos correctos. Ejemplos: "Conexion exitosa", "Error al guardar", "Conexion a Internet perdida".

## 14. Lecciones Aprendidas

1. **`VITE_API_URL` en `.env.production`** — La ruta debe ser relativa (`php/api.php`) y NO absoluta (`/api.php`) cuando el frontend está en un subdirectorio del servidor.
2. **`build.target`** — El WebView del emulador usa Chrome 69 que no soporta `??` ni `?.`. Fijar `build.target: 'chrome69'` en `vite.config.js`.
3. **CORS** — Agregar el dominio de producción a `$allowedOrigins` en `api.php`.
4. **Layout WebView** — En ConstraintLayout, `match_parent` funciona correctamente para que el WebView ocupe toda la pantalla (como en GRIM).
5. **OPcache** — Después de subir PHP nuevos a producción, reiniciar PHP-FPM o tocar los archivos para invalidar caché.
6. **Edge-to-Edge** — `enableEdgeToEdge()` es necesario para que la app llene la pantalla, pero se debe aplicar padding con `WindowInsetsCompat` para respetar la barra de estado.
7. **Conectividad** — Usar `ConnectivityManager.NetworkCallback` para monitorear cambios de red en tiempo real, no solo validar al inicio.
8. **Toast nativo** — En apps Android, usar `Android.showToast()` desde JS en lugar de toast de React. Incluir fallback para desarrollo en navegador.
9. **ErrorModal** — Solo para errores críticos de depuración. Nunca mostrar al usuario final. Usar toast nativo para mensajes al usuario.
10. **Caché de Android** — Desinstalar e instalar la app es necesario para limpiar caché de JS/CSS después de subir cambios al servidor. El WebView de Android cachea los archivos estáticos agresivamente.

## 15. Historial de Commits

| Hash | Mensaje | Fecha |
|---|---|---|
| `db8a347` | chore: initial scaffold with Vite + React 19 | 2026-07-06 |
| `b25d42c` | docs: add project memory (MEMORIA.md) | 2026-07-06 |
| `c6ce4e3` | feat: implement Login, Engine, Core components, WebView config, and project memory | 2026-07-11 |
| `e606846` | fix: Reducir ErrorModal a errores criticos y usar toast nativo para mensajes al usuario | 2026-07-11 |
