<?php
require_once __DIR__ . '/session-manager.php';
require_once __DIR__ . '/mysql-data-manager.php';
require_once __DIR__ . '/dbinfo.php';

define('MICARRITO_DB', 'smartsoft_micarrito');

function escapeSqlLiteral($value)
{
    return str_replace("'", "''", (string) $value);
}

function login($params)
{
    $nickname = isset($params['nickname']) ? trim((string) $params['nickname']) : '';
    $pwd = isset($params['pwd']) ? (string) $params['pwd'] : '';

    if ($nickname == '') {
        return getResultObject(false, 'Debe indicar el nombre de usuario');
    }

    if ($pwd == '') {
        return getResultObject(false, 'Debe indicar la contraseña');
    }

    if (!preg_match('/^[A-Za-z0-9._-]+$/', $nickname)) {
        return getResultObject(false, 'Nombre de usuario inválido');
    }

    $nicknameSql = escapeSqlLiteral($nickname);

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sqlCommand = "select t.* from usuarios as t where t.nickname = '$nicknameSql'";
    $usuario = $conn->Query($sqlCommand);

    if ($usuario === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (count($usuario) == 0) {
        $conn->Close();
        return getResultObject(false, 'Usuario o contraseña incorrectos');
    }

    $pwdHashed = hash("sha3-512", $pwd);

    if (hash_equals((string) $usuario[0]['pwd'], $pwdHashed)) {
        $sessionManager = new SessionManager();
        $session = $sessionManager->StartSession([], $usuario[0]);

        unset($session['user']['pwd']);

        $result = getResultObject(true, 'Sesión iniciada', $session);
    } else {
        $result = getResultObject(false, 'Usuario o contraseña incorrectos');
    }

    $conn->Close();

    return $result;
}

function logout($params, $token)
{
    $sessionManager = new SessionManager();
    $sessionManager->CloseSession($token);
    return getResultObject(true, 'Sesión finalizada');
}

function isLoggedIn($params, $token)
{
    $sessionManager = new SessionManager();
    $data['loggedIn'] = $sessionManager->isActive($token);
    return getResultObject(true, '', $data);
}

function getUserIdFromToken($token)
{
    $sessionManager = new SessionManager();
    $session = $sessionManager->getSession($token);
    if ($session === null || !isset($session['user']['id'])) {
        return null;
    }
    return (int) $session['user']['id'];
}

function getCategorias($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "SELECT id, descrip FROM categorias WHERE idusu = $userId ORDER BY descrip ASC";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, '', $result);
}

