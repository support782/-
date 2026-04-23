<div class="dashboard-container">
    <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Property Management Overview</p>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.875rem; opacity: 0.9;">Orders Today</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.5rem;"><?php echo $stats['today_orders']; ?></div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.875rem; opacity: 0.9;">Pending Orders</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.5rem;"><?php echo $stats['pending_orders']; ?></div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.875rem; opacity: 0.9;">Revenue Today</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.5rem;">$<?php echo number_format($stats['today_revenue'], 2); ?></div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.875rem; opacity: 0.9;">Menu Items</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.5rem;"><?php echo $stats['menu_items']; ?></div>
        </div>
    </div>

    <!-- Recent Orders -->
    <div class="content-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">Recent Orders</h2>
            <a href="/admin/orders" class="btn btn-primary" style="padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; background: #667eea; color: white; font-weight: 500;">View All</a>
        </div>
        
        <div class="table-container" style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f8f9fa;">
                    <tr>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Order ID</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Customer</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Amount</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Status</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Time</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($recentOrders)): ?>
                        <tr>
                            <td colspan="5" style="padding: 2rem; text-align: center; color: #6c757d;">No orders yet</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($recentOrders as $order): ?>
                            <tr style="border-bottom: 1px solid #e9ecef;">
                                <td style="padding: 1rem; font-weight: 500;">#<?php echo $order['id']; ?></td>
                                <td style="padding: 1rem;">
                                    <div><?php echo htmlspecialchars($order['customer_name'] ?? 'Guest'); ?></div>
                                    <?php if ($order['room_number']): ?>
                                        <div style="font-size: 0.875rem; color: #6c757d;">Room <?php echo htmlspecialchars($order['room_number']); ?></div>
                                    <?php endif; ?>
                                </td>
                                <td style="padding: 1rem; font-weight: 600;">$<?php echo number_format($order['total_amount'], 2); ?></td>
                                <td style="padding: 1rem;">
                                    <span class="badge" style="padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; 
                                        background: <?php 
                                            echo match($order['status']) {
                                                'pending' => '#fff3cd',
                                                'preparing' => '#cce5ff',
                                                'ready' => '#d4edda',
                                                'completed' => '#d4edda',
                                                'cancelled' => '#f8d7da',
                                                default => '#e9ecef'
                                            }; 
                                        ?>; 
                                        color: <?php 
                                            echo match($order['status']) {
                                                'pending' => '#856404',
                                                'preparing' => '#004085',
                                                'ready' => '#155724',
                                                'completed' => '#155724',
                                                'cancelled' => '#721c24',
                                                default => '#383d41'
                                            }; 
                                        ?>;">
                                        <?php echo ucfirst($order['status']); ?>
                                    </span>
                                </td>
                                <td style="padding: 1rem; color: #6c757d;">
                                    <?php echo date('M d, h:i A', strtotime($order['created_at'])); ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions" style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1.5rem;">Quick Actions</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <a href="/admin/orders?action=new" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
                <div style="font-weight: 600;">New Order</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">Create manual order</div>
            </a>
            
            <a href="/kitchen/display" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">👨‍🍳</div>
                <div style="font-weight: 600;">Kitchen View</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">Monitor kitchen</div>
            </a>
            
            <a href="/admin/menu" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🍽️</div>
                <div style="font-weight: 600;">Menu Manager</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">Edit menu items</div>
            </a>
            
            <a href="/admin/staff" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
                <div style="font-weight: 600;">Staff Mgmt</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">Manage team</div>
            </a>
        </div>
    </div>
</div>

<style>
.dashboard-container {
    container-type: inline-size;
}

.stat-card:hover {
    transform: translateY(-4px);
    transition: transform 0.2s;
}

.table-container:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    transition: box-shadow 0.2s;
}

@container (min-width: 600px) {
    .stats-grid {
        grid-template-columns: repeat(4, 1fr) !important;
    }
}
</style>

<script>
// Real-time updates via SSE
if (typeof EventSource !== 'undefined') {
    const eventSource = new EventSource('/notifications/stream');
    
    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Real-time update:', data);
        // Reload dashboard on new orders
        if (data.type === 'new_order' || data.type === 'order_status_updated') {
            location.reload();
        }
    };
    
    eventSource.onerror = function() {
        console.log('SSE connection closed');
        eventSource.close();
    };
}
</script>
