<?php
require_once 'dbinfo.php';

define('MICARRITO_DB', 'smartsoft_micarrito');

$dbInfo = getMySqlDbInfo(MICARRITO_DB);
$conn = new mysqli($dbInfo['host'], $dbInfo['user'], $dbInfo['pwd'], $dbInfo['dbname'], $dbInfo['port']);

if ($conn->connect_error) {
    die('Error de conexion: ' . $conn->connect_error);
}

$tables = $conn->query("SHOW TABLES LIKE 'user_devices'");
if ($tables->num_rows === 0) {
    $conn->begin_transaction();

    try {
        $conn->query("CREATE TABLE IF NOT EXISTS user_devices (
            id                  INT           NOT NULL,
            idusu               INT           NOT NULL COMMENT 'FK -> usuarios.id',
            fcm_token           VARCHAR(500)  NOT NULL,
            platform            VARCHAR(20)   NOT NULL DEFAULT 'android',
            active              INT           NOT NULL DEFAULT 1,
            fecha_registro      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_idusu (idusu),
            KEY idx_fcm_token (fcm_token(191))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $conn->commit();
        echo "Migracion exitosa: tabla user_devices creada.\n";
    } catch (Exception $e) {
        $conn->rollback();
        echo 'Error en la migracion: ' . $e->getMessage() . "\n";
    }
} else {
    echo "La tabla user_devices ya existe. No se requiere migracion.\n";
}

// --- Migracion: columnas de comparticion en compras ---

$cols = $conn->query("SHOW COLUMNS FROM compras LIKE 'id_usuario_origen'");
if ($cols->num_rows === 0) {
    $conn->query("ALTER TABLE compras ADD COLUMN id_usuario_origen INT NULL COMMENT 'FK -> usuarios.id (NULL=propia)' AFTER idmon");
    $conn->query("ALTER TABLE compras ADD COLUMN estado_comparticion INT NOT NULL DEFAULT 0 COMMENT '0=normal, 1=recibida_pendiente, 2=aceptada, 3=rechazada' AFTER id_usuario_origen");
    $conn->query("ALTER TABLE compras ADD KEY idx_id_usuario_origen (id_usuario_origen)");
    $conn->query("ALTER TABLE compras ADD KEY idx_estado_comparticion (estado_comparticion)");
    echo "Migracion exitosa: columnas de comparticion agregadas a compras.\n";
} else {
    echo "Las columnas de comparticion ya existen en compras. No se requiere migracion.\n";
}

// --- Migracion: tabla favoritos ---

$favTables = $conn->query("SHOW TABLES LIKE 'favoritos'");
if ($favTables->num_rows === 0) {
    $conn->begin_transaction();

    try {
        $conn->query("CREATE TABLE IF NOT EXISTS favoritos (
            id                  INT          NOT NULL,
            idusu               INT          NOT NULL COMMENT 'FK -> usuarios.id (propietario)',
            nickname            VARCHAR(50)  NOT NULL COMMENT 'Nickname del favorito',
            id_usuario_favorito INT          NOT NULL COMMENT 'FK -> usuarios.id (el favorito)',
            fecha               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_favorito (idusu, id_usuario_favorito),
            KEY idx_idusu (idusu),
            KEY idx_id_usuario_favorito (id_usuario_favorito)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $conn->commit();
        echo "Migracion exitosa: tabla favoritos creada.\n";
    } catch (Exception $e) {
        $conn->rollback();
        echo 'Error en la migracion: ' . $e->getMessage() . "\n";
    }
} else {
    echo "La tabla favoritos ya existe. No se requiere migracion.\n";
}

// --- Migracion: columna bio_token en usuarios ---

$bioCol = $conn->query("SHOW COLUMNS FROM usuarios LIKE 'bio_token'");
if ($bioCol->num_rows === 0) {
    $conn->query("ALTER TABLE usuarios ADD COLUMN bio_token VARCHAR(255) NULL COMMENT 'Token biometrico del dispositivo' AFTER admin");
    echo "Migracion exitosa: columna bio_token agregada a usuarios.\n";
} else {
    echo "La columna bio_token ya existe en usuarios. No se requiere migracion.\n";
}

// --- Migracion: columna prioridad en productos ---

$prioCol = $conn->query("SHOW COLUMNS FROM productos LIKE 'prioridad'");
if ($prioCol->num_rows === 0) {
    $conn->query("ALTER TABLE productos ADD COLUMN prioridad INT NOT NULL DEFAULT 0 COMMENT '0=normal, 1=alta' AFTER comprado");
    echo "Migracion exitosa: columna prioridad agregada a productos.\n";
} else {
    echo "La columna prioridad ya existe en productos. No se requiere migracion.\n";
}

$conn->close();
?>
