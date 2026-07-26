# MiCarrito

Aplicacion movil hibrida (React + Android WebView + PHP backend) para el control de compras en el supermercado.

## Estructura del proyecto

```
MiCarrito/
├── frontend/      # React 19 + Vite (cliente web)
├── backend/       # PHP API REST
├── android/       # APK Android (WebView)
└── database/      # Scripts de inicializacion de BD
```

## Requisitos previos

- **Node.js** >= 18
- **PHP** >= 8.0 (con extension `mbstring` habilitada)
- **MySQL** >= 5.7
- **XAMPP** o similar (para PHP + MySQL)
- **Android Studio** (para compilar la APK)

## 1. Base de datos

```bash
cd database

# Copiar y editar credenciales (si es necesario)
# Crear esquema
php create_schema.php

# Crear usuario admin por defecto (admin / admin)
php create_admin.php
```

## 2. Backend (PHP)

```bash
cd backend

# Copiar archivo de configuracion y editar credenciales
cp dbinfo.php.example dbinfo.php
# Editar dbinfo.php con tus credenciales MySQL
```

El backend debe estar accessible en:
```
http://localhost/smartsoft/micarrito/api.php
```

Copiar la carpeta `backend/` dentro de `C:\xampp\htdocs\smartsoft\micarrito\` (o configurar el VirtualHost correspondiente).

## 3. Frontend (React)

```bash
cd frontend

# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev
```

El frontend corre en `http://localhost:5173` y usa el proxy de Vite para redirigir `/api.php` al backend local.

### Build de produccion

```bash
npm run build
```

El resultado queda en `dist/`. Subir ese contenido al servidor web que la APK apuntara.

## 4. APK Android

Abrir el proyecto en Android Studio:
```
File > Open > seleccionar la carpeta android/
```

### Configurar URL del backend

Editar `app/src/main/java/com/example/micarrito/MainActivity.kt` y cambiar `BASE_URL`:

```kotlin
// Produccion
private val BASE_URL = "https://tu-dominio.com/micarrito"

// Desarrollo local (XAMPP)
// private val BASE_URL = "http://192.168.1.X/smartsoft/micarrito"
```

### Compilar APK

```
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

---

## Funcionalidades

- **Login** con usuario/clave y login biometrico (huella/rostro)
- **Categorias** de productos (CRUD)
- **Compras** con lista de productos, estados y moneda
- **Monedas** personalizables por usuario
- **Configuracion** (cambiar clave, crear usuarios, gestionar biometrico)
- **Filtro de productos** en detalle de compra (todos/pendientes/comprados)
- **Prioridad de productos** (normal/alta) con indicacion visual verde
- Navegacion con boton atras de Android

## Condiciones del estado

| Campo | Valores |
|-------|---------|
| `compras.estado` | 0 = pendiente, 1 = completada |
| `productos.comprado` | 0 = pendiente, 1 = comprado |
| `productos.prioridad` | 0 = normal, 1 = alta |
| `usuarios.admin` | 0 = usuario normal, 1 = administrador |
| `config.contraercategorias` | 0 = expandido, 1 = colapsado |

## Tecnologias

- **Frontend:** React 19, Vite 8, react-icons
- **Backend:** PHP 8, MySQL (mysqli)
- **Android:** Kotlin, WebView, AndroidX Biometric
- **UI:** Estilos inline (sin framework CSS)
