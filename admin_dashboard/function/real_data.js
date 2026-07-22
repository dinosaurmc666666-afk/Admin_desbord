// ============================================
// DASHBOARD FUNCTIONS
// ============================================
async function loadDashboard() {
    console.log('🔄 Loading dashboard...');
    
    const token = getToken();
    if (!token) {
        console.error('❌ No token found - redirecting to login');
        window.location.href = 'login/index.html';
        return;
    }
    
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/stats`);
        
        if (!res) {
            console.error('❌ No response from API');
            showErrorMessage('Cannot connect to server');
            return;
        }
        
        if (res.status !== 200) {
            console.error('❌ API returned status:', res.status);
            showErrorMessage(`Server error: ${res.status}`);
            return;
        }
        
        const stats = await res.json();
        console.log('✅ Stats loaded:', stats);
        
        // Update stats with null checks
        const revenueEl = document.getElementById('stat-revenue');
        const ordersEl = document.getElementById('stat-orders');
        const productsEl = document.getElementById('stat-products');
        const usersEl = document.getElementById('stat-users');
        
        if (revenueEl) revenueEl.innerText = `$${stats.total_revenue.toLocaleString()}`;
        if (ordersEl) ordersEl.innerText = stats.total_orders;
        if (productsEl) productsEl.innerText = stats.total_products;
        if (usersEl) usersEl.innerText = stats.total_users;
        
        // Update badges
        const pendingBadge = document.getElementById('pending-orders-badge');
        if (pendingBadge) pendingBadge.innerText = stats.pending_orders || 0;
        
        const notifBadge = document.getElementById('notif-badge');
        if (notifBadge) {
            const total = (stats.low_stock_count || 0) + (stats.pending_orders || 0);
            notifBadge.innerText = total;
            notifBadge.style.display = total > 0 ? 'flex' : 'none';
        }
        
        // Update realtime stats
        const rtActive = document.getElementById('rt-active');
        const rtNewUsers = document.getElementById('rt-new-users');
        const rtNewOrders = document.getElementById('rt-new-orders');
        const rtLowStock = document.getElementById('rt-low-stock');
        
        if (rtActive) rtActive.innerText = stats.pending_orders || 0;
        if (rtNewUsers) rtNewUsers.innerText = stats.total_users || 0;
        if (rtNewOrders) rtNewOrders.innerText = stats.total_orders || 0;
        if (rtLowStock) rtLowStock.innerText = stats.low_stock_count || 0;
        
        await loadChart();
        
    } catch (err) {
        console.error('❌ Error loading dashboard:', err);
        showErrorMessage('Failed to load data: ' + err.message);
    }
}

async function loadChart() {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/order-analytics`);
        if (!res) return;
        
        const data = await res.json();
        const ctx = document.getElementById('revenueChart');
        
        if (!ctx) {
            console.warn('⚠️ revenueChart element not found');
            return;
        }
        
        if (revenueChart) revenueChart.destroy();
        
        revenueChart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    { 
                        label: 'Orders', 
                        data: data.order_counts, 
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true, 
                        tension: 0.4 
                    },
                    { 
                        label: 'Revenue ($)', 
                        data: data.revenues, 
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        fill: true, 
                        tension: 0.4 
                    }
                ]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'top', align: 'end' } 
                },
                scales: { 
                    y: { beginAtZero: true } 
                }
            }
        });
        
    } catch (err) {
        console.error('❌ Chart error:', err);
    }
}

async function refreshChart() { 
    showToast('Refreshing chart...', 'warning'); 
    await loadChart(); 
}

function startRealtimeMonitoring() {
    async function fetchStatus() {
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/realtime-status`);
            if (!res) return;
            
            const data = await res.json();
            
            const rtActive = document.getElementById('rt-active');
            const rtNewUsers = document.getElementById('rt-new-users');
            const rtNewOrders = document.getElementById('rt-new-orders');
            const rtLowStock = document.getElementById('rt-low-stock');
            const lastUpdate = document.getElementById('lastUpdate');
            
            if (rtActive) rtActive.innerText = data.active_orders;
            if (rtNewUsers) rtNewUsers.innerText = data.new_users_today;
            if (rtNewOrders) rtNewOrders.innerText = data.new_orders_today;
            if (rtLowStock) rtLowStock.innerText = data.low_stock_count;
            if (lastUpdate) lastUpdate.innerText = 'Updated just now';
            
        } catch (e) { 
            console.error(' Realtime error:', e); 
        }
    }
    
    fetchStatus();
    clearInterval(realtimeInterval);
    realtimeInterval = setInterval(fetchStatus, 10000);
}
