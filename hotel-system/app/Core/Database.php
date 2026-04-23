<?php
namespace App\Core;

use PDO;
use PDOException;

/**
 * Database Connection Class using PDO
 */
class Database
{
    private static ?Database $instance = null;
    private ?PDO $connection = null;
    
    private function __construct()
    {
        $config = require BASE_PATH . '/app/Config/config.php';
        $db = $config['database'];
        
        $dsn = sprintf(
            "%s:host=%s;port=%d;dbname=%s;charset=%s",
            $db['driver'],
            $db['host'],
            $db['port'],
            $db['database'],
            $db['charset']
        );
        
        try {
            $this->connection = new PDO($dsn, $db['username'], $db['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => true
            ]);
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            if ($config['app']['debug']) {
                die("Database connection failed: " . $e->getMessage());
            }
            die("Service temporarily unavailable");
        }
    }
    
    public static function getInstance(): Database
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection(): PDO
    {
        return $this->connection;
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup()
    {
        throw new \Exception("Cannot unserialize singleton");
    }
}
