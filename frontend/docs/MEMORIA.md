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
- Componentes Core desde base: `CoreWindow`, `CoreGroup`, `CoreText`, `CorePassword`, `CoreLabel`, `CoreVSep`, `CoreButton`, `CoreButtonSquare`, `CoreHeader`, `CoreCard`, `CoreConfirm`, `CoreModal`, `CoreNumber`, `CoreMenuPopup`, `CoreSelect`, `CoreSuggest`, `CoreToggle`
- Hooks: `useLazyFetch` (API), `Toast` (notificaciones)
- Utilidades: `isRunningInWebView()`, `setBackHandler()`, `clearBackHandler()`, `backHandlerRegistry`
- `react-icons` para iconos
- Build target: `chrome69` (WebView del emulador es Chrome 69)
- React Compiler habilitado via Babel plugin

### Backend (PHP)
- `api.php` — Router principal, CORS, dispatch
- `apicode.php` — Funciones: `login`, `logout`, `isLoggedIn`, `getCategorias`, `saveCategoria`, `deleteCategoria`, `getCompras`, `saveCompra`, `deleteCompra`, `changeEstadoCompra`, `duplicateCompra`, `getCategoriasCompra`, `getProductosCategoria`, `saveProducto`, `deleteProducto`, `changeEstadoProducto`, `copiarCategoria`, `getMonedas`, `saveMoneda`, `deleteMoneda`
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
| `id` | INT(10) | PK (generado manualmente, SIN AUTO_INCREMENT) |
| `nickname` | VARCHAR(20) | Usuario login |
| `nombre` | VARCHAR(50) | Nombre completo |
| `email` | VARCHAR(50) | |
| `pwd` | TEXT | Hash SHA3-512 |
| `admin` | INT(1) | 1 = admin |

Admin por defecto: `admin` / `admin` (hash SHA3-512).

### Tabla `categorias`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | INT(10) | PK (generado manualmente, SIN AUTO_INCREMENT) |
| `idusu` | INT(10) | FK → usuarios.id (cada usuario tiene sus categorías) |
| `descrip` | VARCHAR(30) | Descripción de la categoría |

- Las categorías se muestran ordenadas alfabéticamente por `descrip`
- CRUD completo: crear, editar, eliminar
- Todas las operaciones filtran por `idusu` del token de sesión
- **Regla de generación de IDs**: Nunca usar AUTO_INCREMENT ni LAST_INSERT_ID. Siempre: `SELECT t.id FROM tabla AS t ORDER BY t.id DESC LIMIT 1` → sin resultados = id:1, sino id+1. Siempre dentro de una transacción.
- **Validación futura**: Cuando exista tabla `compras`, validar que una categoría no se pueda eliminar si está asignada a al menos una compra.

### Tabla `compras`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | INT(10) | PK (generado manualmente, SIN AUTO_INCREMENT) |
| `idusu` | INT(10) | FK → usuarios.id |
| `descrip` | VARCHAR(50) | Descripción de la compra |
| `estado` | INT(1) | 0=pendiente, 1=completada |
| `fecha` | DATE | Fecha de la compra |
| `idmon` | INT(10) | FK → monedas.id (moneda de la compra, nullable) |

### Tabla `productos`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | INT(10) | PK (generado manualmente, SIN AUTO_INCREMENT) |
| `compra_id` | INT(10) | FK → compras.id |
| `categoria_id` | INT(10) | FK → categorias.id |
| `nombre` | VARCHAR(50) | Nombre del producto |
| `cantidad` | INT(10) | Cantidad (sin decimales) |
| `precio` | DECIMAL(16,2) | Precio unitario |
| `comprado` | INT(1) | 0=pendiente, 1=comprado |

### Tabla `monedas`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | INT(10) | PK (generado manualmente, SIN AUTO_INCREMENT) |
| `id_usu` | INT(10) | FK → usuarios.id (cada usuario tiene sus monedas) |
| `siglas` | VARCHAR(3) | Siglas de la moneda (ej: USD, EUR, CRC) |
| `nombre` | VARCHAR(20) | Nombre de la moneda (ej: Dolar, Euro) |
| `simbolo` | VARCHAR(3) | Simbolo monetario (ej: $, €, ₡) |

