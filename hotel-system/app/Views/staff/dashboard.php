<div class="dashboard-container">
    <div class="dashboard-header">
        <h1>Staff Dashboard</h1>
        <p>Order Management & Service</p>
    </div>

    <!-- Active Orders -->
    <div class="content-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">Active Orders</h2>
            <div style="display: flex; gap: 0.5rem;">
                <a href="/staff/orders?status=pending" class="btn btn-sm" style="padding: 0.5rem 1rem; background: #fff3cd; color: #856404; text-decoration: none; border-radius: 6px; font-size: 0.875rem;">Pending</a>
                <a href="/staff/orders?status=preparing" class="btn btn-sm" style="padding: 0.5rem 1rem; background: #cce5ff; color: #004085; text-decoration: none; border-radius: 6px; font-size: 0.875rem;">Preparing</a>
                <a href="/staff/orders?status=ready" class="btn btn-sm" style="padding: 0.5rem 1rem; background: #d4edda; color: #155724; text-decoration: none; border-radius: 6px; font-size: 0.875rem;">Ready</a>
                <a href="/staff/orders" class="btn btn-sm" style="padding: 0.5rem 1rem; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-size: 0.875rem;">All</a>
            </div>
        </div>
        
        <div class="orders-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            <?php if (empty($activeOrders)): ?>
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #6c757d; background: white; border-radius: 12px;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                    <p>All orders are completed!</p>
                </div>
            <?php else: ?>
                <?php foreach ($activeOrders as $order): ?>
                    <div class="order-card" style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'">
                        <div style="padding: 1.5rem; border-bottom: 3px solid <?php 
                            echo match($order['status']) {
                                'pending' => '#ffc107',
                                'preparing' => '#007bff',
                                'ready' => '#28a745',
                                default => '#6c757d'
                            };
                        ?>;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                                <h3 style="margin: 0; font-size: 1.25rem;">Order #<?php echo $order['id']; ?></h3>
                                <span class="badge" style="padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;
                                    background: <?php 
                                        echo match($order['status']) {
                                            'pending' => '#ffc107',
                                            'preparing' => '#007bff',
                                            'ready' => '#28a745',
                                            default => '#6c757d'
                                        };
                                    ?>; 
                                    color: white;">
                                    <?php echo ucfirst($order['status']); ?>
                                </span>
                            </div>
                            
                            <div style="margin-bottom: 1rem;">
                                <div style="font-weight: 600; margin-bottom: 0.25rem;"><?php echo htmlspecialchars($order['customer_name'] ?? 'Guest'); ?></div>
                                <?php if ($order['room_number']): ?>
                                    <div style="color: #6c757d; font-size: 0.875rem;">🏨 Room <?php echo htmlspecialchars($order['room_number']); ?></div>
                                <?php endif; ?>
                                <?php if ($order['table_number']): ?>
                                    <div style="color: #6c757d; font-size: 0.875rem;">🪑 Table <?php echo htmlspecialchars($order['table_number']); ?></div>
                                <?php endif; ?>
                            </div>
                            
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
                                <div style="font-size: 1.25rem; font-weight: bold; color: #667eea;">$<?php echo number_format($order['total_amount'], 2); ?></div>
                                <div style="font-size: 0.875rem; color: #6c757d;"><?php echo date('h:i A', strtotime($order['created_at'])); ?></div>
                            </div>
                        </div>
                        
                        <div style="padding: 1rem;">
                            <a href="/staff/orders/<?php echo $order['id']; ?>" class="btn btn-block" style="display: block; padding: 0.75rem; background: #667eea; color: white; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 500;">View Details</a>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions" style="margin-top: 2rem;">
        <h2 style="margin-bottom: 1.5rem;">Quick Actions</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <a href="/kitchen/display" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">👨‍🍳</div>
                <div style="font-weight: 600;">Kitchen Display</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">View kitchen orders</div>
            </a>
            
            <a href="/staff/orders?action=new" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📝</div>
                <div style="font-weight: 600;">New Order</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">Create order</div>
            </a>
            
            <a href="/guest/menu" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📱</div>
                <div style="font-weight: 600;">Guest Menu</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">View customer menu</div>
            </a>
        </div>
    </div>
</div>

<style>
.dashboard-container {
    container-type: inline-size;
}

.order-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

@container (min-width: 900px) {
    .orders-grid {
        grid-template-columns: repeat(3, 1fr) !important;
    }
}

@container (min-width: 600px) and (max-width: 899px) {
    .orders-grid {
        grid-template-columns: repeat(2, 1fr) !important;
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
        // Reload on new orders or status changes
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
