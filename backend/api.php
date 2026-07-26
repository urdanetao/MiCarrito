<?php
require_once __DIR__ . '/common.php';

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');

$allowedOrigins = [
    'http://localhost:5173',
    'http://192.168.1.20:5173',
    'http://192.168.1.20',
    'https://163.245.209.2',
    'https://almacenadorasaiver.com',
];

$requestMethod = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'GET';
$origin = isset($_SERVER['HTTP_ORIGIN']) ? trim((string) $_SERVER['HTTP_ORIGIN']) : '';
$isOriginAllowed = $origin === '' || in_array($origin, $allowedOrigins, true);

if ($origin !== '' && $isOriginAllowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

if ($requestMethod === 'OPTIONS') {
    if (!$isOriginAllowed) {
        http_response_code(403);
        echo json_encode(getResultObject(false, 'Origen no permitido'));
    } else {
        http_response_code(204);
    }
    exit;
}

if (!$isOriginAllowed) {
    http_response_code(403);
    echo json_encode(getResultObject(false, 'Origen no permitido'));
    exit;
}

if ($requestMethod !== 'POST') {
    http_response_code(405);
    echo json_encode(getResultObject(false, 'Método no permitido'));
    exit;
}

try {
    require_once __DIR__ . '/apicode.php';
    require_once __DIR__ . '/session-manager.php';

    $sessionManager = new SessionManager();

    $publicFunctions = [
        'login',
        'logout',
        'isLoggedIn',
        'loginBiometric',
    ];

    $privateFunctions = [
        'getCategorias',
        'saveCategoria',
        'deleteCategoria',
        'getCompras',
        'saveCompra',
        'deleteCompra',
        'changeEstadoCompra',
        'duplicateCompra',
        'getCategoriasCompra',
        'getProductosCategoria',
        'saveProducto',
        'deleteProducto',
        'changeEstadoProducto',
        'copiarCategoria',
        'getMonedas',
        'saveMoneda',
        'deleteMoneda',
        'getConfig',
        'saveConfig',
        'changePassword',
        'createUsuario',
        'registerBiometric',
        'disableBiometric',
    ];

    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(getResultObject(false, 'Solicitud inválida'));
        exit;
    }

    if (!isset($input['action']) || !is_string($input['action'])) {
        http_response_code(400);
        echo json_encode(getResultObject(false, 'No se recibió action'));
        exit;
    }

    $action = trim($input['action']);

    if ($action === '' || !preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $action)) {
        http_response_code(403);
        echo json_encode(getResultObject(false, 'Acceso denegado'));
        exit;
    }

    $token = '';
    if (isset($input['token']) && is_string($input['token'])) {
        $token = trim($input['token']);
    }

    if ($token !== '' && !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i', $token)) {
        $token = '';
    }

    $params = [];
    if (isset($input['params']) && is_array($input['params'])) {
        $params = $input['params'];
    }

    if (!in_array($action, $publicFunctions, true) && !in_array($action, $privateFunctions, true)) {
        saveLog("Intento de acceso a función no permitida: {$action}");
        http_response_code(403);
        echo json_encode(getResultObject(false, 'Acceso denegado'));
        exit;
    }

    if (!function_exists($action)) {
        saveLog("Función no encontrada en API: {$action}");
        http_response_code(404);
        echo json_encode(getResultObject(false, 'Acción no disponible'));
        exit;
    }

    if (in_array($action, $publicFunctions, true)) {
        $response = call_user_func($action, $params, $token);
    } else {
        if ($token === '' || !$sessionManager->isActive($token)) {
            http_response_code(401);
            echo json_encode(getResultObject(false, 'Acceso denegado: token inválido o sesión expirada'));
            exit;
        }

        $response = call_user_func($action, $params, $token);
    }

    if (!is_array($response)) {
        $response = getResultObject(false, 'Respuesta inválida del servidor');
    }

    echo json_encode($response);
} catch (Throwable $e) {
    saveLog("Error interno API: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(getResultObject(false, $e->getMessage()));
}