- CRUD completo: crear, editar, eliminar
- No se puede eliminar si está en uso en al menos una compra
- Script de creación: `create-monedas-table.sql`

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
- Botón atrás del navegador: muestra confirm "¿Desea cerrar sesión?" (en `Engine.jsx` cuando `selectedSection === null`)

## 8b. Menú Principal

- 5 opciones: Configuración, Monedas, Categorías, Compras, Cerrar Sesión
- Layout grid 3 columnas (3 cards por fila), cards más pequeñas
- Cada opción tiene icono `IoSettingsOutline`, `IoCashOutline`, `IoPricetagOutline`, `IoCartOutline`, `IoLogOutOutline`
- Color de cards: gris (`#6c757d`) excepto Cerrar Sesión (rojo `#F44336`)
- `onSelect(key)` envía la sección al Engine
- `onLogout()` cierra sesión directamente

## 9. Módulo Categorías

- Pantalla CRUD con fondo `#f8fafc`, sin `CoreWindow` ni `CoreGroup`
- Header fijo: título "Categorías" (15px) + botón `CoreButtonSquare` "+" (verde `#388e3c`)
- Tarjetas full-width: borde izquierdo `4px solid #388e3c`, fondo blanco `#fff`
- Layout horizontal: icono `IoPricetagOutline` + descripción (12px, color `#666`, truncada con `...`) + botones editar/eliminar
- Botones de acción: `CoreButtonSquare` 30x30 (editar: `#1976d2`, eliminar: `#F44336`)
- Hover: sombra elevada `0 4px 12px rgba(0,0,0,0.08)`, `translateY(-1px)`
- Estado vacío: icono grande + "No hay categorías registradas" + subtexto
- Botón volver flotante: `CoreButtonSquare` con `IoArrowBack` (gris `#6b7280`), `position: fixed`
- Modal declarativo (`CoreModal` de base) para agregar/editar:
  - API: `open`, `onClose`, `closeOnOverlayClick={false}`, children como función `{ closeModal }`
  - Header verde con título y botón X
  - Footer: dos `CoreButtonSquare` con `ignoreFormState` (volver + guardar)
  - Input: `CoreText` con `entryMode=UPPER`, `maxLength=30`, `ignoreFormState`
  - Foco automático al abrir (delay 100ms para timing del dialog)
- Eliminar con `CoreConfirm` de confirmación. El backend valida que la categoría no esté referenciada en `productos.categoria_id` (≥1 producto → error "No se puede eliminar: la categoría está en uso en al menos un producto"); el mensaje se muestra vía toast nativo
- API acciones: `getCategorias`, `saveCategoria`, `deleteCategoria`
- Botón atrás del teléfono manejado vía `setBackHandler()` + `backHandlerRegistry`
  - Si CoreConfirm abierto → dismissConfirm
  - Si modal abierto → cerrar modal
  - Si nada → volver al menú principal

## 10. Módulo Compras

- Pantalla con vista de lista y vista de detalle (ficha), fondo `#f8fafc`, color morado (`#7b1fa2`)

### Vista de Lista
- Header fijo: título "Compras" (15px) + botón filtro (Todas/Pendientes/Completadas) + botón `CoreButtonSquare` "+"
- Tarjetas de compra: borde izquierdo morado (`4px`), descripción (13px), badge de estado (Completa/Pendiente), fecha, total con símbolo de moneda
- Hover: sombra elevada `0 4px 12px rgba(0,0,0,0.08)`, `translateY(-1px)`
- Menú de acciones (…) con `CoreMenuPopup`: Editar, Marcar Completa/Pendiente, Duplicar, Eliminar
- Estado vacío: icono grande + "No hay compras registradas"

### Vista de Detalle (Ficha)
- Header: ícono del carrito + descripción (13px) + total con símbolo de moneda (a la derecha)
- **NO se muestra badge de estado en el header del detalle** (solo en la lista)
- Listado de categorías que contienen productos, expandibles con `IoChevronDown`/`IoChevronForward`
- Cada categoría tiene menú (…): Copiar Categoría, Eliminar Categoría
- Productos dentro de cada categoría expandible con toggle comprado, editar, eliminar
- Subtotal por categoría
- **Botón flotante FAB** (circular, azul `#1976d2`, 40px) en esquina inferior derecha para agregar productos

