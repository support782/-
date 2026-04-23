<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Database;
use PDO;

/**
 * Order Controller - Handles Guest Ordering, Staff Orders, and Kitchen Display
 */
class OrderController
{
    private $db;
    
    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }
    
    /**
     * Show Menu for Guests (PWA)
     */
    public function showMenu(): void
    {
        $propertyId = $_GET['property'] ?? 1; // Default to first property
        
        $stmt = $this->db->prepare(
            "SELECT * FROM menu_items WHERE property_id = ? AND is_available = 1 ORDER BY category, name"
        );
        $stmt->execute([$propertyId]);
        $menuItems = $stmt->fetchAll();
        
        // Group by category
        $categories = [];
        foreach ($menuItems as $item) {
            $categories[$item['category']][] = $item;
        }
        
        $pageTitle = 'Order Online';
        $isGuest = true;
        
        ob_start();
        include BASE_PATH . '/app/Views/guest/menu.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Show Cart for Guests
     */
    public function showCart(): void
    {
        $pageTitle = 'Your Cart';
        $isGuest = true;
        
        ob_start();
        include BASE_PATH . '/app/Views/guest/cart.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Place Order (Guest or Authenticated)
     */
    public function placeOrder(): void
    {
        // Verify CSRF token
        if (!Auth::validateCsrfToken($_POST['_csrf_token'] ?? '')) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Invalid security token']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        
        $items = $data['items'] ?? [];
        $customerName = $data['customer_name'] ?? 'Guest';
        $roomNumber = $data['room_number'] ?? null;
        $tableNumber = $data['table_number'] ?? null;
        $specialInstructions = $data['special_instructions'] ?? '';
        $propertyId = $data['property_id'] ?? 1;
        
        if (empty($items)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cart is empty']);
            return;
        }
        
        try {
            $this->db->beginTransaction();
            
            // Calculate total
            $totalAmount = 0;
            $orderItems = [];
            
            foreach ($items as $item) {
                $stmt = $this->db->prepare("SELECT price FROM menu_items WHERE id = ?");
                $stmt->execute([$item['id']]);
                $menuItem = $stmt->fetch();
                
                if (!$menuItem) {
                    throw new \Exception("Item not found: " . $item['id']);
                }
                
                $itemTotal = $menuItem['price'] * $item['quantity'];
                $totalAmount += $itemTotal;
                $orderItems[] = $item;
            }
            
            // Get user ID if logged in
            $userId = Auth::check() ? Auth::user()['id'] : null;
            
            // Create order
            $stmt = $this->db->prepare(
                "INSERT INTO orders (user_id, property_id, customer_name, room_number, table_number, 
                 special_instructions, total_amount, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')"
            );
            
            $stmt->execute([
                $userId,
                $propertyId,
                $customerName,
                $roomNumber,
                $tableNumber,
                $specialInstructions,
                $totalAmount
            ]);
            
            $orderId = $this->db->lastInsertId();
            
            // Insert order items
            $stmt = $this->db->prepare(
                "INSERT INTO order_items (order_id, menu_item_id, quantity, price, subtotal) 
                 VALUES (?, ?, ?, ?, ?)"
            );
            
            foreach ($orderItems as $item) {
                $menuStmt = $this->db->prepare("SELECT price FROM menu_items WHERE id = ?");
                $menuStmt->execute([$item['id']]);
                $menuItem = $menuStmt->fetch();
                
                $subtotal = $menuItem['price'] * $item['quantity'];
                $stmt->execute([
                    $orderId,
                    $item['id'],
                    $item['quantity'],
                    $menuItem['price'],
                    $subtotal
                ]);
            }
            
            $this->db->commit();
            
            // Send notification (will be picked up by SSE)
            $this->sendNotification('new_order', [
                'order_id' => $orderId,
                'property_id' => $propertyId,
                'total' => $totalAmount
            ]);
            
            echo json_encode([
                'success' => true,
                'order_id' => $orderId,
                'redirect' => "/guest/orders/{$orderId}"
            ]);
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    
    /**
     * View Order Details
     */
    public function viewOrder(int $orderId): void
    {
        $stmt = $this->db->prepare(
            "SELECT o.*, u.name as customer_name 
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id 
             WHERE o.id = ?"
        );
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        
        if (!$order) {
            http_response_code(404);
            die('Order not found');
        }
        
        // Get order items
        $stmt = $this->db->prepare(
            "SELECT oi.*, mi.name as item_name 
             FROM order_items oi 
             JOIN menu_items mi ON oi.menu_item_id = mi.id 
             WHERE oi.order_id = ?"
        );
        $stmt->execute([$orderId]);
        $items = $stmt->fetchAll();
        
        $pageTitle = "Order #{$orderId}";
        $isGuest = true;
        
        ob_start();
        include BASE_PATH . '/app/Views/guest/order-details.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Staff Orders View
     */
    public function staffOrders(): void
    {
        if (!Auth::check()) {
            header('Location: /login');
            exit;
        }
        
        $user = Auth::user();
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
        
        $pageTitle = 'Staff Orders';
        
        ob_start();
        include BASE_PATH . '/app/Views/staff/orders.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Kitchen Display System
     */
    public function kitchenDisplay(): void
    {
        if (!Auth::check()) {
            header('Location: /login');
            exit;
        }
        
        $user = Auth::user();
        
        if (!in_array($user['role'], ['kitchen', 'admin', 'super_admin'])) {
            http_response_code(403);
            die('Access Denied');
        }
        
        $propertyId = $user['property_id'];
        
        // Get active kitchen orders
        $stmt = $this->db->prepare(
            "SELECT o.*, u.name as customer_name, u.room_number, u.table_number
             FROM orders o 
             LEFT JOIN users u ON o.user_id = u.id 
             WHERE o.property_id = ? AND o.status IN ('pending', 'preparing')
             ORDER BY o.created_at ASC"
        );
        $stmt->execute([$propertyId]);
        $orders = $stmt->fetchAll();
        
        $pageTitle = 'Kitchen Display';
        
        ob_start();
        include BASE_PATH . '/app/Views/kitchen/display.php';
        $content = ob_get_clean();
        
        include BASE_PATH . '/app/Views/layouts/main.php';
    }
    
    /**
     * Update Order Status (Kitchen/Staff)
     */
    public function updateOrderStatus(int $orderId): void
    {
        if (!Auth::check()) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return;
        }
        
        $user = Auth::user();
        
        if (!in_array($user['role'], ['kitchen', 'staff', 'admin', 'super_admin'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Forbidden']);
            return;
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        $newStatus = $data['status'] ?? null;
        
        if (!$newStatus || !in_array($newStatus, ['pending', 'preparing', 'ready', 'completed', 'cancelled'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid status']);
            return;
        }
        
        try {
            $stmt = $this->db->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $stmt->execute([$newStatus, $orderId]);
            
            // Get order details for notification
            $stmt = $this->db->prepare("SELECT property_id, total_amount FROM orders WHERE id = ?");
            $stmt->execute([$orderId]);
            $order = $stmt->fetch();
            
            // Send notification
            $this->sendNotification('order_status_updated', [
                'order_id' => $orderId,
                'status' => $newStatus,
                'property_id' => $order['property_id']
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Order status updated']);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }
    
    /**
     * Server-Sent Events Notification Stream
     */
    public function notificationStream(): void
    {
        if (!Auth::check()) {
            http_response_code(401);
            return;
        }
        
        $user = Auth::user();
        $propertyId = $user['property_id'] ?? null;
        
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no'); // Disable nginx buffering
        
        while (true) {
            // Check for new notifications
            $notifications = $this->getNotifications($propertyId, $user['role']);
            
            if (!empty($notifications)) {
                echo "data: " . json_encode($notifications) . "\n\n";
                ob_flush();
                flush();
            }
            
            // Sleep to prevent high CPU usage
            usleep(2000000); // 2 seconds
            
            // Check if client is still connected
            if (connection_aborted()) {
                break;
            }
        }
    }
    
    /**
     * Get Notifications for User
     */
    private function getNotifications(?int $propertyId, string $role): array
    {
        $notifications = [];
        
        // This would typically query a notifications table
        // For now, we'll use a simple file-based approach or session
        // In production, use Redis pub/sub or database with long polling
        
        return $notifications;
    }
    
    /**
     * Send Notification (Store for SSE)
     */
    private function sendNotification(string $type, array $data): void
    {
        // Store notification in database or Redis
        // This will be picked up by the SSE stream
        
        $notification = [
            'type' => $type,
            'data' => $data,
            'timestamp' => time(),
            'property_id' => $data['property_id'] ?? null
        ];
        
        // Save to database
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO notifications (property_id, type, data, created_at) 
                 VALUES (?, ?, ?, NOW())"
            );
            $stmt->execute([
                $notification['property_id'],
                $type,
                json_encode($data)
            ]);
        } catch (\Exception $e) {
            // Log error but don't fail the operation
            error_log("Failed to save notification: " . $e->getMessage());
        }
    }
}
