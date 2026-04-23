# Complete Hotel Management & Smart Order System Plan
## PHP + CSS4 + HTML5 + Fast Loading Architecture

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

### Core Modules:
1. **Super Admin Panel** - Multi-property management
2. **Admin Panel** - Single property management
3. **Staff Dashboard** - Role-based operations
4. **Customer PWA** - Order placement & tracking
5. **Kitchen Display System (KDS)** - Real-time order management
6. **Notification Hub** - Multi-channel alerts
7. **Smart Hotel Integration** - IoT device control

---

## 🚀 PERFORMANCE OPTIMIZATION STRATEGY

### Fast Loading Techniques:
- **PHP 8.2+** with OPcache enabled
- **CSS4 Features**: Container queries, :has(), color-mix(), subgrid
- **HTML5 Semantic Structure** with lazy loading
- **Critical CSS Inlining** for above-fold content
- **Async/Defer JavaScript** loading
- **Image Optimization**: WebP/AVIF formats with srcset
- **Database Query Caching** with Redis/Memcached
- **Gzip/Brotli Compression**
- **CDN Integration** for static assets
- **HTTP/2 Push** for critical resources

---

## 📁 PROJECT STRUCTURE

```
hotel-management-system/
├── public/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── critical.css (inlined)
│   │   │   ├── main.css (CSS4 features)
│   │   │   ├── components.css
│   │   │   ├── utilities.css
│   │   │   └── themes/
│   │   ├── js/
│   │   │   ├── app.js (modular)
│   │   │   ├── pwa.js
│   │   │   ├── notifications.js
│   │   │   └── modules/
│   │   ├── images/
│   │   │   ├── optimized/
│   │   │   └── icons/
│   │   └── fonts/
│   ├── manifest.json
│   ├── sw.js (Service Worker)
│   └── .htaccess
├── src/
│   ├── config/
│   │   ├── database.php
│   │   ├── cache.php
│   │   ├── notifications.php
│   │   └── constants.php
│   ├── core/
│   │   ├── Database.php
│   │   ├── Cache.php
│   │   ├── Session.php
│   │   ├── Auth.php
│   │   ├── Validator.php
│   │   └── Router.php
│   ├── models/
│   │   ├── User.php
│   │   ├── Hotel.php
│   │   ├── Room.php
│   │   ├── Order.php
│   │   ├── MenuItem.php
│   │   ├── Notification.php
│   │   └── Device.php
│   ├── controllers/
│   │   ├── SuperAdminController.php
│   │   ├── AdminController.php
│   │   ├── StaffController.php
│   │   ├── OrderController.php
│   │   ├── KitchenController.php
│   │   ├── NotificationController.php
│   │   └── PWAController.php
│   ├── services/
│   │   ├── NotificationService.php
│   │   ├── OrderService.php
│   │   ├── InventoryService.php
│   │   ├── ReportingService.php
│   │   └── SmartDeviceService.php
│   ├── middleware/
│   │   ├── AuthMiddleware.php
│   │   ├── RoleMiddleware.php
│   │   ├── RateLimitMiddleware.php
│   │   └── CSRFMiddleware.php
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.php
│   │   │   ├── orders.php
│   │   │   ├── notifications.php
│   │   │   └── hotels.php
│   └── views/
│       ├── layouts/
│       │   ├── super-admin.php
│       │   ├── admin.php
│       │   ├── staff.php
│       │   └── customer.php
│       ├── partials/
│       │   ├── header.php
│       │   ├── sidebar.php
│       │   ├── footer.php
│       │   └── notifications.php
│       ├── super-admin/
│       ├── admin/
│       ├── staff/
│       ├── kitchen/
│       └── customer/
├── workers/
│   ├── notification-worker.php
│   ├── order-processor.php
│   └── cleanup-jobs.php
├── logs/
├── cache/
├── uploads/
└── tests/
```

---

## 💾 DATABASE SCHEMA (MySQL/MariaDB)