### Modal Crear/Editar Compra (`CoreModal`)
- Fields: Fecha (`CoreText`), Descripción (`CoreText`), Moneda (`CoreSelect` con `ignoreFormState`)
- CoreSelect de monedas: `options={monedas.map(m => ({ value: String(m.id), label: '${m.simbolo} ${m.nombre} (${m.siglas})' }))}`

### Modal Crear/Editar Producto (`CoreModal`)
- Fields: Categoría (`CoreSuggest` con `allCategorias`), Nombre (`CoreText`), Cantidad (`CoreNumber`, 100% width), Precio (`CoreNumber`, 100% width), Comprado (`CoreToggle`)
- CoreSuggest de categorías: `fieldId="id"`, `displayField="descrip"`, `filterFields="descrip"`
- **Modo persistente (add)**: al guardar, resetea nombre/cantidad/precio/comprado, mantiene categoría seleccionada, refocusear nombre, NO cierra el modal. Solo cierra con botón Cancel (←) o botón atrás del teléfono
- **Modo edit**: al guardar, cierra el modal normalmente
- Título dinámico: "Nuevo Producto" (add) / "Editar Producto" (edit)
- Se puede agregar producto desde el FAB (sin categoría pre-seleccionada) o desde el "+" dentro de cada categoría (categoría pre-seleccionada)

### Modal Duplicar Compra (`CoreModal`)
- Fields: Fecha + Descripción. Backend copia categorías + productos con `comprado=0` siempre

### Modal Copiar Categoría (`CoreModal`)
- Listado de compras destino para copiar la categoría seleccionada. Tiene botón Cancelar (`IoClose`) y `closeOnOverlayClick={true}` (cerrar tocando fuera)

### Navegación
- Botón atrás del teléfono/navegador: cerrar modal → colapsar categoría → volver a lista → volver al menú
- **Patrón de refs**: `selectedCompraRef`, `expandedCategoriaRef`, `isEditingRef` se actualizan en cada render via `useEffect` sin dependencias. El back handler (registrado una sola vez con `[]`) lee estos refs para decidir la acción
- Sincronización automática: `useEffect` que observa `compras` y actualiza `selectedCompra` si cambian `estado`, `total` o `simbolo`
- `refreshCompras()` se ejecuta después de borrar producto, borrar categoría, y cambiar estado, para mantener totales actualizados

### API acciones
- `getCompras`, `saveCompra`, `deleteCompra`, `changeEstadoCompra`, `duplicateCompra`
- `getCategoriasCompra`, `getProductosCategoria`, `saveProducto`, `deleteProducto`, `changeEstadoProducto`
- `copiarCategoria`
- `getCompras` retorna `simbolo` (JOIN con monedas) y `total` (SUM subquery de precio*cantidad)
- `saveCompra` acepta `idmon` (FK → monedas.id)
- `saveProducto` acepta `categoria_id` para mover productos entre categorías y `comprado` para establecer el estado al crear/editar

## 10b. Módulo Monedas

- Pantalla CRUD con fondo `#f8fafc`, color naranja (`#f57c00`)
- Header fijo: título "Monedas" + botón `CoreButtonSquare` "+"
- Tarjetas: borde izquierdo `4px solid #f57c00`, icono `IoCashOutline`, badge de siglas, nombre (13px/600), símbolo
- Modal crear/editar (`CoreModal` que contiene `CoreWindow`): `CoreWindow` icono `IoCashOutline` + título "Nueva Moneda"/"Editar Moneda" color naranja; controles envueltos en `CoreGroup` "Datos de la moneda": Siglas (`CoreText`, maxLength 3, UPPER), Nombre (`CoreText`, maxLength 20, UPPER), Símbolo (`CoreText`, maxLength 3, NORMAL), separados por `CoreVSep size={8}`
- Footer del `CoreWindow`: `CoreButtonSquare` volver (gris) + guardar (naranja)
- Eliminar con `CoreConfirm`: el backend valida que la moneda no esté en uso en `compras.idmon` (≥1 compra → error "No se puede eliminar: la moneda esta en uso en al menos una compra"); el mensaje se muestra vía toast nativo
- API acciones: `getMonedas`, `saveMoneda`, `deleteMoneda`
- Botón atrás: vuelve al menú principal

