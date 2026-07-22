// real_data.js

async function loadDashboard() {
    console.log('🔄 Loading dashboard...');
    
    const token = getToken();
    console.log('🔑 Token status:', token ? '✅ Present' : '❌ Missing');
    
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
        
        // Update UI
        document.getElementById('stat-revenue').innerText = `$${stats.total_revenue.toLocaleString()}`;
        document.getElementById('stat-orders').innerText = stats.total_orders;
        document.getElementById('stat-products').innerText = stats.total_products;
        document.getElementById('stat-users').innerText = stats.total_users;
        
        const pendingBadge = document.getElementById('pending-orders-badge');
        if (pendingBadge) pendingBadge.innerText = stats.pending_orders || 0;
        
        const notifBadge = document.getElementById('notif-badge');
        if (notifBadge) {
            const total = (stats.low_stock_count || 0) + (stats.pending_orders || 0);
            notifBadge.innerText = total;
            notifBadge.style.display = total > 0 ? 'flex' : 'none';
        }
        
        await loadChart();
        
    } catch (err) {
        console.error('❌ Error loading dashboard:', err);
        showErrorMessage('Failed to load data: ' + err.message);
    }
}

function showErrorMessage(msg) {
    const dashboard = document.getElementById('section-dashboard');
    if (dashboard) {
        dashboard.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size:48px; margin-bottom:16px;"></i>
                <h3>Error Loading Data</h3>
                <p>${msg}</p>
                <button onclick="loadDashboard()" class="btn btn-primary" style="margin-top:16px;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        `;
    }
}

async function loadProducts() {
    console.log('🔄 Loading products...');
    
    try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        
        console.log('📦 Products response:', data);
        
        const tbody = document.getElementById('product-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const products = data.products || data || [];
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No products found. Add some products first!</td></tr>';
            return;
        }
        
        products.forEach(p => {
            const imgUrl = p.image_url ? `${API_URL}${p.image_url}` : 'https://via.placeholder.com/50';
            const stockColor = p.stock <= (p.min_stock || 5) ? 'var(--danger)' : 'var(--success)';
            
            tbody.innerHTML += `
                <tr>
                    <td><img src="${imgUrl}" class="product-img" onerror="this.src='https://via.placeholder.com/50'"></td>
                    <td><strong>${p.name}</strong><br><small style="color:var(--text-secondary);">${p.sku || '-'}</small></td>
                    <td>$${p.price}</td>
                    <td><span style="color:${stockColor}; font-weight:600;">${p.stock}</span></td>
                    <td>${p.category || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        });
        
    } catch (err) {
        console.error('❌ Error loading products:', err);
    }
}

// ... rest of the functions remain the same