### Users & Authentication
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'manager', 'chef', 'waiter', 'customer') NOT NULL,
    hotel_id INT NULL,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_hotel (hotel_id)
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;
```

### Hotels & Properties
```sql
CREATE TABLE hotels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    currency VARCHAR(3) DEFAULT 'USD',
    settings JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    type ENUM('single', 'double', 'suite', 'deluxe') NOT NULL,
    floor INT,
    capacity INT DEFAULT 2,
    price DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'occupied', 'maintenance', 'reserved') DEFAULT 'available',
    smart_device_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_room (hotel_id, room_number),
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_status (status)
) ENGINE=InnoDB;
```

### Menu & Orders
```sql
CREATE TABLE menu_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hotel (hotel_id)
) ENGINE=InnoDB;

CREATE TABLE menu_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    preparation_time INT DEFAULT 15,
    is_available BOOLEAN DEFAULT TRUE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    allergens JSON,
    nutritional_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE,
    INDEX idx_category (category_id),
    INDEX idx_available (is_available)
) ENGINE=InnoDB;

CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    hotel_id INT NOT NULL,
    room_id INT NULL,
    user_id INT NULL,
    order_type ENUM('room_service', 'restaurant', 'takeaway', 'delivery') NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
    priority ENUM('normal', 'urgent', 'vip') DEFAULT 'normal',
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method ENUM('cash', 'card', 'digital_wallet', 'room_charge') NULL,
    special_instructions TEXT,
    qr_code VARCHAR(255),
    estimated_time INT,
    completed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_hotel (hotel_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    customizations JSON,
    special_notes TEXT,
    status ENUM('pending', 'preparing', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE RESTRICT,
    INDEX idx_order (order_id)
) ENGINE=InnoDB;
```

### Notifications System
```sql
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid CHAR(36) UNIQUE NOT NULL,
    user_id INT NULL,
    hotel_id INT NULL,
    type ENUM('order', 'payment', 'system', 'alert', 'reminder') NOT NULL,
    channel ENUM('web', 'push', 'email', 'sms', 'all') DEFAULT 'web',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    action_url VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME NULL,
    sent_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_unread (is_read),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE push_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    browser_info VARCHAR(255),
    expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_endpoint (endpoint),
    INDEX idx_user (user_id)
) ENGINE=InnoDB;
```

### Smart Devices & IoT
```sql
CREATE TABLE smart_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hotel_id INT NOT NULL,
    room_id INT NULL,
    device_type ENUM('thermostat', 'lighting', 'lock', 'tv', 'minibar', 'sensor') NOT NULL,
    device_name VARCHAR(100),
    device_id VARCHAR(100) UNIQUE NOT NULL,
    status ENUM('online', 'offline', 'maintenance') DEFAULT 'offline',
    last_seen DATETIME NULL,
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    INDEX idx_device (device_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;
```

---

## 🎨 CSS4 FEATURES IMPLEMENTATION

### Main Stylesheet (main.css)
```css
/* CSS4 Features */
:root {
    --primary-color: #2563eb;
    --secondary-color: #7c3aed;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --danger-color: #ef4444;
    
    /* Color Mix Function */
    --primary-light: color-mix(in srgb, var(--primary-color), white 30%);
    --primary-dark: color-mix(in srgb, var(--primary-color), black 20%);
    
    /* Spacing Scale */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-4: 1rem;
    --space-8: 2rem;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
    --shadow-md: 0 4px 6px oklch(0% 0 0 / 0.1);
    --shadow-lg: 0 10px 15px oklch(0% 0 0 / 0.1);
}

/* Container Queries */
@container card-container (min-width: 400px) {
    .order-card {
        grid-template-columns: 1fr 2fr;
    }
}

.order-card {
    container-type: inline-size;
    container-name: card-container;
}

/* :has() Selector */
.form-group:has(input:focus) {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px var(--primary-light);
}

.menu-item:has(.badge-urgent) {
    border-left: 4px solid var(--danger-color);
}

/* Subgrid for Layouts */
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-4);
}

.stat-card {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 3;
}

/* Layer Syntax */
@layer base, components, utilities, theme;

@layer base {
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }
    
    html {
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.5;
    }
}

@layer components {
    .btn {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-4);
        border-radius: 0.5rem;
        font-weight: 600;
        transition: all 0.2s ease;
    }
    
    .btn-primary {
        background: var(--primary-color);
        color: white;
    }
    
    .btn-primary:hover {
        background: var(--primary-dark);
        transform: translateY(-1px);
    }
}