## 10c. Módulo Configuración

- Pantalla con `CoreWindow` "Preferencias" (icono `IoSettingsOutline`, color `#1976d2`)
- Header: icono `IoSettingsOutline` + título "Configuracion" (NO hay botón Atrás en el header)
- `CoreGroup` "Compras" con un `CoreToggle` "Contraer categorias"
  - `value` = `'1'`/`'0'`. `onChange` marca `dirtyRef` y actualiza estado
  - Texto explicativo debajo: "Las categorias se muestran contraidas/desplegadas al abrir una compra."
- **Guardado automático**: al cambiar el toggle se llama `saveConfig` inmediatamente. NO hay botón Guardar ni botón Atrás en esta pantalla
- **Carga inicial NO guarda**: usa `initializedRef` (true tras `getConfig`) + `dirtyRef` (true solo en cambio manual del usuario). El `useEffect` de guardado solo ejecuta `saveConfig` si ambos son true
- Back handler: `setBackHandler` llama a `onBack` (vuelve al menú). El botón Atrás físico/del navegador funciona vía `popstate`
- API acciones: `getConfig`, `saveConfig`

## 11. API — CORS

Orígenes permitidos en `api.php`:

```
http://localhost:5173
http://192.168.1.20:5173
http://192.168.1.20
https://163.245.209.2
https://almacenadorasaiver.com
```

## 12. Navegación entre Pantallas

- `Engine.jsx` maneja estado `selectedSection` (null = menú principal)
- `MenuPrincipal` recibe `onSelect(key)` para opciones no-logout
- `handleSelectSection` hace `history.pushState({ section }, '', '')` al entrar a cada sección
- `handleOpenDetail` hace `history.pushState({ compraDetail: true }, '', '')` al entrar a la ficha de una compra
- Renderizado condicional: `selectedSection === 'categorias'` → `<Categorias />`, `selectedSection === 'compras'` → `<Compras />`, `selectedSection === 'monedas'` → `<Monedas />`
- Cada pantalla recibe `onBack` para volver al menú
- **Botón atrás del navegador**: `main.jsx` registra listener `popstate` que llama `backHandlerRegistry.invoke()`. Cada módulo registra su propio handler con `setBackHandler()`
- **Patrón de refs para back handler**: como el handler se registra una sola vez (`[]`), los valores dinámicos (`selectedCompra`, `expandedCategoria`, modales abiertos) se leen vía refs que se actualizan en cada render
- **Sync de selectedCompra**: `useEffect` observa `compras` y actualiza `selectedCompra` si cambian `estado`, `total` o `simbolo`, evitando datos stale en la ficha
- **Botón flotante del navegador** (`showBackButton`): visible solo en browser (no en WebView), `position: fixed`, usa `onBack` del Engine

## 13. Rutas de Archivos Clave

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
    src/system/Categorias/Categorias.jsx
    src/system/Compras/Compras.jsx
    src/system/Monedas/Monedas.jsx
    src/components/CoreModal/CoreModal.jsx
    src/components/CoreNumber/CoreNumber.jsx
    src/components/CoreMenuPopup/CoreMenuPopup.jsx
    src/components/CoreSelect/CoreSelect.jsx
    src/components/CoreSuggest/CoreSuggest.jsx
    src/components/CoreToggle/CoreToggle.jsx
    src/components/index.js
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

