<?php
/**
 * Web Routes
 */

use App\Controllers\HomeController;
use App\Controllers\AuthController;
use App\Controllers\OrderController;
use App\Controllers\AdminController;

// Home
$router->get('/', [HomeController::class, 'index']);

// Authentication
$router->get('/login', [AuthController::class, 'showLogin']);
$router->post('/login', [AuthController::class, 'login']);
$router->get('/logout', [AuthController::class, 'logout']);

// Guest PWA - Menu & Ordering
$router->get('/guest/menu', [OrderController::class, 'showMenu']);
$router->get('/guest/cart', [OrderController::class, 'showCart']);
$router->post('/guest/order', [OrderController::class, 'placeOrder']);
$router->get('/guest/orders/{id}', [OrderController::class, 'viewOrder']);

// Staff Dashboard
$router->get('/staff/dashboard', [AdminController::class, 'staffDashboard']);
$router->get('/staff/orders', [OrderController::class, 'staffOrders']);

// Kitchen Display System
$router->get('/kitchen/display', [OrderController::class, 'kitchenDisplay']);
$router->put('/kitchen/order/{id}/status', [OrderController::class, 'updateOrderStatus']);

// Admin Panel
$router->get('/admin/dashboard', [AdminController::class, 'dashboard']);
$router->get('/admin/orders', [AdminController::class, 'orders']);
$router->get('/admin/menu', [AdminController::class, 'menuManagement']);
$router->get('/admin/staff', [AdminController::class, 'staffManagement']);

// Super Admin
$router->get('/super-admin/dashboard', [AdminController::class, 'superAdminDashboard']);
$router->get('/super-admin/properties', [AdminController::class, 'properties']);

// Notifications Stream (SSE)
$router->get('/notifications/stream', [OrderController::class, 'notificationStream']);
