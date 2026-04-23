<div class="kitchen-container">
    <div class="kitchen-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
            <h1 style="margin: 0; font-size: 2rem;">Kitchen Display System</h1>
            <p style="color: #6c757d; margin: 0.5rem 0 0;">Real-time Order Management</p>
        </div>
        <div style="display: flex; gap: 1rem;">
            <button onclick="toggleSound()" id="soundBtn" style="padding: 0.75rem 1.5rem; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">🔊 Sound On</button>
            <button onclick="toggleAutoRefresh()" id="refreshBtn" style="padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">⏱️ Auto-Refresh: ON</button>
        </div>
    </div>

    <!-- Status Filter Tabs -->
    <div class="status-tabs" style="display: flex; gap: 1rem; margin-bottom: 2rem; overflow-x: auto;">
        <button class="tab-btn active" data-status="all" style="padding: 0.75rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; white-space: nowrap;">All Orders</button>
        <button class="tab-btn" data-status="pending" style="padding: 0.75rem 1.5rem; background: #ffc107; color: #856404; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; white-space: nowrap;">Pending (<span id="pending-count"><?php echo count(array_filter($orders, fn($o) => $o['status'] === 'pending')); ?></span>)</button>
        <button class="tab-btn" data-status="preparing" style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; white-space: nowrap;">Preparing (<span id="preparing-count"><?php echo count(array_filter($orders, fn($o) => $o['status'] === 'preparing')); ?></span>)</button>
    </div>

    <!-- Orders Grid -->
    <div class="orders-grid" id="ordersGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem;">
        <?php if (empty($orders)): ?>
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                <h3 style="margin: 0; color: #28a745;">No Active Orders</h3>
                <p style="color: #6c757d; margin: 0.5rem 0 0;">All orders are completed!</p>
            </div>
        <?php else: ?>
            <?php foreach ($orders as $order): ?>
                <div class="order-card" data-order-id="<?php echo $order['id']; ?>" data-status="<?php echo $order['status']; ?>" style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; border-top: 5px solid <?php 
                    echo match($order['status']) {
                        'pending' => '#ffc107',
                        'preparing' => '#007bff',
                        default => '#6c757d'
                    };
                ?>; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                    
                    <div style="padding: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0; font-size: 1.5rem; font-weight: bold;">#<?php echo $order['id']; ?></h3>
                            <span class="status-badge" style="padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.875rem; font-weight: 600; text-transform: uppercase;
                                background: <?php 
                                    echo match($order['status']) {
                                        'pending' => '#fff3cd',
                                        'preparing' => '#cce5ff',
                                        default => '#e9ecef'
                                    };
                                ?>; 
                                color: <?php 
                                    echo match($order['status']) {
                                        'pending' => '#856404',
                                        'preparing' => '#004085',
                                        default => '#383d41'
                                    };
                                ?>;">
                                <?php echo ucfirst($order['status']); ?>
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <span style="font-size: 1.25rem;">👤</span>
                                <span style="font-weight: 600;"><?php echo htmlspecialchars($order['customer_name'] ?? 'Guest'); ?></span>
                            </div>
                            <?php if ($order['room_number']): ?>
                                <div style="display: flex; align-items: center; gap: 0.5rem; color: #6c757d;">
                                    <span>🏨</span>
                                    <span>Room <?php echo htmlspecialchars($order['room_number']); ?></span>
                                </div>
                            <?php endif; ?>
                            <?php if ($order['table_number']): ?>
                                <div style="display: flex; align-items: center; gap: 0.5rem; color: #6c757d;">
                                    <span>🪑</span>
                                    <span>Table <?php echo htmlspecialchars($order['table_number']); ?></span>
                                </div>
                            <?php endif; ?>
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: #6c757d; margin-top: 0.5rem;">
                                <span>⏰</span>
                                <span><?php echo date('h:i A', strtotime($order['created_at'])); ?></span>
                                <span style="margin-left: auto; font-weight: bold; color: #667eea; font-size: 1.25rem;">$<?php echo number_format($order['total_amount'], 2); ?></span>
                            </div>
                        </div>
                        
                        <?php if ($order['special_instructions']): ?>
                            <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #ffc107;">
                                <strong>⚠️ Special Instructions:</strong>
                                <p style="margin: 0.5rem 0 0;"><?php echo htmlspecialchars($order['special_instructions']); ?></p>
                            </div>
                        <?php endif; ?>
                        
                        <div style="border-top: 2px solid #e9ecef; padding-top: 1rem;">
                            <h4 style="margin: 0 0 1rem; font-size: 1rem; color: #6c757d;">ORDER ITEMS:</h4>
                            <ul style="margin: 0; padding-left: 1.5rem;">
                                <?php
                                // Get order items
                                $itemStmt = $this->db->prepare("SELECT oi.*, mi.name FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = ?");
                                $itemStmt->execute([$order['id']]);
                                $items = $itemStmt->fetchAll();
                                foreach ($items as $item):
                                ?>
                                    <li style="margin-bottom: 0.5rem;">
                                        <strong><?php echo $item['quantity']; ?>x</strong> <?php echo htmlspecialchars($item['name']); ?>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    </div>
                    
                    <div style="padding: 1rem; background: #f8f9fa; display: flex; gap: 0.5rem;">
                        <?php if ($order['status'] === 'pending'): ?>
                            <button onclick="updateStatus(<?php echo $order['id']; ?>, 'preparing')" style="flex: 1; padding: 0.75rem; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">▶️ Start Preparing</button>
                        <?php elseif ($order['status'] === 'preparing'): ?>
                            <button onclick="updateStatus(<?php echo $order['id']; ?>, 'ready')" style="flex: 1; padding: 0.75rem; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">✅ Mark Ready</button>
                        <?php endif; ?>
                        <button onclick="viewOrder(<?php echo $order['id']; ?>)" style="padding: 0.75rem 1rem; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer;">👁️ View</button>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
