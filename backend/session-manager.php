<?php

class SessionManager
{
    private const SESSIONS_DIR = __DIR__ . '/data/sessions/';
    private const LOG_FILE = __DIR__ . '/log/session_log.txt';
    private const SESSION_TTL_SECONDS = 0;
    private const SESSION_IDLE_TIMEOUT_SECONDS = 0;

    public function __construct()
    {
        $oldFile = __DIR__ . '/data/sessions.json';
        if (file_exists($oldFile)) {
            try {
                $content = file_get_contents($oldFile);
                if ($content !== false) {
                    $sessions = json_decode($content, true);
                    if (is_array($sessions)) {
                        foreach ($sessions as $session) {
                            if (isset($session['sessionId']) && is_string($session['sessionId'])) {
                                $this->SaveSessionFile($session['sessionId'], $session);
                            }
                        }
                    }
                }
                @unlink($oldFile);
            } catch (Throwable $e) {
                $this->SaveLog("Error durante la migración de sesiones: " . $e->getMessage());
            }
        }
    }

    private function BuildToken(): string
    {
        $data = random_bytes(16);

        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        return sprintf(
            '%08s-%04s-%04s-%04s-%12s',
            bin2hex(substr($data, 0, 4)),
            bin2hex(substr($data, 4, 2)),
            bin2hex(substr($data, 6, 2)),
            bin2hex(substr($data, 8, 2)),
            bin2hex(substr($data, 10, 6))
        );
    }

    private function GetSessionFilePath(string $sessionId): string
    {
        return self::SESSIONS_DIR . $sessionId . '.json';
    }

    private function SaveSessionFile(string $sessionId, array $sessionData): void
    {
        try {
            if (!is_dir(self::SESSIONS_DIR)) {
                mkdir(self::SESSIONS_DIR, 0700, true);
            }

            $path = $this->GetSessionFilePath($sessionId);
            $json = json_encode($sessionData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            if ($json === false) {
                $this->SaveLog("Error al serializar la sesión: " . $sessionId);
                return;
            }

            $result = file_put_contents($path, $json, LOCK_EX);

            if ($result === false) {
                $this->SaveLog("Error al escribir el archivo de sesión: " . $path);
            } else {
                @chmod($path, 0600);
            }
        } catch (Throwable $e) {
            $this->SaveLog("Excepción al guardar sesión: " . $e->getMessage());
        }
    }

    private function DeleteSessionFile(string $sessionId): void
    {
        $path = $this->GetSessionFilePath($sessionId);
        if (file_exists($path)) {
            @unlink($path);
        }
    }

    private function SaveLog(string $log): void
    {
        try {
            $directory = dirname(self::LOG_FILE);
            if (!is_dir($directory)) {
                mkdir($directory, 0700, true);
            }

            $timestamp = date('Y-m-d H:i:s');
            $logMessage = "[{$timestamp}] SessionManager: {$log}" . PHP_EOL;

            file_put_contents(self::LOG_FILE, $logMessage, FILE_APPEND | LOCK_EX);

        } catch (Throwable $e) {
            error_log("SessionManager SaveLog Error: " . $e->getMessage());
        }
    }

    public function isActive(string $sessionId): bool
    {
        $sessionId = trim($sessionId);
        if ($sessionId === '') {
            return false;
        }

        return file_exists($this->GetSessionFilePath($sessionId));
    }

    public function getSession(string $sessionId): ?array
    {
        $sessionId = trim($sessionId);
        if ($sessionId === '') {
            return null;
        }

        $path = $this->GetSessionFilePath($sessionId);
        if (!file_exists($path)) {
            return null;
        }

        $content = file_get_contents($path);
        if ($content === false) {
            return null;
        }

        $data = json_decode($content, true);
        return is_array($data) ? $data : null;
    }

    public function StartSession(array $company, array $user): array
    {
        $newToken = $this->BuildToken();
        $now = time();

        $safeUser = $user;
        unset($safeUser['pwd']);

        $newSession = array(
            'sessionId' => $newToken,
            'company' => $company,
            'user' => $safeUser,
            'createdAt' => $now,
            'lastActivityAt' => $now,
            'expiresAt' => self::SESSION_TTL_SECONDS > 0 ? $now + self::SESSION_TTL_SECONDS : 0,
        );

        $this->SaveSessionFile($newToken, $newSession);

        return $newSession;
    }

    public function CloseSession(string $token): void
    {
        $token = trim($token);
        if ($token === '') {
            return;
        }

        $this->DeleteSessionFile($token);
    }
}
