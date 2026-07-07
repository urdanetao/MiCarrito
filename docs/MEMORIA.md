# Memoria del Proyecto — MiCarrito

> Documento vivo para registrar decisiones de diseño, directrices del arquitecto y estado del proyecto.

---

## 1. Datos Generales

| Campo | Valor |
|---|---|
| Nombre oficial | MiCarrito |
| Tipo | App híbrida (WebView nativo + Frontend React) |
| Frontend | React 19 + Vite 8 |
| Lenguaje | JavaScript (JSX) — sin TypeScript |
| Repositorio | Local — `D:\Source\React\smartsoft\micarrito` |
| Primer commit | `db8a347` — "chore: initial scaffold with Vite + React 19" |

---

## 2. Stack Tecnológico (Confirmado)

- **Build tool:** Vite
- **UI:** React 19 con JS vanilla
- **Estilos:** CSS inline mediante constantes de objetos estilo en archivos `*.styles.js` (sin librerías externas de CSS)
- **Routing:** Por definir
- **Estado global:** Por definir
- **Persistencia local:** Por definir
- **Contenedor híbrido:** Por definir

---

## 3. Arquitectura de la App Nativa

(Pendiente de definir)

- Contiene un WebView que renderiza la aplicación web real.
- El icono de la app es el isotipo del carrito (sin letras), sobre fondo blanco cuadrado, delegando bordes redondeados al SO.

---

## 4. Identidad Visual

| Elemento | Detalle |
|---|---|
| Estilo | Elegante, minimalista, limpio |
| Paleta | Por definir (azul marino/verde esmeralda profundo, blanco, oro/mostaza para acentos) |
| Logotipo | Icono geométrico abstracto (líneas continuas de carrito) + tipografía minimalista "MiCarrito" |
| App Icon | Mismo isotipo, sin letras, fondo blanco cuadrado |

---

## 5. Base de Datos — Modelo de Datos

### 5.1. `categories`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (UUID) | PK |
| `name` | String | Ej. "Mascotas" |
| `icon` | String (opcional) | Emoji o identificador |
| `created_at` | Timestamp | |

### 5.2. `products`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (UUID) | PK |
| `name` | String | Ej. "Alimento para perros" |
| `category_id` | String | FK → categories |
| `estimated_price` | Decimal (opcional) | Último precio sugerido |

### 5.3. `shopping_lists`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (UUID) | PK |
| `name` | String | Ej. "Compra Mensual" |
| `status` | Enum/String | `active`, `completed`, `archived` |
| `created_at` | Timestamp | |

### 5.4. `list_items`
| Campo | Tipo | Notas |
|---|---|---|
| `id` | String (UUID) | PK |
| `list_id` | String | FK → shopping_lists |
| `product_id` | String | FK → products |
| `quantity` | Integer/Decimal | Default 1 |
| `price` | Decimal | Precio real al marcar |
| `is_purchased` | Boolean | `true` = comprado |
| `added_at` | Timestamp | |

### 5.5. Lógica del Totalizador
```
SUM(price * quantity) WHERE list_id = X AND is_purchased = true
```

---

## 6. Directrices del Arquitecto

*(Las siguientes reglas se han ido estableciendo durante el desarrollo. Deben cumplirse siempre.)*

| # | Directriz | Fecha |
|---|---|---|
| 1 | Todos los estilos deben definirse como constantes de objetos CSS en archivos `*.styles.js` y aplicarse inline. No usar archivos `.css` (salvo `index.css` base), CSS Modules, TailwindCSS ni librerías externas de estilos. | 2026-07-06 |

---

## 7. Historial de Commits

| Hash | Mensaje | Fecha |
|---|---|---|
| `db8a347` | chore: initial scaffold with Vite + React 19 | 2026-07-06 |
