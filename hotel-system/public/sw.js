/**
 * Service Worker for Smart Hotel System
 * Handles offline caching, background sync, and push notifications
 */

const CACHE_NAME = 'hotel-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.php',
    '/assets/css/style.css',
    '/assets/js/app.js',
    '/manifest.json',
    '/guest/menu'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // API requests - Network first
    if (request.url.includes('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // Static assets - Cache first
    if (request.url.includes('/assets/')) {
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // HTML pages - Network first with cache fallback
    event.respondWith(networkFirst(request));
});

// Network First Strategy
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        
        // Clone and cache successful responses
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Network failed, try cache
        const cached = await caches.match(request);
        if (cached) {
            return cached;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Cache First Strategy
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        throw error;
    }
}

// Background Sync for Orders
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    const pendingOrders = JSON.parse(localStorage.getItem('pending_orders') || '[]');
    
    if (pendingOrders.length === 0) {
        return;
    }
    
    for (const order of pendingOrders) {
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(order)
            });
            
            if (response.ok) {
                // Remove from pending
                const index = pendingOrders.indexOf(order);
                if (index > -1) {
                    pendingOrders.splice(index, 1);
                }
            }
        } catch (error) {
            console.error('Sync failed for order:', error);
        }
    }
    
    localStorage.setItem('pending_orders', JSON.stringify(pendingOrders));
}

// Push Notifications
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    
    const options = {
        body: data.message || 'New notification',
        icon: '/assets/icons/icon-192.png',
        badge: '/assets/icons/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/guest/orders'
        },
        actions: [
            { action: 'view', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Hotel Order', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        const urlToOpen = event.notification.data?.url || '/guest/orders';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clientList => {
                    for (const client of clientList) {
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Message Handler for skipping waiting
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('Service Worker loaded');
