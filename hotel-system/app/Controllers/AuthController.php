<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use PDO;

/**
 * Authentication Controller
 */
class AuthController
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }
    
    public function showLogin(): void
    {
        if (Auth::check()) {
            header('Location: /');
            exit;
        }
        
        $pageTitle = 'Login - Smart Hotel System';
        $csrfToken = Auth::generateCsrfToken();
        
        ob_start();
        include BASE_PATH . '/app/Views/auth/login.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    public function login(): void
    {
        // Verify CSRF token
        if (!Auth::validateCsrfToken($_POST['_csrf_token'] ?? '')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Invalid security token']);
            return;
        }
        
        $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
        $password = $_POST['password'] ?? '';
        
        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email and password required']);
            return;
        }
        
        // Find user
        $stmt = $this->db->prepare(
            "SELECT u.*, p.id as property_id 
             FROM users u 
             LEFT JOIN properties p ON u.property_id = p.id 
             WHERE u.email = ? AND u.is_active = 1"
        );
        
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
            return;
        }
        
        // Login successful
        Auth::login($user);
        
        echo json_encode([
            'success' => true,
            'redirect' => '/'
        ]);
    }
    
    public function logout(): void
    {
        Auth::logout();
        header('Location: /login');
        exit;
    }
}
