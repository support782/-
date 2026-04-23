<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use PDO;

/**
 * Admin Controller - Handles Admin, Super Admin, Staff, and Kitchen Dashboards
 */
class AdminController
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Middleware to check authentication and role access
     */
    private function checkRole(array $allowedRoles): bool
    {
        if (!Auth::check()) {
            header('Location: /login');
            exit;
        }
        
        $user = Auth::user();
        if (!in_array($user['role'], $allowedRoles)) {
            http_response_code(403);
            die('Access Denied: You do not have permission to access this page.');
        }
        
        return true;
    }
    
    /**
     * Super Admin Dashboard - Multi-property management
     */
    public function superAdminDashboard(): void
    {
        $this->checkRole(['super_admin']);
        
        $user = Auth::user();
        $pageTitle = 'Super Admin Dashboard';
        
        // Get statistics
        $stats = $this->getSuperAdminStats();
        
        // Get all properties
        $stmt = $this->db->query("SELECT * FROM properties ORDER BY created_at DESC");
        $properties = $stmt->fetchAll();
        
        ob_start();
        include BASE_PATH . '/app/Views/super-admin/dashboard.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Property Management for Super Admin
     */
    public function properties(): void
    {
        $this->checkRole(['super_admin']);
        
        $user = Auth::user();
        $pageTitle = 'Property Management';
        
        $stmt = $this->db->query("SELECT * FROM properties ORDER BY created_at DESC");
        $properties = $stmt->fetchAll();
        
        ob_start();
        include BASE_PATH . '/app/Views/super-admin/properties.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Admin Dashboard - Single property management
     */
    public function dashboard(): void
    {
        $this->checkRole(['admin', 'super_admin']);
        
        $user = Auth::user();
        $pageTitle = 'Admin Dashboard';
        
        // Get property stats
        $propertyId = $user['property_id'];
        $stats = $this->getPropertyStats($propertyId);
        
        // Recent orders
        $stmt = $this->db->prepare(
            "SELECT o.*, u.name as customer_name 
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id 
             WHERE o.property_id = ? 
             ORDER BY o.created_at DESC LIMIT 10"
        );
        $stmt->execute([$propertyId]);
        $recentOrders = $stmt->fetchAll();
        
        ob_start();
        include BASE_PATH . '/app/Views/admin/dashboard.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Orders Management
     */
    public function orders(): void
    {
        $this->checkRole(['admin', 'super_admin']);
        
        $user = Auth::user();
        $pageTitle = 'Order Management';
        $propertyId = $user['property_id'];
        
        $status = $_GET['status'] ?? 'all';
        
        $sql = "SELECT o.*, u.name as customer_name, u.room_number 
                FROM orders o 
                LEFT JOIN users u ON o.user_id = u.id 
                WHERE o.property_id = ?";
        
        if ($status !== 'all') {
            $sql .= " AND o.status = ?";
        }
        
        $sql .= " ORDER BY o.created_at DESC";
        
        $stmt = $this->db->prepare($sql);
        if ($status !== 'all') {
            $stmt->execute([$propertyId, $status]);
        } else {
            $stmt->execute([$propertyId]);
        }
        
        $orders = $stmt->fetchAll();
        
        ob_start();
        include BASE_PATH . '/app/Views/admin/orders.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Menu Management
     */
    public function menuManagement(): void
    {
        $this->checkRole(['admin', 'super_admin']);
        
        $user = Auth::user();
        $pageTitle = 'Menu Management';
        $propertyId = $user['property_id'];
        
        $stmt = $this->db->prepare(
            "SELECT * FROM menu_items WHERE property_id = ? ORDER BY category, name"
        );
        $stmt->execute([$propertyId]);
        $menuItems = $stmt->fetchAll();
        
        // Get categories
        $categories = array_unique(array_column($menuItems, 'category'));
        
        ob_start();
        include BASE_PATH . '/app/Views/admin/menu.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Staff Management
     */
    public function staffManagement(): void
    {
        $this->checkRole(['admin', 'super_admin']);
        
        $user = Auth::user();
        $pageTitle = 'Staff Management';
        $propertyId = $user['property_id'];
        
        $stmt = $this->db->prepare(
            "SELECT * FROM users WHERE property_id = ? AND role IN ('staff', 'kitchen') ORDER BY created_at DESC"
        );
        $stmt->execute([$propertyId]);
        $staff = $stmt->fetchAll();
        
        ob_start();
        include BASE_PATH . '/app/Views/admin/staff.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Staff Dashboard
     */
    public function staffDashboard(): void
    {
        $this->checkRole(['staff', 'admin', 'super_admin']);
        
        $user = Auth::user();
        $pageTitle = 'Staff Dashboard';
        $propertyId = $user['property_id'];
        
        // Get active orders for staff
        $stmt = $this->db->prepare(
            "SELECT o.*, u.name as customer_name, u.room_number 
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id 
             WHERE o.property_id = ? AND o.status IN ('pending', 'preparing', 'ready')
             ORDER BY o.created_at ASC"
        );
        $stmt->execute([$propertyId]);
        $activeOrders = $stmt->fetchAll();
        
        ob_start();
        include BASE_PATH . '/app/Views/staff/dashboard.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Get Super Admin Statistics
     */
    private function getSuperAdminStats(): array
    {
        $stats = [];
        
        // Total properties
        $stmt = $this->db->query("SELECT COUNT(*) as count FROM properties");
        $stats['total_properties'] = $stmt->fetch()['count'];
        
        // Total users
        $stmt = $this->db->query("SELECT COUNT(*) as count FROM users");
        $stats['total_users'] = $stmt->fetch()['count'];
        
        // Total orders today
        $stmt = $this->db->query("SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()");
        $stats['today_orders'] = $stmt->fetch()['count'];
        
        // Revenue today
        $stmt = $this->db->query("SELECT SUM(total_amount) as revenue FROM orders WHERE DATE(created_at) = CURDATE() AND status = 'completed'");
        $result = $stmt->fetch();
        $stats['today_revenue'] = $result['revenue'] ?? 0;
        
        return $stats;
    }
    
    /**
     * Get Property Statistics
     */
    private function getPropertyStats(int $propertyId): array
    {
        $stats = [];
        
        // Total orders today
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM orders WHERE property_id = ? AND DATE(created_at) = CURDATE()");
        $stmt->execute([$propertyId]);
        $stats['today_orders'] = $stmt->fetch()['count'];
        
        // Pending orders
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM orders WHERE property_id = ? AND status = 'pending'");
        $stmt->execute([$propertyId]);
        $stats['pending_orders'] = $stmt->fetch()['count'];
        
        // Revenue today
        $stmt = $this->db->prepare("SELECT SUM(total_amount) as revenue FROM orders WHERE property_id = ? AND DATE(created_at) = CURDATE() AND status = 'completed'");
        $stmt->execute([$propertyId]);
        $result = $stmt->fetch();
        $stats['today_revenue'] = $result['revenue'] ?? 0;
        
        // Total menu items
        $stmt = $this->db->prepare("SELECT COUNT(*) as count FROM menu_items WHERE property_id = ?");
        $stmt->execute([$propertyId]);
        $stats['menu_items'] = $stmt->fetch()['count'];
        
        return $stats;
    }
}
