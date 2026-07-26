<?php
    class MySqlDataManager {
        private const __MYSQL_DATA_MANAGER_LOG_FILENAME = __DIR__ . '/log/mysql-data-manager.log';
        private const __MYSQL_DATA_MANAGER_SAVE_LOG = true;

        private $connected;
        private $conn;
        private $stmt;
        private $errorMessage;

        function __construct($dbInfo) {
            $this->connected = false;
            $this->conn = false;
            $this->stmt = false;
            $this->errorMessage = '';

            if (!$this->ValidateDbInfoStructure($dbInfo)) {
                return;
            }

            $host = $dbInfo['host'];
            $port = $dbInfo['port'];
            if ($dbInfo['dbname'] != '') {
                $dbname = $dbInfo['dbname'];
                $user = $dbInfo['user'];
            } else {
                $dbname = '';
                $user = $dbInfo['user'];
            }
            $pwd = $dbInfo['pwd'];
            $conn = mysqli_connect($host, $user, $pwd, $dbname, $port);

            if ($conn === false) {
                $this->errorMessage = mysqli_connect_error();
                $this->SaveEventLog($this->errorMessage);
                return;
            }

            $this->errorMessage = '';
            $this->conn = $conn;
            $this->connected = true;
        }

        function __destruct() {
            $this->Close();
        }

        public function IsConnected() {
            return $this->connected;
        }

        public function BeginTransaction() {
            if (!$this->connected) {
                $this->errorMessage = 'BeginTransaction: No hay una conexión activa';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if ($this->stmt !== false) {
                $this->errorMessage = 'BeginTransaction: Hay resultados pendientes por extraer';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!$this->conn->begin_transaction(MYSQLI_TRANS_START_READ_WRITE)) {
                $this->errorMessage = 'BeginTransaction: ' . $this->conn->error;
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            return true;
        }

        public function CommitTransaction() {
            if (!$this->connected) {
                $this->errorMessage = 'CommitTransaction: No hay una conexión activa';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!$this->conn->commit()) {
                $this->errorMessage = 'CommitTransaction: ' . $this->conn->error;
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            return true;
        }

        public function RollbackTransaction() {
            if (!$this->connected) {
                $this->errorMessage = 'RollbackTransaction: No hay una conexión activa';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!$this->conn->rollback()) {
                $this->errorMessage = 'RollbackTransaction: ' . $this->conn->error;
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            return true;
        }

        public function Query($sqlCommand, $maxRows = 0) {
            if (gettype($sqlCommand) != 'string') {
                $this->errorMessage = 'Query: El parametro [sqlCommand] debe ser de tipo string';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (gettype($maxRows) != 'integer') {
                $this->errorMessage = 'Query: El parametro [maxRows] debe ser de tipo numerico';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!$this->connected) {
                $this->errorMessage = 'Query: No hay una conexión activa';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if ($this->stmt !== false) {
                $this->errorMessage = 'Query: Hay resultados pendientes por extraer';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if ($this->conn->autocommit(true) === false) {
                $this->errorMessage = 'Query: No se pudo establecer el autocommit';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            $stmt = $this->conn->query($sqlCommand);

            if (gettype($stmt) == 'boolean') {
                if ($stmt === false) {
                    $this->errorMessage = 'Query: ' . $this->conn->error;
                    $this->SaveEventLog($this->errorMessage);
                    return false;
                }

                $this->errorMessage = '';
                return true;
            }

            $this->stmt = $stmt;
            $data = $this->Fetch($maxRows);

            return $data;
        }

        public function Fetch($maxRows = 0) {
            if (gettype($maxRows) != 'integer') {
                $this->errorMessage = 'Query: El parametro [maxRows] debe ser de tipo numerico';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!$this->connected) {
                $this->errorMessage = 'Query: No hay una conexión activa';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            $i = 0;
            $data = array();

            if ($this->stmt === false) {
                return $data;
            }

            while (true) {
                $row = $this->stmt->fetch_assoc();

                if ($row === false) {
                    $this->errorMessage = 'Fetch: ' . $this->conn->error;
                    $this->SaveEventLog($this->errorMessage);
                    return false;
                }

                if (is_null($row)) {
                    $this->stmt->close();
                    $this->stmt = false;
                    break;
                }

                $data[$i] = $row;
                $i++;

                if ($maxRows != 0 && $i == $maxRows) {
                    break;
                }
            }

            $this->errorMessage = '';

            return $data;
        }

        public function GetDatabases() {
            $sqlCommand = "show databases;";
            $result = $this->Query($sqlCommand);

            if ($result === false) {
                return $result;
            }

            $i = 0;
            $data = array();
            for ($j = 0; $j < count($result); $j++) {
                foreach ($result[$j] as $key => $value) {
                    $data[$i] = strtolower($value);
                    $i++;
                    break;
                }
            }

            $this->errorMessage = '';
            return $data;
        }

        public function ExistDatabase($name) {
            if (gettype($name) != 'string') {
                $this->errorMessage = 'ExistDatabase: El tipo de [name] debe ser string';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            $result = $this->GetDatabases();

            if ($result === false) {
                return $result;
            }

            $found = false;
            for ($i = 0; $i < count($result); $i++) {
                if ($result[$i] == $name) {
                    $found = true;
                    break;
                }
            }

            $this->errorMessage = '';
            return $found;
        }

        public function GetTables() {
            $sqlCommand = "show tables;";
            $result = $this->Query($sqlCommand);

            if ($result === false) {
                return $result;
            }

            $i = 0;
            $data = array();
            for ($j = 0; $j < count($result); $j++) {
                foreach ($result[$j] as $key => $value) {
                    $data[$i] = strtolower($value);
                    $i++;
                    break;
                }
            }

            $this->errorMessage = '';
            return $data;
        }

        public function ExistTable($name) {
            if (gettype($name) != 'string') {
                $this->errorMessage = 'ExistTable: El tipo de [name] debe ser string';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            $result = $this->GetTables();

            if ($result === false) {
                return $result;
            }

            $found = false;
            for ($i = 0; $i < count($result); $i++) {
                if ($result[$i] == $name) {
                    $found = true;
                    break;
                }
            }

            $this->errorMessage = '';
            return $found;
        }

        public function Close() {
            if ($this->connected) {
                if ($this->stmt !== false) {
                    $this->Fetch();
                }

                $this->conn->close();
                $this->conn = false;
                $this->connected = false;
            }
        }

        public function GetErrorMessage() {
            return $this->errorMessage;
        }

        public function SetEventLogState($state) {
            if (gettype($state) != 'boolean') {
                $this->errorMessage = 'SetEventLogState: El parametro [state] debe ser de tipo booleano';
                $this->SaveEventLog($this->errorMessage);
                return;
            }
            $this->saveEventLog = $state;
        }

        private function ValidateDbInfoStructure($dbInfo) {
            if (gettype($dbInfo) != 'array') {
                $this->errorMessage = 'El parametro [dbInfo] debe ser un arreglo asociativo';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!isset($dbInfo['host'])) {
                $this->errorMessage = 'No se estableció el campo [host] en el parametro [dbInfo]';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (gettype($dbInfo['host']) != 'string') {
                $this->errorMessage = 'El campo [host] debe ser de tipo cadena';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!isset($dbInfo['dbname'])) {
                $this->errorMessage = 'No se estableció el campo [dbname] en el parametro [dbInfo]';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (gettype($dbInfo['dbname']) != 'string') {
                $this->errorMessage = 'El campo [dbname] debe ser de tipo cadena';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!isset($dbInfo['user'])) {
                $this->errorMessage = 'No se estableció el campo [user] en el parametro [dbInfo]';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (gettype($dbInfo['user']) != 'string') {
                $this->errorMessage = 'El campo [user] debe ser de tipo cadena';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (!isset($dbInfo['pwd'])) {
                $this->errorMessage = 'No se estableció el campo [pwd] en el parametro [dbInfo]';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            if (gettype($dbInfo['pwd']) != 'string') {
                $this->errorMessage = 'El campo [pwd] debe ser de tipo cadena';
                $this->SaveEventLog($this->errorMessage);
                return false;
            }

            $this->errorMessage = '';
            return true;
        }

        private function SaveEventLog($log) {
            if (MySqlDataManager::__MYSQL_DATA_MANAGER_SAVE_LOG) {
                $file = fopen(__DIR__ . '/' . MySqlDataManager::__MYSQL_DATA_MANAGER_LOG_FILENAME, "a");
                $date = date('Y-m-d H:i:s');
                fwrite($file, $date . ' ' . $log . PHP_EOL);
                fclose($file);
            }
        }
    }
