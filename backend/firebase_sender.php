<?php
require_once __DIR__ . '/firebase_config.php';

$firebaseAccessToken = null;

function getFirebaseAccessToken()
{
    global $firebaseAccessToken;
    if ($firebaseAccessToken !== null) {
        return $firebaseAccessToken;
    }

    $saPath = FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!file_exists($saPath)) {
        saveLog("Firebase: service account no encontrado en $saPath");
        return null;
    }

    $sa = json_decode(file_get_contents($saPath), true);
    if (!$sa || !isset($sa['client_email']) || !isset($sa['private_key'])) {
        saveLog('Firebase: service account JSON inválido');
        return null;
    }

    $now = time();
    $header = json_encode(['typ' => 'JWT', 'alg' => 'RS256']);
    $payload = json_encode([
        'iss' => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
        'aud' => 'https://oauth2.googleapis.com/token',
        'iat' => $now,
        'exp' => $now + 3600,
    ]);

    $headerB64 = rtrim(base64_encode($header), '=');
    $payloadB64 = rtrim(base64_encode($payload), '=');
    $signInput = "$headerB64.$payloadB64";

    $signature = '';
    openssl_sign($signInput, $signature, $sa['private_key'], OPENSSL_ALGO_SHA256);
    $signatureB64 = rtrim(base64_encode($signature), '=');

    $jwt = "$signInput.$signatureB64";

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]),
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        saveLog("Firebase: error obteniendo access token (HTTP $httpCode): $response");
        return null;
    }

    $tokenData = json_decode($response, true);
    if (!isset($tokenData['access_token'])) {
        saveLog('Firebase: respuesta sin access_token');
        return null;
    }

    $firebaseAccessToken = $tokenData['access_token'];
    return $firebaseAccessToken;
}

function getFirebaseProjectId()
{
    $saPath = FIREBASE_SERVICE_ACCOUNT_PATH;
    if (!file_exists($saPath)) {
        return null;
    }
    $sa = json_decode(file_get_contents($saPath), true);
    return $sa['project_id'] ?? null;
}

function sendFcmPush($fcmToken, $title, $body, $data = [])
{
    $accessToken = getFirebaseAccessToken();
    if ($accessToken === null) {
        return false;
    }

    $projectId = getFirebaseProjectId();
    if ($projectId === null) {
        saveLog('Firebase: project_id no encontrado en service account');
        return false;
    }

    $message = [
        'token' => $fcmToken,
        'notification' => [
            'title' => $title,
            'body' => $body,
        ],
        'android' => [
            'priority' => 'high',
            'notification' => [
                'channel_id' => 'micarrito_notifications',
                'sound' => 'default',
            ],
        ],
    ];

    if (!empty($data)) {
        $message['data'] = array_map('strval', $data);
    }

    $payload = json_encode(['message' => $message]);

    $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => $payload,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode !== 200) {
        saveLog("Firebase: error enviando push (HTTP $httpCode): $response");
        return false;
    }

    return true;
}

function sendPushToUser($userId, $title, $body, $data = [])
{
    $dbInfo = getMySqlDbInfo(MICARRITO_DB);
    $conn = new MySqlDataManager($dbInfo);

    if (!$conn->IsConnected()) {
        saveLog("Firebase: error BD: " . $conn->GetErrorMessage());
        return 0;
    }

    $sql = "SELECT fcm_token FROM user_devices WHERE idusu = $userId AND active = 1";
    $devices = $conn->Query($sql);
    $conn->Close();

    if ($devices === false || count($devices) === 0) {
        return 0;
    }

    $sent = 0;
    foreach ($devices as $device) {
        if (sendFcmPush($device['fcm_token'], $title, $body, $data)) {
            $sent++;
        }
    }

    return $sent;
}