/* Scroll-driven Animations */
@keyframes progress {
    from { width: 0% }
    to { width: 100% }
}

.loading-bar {
    animation: progress linear;
    animation-timeline: scroll();
}

/* Nesting */
.notification-panel {
    background: white;
    border-radius: 1rem;
    box-shadow: var(--shadow-lg);
    
    & header {
        padding: var(--space-4);
        border-bottom: 1px solid #e5e7eb;
    }
    
    & .notification-list {
        max-height: 400px;
        overflow-y: auto;
        
        & .notification-item {
            padding: var(--space-4);
            border-bottom: 1px solid #f3f4f6;
            
            &:hover {
                background: #f9fafb;
            }
            
            &.unread {
                background: oklch(98% 0.01 250);
            }
        }
    }
}

/* Media Queries Range Syntax */
@media (width >= 768px) and (width < 1024px) {
    .dashboard {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (width >= 1024px) {
    .dashboard {
        grid-template-columns: repeat(4, 1fr);
    }
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-primary: #1f2937;
        --text-primary: #f9fafb;
    }
}
```

---

## ⚡ FAST LOADING OPTIMIZATIONS

### Critical CSS Inlining Strategy
```php
// src/views/layouts/partials/header.php
<?php
$criticalCss = file_get_contents(__DIR__ . '/../../../public/assets/css/critical.css');
echo "<style>{$criticalCss}</style>";
?>
<link rel="preload" href="/assets/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/css/main.css"></noscript>
```

### Image Optimization Helper
```php
// src/core/ImageOptimizer.php
class ImageOptimizer {
    public static function generateSrcset($imagePath, $sizes = [400, 800, 1200, 1600]) {
        $srcset = [];
        foreach ($sizes as $size) {
            $optimized = self::resize($imagePath, $size);
            $srcset[] = "{$optimized} {$size}w";
        }
        return implode(', ', $srcset);
    }
    
    public static function responsiveImage($imagePath, $alt, $class = '') {
        $webp = self::convertToWebP($imagePath);
        $avif = self::convertToAVIF($imagePath);
        $srcset = self::generateSrcset($imagePath);
        
        return "
            <picture>
                <source srcset='{$avif}' type='image/avif'>
                <source srcset='{$webp}' type='image/webp'>
                <img src='{$imagePath}' alt='{$alt}' class='{$class}' 
                     srcset='{$srcset}' sizes='(max-width: 768px) 100vw, 50vw'
                     loading='lazy' decoding='async'>
            </picture>
        ";
    }
}
```

### Database Query Caching
```php
// src/core/Cache.php
class Cache {
    private static $instance;
    private $redis;
    private $ttl = 300; // 5 minutes
    
    private function __construct() {
        $this->redis = new Redis();
        $this->redis->connect('127.0.0.1', 6379);
    }
    
    public static function getInstance() {
        if (!self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function get($key) {
        $data = $this->redis->get($key);
        return $data ? json_decode($data, true) : false;
    }
    
    public function set($key, $value, $ttl = null) {
        return $this->redis->setex($key, $ttl ?? $this->ttl, json_encode($value));
    }
    
    public function remember($key, $callback, $ttl = null) {
        if ($data = $this->get($key)) {
            return $data;
        }
        
        $data = $callback();
        $this->set($key, $data, $ttl);
        return $data;
    }
    
    public function invalidate($pattern) {
        $keys = $this->redis->keys($pattern);
        if ($keys) {
            $this->redis->del($keys);
        }
    }
}

// Usage in models
$menuItems = Cache::getInstance()->remember('menu_items_' . $hotelId, function() use ($hotelId) {
    return $this->db->query("SELECT * FROM menu_items WHERE hotel_id = ? AND is_available = 1", [$hotelId]);
});
```

### OPcache Configuration
```ini
; php.ini optimization
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=60
opcache.fast_shutdown=1
opcache.enable_cli=1
opcache.save_comments=1
```

---

## 🔔 NOTIFICATION SYSTEM

### Real-time Notification Service
```php
// src/services/NotificationService.php
class NotificationService {
    private $db;
    private $pushManager;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->pushManager = new PushNotificationManager();
    }
    
    public function send($userId, $type, $title, $message, $data = [], $channels = ['web']) {
        // Save to database
        $notificationId = $this->db->insert('notifications', [
            'user_id' => $userId,
            'type' => $type,
            'channel' => implode(',', $channels),
            'title' => $title,
            'message' => $message,
            'data' => json_encode($data),
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        // Send via selected channels
        if (in_array('push', $channels)) {
            $this->sendPushNotification($userId, $title, $message, $data);
        }
        
        if (in_array('email', $channels)) {
            $this->sendEmail($userId, $title, $message, $data);
        }
        
        // Broadcast via WebSocket for real-time updates
        $this->broadcastToUser($userId, [
            'id' => $notificationId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        return $notificationId;
    }
    
    public function sendOrderUpdate($orderId, $newStatus, $userId) {
        $order = $this->db->query("SELECT * FROM orders WHERE id = ?", [$orderId])->fetch();
        
        $statusMessages = [
            'confirmed' => 'Your order has been confirmed!',
            'preparing' => 'Kitchen is preparing your order',
            'ready' => 'Your order is ready for delivery',
            'delivered' => 'Order delivered successfully!'
        ];
        
        $this->send($userId, 'order', 'Order Update', $statusMessages[$newStatus], [
            'order_id' => $orderId,
            'status' => $newStatus,
            'order_details' => $order
        ], ['web', 'push']);
    }
    
    private function broadcastToUser($userId, $notification) {
        // Use Server-Sent Events or WebSocket
        echo "data: " . json_encode($notification) . "\n\n";
        flush();
    }
}
```

### Server-Sent Events Endpoint
```php
// api/v1/notifications/stream.php
<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no');

session_start();
$userId = $_SESSION['user_id'] ?? null;

if (!$userId) {
    http_response_code(401);
    exit;
}

$db = Database::getInstance();

// Send initial connection confirmation
echo "data: " . json_encode(['type' => 'connected', 'timestamp' => time()]) . "\n\n";
flush();

while (true) {
    // Check for new notifications
    $notifications = $db->query(
        "SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 10",
        [$userId]
    );
    
    foreach ($notifications as $notif) {
        echo "data: " . json_encode([
            'type' => 'notification',
            'payload' => $notif
        ]) . "\n\n";
        flush();
    }
    
    // Check order status updates
    $orders = $db->query(
        "SELECT o.*, u.name as user_name FROM orders o
         LEFT JOIN users u ON o.user_id = u.id
         WHERE o.user_id = ? AND o.updated_at > DATE_SUB(NOW(), INTERVAL 5 SECOND)",
        [$userId]
    );
    
    foreach ($orders as $order) {
        echo "data: " . json_encode([
            'type' => 'order_update',
            'payload' => $order
        ]) . "\n\n";
        flush();
    }
    
    sleep(2);
    
    // Check if client is still connected
    if (connection_aborted()) {
        break;
    }
}
```

---

## 📱 PWA IMPLEMENTATION

### Manifest File (manifest.json)
```json
{
  "name": "Hotel Management System",
  "short_name": "HotelMS",
  "description": "Complete hotel management and order system",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/assets/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "productivity"],
  "shortcuts": [
    {
      "name": "New Order",
      "short_name": "Order",
      "description": "Create a new order",
      "url": "/orders/new",
      "icons": [{"src": "/assets/icons/order-icon.png", "sizes": "96x96"}]
    },
    {
      "name": "Notifications",
      "short_name": "Alerts",
      "description": "View notifications",
      "url": "/notifications",
      "icons": [{"src": "/assets/icons/notification-icon.png", "sizes": "96x96"}]
    }
  ]
}
```

### Service Worker (sw.js)
```javascript
const CACHE_NAME = 'hotel-ms-v1';
const STATIC_ASSETS = [
    '/',
    '/dashboard',
    '/assets/css/critical.css',
    '/assets/css/main.css',
    '/assets/js/app.js',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request).then((cachedResponse) => {
                    return cachedResponse || caches.match('/offline.html');
                });
            })
    );
});

