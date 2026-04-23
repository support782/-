<?php
/**
 * Hotel Management System - Main Entry Point
 * 
 * Fast-loading PHP 8.2+ application with MVC architecture
 */

// Define base path
define('BASE_PATH', dirname(__DIR__));
define('PUBLIC_PATH', __DIR__);

// Autoloader (Simple PSR-4 style)
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = BASE_PATH . '/app/';
    
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    
    if (file_exists($file)) {
        require $file;
    }
});

// Load configuration
require_once BASE_PATH . '/app/Config/config.php';
require_once BASE_PATH . '/app/Core/Database.php';
require_once BASE_PATH . '/app/Core/Router.php';
require_once BASE_PATH . '/app/Core/Auth.php';

// Start session with secure settings
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);
ini_set('session.use_strict_mode', 1);
session_start();

// Initialize Router
$router = new App\Core\Router();

// Define Routes
require BASE_PATH . '/routes/web.php';
require BASE_PATH . '/routes/api.php';

// Dispatch request
$router->dispatch($_SERVER['REQUEST_URI'], $_SERVER['REQUEST_METHOD']);