function saveCategoria($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;
    $descrip = isset($params['descrip']) ? trim((string) $params['descrip']) : '';

    if ($descrip === '') {
        return getResultObject(false, 'Debe indicar la descripción');
    }

    if (strlen($descrip) > 30) {
        return getResultObject(false, 'La descripción no puede exceder 30 caracteres');
    }

    $descripSql = escapeSqlLiteral($descrip);

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    if ($id > 0) {
        $sql = "UPDATE categorias SET descrip = '$descripSql' WHERE id = $id AND idusu = $userId";
        $result = $conn->Query($sql);

        if ($result === false) {
            $msg = $conn->GetErrorMessage();
            $conn->Close();
            return getResultObject(false, $msg);
        }

        $conn->Close();
        return getResultObject(true, 'Categoría modificada', ['id' => $id, 'descrip' => $descrip]);
    }

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("SELECT t.id FROM categorias AS t ORDER BY t.id DESC LIMIT 1");

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $newId = 1;
    if (count($result) > 0) {
        $newId = (int) $result[0]['id'] + 1;
    }

    $sql = "INSERT INTO categorias (id, idusu, descrip) VALUES ($newId, $userId, '$descripSql')";
    $result = $conn->Query($sql);

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (!$conn->CommitTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Categoría creada', ['id' => $newId, 'descrip' => $descrip]);
}

function deleteCategoria($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;

    if ($id <= 0) {
        return getResultObject(false, 'ID de categoría inválido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $enUso = $conn->Query("SELECT COUNT(*) AS total FROM productos WHERE idcat = $id");

    if ($enUso !== false && count($enUso) > 0 && (int) $enUso[0]['total'] > 0) {
        $conn->Close();
        return getResultObject(false, 'No se puede eliminar: la categoría está en uso en al menos un producto');
    }

    $sql = "DELETE FROM categorias WHERE id = $id AND idusu = $userId";
    $result = $conn->Query($sql);

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (!$conn->CommitTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Categoría eliminada');
}

function getCompras($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $filtro = isset($params['filtro']) ? trim((string) $params['filtro']) : 'todas';

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "SELECT c.id, c.descrip, c.estado, c.fecha, c.idmon, IFNULL(m.simbolo, '$') AS simbolo, (SELECT IFNULL(SUM(CASE WHEN p.comprado = 1 THEN p.precio * p.cantidad ELSE 0 END), 0) FROM productos p WHERE p.idcom = c.id) AS total FROM compras c LEFT JOIN monedas m ON c.idmon = m.id WHERE c.idusu = $userId";

    if ($filtro === 'pendientes') {
        $sql .= " AND estado = 0";
    } elseif ($filtro === 'completadas') {
        $sql .= " AND estado = 1";
    }

    $sql .= " ORDER BY fecha DESC, id DESC";

    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, '', $result);
}

function saveCompra($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;
    $descrip = isset($params['descrip']) ? trim((string) $params['descrip']) : '';
    $fecha = isset($params['fecha']) ? trim((string) $params['fecha']) : date('Y-m-d');
    $idmon = isset($params['idmon']) ? (int) $params['idmon'] : 0;

    if ($descrip === '') {
        return getResultObject(false, 'Debe indicar la descripción');
    }

    $descripSql = escapeSqlLiteral($descrip);

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    if ($id > 0) {
        $sql = "UPDATE compras SET descrip = '$descripSql', fecha = '$fecha', idmon = $idmon WHERE id = $id AND idusu = $userId";
        $result = $conn->Query($sql);

        if ($result === false) {
            $msg = $conn->GetErrorMessage();
            $conn->Close();
            return getResultObject(false, $msg);
        }

        $conn->Close();
        return getResultObject(true, 'Compra modificada', ['id' => $id, 'descrip' => $descrip, 'fecha' => $fecha, 'idmon' => $idmon]);
    }

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("SELECT t.id FROM compras AS t ORDER BY t.id DESC LIMIT 1");

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $newId = 1;
    if (count($result) > 0) {
        $newId = (int) $result[0]['id'] + 1;
    }

    $sql = "INSERT INTO compras (id, idusu, descrip, estado, fecha, idmon) VALUES ($newId, $userId, '$descripSql', 0, '$fecha', $idmon)";
    $result = $conn->Query($sql);

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (!$conn->CommitTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Compra creada', ['id' => $newId, 'descrip' => $descrip, 'fecha' => $fecha, 'idmon' => $idmon]);
}

function deleteCompra($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;

    if ($id <= 0) {
        return getResultObject(false, 'ID de compra inválido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("DELETE FROM productos WHERE idcom = $id");

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("DELETE FROM compras WHERE id = $id AND idusu = $userId");

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (!$conn->CommitTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Compra eliminada');
}

function changeEstadoCompra($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;

    if ($id <= 0) {
        return getResultObject(false, 'ID de compra inválido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "UPDATE compras SET estado = IF(estado = 0, 1, 0) WHERE id = $id AND idusu = $userId";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Estado actualizado');
}

function duplicateCompra($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $origenId = isset($params['origen_id']) ? (int) $params['origen_id'] : 0;
    $nuevaFecha = isset($params['fecha']) ? trim((string) $params['fecha']) : date('Y-m-d');
    $nuevaDescrip = isset($params['descrip']) ? trim((string) $params['descrip']) : '';

    if ($origenId <= 0) {
        return getResultObject(false, 'ID de compra origen inválido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $result = $conn->Query("SELECT id, descrip, idmon FROM compras WHERE id = $origenId AND idusu = $userId");
    if ($result === false || count($result) === 0) {
        $conn->Close();
        return getResultObject(false, 'Compra origen no encontrada');
    }

    $origenDescrip = $result[0]['descrip'];
    $origenIdmon = (int) $result[0]['idmon'];

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("SELECT t.id FROM compras AS t ORDER BY t.id DESC LIMIT 1");
    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $newId = 1;
    if (count($result) > 0) {
        $newId = (int) $result[0]['id'] + 1;
    }

    $finalDescrip = $nuevaDescrip !== '' ? $nuevaDescrip : $origenDescrip;
    $finalDescripSql = escapeSqlLiteral($finalDescrip);

    $sql = "INSERT INTO compras (id, idusu, descrip, estado, fecha, idmon) VALUES ($newId, $userId, '$finalDescripSql', 0, '$nuevaFecha', $origenIdmon)";
    $result = $conn->Query($sql);

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $productos = $conn->Query("SELECT id, idcat, nombre, cantidad, precio, comprado, prioridad FROM productos WHERE idcom = $origenId");

    if ($productos === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (count($productos) > 0) {
        $result = $conn->Query("SELECT t.id FROM productos AS t ORDER BY t.id DESC LIMIT 1");
        if ($result === false) {
            $conn->RollbackTransaction();
            $msg = $conn->GetErrorMessage();
            $conn->Close();
            return getResultObject(false, $msg);
        }

        $nextProdId = 1;
        if (count($result) > 0) {
            $nextProdId = (int) $result[0]['id'] + 1;
        }

        foreach ($productos as $prod) {
            $nombreSql = escapeSqlLiteral($prod['nombre']);
            $sql = "INSERT INTO productos (id, idcom, idcat, nombre, cantidad, precio, comprado, prioridad) VALUES ($nextProdId, $newId, {$prod['idcat']}, '$nombreSql', {$prod['cantidad']}, {$prod['precio']}, {$prod['comprado']}, {$prod['prioridad']})";
            $result = $conn->Query($sql);
            if ($result === false) {
                $conn->RollbackTransaction();
                $msg = $conn->GetErrorMessage();
                $conn->Close();
                return getResultObject(false, $msg);
            }
            $nextProdId++;
        }
    }

    if (!$conn->CommitTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Compra duplicada', ['id' => $newId, 'descrip' => $finalDescrip, 'fecha' => $nuevaFecha, 'idmon' => $origenIdmon]);
}

function getCategoriasCompra($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $compraId = isset($params['idcom']) ? (int) $params['idcom'] : 0;

    if ($compraId <= 0) {
        return getResultObject(false, 'ID de compra inválido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "SELECT DISTINCT c.id, c.descrip FROM categorias c INNER JOIN productos p ON c.id = p.idcat WHERE p.idcom = $compraId AND c.idusu = $userId ORDER BY c.descrip ASC";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, '', $result);
}

function getProductosCategoria($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $compraId = isset($params['idcom']) ? (int) $params['idcom'] : 0;
    $categoriaId = isset($params['idcat']) ? (int) $params['idcat'] : 0;

    if ($compraId <= 0 || $categoriaId <= 0) {
        return getResultObject(false, 'Parámetros inválidos');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "SELECT id, idcom, idcat, nombre, cantidad, precio, comprado, prioridad FROM productos WHERE idcom = $compraId AND idcat = $categoriaId ORDER BY prioridad DESC, nombre ASC";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, '', $result);
}

function saveProducto($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;
    $compraId = isset($params['idcom']) ? (int) $params['idcom'] : 0;
    $categoriaId = isset($params['idcat']) ? (int) $params['idcat'] : 0;
    $nombre = isset($params['nombre']) ? trim((string) $params['nombre']) : '';
    $cantidad = isset($params['cantidad']) ? (int) $params['cantidad'] : 0;
    $precio = isset($params['precio']) ? floatval($params['precio']) : 0.00;
    $comprado = isset($params['comprado']) ? (int) $params['comprado'] : 0;
    $prioridad = isset($params['prioridad']) ? (int) $params['prioridad'] : 0;

    if ($compraId <= 0 || $categoriaId <= 0) {
        return getResultObject(false, 'Parámetros inválidos');
    }

    if ($nombre === '') {
        return getResultObject(false, 'Debe indicar el nombre del producto');
    }

    $nombreSql = escapeSqlLiteral($nombre);

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    if ($id > 0) {
        $sql = "UPDATE productos SET nombre = '$nombreSql', cantidad = $cantidad, precio = $precio, comprado = $comprado, prioridad = $prioridad WHERE id = $id AND idcom = $compraId";
        $result = $conn->Query($sql);

        if ($result === false) {
            $msg = $conn->GetErrorMessage();
            $conn->Close();
            return getResultObject(false, $msg);
        }

        $conn->Close();
        return getResultObject(true, 'Producto modificado', ['id' => $id, 'nombre' => $nombre, 'cantidad' => $cantidad, 'precio' => $precio]);
    }

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("SELECT t.id FROM productos AS t ORDER BY t.id DESC LIMIT 1");

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $newId = 1;
    if (count($result) > 0) {
        $newId = (int) $result[0]['id'] + 1;
    }

    $sql = "INSERT INTO productos (id, idcom, idcat, nombre, cantidad, precio, comprado, prioridad) VALUES ($newId, $compraId, $categoriaId, '$nombreSql', $cantidad, $precio, $comprado, $prioridad)";
    $result = $conn->Query($sql);

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (!$conn->CommitTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Producto creado', ['id' => $newId, 'nombre' => $nombre, 'cantidad' => $cantidad, 'precio' => $precio]);
}

function deleteProducto($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;

    if ($id <= 0) {
        return getResultObject(false, 'ID de producto inválido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "DELETE FROM productos WHERE id = $id";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Producto eliminado');
}

function changeEstadoProducto($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;

    if ($id <= 0) {
        return getResultObject(false, 'ID de producto inválido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "UPDATE productos SET comprado = IF(comprado = 0, 1, 0) WHERE id = $id";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Estado actualizado');
}

function getMonedas($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesion invalida');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "SELECT id, siglas, nombre, simbolo FROM monedas WHERE id_usu = $userId ORDER BY nombre ASC";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, '', $result);
}

function saveMoneda($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesion invalida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;
    $siglas = isset($params['siglas']) ? strtoupper(trim((string) $params['siglas'])) : '';
    $nombre = isset($params['nombre']) ? trim((string) $params['nombre']) : '';
    $simbolo = isset($params['simbolo']) ? trim((string) $params['simbolo']) : '';

    if ($siglas === '' || $nombre === '' || $simbolo === '') {
        return getResultObject(false, 'Siglas, nombre y simbolo son requeridos');
    }

    $siglasSql = escapeSqlLiteral($siglas);
    $nombreSql = escapeSqlLiteral($nombre);
    $simboloSql = escapeSqlLiteral($simbolo);

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    if ($id > 0) {
        $sql = "UPDATE monedas SET siglas = '$siglasSql', nombre = '$nombreSql', simbolo = '$simboloSql' WHERE id = $id AND id_usu = $userId";
        $result = $conn->Query($sql);

        if ($result === false) {
            $msg = $conn->GetErrorMessage();
            $conn->Close();
            return getResultObject(false, $msg);
        }

        $conn->Close();
        return getResultObject(true, 'Moneda modificada', ['id' => $id, 'siglas' => $siglas, 'nombre' => $nombre, 'simbolo' => $simbolo]);
    }

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("SELECT t.id FROM monedas AS t ORDER BY t.id DESC LIMIT 1");

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $newId = 1;
    if (count($result) > 0) {
        $newId = (int) $result[0]['id'] + 1;
    }

    $sql = "INSERT INTO monedas (id, id_usu, siglas, nombre, simbolo) VALUES ($newId, $userId, '$siglasSql', '$nombreSql', '$simboloSql')";
    $result = $conn->Query($sql);

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (!$conn->CommitTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Moneda creada', ['id' => $newId, 'siglas' => $siglas, 'nombre' => $nombre, 'simbolo' => $simbolo]);
}

function deleteMoneda($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesion invalida');
    }

    $id = isset($params['id']) ? (int) $params['id'] : 0;

    if ($id <= 0) {
        return getResultObject(false, 'ID de moneda invalido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $enUso = $conn->Query("SELECT COUNT(*) AS total FROM compras WHERE idmon = $id AND idusu = $userId");

    if ($enUso !== false && count($enUso) > 0 && (int) $enUso[0]['total'] > 0) {
        $conn->Close();
        return getResultObject(false, 'No se puede eliminar: la moneda esta en uso en al menos una compra');
    }

    $sql = "DELETE FROM monedas WHERE id = $id AND id_usu = $userId";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Moneda eliminada');
}

function copiarCategoria($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $compraOrigenId = isset($params['compra_origen_id']) ? (int) $params['compra_origen_id'] : 0;
    $compraDestinoId = isset($params['compra_destino_id']) ? (int) $params['compra_destino_id'] : 0;
    $categoriaId = isset($params['idcat']) ? (int) $params['idcat'] : 0;

    if ($compraOrigenId <= 0 || $compraDestinoId <= 0 || $categoriaId <= 0) {
        return getResultObject(false, 'Parámetros inválidos');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $productos = $conn->Query("SELECT id, nombre, cantidad, precio, comprado, prioridad FROM productos WHERE idcom = $compraOrigenId AND idcat = $categoriaId");

    if ($productos === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (count($productos) === 0) {
        $conn->Close();
        return getResultObject(false, 'No hay productos para copiar');
    }

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("SELECT t.id FROM productos AS t ORDER BY t.id DESC LIMIT 1");
    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $nextId = 1;
    if (count($result) > 0) {
        $nextId = (int) $result[0]['id'] + 1;
    }

    foreach ($productos as $prod) {
        $nombreSql = escapeSqlLiteral($prod['nombre']);
        $sql = "INSERT INTO productos (id, idcom, idcat, nombre, cantidad, precio, comprado, prioridad) VALUES ($nextId, $compraDestinoId, $categoriaId, '$nombreSql', {$prod['cantidad']}, {$prod['precio']}, 0, {$prod['prioridad']})";
        $result = $conn->Query($sql);
        if ($result === false) {
            $conn->RollbackTransaction();
            $msg = $conn->GetErrorMessage();
            $conn->Close();
            return getResultObject(false, $msg);
        }
        $nextId++;
    }

    if (!$conn->CommitTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Categoría copiada');
}

function getConfig($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "SELECT id, contraercategorias FROM config WHERE id = 1";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (count($result) === 0) {
        $conn->Close();
        return getResultObject(false, 'Registro de configuración no encontrado');
    }

    $conn->Close();
    return getResultObject(true, '', $result[0]);
}

function saveConfig($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $contraer = isset($params['contraercategorias']) ? (int) $params['contraercategorias'] : 0;

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "UPDATE config SET contraercategorias = $contraer WHERE id = 1";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Configuración guardada');
}

function changePassword($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $actual = isset($params['actual']) ? (string) $params['actual'] : '';
    $nueva = isset($params['nueva']) ? (string) $params['nueva'] : '';
    $confirmacion = isset($params['confirmacion']) ? (string) $params['confirmacion'] : '';

    if ($actual === '' || $nueva === '' || $confirmacion === '') {
        return getResultObject(false, 'Debe indicar la clave actual y la nueva clave');
    }

    if ($nueva !== $confirmacion) {
        return getResultObject(false, 'La nueva clave y su confirmación no coinciden');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "SELECT id, pwd FROM usuarios WHERE id = $userId";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (count($result) === 0) {
        $conn->Close();
        return getResultObject(false, 'Usuario no encontrado');
    }

    $pwdActualHash = hash('sha3-512', $actual);
    if (!hash_equals((string) $result[0]['pwd'], $pwdActualHash)) {
        $conn->Close();
        return getResultObject(false, 'La clave actual es incorrecta');
    }

    $nuevaHash = hash('sha3-512', $nueva);
    $sqlUpdate = "UPDATE usuarios SET pwd = '$nuevaHash' WHERE id = $userId";
    $upd = $conn->Query($sqlUpdate);

    if ($upd === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Contraseña actualizada');
}

function createUsuario($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $nickname = isset($params['nickname']) ? trim((string) $params['nickname']) : '';
    $nombre = isset($params['nombre']) ? trim((string) $params['nombre']) : '';
    $email = isset($params['email']) ? trim((string) $params['email']) : '';
    $pwd = isset($params['pwd']) ? (string) $params['pwd'] : '';
    $admin = isset($params['admin']) ? (int) $params['admin'] : 0;

    if ($nickname === '') {
        return getResultObject(false, 'Debe indicar el nombre de usuario');
    }

    if (!preg_match('/^[A-Za-z0-9._-]+$/', $nickname)) {
        return getResultObject(false, 'Nombre de usuario inválido');
    }

    if ($pwd === '') {
        return getResultObject(false, 'Debe indicar la contraseña');
    }

    if (strlen($pwd) < 4) {
        return getResultObject(false, 'La contraseña debe tener al menos 4 caracteres');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sqlAdmin = "SELECT admin FROM usuarios WHERE id = $userId";
    $resAdmin = $conn->Query($sqlAdmin);

    if ($resAdmin === false || count($resAdmin) === 0) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg !== '' ? $msg : 'No autorizado');
    }

    if ((int) $resAdmin[0]['admin'] !== 1) {
        $conn->Close();
        return getResultObject(false, 'No tiene permisos para crear usuarios');
    }

    $nicknameSql = escapeSqlLiteral($nickname);
    $nombreSql = escapeSqlLiteral($nombre);
    $emailSql = escapeSqlLiteral($email);
    $pwdHash = hash('sha3-512', $pwd);

    $sqlCheck = "SELECT id FROM usuarios WHERE nickname = '$nicknameSql' LIMIT 1";
    $resCheck = $conn->Query($sqlCheck);

    if ($resCheck === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (count($resCheck) > 0) {
        $conn->Close();
        return getResultObject(false, 'El nombre de usuario ya existe');
    }

    if (!$conn->BeginTransaction()) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $result = $conn->Query("SELECT t.id FROM usuarios AS t ORDER BY t.id DESC LIMIT 1");

    if ($result === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $newId = 1;
    if (count($result) > 0) {
        $newId = (int) $result[0]['id'] + 1;
    }

    $sql = "INSERT INTO usuarios (id, nickname, nombre, email, pwd, admin) VALUES ($newId, '$nicknameSql', '$nombreSql', '$emailSql', '$pwdHash', $admin)";
    $res = $conn->Query($sql);

    if ($res === false) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (!$conn->CommitTransaction()) {
        $conn->RollbackTransaction();
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Usuario creado', [
        'id' => $newId,
        'nickname' => $nickname,
        'nombre' => $nombre,
        'email' => $email,
        'admin' => $admin,
    ]);
}

function registerBiometric($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $bioToken = isset($params['bioToken']) ? trim((string) $params['bioToken']) : '';
    if ($bioToken === '' || strlen($bioToken) < 16) {
        return getResultObject(false, 'Token biométrico inválido');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $bioTokenSql = escapeSqlLiteral($bioToken);
    $sql = "UPDATE usuarios SET bio_token = '$bioTokenSql' WHERE id = $userId";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Biometría registrada');
}

function loginBiometric($params)
{
    $nickname = isset($params['nickname']) ? trim((string) $params['nickname']) : '';
    $bioToken = isset($params['bioToken']) ? trim((string) $params['bioToken']) : '';

    if ($nickname === '' || $bioToken === '') {
        return getResultObject(false, 'Debe indicar usuario y credencial biométrica');
    }

    $nicknameSql = escapeSqlLiteral($nickname);
    $bioTokenSql = escapeSqlLiteral($bioToken);

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "SELECT * FROM usuarios WHERE nickname = '$nicknameSql' AND bio_token = '$bioTokenSql'";
    $usuario = $conn->Query($sql);

    if ($usuario === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    if (count($usuario) === 0) {
        $conn->Close();
        return getResultObject(false, 'Biometría no registrada o credencial inválida');
    }

    $sessionManager = new SessionManager();
    $session = $sessionManager->StartSession([], $usuario[0]);

    unset($session['user']['pwd']);
    unset($session['user']['bio_token']);

    $conn->Close();
    return getResultObject(true, 'Sesión iniciada', $session);
}

function disableBiometric($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $sql = "UPDATE usuarios SET bio_token = NULL WHERE id = $userId";
    $result = $conn->Query($sql);

    if ($result === false) {
        $msg = $conn->GetErrorMessage();
        $conn->Close();
        return getResultObject(false, $msg);
    }

    $conn->Close();
    return getResultObject(true, 'Datos biométricos eliminados');
}

// =====================
// Notificaciones Push
// =====================

function registerDevice($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $fcmToken = isset($params['fcmToken']) ? trim((string) $params['fcmToken']) : '';
    if ($fcmToken === '') {
        return getResultObject(false, 'Se requiere fcmToken');
    }

    $platform = isset($params['platform']) ? trim((string) $params['platform']) : 'android';

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $fcmTokenSql = escapeSqlLiteral($fcmToken);

    $existing = $conn->Query("SELECT id FROM user_devices WHERE fcm_token = '$fcmTokenSql'");

    if ($existing !== false && count($existing) > 0) {
        $deviceId = (int) $existing[0]['id'];
        $conn->Query("UPDATE user_devices SET idusu = $userId, active = 1, fecha_actualizacion = NOW() WHERE id = $deviceId");
    } else {
        $result = $conn->Query("SELECT t.id FROM user_devices AS t ORDER BY t.id DESC LIMIT 1");
        $newId = 1;
        if ($result !== false && count($result) > 0) {
            $newId = (int) $result[0]['id'] + 1;
        }

        $platformSql = escapeSqlLiteral($platform);
        $conn->Query("INSERT INTO user_devices (id, idusu, fcm_token, platform, active, fecha_registro, fecha_actualizacion)
            VALUES ($newId, $userId, '$fcmTokenSql', '$platformSql', 1, NOW(), NOW())");
        $deviceId = $newId;
    }

    $conn->Close();
    return getResultObject(true, 'Dispositivo registrado', ['deviceId' => $deviceId]);
}

function unregisterDevice($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesión inválida');
    }

    $fcmToken = isset($params['fcmToken']) ? trim((string) $params['fcmToken']) : '';
    if ($fcmToken === '') {
        return getResultObject(false, 'Se requiere fcmToken');
    }

    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        return getResultObject(false, $conn->GetErrorMessage());
    }

    $fcmTokenSql = escapeSqlLiteral($fcmToken);
    $conn->Query("UPDATE user_devices SET active = 0, fecha_actualizacion = NOW() WHERE fcm_token = '$fcmTokenSql' AND idusu = $userId");

    $conn->Close();
    return getResultObject(true, 'Dispositivo desregistrado');
}

function sendTestNotification($params, $token)
{
    $userId = getUserIdFromToken($token);
    if ($userId === null) {
        return getResultObject(false, 'Sesion invalida');
    }

    require_once __DIR__ . '/firebase_sender.php';

    $nickname = isset($params['nickname']) ? trim((string) $params['nickname']) : '';

    if ($nickname !== '') {
        $nicknameSql = escapeSqlLiteral($nickname);
        $dbInfo = getMySqlDbInfo(MICARRITO_DB);
        $conn = new MySqlDataManager($dbInfo);

        if (!$conn->IsConnected()) {
            return getResultObject(false, $conn->GetErrorMessage());
        }

        $sql = "SELECT id FROM usuarios WHERE nickname = '$nicknameSql'";
        $result = $conn->Query($sql);
        $conn->Close();

        if ($result === false || count($result) === 0) {
            return getResultObject(false, "Usuario '$nickname' no encontrado");
        }

        $targetUserId = (int) $result[0]['id'];
        $sent = sendPushToUser($targetUserId, 'MiCarrito', 'Esta es una notificacion de prueba de MiCarrito');
    } else {
        $sent = sendPushToUser($userId, 'MiCarrito', 'Esta es una notificacion de prueba de MiCarrito');
    }

    if ($sent === 0) {
        return getResultObject(false, 'No hay dispositivos registrados para enviar notificacion');
    }

    $destino = $nickname !== '' ? $nickname : 'tu dispositivo';
    return getResultObject(true, "Notificacion enviada a $destino ($sent dispositivo(s))", ['devices' => $sent]);
}