// Push Notification Handler
self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    const options = {
        body: data.message,
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.action_url || '/notifications'
        },
        actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Background Sync for Offline Orders
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    const pendingOrders = await getPendingOrdersFromIndexedDB();
    for (const order of pendingOrders) {
        try {
            await fetch('/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
            await removeOrderFromIndexedDB(order.id);
        } catch (error) {
            console.error('Sync failed:', error);
        }
    }
}
```

### PWA Registration Script
```javascript
// public/assets/js/pwa.js
class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.init();
    }
    
    async init() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                console.log('SW registered:', registration.scope);
                
                this.setupPushNotifications();
                this.setupOfflineSupport();
            } catch (error) {
                console.error('SW registration failed:', error);
            }
        }
        
        this.listenForInstallPrompt();
    }
    
    listenForInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallButton();
            this.deferredPrompt = null;
        });
    }
    
    async showInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.style.display = 'block';
            installBtn.addEventListener('click', async () => {
                await this.install();
            });
        }
    }
    
    async install() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        this.deferredPrompt = null;
    }
    
    async setupPushNotifications() {
        if ('Notification' in window && 'PushManager' in window) {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });
                
                await this.saveSubscription(subscription);
            }
        }
    }
    
    async saveSubscription(subscription) {
        await fetch('/api/v1/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
    }
    
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
    }
}

