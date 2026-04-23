<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#4F46E5">
    <meta name="description" content="Smart Hotel Order System - Fast & Easy Ordering">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json">
    
    <!-- Preload Critical Assets -->
    <link rel="preload" href="/assets/css/style.css" as="style">
    <link rel="preload" href="/assets/js/app.js" as="script">
    
    <!-- Critical CSS Inline -->
    <style>
        :root {
            --primary: #4F46E5;
            --primary-dark: #4338CA;
            --secondary: #10B981;
            --danger: #EF4444;
            --warning: #F59E0B;
            --gray-50: #F9FAFB;
            --gray-100: #F3F4F6;
            --gray-200: #E5E7EB;
            --gray-300: #D1D5DB;
            --gray-700: #374151;
            --gray-900: #111827;
            --shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            --radius: 12px;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: var(--gray-50);
            color: var(--gray-900);
            line-height: 1.6;
        }
        
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            border-radius: var(--radius);
            font-weight: 600;
            text-decoration: none;
            transition: all 0.2s;
            border: none;
            cursor: pointer;
        }
        
        .btn-primary {
            background: var(--primary);
            color: white;
        }
        
        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }
        
        /* Navigation */
        .navbar {
            background: white;
            box-shadow: var(--shadow);
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 1000;
        }
        
        .navbar-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .navbar-brand {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
            text-decoration: none;
        }
        
        .navbar-menu {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        
        .navbar-link {
            color: var(--gray-700);
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: var(--radius);
            transition: all 0.2s;
        }
        
        .navbar-link:hover {
            background: var(--gray-100);
            color: var(--primary);
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        
        /* Main Content Area */
        .main-content {
            padding: 2rem 0;
            min-height: calc(100vh - 200px);
        }
        
        /* Dashboard Header */
        .dashboard-header {
            margin-bottom: 2rem;
        }
        
        .dashboard-header h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .dashboard-header p {
            color: var(--gray-700);
        }
        
        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        /* Content Section */
        .content-section {
            margin-bottom: 2rem;
        }
        
        /* Table Container */
        .table-container {
            background: white;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            overflow: hidden;
        }
        
        /* Toast Notification */
        .toast {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: var(--gray-900);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius);
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            z-index: 9999;
            transform: translateY(0);
            opacity: 1;
            transition: all 0.3s;
        }
        
        .toast.hidden {
            transform: translateY(100px);
            opacity: 0;
            pointer-events: none;
        }
        
        /* Install Prompt */
        .install-prompt {
            position: fixed;
            bottom: 2rem;
            left: 2rem;
            background: white;
            padding: 1.5rem;
            border-radius: var(--radius);
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .install-prompt.hidden {
            display: none;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .navbar-menu {
                display: none;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .toast {
                left: 1rem;
                right: 1rem;
                bottom: 1rem;
            }
        }
    </style>
    
    <!-- Main Stylesheet -->
    <link rel="stylesheet" href="/assets/css/style.css">
    
    <title><?= $pageTitle ?? 'Smart Hotel System' ?></title>
</head>
<body>
    <?php if (isset($user) || Auth::check()): ?>
        <?php $currentUser = $user ?? Auth::user(); ?>
        <nav class="navbar">
            <div class="container navbar-content">
                <a href="/" class="navbar-brand">🏨 Smart Hotel</a>
                <div class="navbar-menu">
                    <?php if ($currentUser['role'] === 'super_admin'): ?>
                        <a href="/super-admin/dashboard" class="navbar-link">Dashboard</a>
                        <a href="/super-admin/properties" class="navbar-link">Properties</a>
                    <?php elseif ($currentUser['role'] === 'admin'): ?>
                        <a href="/admin/dashboard" class="navbar-link">Dashboard</a>
                        <a href="/admin/orders" class="navbar-link">Orders</a>
                        <a href="/admin/menu" class="navbar-link">Menu</a>
                        <a href="/admin/staff" class="navbar-link">Staff</a>
                    <?php elseif ($currentUser['role'] === 'staff'): ?>
                        <a href="/staff/dashboard" class="navbar-link">Dashboard</a>
                        <a href="/staff/orders" class="navbar-link">Orders</a>
                        <a href="/kitchen/display" class="navbar-link">Kitchen</a>
                    <?php elseif ($currentUser['role'] === 'kitchen'): ?>
                        <a href="/kitchen/display" class="navbar-link">Kitchen Display</a>
                    <?php endif; ?>
                </div>
                <div class="user-info">
                    <div class="user-avatar"><?= strtoupper(substr($currentUser['name'], 0, 1)) ?></div>
                    <span><?= htmlspecialchars($currentUser['name']) ?></span>
                    <a href="/logout" class="btn btn-sm" style="background: var(--danger); color: white;">Logout</a>
                </div>
            </div>
        </nav>
    <?php endif; ?>
    
    <main class="main-content">
        <div class="container">
            <?= $content ?? '' ?>
        </div>
    </main>
    
    <!-- Install Prompt -->
    <div id="install-prompt" class="install-prompt hidden">
        <div class="install-prompt-content">
            <p>📱 Install our app for faster ordering!</p>
            <button id="install-btn" class="btn btn-primary">Install</button>
            <button id="dismiss-install" class="btn">Later</button>
        </div>
    </div>
    
    <!-- Notification Toast -->
    <div id="toast" class="toast hidden"></div>
    
    <!-- Service Worker Registration -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('SW registered:', reg.scope))
                    .catch(err => console.log('SW registration failed:', err));
            });
        }
    </script>
    
    <!-- Main App Script -->
    <script src="/assets/js/app.js" defer></script>
</body>
</html>
