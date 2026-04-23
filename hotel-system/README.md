# Smart Hotel Management System

A comprehensive, fast-loading hotel management and order taking system built with **PHP 8.2+**, **CSS4**, and **HTML5**.

## 🚀 Features

### Core Systems
- **Super Admin Panel** - Multi-property management
- **Property Admin** - Single hotel/restaurant control
- **Staff Dashboard** - Operational workflow tools
- **Guest PWA** - Progressive web app for ordering
- **Kitchen Display System (KDS)** - Real-time order management
- **Smart Hotel Integration** - IoT device connectivity

### Technical Highlights
- ⚡ **Fast Loading** - PHP 8.2+ with OPcache, Redis caching
- 🎨 **CSS4 Features** - Container queries, `:has()`, `color-mix()`, subgrid
- 📱 **PWA Ready** - Installable, offline support, background sync
- 🔔 **Real-time Notifications** - Server-Sent Events (SSE)
- 🔒 **Secure** - CSRF protection, prepared statements, secure sessions

## 📁 Project Structure

```
hotel-system/
├── public/                 # Document root
│   ├── index.php          # Entry point
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   ├── offline.html       # Offline fallback page
│   └── assets/
│       ├── css/style.css  # CSS4 styles
│       ├── js/app.js      # Vanilla JS
│       └── icons/         # PWA icons
├── app/
│   ├── Config/            # Configuration files
│   ├── Core/              # Framework core (Router, DB, Auth)
│   ├── Controllers/       # Request handlers
│   ├── Models/            # Database models
│   └── Views/             # PHP templates
├── routes/
│   ├── web.php            # Web routes
│   └── api.php            # API routes
└── storage/               # Logs, cache, uploads
```

## 🛠️ Installation

### Prerequisites
- PHP 8.2+ with FPM
- MySQL 8.0 / MariaDB
- Redis
- Nginx or Apache

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd hotel-system
```

2. **Configure database**
Edit `app/Config/config.php`:
```php
'database' => [
    'host' => 'localhost',
    'database' => 'hotel_db',
    'username' => 'your_user',
    'password' => 'your_password'
]
```

3. **Create database**
```bash
mysql -u root -p
CREATE DATABASE hotel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

4. **Set permissions**
```bash
chmod -R 775 storage/
chown -R www-data:www-data .
```

5. **Configure web server**

**Nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name your-hotel.com;
    root /var/www/hotel-system/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }
}
```

6. **Enable HTTPS**
```bash
certbot --nginx -d your-hotel.com
```

## 📱 PWA Installation

The app is installable on mobile devices:
1. Visit the site in Chrome/Safari
2. Tap "Add to Home Screen"
3. Use like a native app!

## 🔔 Notification System

Real-time notifications via Server-Sent Events:
- Order status updates
- Kitchen alerts
- Staff notifications

## 📊 Database Schema

Key tables:
- `users` - User accounts with roles
- `properties` - Hotels/restaurants
- `orders` - Order management
- `notifications` - Notification tracking
- `menu_items` - Restaurant menu

See `hotel-management-system.md` for complete schema.

## 🎯 User Roles

| Role | Access |
|------|--------|
| Super Admin | All properties, global settings |
| Admin | Single property management |
| Staff | Order handling, customer service |
| Kitchen | Kitchen display, order prep |
| Guest | Menu browsing, ordering |

## 🔒 Security Features

- ✅ CSRF token protection
- ✅ SQL injection prevention (PDO prepared statements)
- ✅ XSS protection (output escaping)
- ✅ Secure session handling
- ✅ Password hashing (Argon2id)
- ✅ Role-based access control

## 📈 Performance Optimizations

- **OPcache** enabled for PHP
- **Redis** for sessions and caching
- **Critical CSS** inlined
- **Lazy loading** images
- **HTTP/2** protocol
- **Brotli/Gzip** compression

## 🗺️ Development Roadmap

See `hotel-management-system.md` for detailed 12-week roadmap.

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For questions or issues, contact your system administrator.

---

Built with ❤️ using PHP 8.2+ and modern CSS4
