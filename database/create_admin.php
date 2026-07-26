<?php
/**
 * MiCarrito - Crear usuario administrador por defecto
 *
 * Ejecutar una sola vez despues de create_schema.php:
 *   php create_admin.php
 *
 * Credenciales por defecto: admin / admin
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

$conn = new mysqli($host, $user, $pwd, $dbName, $port);

if ($conn->connect_error) {
    die("Error de conexion: " . $conn->connect_error . "\n");
}

$check = $conn->query("SELECT id FROM usuarios WHERE nickname = 'admin'");
if ($check && $check->num_rows > 0) {
    echo "El usuario 'admin' ya existe. Omitido.\n";
    $conn->close();
    exit;
}

$adminPwd = hash('sha3-512', 'admin');

$result = $conn->query("SELECT IFNULL(MAX(id), 0) + 1 AS nextId FROM usuarios");
$row = $result->fetch_assoc();
$nextId = intval($row['nextId']);

$nombre = $conn->real_escape_string('Administrador');
$email = $conn->real_escape_string('');

$sql = "INSERT INTO usuarios (id, nickname, nombre, email, pwd, admin)
        VALUES ($nextId, 'admin', '{$nombre}', '{$email}', '{$adminPwd}', 1)";

if ($conn->query($sql)) {
    echo "Usuario 'admin' creado (id={$nextId}).\n";
    echo "  nickname: admin\n";
    echo "  password: admin\n";
    echo "  admin:    1\n";
} else {
    echo "Error al crear usuario: " . $conn->error . "\n";
}

$conn->close();