## 14. Decisiones de Arquitectura

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
| 12 | Back handler con `useRef` para valores dinámicos — el handler se registra una vez (`[]`), refs se actualizan en cada render | 2026-07-16 |
| 13 | `CoreSuggest` para selects con búsqueda (categorías en modal de productos) | 2026-07-16 |
| 14 | Modal persistente en modo add: after save, reset fields, keep category, refocus name, don't close | 2026-07-16 |
| 15 | `popstate` listener centralizado en `main.jsx` vía `backHandlerRegistry` — NO duplicar en componentes | 2026-07-16 |
| 16 | `history.pushState` al entrar a cada sección desde Engine para que el botón atrás del navegador funcione | 2026-07-16 |
| 17 | Sync automática de `selectedCompra` con `compras` via `useEffect` para evitar datos stale en la ficha | 2026-07-16 |
| 18 | `backHandlerRegistry` separa `handler` (back de confirm/modales) de `restore` (restore de navegación desde `history.state`). `setBackHandler` / `setRestoreHandler` / `clearBackHandler` (solo limpia handler) | 2026-07-16 |
| 19 | Navegación dirigida 100% por `history.state`: botón/tecla física y `popstate` SOLO hacen `window.history.back()`. El `popstate` centralizado llama `restore()` que lee `history.state` y deriva el estado de React. Un `back` = subir un nivel exacto | 2026-07-16 |
| 20 | `handleOpenDetail` hace `pushState({section:'compras', compraDetail:true})` (state combinado). El `restore` de Compras: si `compraDetail` → queda en detalle; si `section==='compras'` sin `compraDetail` → `handleBackFromDetail()` (lista); si no hay section → `onBack()` (menú) | 2026-07-16 |
| 21 | `clearRestoreHandler` (alias de `clearBackHandler`) limpia el `restore` al desmontar cada módulo. Sin esto, el `restore` de un módulo muerto "come" pulsaciones de Atrás (había que pulsar 2-3 veces) | 2026-07-16 |
| 22 | El `restore` del Engine se re-registra cuando `selectedSection === null` y se limpia al entrar a una subpantalla, para que no compita con el `restore` de la subpantalla | 2026-07-16 |
| 23 | Configuración: guardado automático al cambiar el `CoreToggle` (sin botón Guardar ni botón Atrás en header). Icono `IoSettingsOutline` antes del título. Usa `initializedRef` + `dirtyRef` para NO disparar `saveConfig` en la carga inicial | 2026-07-16 |
| 24 | Compras: animación de expandir/contraer categorías con CSS Grid (`grid-template-rows: 0fr ↔ 1fr` + `overflow:hidden`), reemplazando el `max-height` fijo que se veía poco suave | 2026-07-16 |
| 25 | Monedas: formulario agregar/editar usa `CoreWindow` (icono `IoCashOutline`, color naranja) con los `CoreText` envueltos en `CoreGroup` "Datos de la moneda", dentro de `CoreModal` | 2026-07-16 |
| 26 | Backend `deleteCategoria` valida que la categoría no esté en uso en `productos.categoria_id` (≥1 → error). `deleteMoneda` ya validaba contra `compras.idmon`. El frontend muestra el mensaje de error vía toast nativo (sin cambios en JSX) | 2026-07-16 |
| 27 | `ModalCopiar` (copiar categoría a otra compra) ahora tiene botón Cancelar (`IoClose`) y `closeOnOverlayClick={true}` para cerrar tocando fuera | 2026-07-16 |

## 15. Notas del Usuario

- **Teclado en inglés**: El usuario escribe sin acentos porque su teclado está en inglés. Siempre colocar acentos correctos en textos visibles al usuario (strings, mensajes de error, etc.).

## 16. Directivas de Desarrollo

- **Idioma**: Siempre responder en español.
- **ErrorModal**: Solo se usa para mostrar errores críticos de la aplicación con fines de depuración. Si el sistema funciona correctamente, nunca se muestra. Los mensajes al usuario se muestran con toast nativo de Android (`Android.showToast()`), NO con el toast de React ni con ErrorModal.
- **Toast nativo**: En `useLazyFetch`, usar `Android.showToast(message, durationMs)` con fallback a `toast.showToast()` para desarrollo en navegador. El toast de React NO se usa en producción.
- **No inventar nombres de campos**: Nunca asumir ni inventar nombres de columnas/campos de la BD, parámetros de API ni propiedades. Si el usuario no ha proporcionado explícitamente el nombre, preguntar antes de usar cualquier nombre. (Lección aplicada en la refactorización compra_id→idcom / categoria_id→idcat: se renombró sin confirmar y requirió ALTER físico en producción.)
- **Mensajes al usuario**: Siempre con acentos correctos. Ejemplos: "Conexion exitosa", "Error al guardar", "Conexion a Internet perdida".

