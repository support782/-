<?php
/**
 * API Routes
 */

use App\Controllers\Api\AuthApiController;
use App\Controllers\Api\OrderApiController;
use App\Controllers\Api\MenuApiController;

// Authentication API
$router->post('/api/auth/login', [AuthApiController::class, 'login']);
$router->post('/api/auth/register', [AuthApiController::class, 'register']);

// Menu API
$router->get('/api/menu', [MenuApiController::class, 'index']);
$router->get('/api/menu/{id}', [MenuApiController::class, 'show']);

// Orders API
$router->get('/api/orders', [OrderApiController::class, 'index']);
$router->post('/api/orders', [OrderApiController::class, 'store']);
$router->get('/api/orders/{id}', [OrderApiController::class, 'show']);
$router->put('/api/orders/{id}/status', [OrderApiController::class, 'updateStatus']);

// Notifications Stream (SSE)
$router->get('/api/notifications/stream', [OrderApiController::class, 'stream']);

// Admin Stats API
$router->get('/api/admin/stats', [OrderApiController::class, 'stats']);