// Initialize PWA
document.addEventListener('DOMContentLoaded', () => {
    new PWAInstaller();
});
```

---

## 👥 ROLE-BASED ACCESS CONTROL MATRIX

| Feature | Super Admin | Admin | Manager | Chef | Waiter | Customer |
|---------|------------|-------|---------|------|--------|----------|
| Multi-property Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Property Settings | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| User Management | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Menu Management | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| Order Management | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Kitchen Display | ❌ | ⚠️ | ✅ | ✅ | ⚠️ | ❌ |
| Reports & Analytics | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Smart Device Control | ✅ | ✅ | ✅ | ❌ | ❌ | ⚠️ |
| Notifications (All) | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Billing & Payments | ✅ | ✅ | ✅ | ❌ | ⚠️ | ✅ |

✅ = Full Access | ⚠️ = Limited Access | ❌ = No Access

---

## 📊 DASHBOARD FEATURES

### Super Admin Dashboard
- Multi-property overview
- Revenue analytics across all hotels
- User management system-wide
- System health monitoring
- Global settings configuration
- Audit logs

### Admin Dashboard
- Single property management
- Room occupancy rates
- Order statistics
- Staff performance metrics
- Inventory levels
- Financial reports

### Kitchen Display System
- Real-time order queue
- Order prioritization (VIP, Urgent)
- Preparation time tracking
- Item customization display
- Status updates (one-click)
- Historical data

### Staff Mobile View
- Order notifications
- Task assignments
- Quick status updates
- Customer requests
- Shift schedules

---

## 🔐 SECURITY IMPLEMENTATION

### Authentication System
```php
// src/core/Auth.php
class Auth {
    public static function login($email, $password) {
        $db = Database::getInstance();
        $user = $db->query("SELECT * FROM users WHERE email = ? AND status = 'active'", [$email])->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            throw new Exception('Invalid credentials');
        }
        
        // Generate secure session token
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        $db->insert('user_sessions', [
            'user_id' => $user['id'],
            'token' => hash('sha256', $token),
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'device_info' => $_SERVER['HTTP_USER_AGENT'],
            'expires_at' => $expiresAt
        ]);
        
        // Set secure cookie
        setcookie('session_token', $token, [
            'expires' => strtotime('+24 hours'),
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
        
        // Update last login
        $db->update('users', ['last_login' => date('Y-m-d H:i:s')], ['id' => $user['id']]);
        
        return $user;
    }
    
    public static function check() {
        $token = $_COOKIE['session_token'] ?? null;
        if (!$token) return false;
        
        $hashedToken = hash('sha256', $token);
        $db = Database::getInstance();
        
        $session = $db->query(
            "SELECT s.*, u.* FROM user_sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.token = ? AND s.expires_at > NOW()",
            [$hashedToken]
        )->fetch();
        
        if (!$session) {
            self::logout();
            return false;
        }
        
        return $session;
    }
    
    public static function logout() {
        $token = $_COOKIE['session_token'] ?? null;
        if ($token) {
            $db = Database::getInstance();
            $db->delete('user_sessions', ['token' => hash('sha256', $token)]);
        }
        setcookie('session_token', '', ['expires' => time() - 3600, 'path' => '/']);
    }
}
```

### CSRF Protection
```php
// src/middleware/CSRFMiddleware.php
class CSRFMiddleware {
    public static function generateToken() {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    public static function validate($token) {
        if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
            http_response_code(403);
            die('Invalid CSRF token');
        }
    }
    