## 17. Lecciones Aprendidas

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
11. **Back handler con refs** — Cuando un `setBackHandler` se registra una vez con dependencias `[]`, las variables del closure quedan stale. Usar refs (`selectedCompraRef`, `expandedCategoriaRef`, `isEditingRef`) que se actualicen en un `useEffect` sin dependencias (se ejecuta en cada render).
12. **`popstate` listener** — Solo registrar UN listener de `popstate` (en `main.jsx` vía `backHandlerRegistry`). Si se registra en múltiples componentes, el handler que desmonta el componente gana y el otro nunca se ejecuta.
13. **`history.pushState`** — Para que el botón atrás del navegador funcione en SPAs, hacer `pushState` al navegar a cada sección. Sin esto, el `popstate` no se dispara porque no hay historial que poppear.
14. **Sync de selectedCompra** — Cuando se cambia datos de una compra desde la lista (estado, total), el `selectedCompra` de la ficha queda stale. Agregar un `useEffect` que observe `compras` y actualice `selectedCompra` si cambiaron campos relevantes.
15. **`refreshCompras()` post-operaciones** — Después de borrar producto, borrar categoría, o cambiar estado, llamar `refreshCompras()` para mantener la lista y los totales sincronizados con la BD.
16. **OPcache en PHP** — Después de subir PHP nuevos a producción, reiniciar PHP-FPM o tocar los archivos para invalidar caché. El OPcache sirve código stale si no se invalida.
17. **`pushState` para cada nivel de navegación** — Cada nivel de navegación (sección, detalle) necesita su propio `pushState` para que el botón atrás funcione correctamente. Sin esto, un solo `back` salta múltiples niveles.
18. **`saveProducto` con `comprado`** — El campo `comprado` se puede establecer al crear o editar un producto. El backend acepta el parámetro y lo guarda en INSERT y UPDATE.
19. **Modales siempre con `CoreWindow`** — Todos los modales usan `CoreWindow` para el header (icono + título + color). NUNCA crear un div manual que imite CoreWindow. Los controles dentro de modales siempre van envueltos en `CoreGroup`.
20. **Modales en archivos separados** — Cada modal se extrae a su propio archivo `.jsx` en la misma carpeta del componente padre (ej: `ModalCompra.jsx`, `ModalProducto.jsx`, etc.). El padre importa y renderiza los modales, pasando state y handlers como props.

## 18. Bugs Conocidos

| # | Descripción | Estado | Notas |
|---|---|---|---|
| 1 | **Botón Atrás del navegador desde ficha de compra va al menú en vez de la lista** | RESUELTO (3ª iteración) | Reestructuración completa basada 100% en `history.state` (ver decisión 19/20). 3ª iteración corrige: (a) los módulos no limpiaban el `restore` al desmontar (`clearRestoreHandler` faltante en cleanup), dejando handlers muertos que "comían" pulsaciones → había que pulsar 2-3 veces; (b) el `restore` de Compras hacía `return` sin limpiar `selectedCompra` cuando `compraDetail` era true, desincronizando React del history; (c) el `restore` del Engine no se re-registraba al volver al menú. Ahora cleanup hace `clearBackHandler()` + `clearRestoreHandler()` y el `restore` de Compras siempre limpia `selectedCompra` antes de delegar a `onBack`. |

## 19. Historial de Commits

| Hash | Mensaje | Fecha |
|---|---|---|
| `db8a347` | chore: initial scaffold with Vite + React 19 | 2026-07-06 |
| `b25d42c` | docs: add project memory (MEMORIA.md) | 2026-07-06 |
| `c6ce4e3` | feat: implement Login, Engine, Core components, WebView config, and project memory | 2026-07-11 |
| `e606846` | fix: Reducir ErrorModal a errores criticos y usar toast nativo para mensajes al usuario | 2026-07-11 |
| `cb8a11c` | fix: Correccion navegacion back (limpieza de restore), guardado automatico Configuracion (sin guardar en carga) y CoreWindow en Monedas | 2026-07-16 |
| `9ea6408` | docs: actualizar MEMORIA con Configuracion, animacion categorias, fix back y CoreWindow Monedas | 2026-07-16 |
| `f1b3c2d` | fix: validar eliminacion de categorias (productos) y monedas (compras) en backend + boton cancelar en ModalCopiar | 2026-07-16 |
