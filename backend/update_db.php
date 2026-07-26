<?php
require_once 'dbinfo.php';

$dbInfo = getMySqlDbInfo(MICARRITO_DB);
$conn = new mysqli($dbInfo['host'], $dbInfo['user'], $dbInfo['pwd'], $dbInfo['db'], $dbInfo['port']);

if ($conn->connect_error) {
    die('Error de conexion: ' . $conn->connect_error);
}

$tables = $conn->query("SHOW TABLES LIKE 'productos'");
if ($tables->num_rows === 0) {
    die('La tabla productos no existe');
}

$columns = $conn->query("SHOW COLUMNS FROM productos LIKE 'prioridad'");
if ($columns->num_rows > 0) {
    echo 'La columna prioridad ya existe en la tabla productos. No se requiere migracion.';
    $conn->close();
    exit;
}

$conn->begin_transaction();

try {
    $conn->query("ALTER TABLE productos ADD COLUMN prioridad INT(1) NOT NULL DEFAULT 0 AFTER comprado");
    $conn->commit();
    echo 'Migracion exitosa: columna prioridad agregada a la tabla productos.';
} catch (Exception $e) {
    $conn->rollback();
    echo 'Error en la migracion: ' . $e->getMessage();
}

$conn->close();
?>