    public static function field() {
        $token = self::generateToken();
        return "<input type='hidden' name='csrf_token' value='{$token}'>";
    }
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Server Requirements
- PHP 8.2+ with extensions: PDO, MySQLi, OpenSSL, MBString, Redis
- MySQL 8.0+ or MariaDB 10.6+
- Nginx/Apache with HTTP/2
- SSL Certificate (Let's Encrypt)
- Redis for caching
- Node.js (optional, for build tools)

### Performance Configuration
```nginx
# Nginx Configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    root /var/www/hotel-ms/public;
    index index.php;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # Browser Caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # PHP Processing
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_index index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_buffer_size 128k;
        fastcgi_buffers 4 256k;
        fastcgi_busy_buffers_size 256k;
    }
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000";
}
```

---

## 📈 DEVELOPMENT ROADMAP

### Phase 1: Foundation (Weeks 1-2)
- [ ] Project setup and structure
- [ ] Database schema implementation
- [ ] Core classes (Database, Cache, Auth, Session)
- [ ] Basic authentication system
- [ ] Role-based access control

### Phase 2: Core Features (Weeks 3-5)
- [ ] Super Admin panel
- [ ] Admin dashboard
- [ ] Hotel and room management
- [ ] Menu management system
- [ ] Order creation and management

### Phase 3: Advanced Features (Weeks 6-8)
- [ ] Kitchen Display System
- [ ] Real-time notification system
- [ ] PWA implementation
- [ ] Service Worker and offline support
- [ ] Push notifications

### Phase 4: Smart Integration (Weeks 9-10)
- [ ] IoT device integration
- [ ] QR code generation for ordering
- [ ] Smart room controls
- [ ] Automated notifications

### Phase 5: Optimization & Testing (Weeks 11-12)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Cross-browser testing
- [ ] Mobile responsiveness
- [ ] Load testing
- [ ] Documentation

---

## 📝 API ENDPOINTS

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/me` - Get current user

### Orders
- `GET /api/v1/orders` - List orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders/{id}` - Get order details
- `PUT /api/v1/orders/{id}` - Update order
- `DELETE /api/v1/orders/{id}` - Cancel order
- `POST /api/v1/orders/{id}/status` - Update status

### Notifications
- `GET /api/v1/notifications` - List notifications
- `PUT /api/v1/notifications/{id}/read` - Mark as read
- `GET /api/v1/notifications/stream` - SSE stream
- `POST /api/v1/push/subscribe` - Subscribe to push

### Hotels
- `GET /api/v1/hotels` - List hotels
- `POST /api/v1/hotels` - Create hotel
- `GET /api/v1/hotels/{id}` - Get hotel details
- `PUT /api/v1/hotels/{id}` - Update hotel
- `DELETE /api/v1/hotels/{id}` - Delete hotel

### Menu
- `GET /api/v1/menu` - Get menu items
- `POST /api/v1/menu` - Create menu item
- `PUT /api/v1/menu/{id}` - Update menu item
- `DELETE /api/v1/menu/{id}` - Delete menu item

---

## 🎯 KEY PERFORMANCE INDICATORS

- **Page Load Time**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **First Contentful Paint**: < 1 second
- **API Response Time**: < 200ms
- **Database Query Time**: < 50ms
- **Cache Hit Ratio**: > 90%
- **Uptime**: 99.9%
- **PWA Install Rate**: > 60%
- **Notification Delivery**: < 1 second

---

This comprehensive plan provides everything needed to build a fast, scalable, and feature-rich hotel management system using PHP, CSS4, and HTML5 with PWA capabilities and real-time notifications.
