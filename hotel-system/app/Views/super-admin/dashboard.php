<div class="dashboard-container">
    <div class="dashboard-header">
        <h1>Super Admin Dashboard</h1>
        <p>Multi-Property Management Overview</p>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.875rem; opacity: 0.9;">Total Properties</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.5rem;"><?php echo $stats['total_properties']; ?></div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.875rem; opacity: 0.9;">Total Users</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.5rem;"><?php echo $stats['total_users']; ?></div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.875rem; opacity: 0.9;">Orders Today</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.5rem;"><?php echo $stats['today_orders']; ?></div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="font-size: 0.875rem; opacity: 0.9;">Revenue Today</div>
            <div style="font-size: 2.5rem; font-weight: bold; margin-top: 0.5rem;">$<?php echo number_format($stats['today_revenue'], 2); ?></div>
        </div>
    </div>

    <!-- Properties Section -->
    <div class="content-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="margin: 0;">Properties</h2>
            <a href="/super-admin/properties" class="btn btn-primary" style="padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 8px; background: #667eea; color: white; font-weight: 500;">Manage All</a>
        </div>
        
        <div class="table-container" style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead style="background: #f8f9fa;">
                    <tr>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Property Name</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Location</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Status</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Created</th>
                        <th style="padding: 1rem; text-align: left; border-bottom: 2px solid #e9ecef;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($properties)): ?>
                        <tr>
                            <td colspan="5" style="padding: 2rem; text-align: center; color: #6c757d;">No properties found</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach (array_slice($properties, 0, 5) as $property): ?>
                            <tr style="border-bottom: 1px solid #e9ecef;">
                                <td style="padding: 1rem; font-weight: 500;"><?php echo htmlspecialchars($property['name']); ?></td>
                                <td style="padding: 1rem; color: #6c757d;"><?php echo htmlspecialchars($property['location'] ?? 'N/A'); ?></td>
                                <td style="padding: 1rem;">
                                    <span class="badge" style="padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.875rem; background: <?php echo $property['is_active'] ? '#d4edda' : '#f8d7da'; ?>; color: <?php echo $property['is_active'] ? '#155724' : '#721c24'; ?>;">
                                        <?php echo $property['is_active'] ? 'Active' : 'Inactive'; ?>
                                    </span>
                                </td>
                                <td style="padding: 1rem; color: #6c757d;"><?php echo date('M d, Y', strtotime($property['created_at'])); ?></td>
                                <td style="padding: 1rem;">
                                    <a href="/admin/dashboard?property=<?php echo $property['id']; ?>" class="btn btn-sm" style="padding: 0.5rem 1rem; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-size: 0.875rem;">Access</a>
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
            <a href="/super-admin/properties?action=new" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏨</div>
                <div style="font-weight: 600;">Add Property</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">Create new hotel/restaurant</div>
            </a>
            
            <a href="/admin/staff?action=new" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">👥</div>
                <div style="font-weight: 600;">Add Staff</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">Create user account</div>
            </a>
            
            <a href="/admin/menu?action=new" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">📋</div>
                <div style="font-weight: 600;">Menu Items</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">Manage menu</div>
            </a>
            
            <a href="/notifications" class="action-card" style="padding: 1.5rem; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); text-decoration: none; color: inherit; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔔</div>
                <div style="font-weight: 600;">Notifications</div>
                <div style="font-size: 0.875rem; color: #6c757d; margin-top: 0.25rem;">View all alerts</div>
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

.badge {
    display: inline-block;
    font-weight: 500;
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
        // Reload stats periodically
        location.reload();
    };
    
    eventSource.onerror = function() {
        console.log('SSE connection closed');
        eventSource.close();
    };
}
</script>
