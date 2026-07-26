<?php
define('log_filename', './log/log.txt');
define('codes', __DIR__ . '/data/codes.json');

function saveLog($message)
{
    $fechaHora = date('Y-m-d H:i');

    $logEntry = "[$fechaHora] $message" . PHP_EOL;

    $archivo = fopen(log_filename, 'a');

    fwrite($archivo, $logEntry);

    fclose($archivo);
}

function getUID()
{
    $data = random_bytes(16);

    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

    $uuid = vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));

    return $uuid;
}

function getResultObject($status, $message, $data = [])
{
    return array('status' => $status, 'message' => $message, 'data' => $data);
}
