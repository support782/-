<?php
/**
 * Application Configuration
 */

return [
    'app' => [
        'name' => 'Smart Hotel System',
        'url' => 'https://your-hotel.com',
        'debug' => false,
        'timezone' => 'UTC'
    ],
    
    'database' => [
        'driver' => 'mysql',
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'hotel_db',
        'username' => 'hotel_user',
        'password' => 'secure_password_here',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci'
    ],
    
    'redis' => [
        'host' => '127.0.0.1',
        'port' => 6379,
        'password' => null,
        'database' => 0
    ],
    
    'session' => [
        'lifetime' => 7200,
        'store' => 'redis' // or 'database'
    ],
    
    'cache' => [
        'driver' => 'redis',
        'prefix' => 'hotel_cache_'
    ],
    
    'security' => [
        'csrf_token_name' => '_csrf_token',
        'password_algorithm' => PASSWORD_ARGON2ID
    ]
];