</div>

<audio id="notificationSound" src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbqWEyMmih0NupYTIyaKHQ26lhMjJoodDbqWEyMmih0NupYTIyaKHQ26lhMjJoodDbqWEyMg=="></audio>

<script>
let soundEnabled = true;
let autoRefreshEnabled = true;
const audio = document.getElementById('notificationSound');

// Toggle sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundBtn').textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
    document.getElementById('soundBtn').style.background = soundEnabled ? '#28a745' : '#dc3545';
}

// Toggle auto-refresh
function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    document.getElementById('refreshBtn').textContent = autoRefreshEnabled ? '⏱️ Auto-Refresh: ON' : '⏱️ Auto-Refresh: OFF';
    document.getElementById('refreshBtn').style.background = autoRefreshEnabled ? '#667eea' : '#6c757d';
}

// Update order status
async function updateStatus(orderId, newStatus) {
    try {
        const response = await fetch(`/kitchen/order/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        const result = await response.json();
        
        if (result.success) {
            playNotificationSound();
            location.reload();
        } else {
            alert('Failed to update order status: ' + result.message);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Error updating order status');
    }
}

// View order details
function viewOrder(orderId) {
    window.open(`/staff/orders/${orderId}`, '_blank');
}

// Play notification sound
function playNotificationSound() {
    if (soundEnabled) {
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

// Tab filtering
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const status = this.dataset.status;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        document.querySelectorAll('.order-card').forEach(card => {
            if (status === 'all' || card.dataset.status === status) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Real-time updates via SSE
if (typeof EventSource !== 'undefined') {
    const eventSource = new EventSource('/notifications/stream');
    
    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Real-time update:', data);
        
        if (data.type === 'new_order') {
            playNotificationSound();
            if (autoRefreshEnabled) {
                location.reload();
            }
        }
    };
    
    eventSource.onerror = function() {
        console.log('SSE connection closed');
        eventSource.close();
    };
}

// Fallback polling if SSE not supported
if (typeof EventSource === 'undefined') {
    setInterval(() => {
        if (autoRefreshEnabled) {
            location.reload();
        }
    }, 10000); // Poll every 10 seconds
}
</script>

<style>
.kitchen-container {
    container-type: inline-size;
}

.order-card {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@container (min-width: 1050px) {
    .orders-grid {
        grid-template-columns: repeat(3, 1fr) !important;
    }
}

@container (min-width: 700px) and (max-width: 1049px) {
    .orders-grid {
        grid-template-columns: repeat(2, 1fr) !important;
    }
}
</style>
