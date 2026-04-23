/**
 * Smart Hotel System - Main Application JavaScript
 * ES6+ Vanilla JavaScript for fast loading
 */

// App State
const AppState = {
    cart: [],
    notifications: [],
    isOnline: navigator.onLine,
    deferredPrompt: null
};

// Utility Functions
const Utils = {
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Cart Management
const Cart = {
    add(item) {
        const existing = AppState.cart.find(i => i.id === item.id);
        if (existing) {
            existing.quantity++;
        } else {
            AppState.cart.push({ ...item, quantity: 1 });
        }
        this.save();
        this.updateUI();
    },

    remove(itemId) {
        AppState.cart = AppState.cart.filter(i => i.id !== itemId);
        this.save();
        this.updateUI();
    },

    updateQuantity(itemId, quantity) {
        const item = AppState.cart.find(i => i.id === itemId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.save();
            this.updateUI();
        }
    },

    getTotal() {
        return AppState.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    save() {
        localStorage.setItem('hotel_cart', JSON.stringify(AppState.cart));
    },

    load() {
        const saved = localStorage.getItem('hotel_cart');
        if (saved) {
            AppState.cart = JSON.parse(saved);
            this.updateUI();
        }
    },

    updateUI() {
        const count = AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartBadge = document.getElementById('cart-count');
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'block' : 'none';
        }
    },

    clear() {
        AppState.cart = [];
        this.save();
        this.updateUI();
    }
};

// Notification System with Server-Sent Events
const NotificationSystem = {
    init() {
        if (!document.getElementById('notification-stream')) return;
        
        this.connect();
        this.requestPermission();
    },

    connect() {
        const eventSource = new EventSource('/notifications/stream');
        
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.show(data);
            
            // Play sound for important notifications
            if (data.type === 'order' || data.type === 'alert') {
                this.playSound();
            }
        };
        
        eventSource.onerror = () => {
            console.log('SSE connection lost, reconnecting...');
            eventSource.close();
            setTimeout(() => this.connect(), 5000);
        };
    },

    show(notification) {
        AppState.notifications.push(notification);
        Utils.showToast(notification.message, notification.type);
        
        // Update badge
        const unreadCount = AppState.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        if (badge && unreadCount > 0) {
            badge.textContent = unreadCount;
        }
    },

    requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    playSound() {
        const audio = new Audio('/assets/sounds/notification.mp3');
        audio.play().catch(() => {}); // Ignore autoplay errors
    }
};

// PWA Install Handler
const PWAInstall = {
    init() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            AppState.deferredPrompt = e;
            this.showPrompt();
        });
        
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            AppState.deferredPrompt = null;
            document.getElementById('install-prompt').classList.add('hidden');
        });
        
        // Setup button handlers
        document.getElementById('install-btn')?.addEventListener('click', () => this.install());
        document.getElementById('dismiss-install')?.addEventListener('click', () => {
            document.getElementById('install-prompt').classList.add('hidden');
        });
    },

    showPrompt() {
        document.getElementById('install-prompt').classList.remove('hidden');
    },

    async install() {
        if (!AppState.deferredPrompt) return;
        
        AppState.deferredPrompt.prompt();
        const { outcome } = await AppState.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        
        AppState.deferredPrompt = null;
    }
};

// Order Management
const OrderManager = {
    async placeOrder(orderData) {
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                Cart.clear();
                Utils.showToast('Order placed successfully!', 'success');
                window.location.href = `/guest/orders/${result.order_id}`;
            } else {
                Utils.showToast(result.message || 'Order failed', 'error');
            }
        } catch (error) {
            console.error('Order error:', error);
            Utils.showToast('Network error. Please try again.', 'error');
        }
    },

    trackOrder(orderId) {
        // Real-time order tracking via SSE
        console.log(`Tracking order ${orderId}`);
    }
};

// Background Sync for Offline Orders
const BackgroundSync = {
    async register() {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-orders');
        }
    },

    queueOrder(orderData) {
        const pendingOrders = JSON.parse(localStorage.getItem('pending_orders') || '[]');
        pendingOrders.push(orderData);
        localStorage.setItem('pending_orders', JSON.stringify(pendingOrders));
        this.register();
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    // Load cart from storage
    Cart.load();
    
    // Initialize PWA
    PWAInstall.init();
    
    // Initialize notifications
    NotificationSystem.init();
    
    // Online/Offline handling
    window.addEventListener('online', () => {
        Utils.showToast('You\'re back online!', 'success');
        BackgroundSync.register();
    });
    
    window.addEventListener('offline', () => {
        Utils.showToast('You\'re offline. Orders will sync when reconnected.', 'warning');
    });
    
    console.log('Smart Hotel System initialized');
});

// Export for module usage
window.App = {
    Cart,
    Utils,
    OrderManager,
    BackgroundSync,
    AppState
};
