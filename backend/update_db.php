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
        echo 'Migracion exitosa: tabla user_devices creada.';
    } catch (Exception $e) {
        $conn->rollback();
        echo 'Error en la migracion: ' . $e->getMessage();
    }
} else {
    echo 'La tabla user_devices ya existe. No se requiere migracion.';
}

$conn->close();
?>
