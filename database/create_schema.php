<?php
/**
 * MiCarrito - Crear esquema de base de datos
 *
 * Ejecutar una sola vez para inicializar la BD:
 *   php create_schema.php
 *
 * Lee credenciales desde variables de entorno:
 *   SAIVERNET_MYSQL_HOST (default: localhost)
 *   SAIVERNET_MYSQL_PORT (default: 3306)
 *   SAIVERNET_MYSQL_USER (default: root)
 *   SAIVERNET_MYSQL_PWD  (default: "")
 */

function envOrDefault($key, $default)
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        return $default;
    }
    return $value;
}

$host = envOrDefault('SAIVERNET_MYSQL_HOST', 'localhost');
$port = intval(envOrDefault('SAIVERNET_MYSQL_PORT', '3306'));
$user = envOrDefault('SAIVERNET_MYSQL_USER', 'root');
$pwd  = envOrDefault('SAIVERNET_MYSQL_PWD', '');
$dbName = 'smartsoft_micarrito';

echo "Conectando a MySQL en {$host}:{$port}...\n";

$conn = new mysqli($host, $user, $pwd, '', $port);

if ($conn->connect_error) {
    die("Error de conexion: " . $conn->connect_error . "\n");
}

$conn->query("CREATE DATABASE IF NOT EXISTS {$dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$conn->select_db($dbName);

echo "Base de datos '{$dbName}' creada/seleccionada.\n";

$schema = "
CREATE TABLE IF NOT EXISTS usuarios (
    id         INT          NOT NULL,
    nickname   VARCHAR(50)  NOT NULL,
    nombre     VARCHAR(100) NOT NULL,
    email      VARCHAR(100) NOT NULL,
    pwd        VARCHAR(128) NOT NULL COMMENT 'SHA3-512 hash',
    admin      INT          NOT NULL DEFAULT 0,
    bio_token  VARCHAR(255) NULL     COMMENT 'Token biometrico del dispositivo',
    PRIMARY KEY (id),
    UNIQUE KEY uk_nickname (nickname)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categorias (
    id      INT         NOT NULL,
    idusu   INT         NOT NULL COMMENT 'FK -> usuarios.id',
    descrip VARCHAR(30) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_idusu (idusu)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS monedas (
    id      INT(10)     NOT NULL,
    id_usu  INT(10)     NOT NULL COMMENT 'FK -> usuarios.id',
    siglas  VARCHAR(3)  NOT NULL,
    nombre  VARCHAR(20) NOT NULL,
    simbolo VARCHAR(3)  NOT NULL,
    PRIMARY KEY (id),
    KEY idx_id_usu (id_usu)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS compras (
    id      INT          NOT NULL,
    idusu   INT          NOT NULL COMMENT 'FK -> usuarios.id',
    descrip VARCHAR(100) NOT NULL,
    estado  INT          NOT NULL DEFAULT 0 COMMENT '0=pendiente, 1=completada',
    fecha   DATE         NOT NULL,
    idmon   INT(10)      DEFAULT NULL COMMENT 'FK -> monedas.id (nullable)',
    PRIMARY KEY (id),
    KEY idx_idusu (idusu),
    KEY idx_idmon (idmon)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
    id       INT          NOT NULL,
    idcom    INT          NOT NULL COMMENT 'FK -> compras.id',
    idcat    INT          NOT NULL COMMENT 'FK -> categorias.id',
    nombre   VARCHAR(100) NOT NULL,
    cantidad INT          NOT NULL DEFAULT 1,
    precio   DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    comprado INT          NOT NULL DEFAULT 0 COMMENT '0=pendiente, 1=comprado',
    prioridad INT         NOT NULL DEFAULT 0 COMMENT '0=normal, 1=alta',
    PRIMARY KEY (id),
    KEY idx_idcom (idcom),
    KEY idx_idcat (idcat)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS config (
    id                 INT NOT NULL,
    contraercategorias INT NOT NULL DEFAULT 0 COMMENT '0=expandido, 1=colapsado',
    PRIMARY KEY (id)
) ENGINE=InnoDB;
";

$tables = ['usuarios', 'categorias', 'monedas', 'compras', 'productos', 'config'];

$conn->query("SET FOREIGN_KEY_CHECKS = 0");

$lines = array_filter(array_map('trim', explode(";", $schema)));
foreach ($lines as $stmt) {
    if ($stmt === '' || str_starts_with($stmt, '--')) {
        continue;
    }
    $conn->query($stmt);
}

$conn->query("SET FOREIGN_KEY_CHECKS = 1");

foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '{$table}'");
    if ($result->num_rows > 0) {
        echo "  [ok] Tabla '{$table}' creada/verificada.\n";
    } else {
        echo "  [ERROR] Tabla '{$table}' no se pudo crear.\n";
    }
}

$configCheck = $conn->query("SELECT COUNT(*) AS total FROM config");
if ($configCheck) {
    $row = $configCheck->fetch_assoc();
    if ($row['total'] == 0) {
        $conn->query("INSERT INTO config (id, contraercategorias) VALUES (1, 0)");
        echo "  [ok] Configuracion por defecto insertada.\n";
    } else {
        echo "  [skip] Configuracion ya existe.\n";
    }
}

$conn->close();
echo "\nEsquema de base de datos listo.\n";
