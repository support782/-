<?php
namespace App\Core;

/**
 * Authentication Helper Class
 */
class Auth
{
    public static function check(): bool
    {
        return isset($_SESSION['user_id']);
    }
    
    public static function user(): ?array
    {
        if (!self::check()) {
            return null;
        }
        
        return $_SESSION['user'] ?? null;
    }
    
    public static function id(): ?int
    {
        return $_SESSION['user_id'] ?? null;
    }
    
    public static function role(): ?string
    {
        return $_SESSION['user_role'] ?? null;
    }
    
    public static function login(array $user): void
    {
        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user'] = $user;
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['property_id'] = $user['property_id'] ?? null;
    }
    
    public static function logout(): void
    {
        $_SESSION = [];
        
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }
        
        session_destroy();
    }
    
    public static function requireRole(string ...$roles): void
    {
        if (!self::check()) {
            header('Location: /login');
            exit;
        }
        
        if (!in_array(self::role(), $roles)) {
            http_response_code(403);
            die('Unauthorized access');
        }
    }
    
    public static function generateCsrfToken(): string
    {
        if (empty($_SESSION['_csrf_token'])) {
            $_SESSION['_csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['_csrf_token'];
    }
    
    public static function validateCsrfToken(?string $token): bool
    {
        return isset($_SESSION['_csrf_token']) && hash_equals($_SESSION['_csrf_token'], $token ?? '');
    }
}
