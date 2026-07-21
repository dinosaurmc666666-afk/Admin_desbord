

// ===== CONFIGURATION =====
const API_URL = 'https://payment.forestsmp.site/api'; // ⚠️ កែ URL នេះតាមកន្លែងដាក់ Backend របស់អ្នក
let revenueChart = null;
let realtimeInterval = null;

// ===== AUTH =====
function getToken() { return localStorage.getItem('admin_token'); }
function setToken(token) { localStorage.setItem('admin_token', token); }
function clearToken() { localStorage.removeItem('admin_token'); }

// Check auth immediately on load
if (!getToken()) {
    window.location.href = 'loginadmin.html';
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTheme();
    initDashboard();
});

// ===== NAVIGATION =====
function initNavigation() {
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
            document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            document.getElementById('sidebar').classList.remove('mobile-open');
        });
    });

    document.getElementById('toggleSidebar').addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.toggle('mobile-open');
        } else {
            document.getElementById('sidebar').classList.toggle('collapsed');
        }
    });

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.querySelector('.toggle-sidebar');
        if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });
}

function switchSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${sectionId}`).classList.add('active');
    
    if (sectionId === 'dashboard') {
        setTimeout(() => refreshChart(), 100);
        startRealtimeMonitoring();
    } else {
        clearInterval(realtimeInterval);
    }
}

// ===== THEME =====
function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeToggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    });
}

// ===== API HELPERS =====
async function fetchWithAuth(url, options = {}) {
    const headers = { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
}

// ===== TOAST =====
function showToast(message, type = 'success', title = '') {
    const container = document.getElementById('toastContainer');
    const icons = { success: 'fa-check', error: 'fa-times', warning: 'fa-exclamation' };
    const defaultTitles = { success: 'Success', error: 'Error', warning: 'Warning' };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title || defaultTitles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== DASHBOARD =====
async function initDashboard() {
    loadDashboard();
}

async function loadDashboard() {
    try {
        const stats = await fetchWithAuth(`${API_URL}/admin/stats`).then(r => r.json());
        document.getElementById('stat-revenue').innerText = `$${stats.total_revenue.toLocaleString()}`;
        document.getElementById('stat-orders').innerText = stats.total_orders;
        document.getElementById('stat-products').innerText = stats.total_products;
        document.getElementById('stat-users').innerText = stats.total_users;
        document.getElementById('pending-orders-badge').innerText = stats.pending_orders;
        document.getElementById('notif-badge').innerText = stats.low_stock_count + stats.pending_orders;
        loadChart();
    } catch (err) { console.error(err); }
}

async function loadChart() {
    try {
        const data = await fetchWithAuth(`${API_URL}/admin/order-analytics`).then(r => r.json());
        const ctx = document.getElementById('revenueChart').getContext('2d');
        if (revenueChart) revenueChart.destroy();
        
        revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    { label: 'Orders', data: data.order_counts, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.1)', fill: true, tension: 0.4 },
                    { label: 'Revenue ($)', data: data.revenues, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)', fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', align: 'end' } } }
        });
    } catch (err) { console.error(err); }
}

async function refreshChart() {
    showToast('Refreshing chart...', 'warning', 'Loading');
    await loadChart();
}

// ===== REAL-TIME MONITORING =====
function startRealtimeMonitoring() {
    async function fetchStatus() {
        try {
            const res = await fetchWithAuth(`${API_URL}/admin/realtime-status`);
            const data = await res.json();
            document.getElementById('rt-active').innerText = data.active_orders;
            document.getElementById('rt-new-users').innerText = data.new_users_today;
            document.getElementById('rt-new-orders').innerText = data.new_orders_today;
            document.getElementById('rt-low-stock').innerText = data.low_stock_count;
            document.getElementById('lastUpdate').innerText = 'Updated just now';
            
            const notifBadge = document.getElementById('notif-badge');
            const totalAlerts = data.active_orders + data.low_stock_count;
            if (totalAlerts > 0) { notifBadge.style.display = 'flex'; notifBadge.innerText = totalAlerts; } 
            else { notifBadge.style.display = 'none'; }
        } catch (e) { console.error(e); }
    }
    fetchStatus();
    clearInterval(realtimeInterval);
    realtimeInterval = setInterval(fetchStatus, 10000);
}

// ===== PRODUCTS =====
async function loadProducts() {
    try {
        const data = await fetch(`${API_URL}/products`).then(r => r.json());
        const tbody = document.getElementById('product-table-body');
        tbody.innerHTML = '';
        if (!data.products || data.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products found</td></tr>';
            return;
        }
        data.products.forEach(p => {
            const imgUrl = p.image_url ? `${API_URL}${p.image_url}` : 'https://via.placeholder.com/50';
            tbody.innerHTML += `
                <tr>
                    <td><img src="${imgUrl}" class="product-img"></td>
                    <td><strong>${p.name}</strong><br><small style="color:var(--text-secondary);">${p.sku || '-'}</small></td>
                    <td>$${p.price}</td>
                    <td><span style="color:${p.stock <= p.min_stock ? 'var(--danger)' : 'var(--success)'}; font-weight:600;">${p.stock}</span></td>
                    <td>${p.category || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
        });
    } catch (err) { showToast('Failed to load products', 'error'); }
}

function openProductModal() {
    document.getElementById('productModalTitle').innerText = 'បន្ថែមផលិតផលថ្មី';
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('productModal').classList.add('active');
}
function closeProductModal() { document.getElementById('productModal').classList.remove('active'); }

async function editProduct(id) {
    try {
        const p = await fetchWithAuth(`${API_URL}/products/${id}`).then(r => r.json());
        document.getElementById('productModalTitle').innerText = 'កែសម្រួលផលិតផល';
        document.getElementById('prodId').value = p.id;
        document.getElementById('prodName').value = p.name;
        document.getElementById('prodPrice').value = p.price;
        document.getElementById('prodCost').value = p.cost_price || 0;
        document.getElementById('prodStock').value = p.stock;
        document.getElementById('prodMinStock').value = p.min_stock || 5;
        document.getElementById('prodCategory').value = p.category || '';
        document.getElementById('prodSku').value = p.sku || '';
        document.getElementById('prodDesc').value = p.description || '';
        document.getElementById('productModal').classList.add('active');
    } catch (err) { showToast('Failed to load product', 'error'); }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('prodId').value;
    const fileInput = document.getElementById('prodImage');
    let imageUrl = '';
    if (fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        try {
            const res = await fetch(`${API_URL}/admin/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${getToken()}` }, body: formData });
            const data = await res.json();
            if (data.url) imageUrl = data.url;
        } catch (err) { console.error(err); }
    }
    const productData = {
        name: document.getElementById('prodName').value,
        price: parseFloat(document.getElementById('prodPrice').value),
        cost_price: parseFloat(document.getElementById('prodCost').value) || 0,
        stock: parseInt(document.getElementById('prodStock').value),
        min_stock: parseInt(document.getElementById('prodMinStock').value) || 5,
        category: document.getElementById('prodCategory').value,
        sku: document.getElementById('prodSku').value,
        description: document.getElementById('prodDesc').value,
        image_url: imageUrl
    };
    try {
        if (id) { await fetchWithAuth(`${API_URL}/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(productData) }); showToast('ផលិតផលត្រូវបានកែសម្រួល!', 'success'); }
        else { await fetchWithAuth(`${API_URL}/admin/products`, { method: 'POST', body: JSON.stringify(productData) }); showToast('ផលិតផលត្រូវបានបន្ថែម!', 'success'); }
        closeProductModal(); loadProducts();
    } catch (err) { showToast('មានកំហុសក្នុងការរក្សាទុក', 'error'); }
}

async function deleteProduct(id) {
    if (!confirm('តើអ្នកបរាកដជាចង់លុបផលិតផលនេះ?')) return;
    try {
        await fetchWithAuth(`${API_URL}/admin/products/${id}`, { method: 'DELETE' });
        showToast('ផលិតផលត្រូវបានលុប!', 'success'); loadProducts();
    } catch (err) { showToast('មានកំហុសក្នុងការលុប', 'error'); }
}

// ===== ORDERS =====
async function loadOrders() {
    try {
        const data = await fetchWithAuth(`${API_URL}/admin/orders`).then(r => r.json());
        const tbody = document.getElementById('order-table-body');
        tbody.innerHTML = '';
        if (!data.orders || data.orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders yet</td></tr>';
            return;
        }
        data.orders.forEach(o => {
            tbody.innerHTML += `
                <tr>
                    <td><strong>#${o.order_number || o.id}</strong></td>
                    <td><div class="customer-cell"><div class="customer-avatar" style="background:linear-gradient(135deg,#6366f1,#818cf8);">${o.customer_name.charAt(0).toUpperCase()}</div><div><div class="customer-name">${o.customer_name}</div><div class="customer-email">${o.customer_email}</div></div></div></td>
                    <td><strong>$${o.total_price}</strong></td>
                    <td><span class="status-badge ${o.status}">${o.status}</span></td>
                    <td>${new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder(${o.id})"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-sm btn-success" onclick="printInvoice(${o.id})"><i class="fas fa-print"></i></button>
                    </td>
                </tr>`;
        });
    } catch (err) { console.error(err); }
}

async function viewOrder(id) {
    try {
        const order = await fetchWithAuth(`${API_URL}/admin/orders/${id}`).then(r => r.json());
        alert(`Order #${order.order_number}\nCustomer: ${order.customer_name}\nTotal: $${order.total_price}\nStatus: ${order.status}\n\nItems:\n${order.items.map(i => `- ${i.product_name} x${i.quantity} = $${i.subtotal}`).join('\n')}`);
    } catch (err) { showToast('Failed to load order', 'error'); }
}

async function printInvoice(id) {
    try {
        const order = await fetchWithAuth(`${API_URL}/admin/orders/${id}`).then(r => r.json());
        const content = document.getElementById('invoice-content');
        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                <div><strong>Invoice #:</strong> ${order.order_number || order.id}<br><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</div>
                <div style="text-align:right;"><strong>Customer:</strong><br>${order.customer_name}<br>${order.customer_email}<br>${order.customer_phone || ''}</div>
            </div>
            <table style="width:100%; border-collapse:collapse; margin:20px 0;">
                <thead><tr style="background:#f1f5f9;"><th style="padding:10px; text-align:left;">Product</th><th style="padding:10px;">Qty</th><th style="padding:10px;">Price</th><th style="padding:10px;">Subtotal</th></tr></thead>
                <tbody>${order.items.map(i => `<tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:10px;">${i.product_name}</td><td style="padding:10px; text-align:center;">${i.quantity}</td><td style="padding:10px; text-align:right;">$${i.price}</td><td style="padding:10px; text-align:right;">$${i.subtotal}</td></tr>`).join('')}</tbody>
            </table>
            <div style="text-align:right; font-size:18px; margin-top:20px;">
                ${order.discount_code ? `<p>Discount (${order.discount_code}): -$${order.discount_amount}</p>` : ''}
                <p><strong>Total: $${order.total_price}</strong></p>
                <p style="font-size:14px;">Status: ${order.status} | Payment: ${order.payment_status}</p>
            </div>`;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`<html><head><title>Invoice #${order.order_number || order.id}</title></head><body>${document.getElementById('invoice-print').innerHTML}</body></html>`);
        printWindow.document.close();
        printWindow.print();
    } catch (err) { showToast('Failed to print invoice', 'error'); }
}

// ===== USERS =====
async function loadUsers() {
    try {
        const data = await fetchWithAuth(`${API_URL}/admin/users`).then(r => r.json());
        const tbody = document.getElementById('user-table-body');
        tbody.innerHTML = '';
        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No users registered yet.</td></tr>';
            return;
        }
        data.users.forEach(u => {
            const statusClass = u.is_banned ? 'banned' : 'active';
            const statusText = u.is_banned ? 'Banned' : 'Active';
            const actionBtn = u.is_banned 
                ? `<button class="btn btn-sm btn-success" onclick="openBanModal(${u.id}, '${u.name}', false)"><i class="fas fa-unlock"></i> Unban</button>`
                : `<button class="btn btn-sm btn-danger" onclick="openBanModal(${u.id}, '${u.name}', true)"><i class="fas fa-ban"></i> Ban</button>`;
            tbody.innerHTML += `
                <tr>
                    <td><div class="customer-cell"><div class="customer-avatar" style="background:linear-gradient(135deg,#6366f1,#818cf8);">${u.name.charAt(0).toUpperCase()}</div><strong>${u.name}</strong></div></td>
                    <td>${u.email}</td>
                    <td><span class="status-badge active">${u.role}</span></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${actionBtn}</td>
                </tr>`;
        });
    } catch (err) { console.error(err); }
}

function openBanModal(userId, userName, isBan) {
    document.getElementById('banUserId').value = userId;
    document.getElementById('banAction').value = isBan ? 'ban' : 'unban';
    document.getElementById('banModalTitle').innerText = isBan ? `Ban ${userName}` : `Unban ${userName}`;
    document.getElementById('banReasonGroup').style.display = isBan ? 'block' : 'none';
    document.getElementById('banSubmitBtn').innerHTML = isBan ? '<i class="fas fa-ban"></i> Ban' : '<i class="fas fa-unlock"></i> Unban';
    document.getElementById('banSubmitBtn').className = isBan ? 'btn btn-danger' : 'btn btn-success';
    document.getElementById('banModal').classList.add('active');
}
function closeBanModal() { document.getElementById('banModal').classList.remove('active'); }

async function handleBanSubmit(e) {
    e.preventDefault();
    const userId = document.getElementById('banUserId').value;
    const action = document.getElementById('banAction').value;
    const reason = document.getElementById('banReason').value;
    try {
        await fetchWithAuth(`${API_URL}/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify({ is_banned: action === 'ban', banned_reason: reason }) });
        showToast(action === 'ban' ? 'User banned!' : 'User unbanned!', 'success');
        closeBanModal(); loadUsers();
    } catch (err) { showToast('Failed to update user', 'error'); }
}

// ===== DISCOUNTS =====
async function loadDiscounts() {
    try {
        const data = await fetchWithAuth(`${API_URL}/admin/discounts`).then(r => r.json());
        const tbody = document.getElementById('discount-table-body');
        tbody.innerHTML = '';
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No discount codes yet</td></tr>';
            return;
        }
        data.forEach(d => {
            const statusClass = d.is_expired || !d.is_active ? 'cancelled' : 'active';
            const statusText = d.is_expired ? 'Expired' : (!d.is_active ? 'Inactive' : 'Active');
            tbody.innerHTML += `
                <tr>
                    <td><strong style="color:var(--primary); font-family:monospace;">${d.code}</strong></td>
                    <td>${d.description || '-'}</td>
                    <td>${d.percent}%</td>
                    <td>${d.used} / ${d.limit === 999999 ? '∞' : d.limit}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td><button class="btn btn-sm btn-danger" onclick="deleteDiscount(${d.id})"><i class="fas fa-trash"></i></button></td>
                </tr>`;
        });
    } catch (err) { console.error(err); }
}

function openDiscountModal() {
    document.getElementById('discountForm').reset();
    document.getElementById('discountModal').classList.add('active');
}
function closeDiscountModal() { document.getElementById('discountModal').classList.remove('active'); }
function toggleDiscLimit() { document.getElementById('discLimitGroup').style.display = document.getElementById('discLimitType').value === 'fixed' ? 'block' : 'none'; }
function toggleDiscExpiry() { document.getElementById('discExpiryGroup').style.display = document.getElementById('discExpiryType').value === 'unlimited' ? 'none' : 'block'; }

async function handleDiscountSubmit(e) {
    e.preventDefault();
    const data = {
        code: document.getElementById('discCode').value.toUpperCase(),
        description: document.getElementById('discDesc').value,
        percent: parseFloat(document.getElementById('discPercent').value),
        min_purchase: parseFloat(document.getElementById('discMinPurchase').value) || 0,
        max_discount: parseFloat(document.getElementById('discMaxDiscount').value) || 999999,
        limit_type: document.getElementById('discLimitType').value,
        limit: document.getElementById('discLimitType').value === 'fixed' ? parseInt(document.getElementById('discLimit').value) : 999999,
        expiry_type: document.getElementById('discExpiryType').value,
        expiry_value: document.getElementById('discExpiryType').value !== 'unlimited' ? parseInt(document.getElementById('discExpiryValue').value) : null
    };
    try {
        await fetchWithAuth(`${API_URL}/admin/discounts`, { method: 'POST', body: JSON.stringify(data) });
        showToast('កូដបញ្ចុះតម្លៃត្រូវបានបង្កើត!', 'success');
        closeDiscountModal(); loadDiscounts();
    } catch (err) { showToast('មានកំហុសក្នុងការបង្កើតកូដ', 'error'); }
}

async function deleteDiscount(id) {
    if (!confirm('តើអ្កប្រាកដជាចង់លុបកូដនេះ?')) return;
    try {
        await fetchWithAuth(`${API_URL}/admin/discounts/${id}`, { method: 'DELETE' });
        showToast('កូដត្រូវបានលុប!', 'success'); loadDiscounts();
    } catch (err) { showToast('មានកំហុសក្នុងការលុប', 'error'); }
}

// ===== STOCK =====
async function loadStock() {
    try {
        const data = await fetch(`${API_URL}/products`).then(r => r.json());
        const tbody = document.getElementById('stock-table-body');
        tbody.innerHTML = '';
        let total = 0, low = 0, ok = 0;
        if (!data.products || data.products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No products</td></tr>';
            return;
        }
        data.products.forEach(p => {
            total++;
            if (p.stock <= p.min_stock) low++; else ok++;
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td><code>${p.sku || '-'}</code></td>
                    <td><span style="color:${p.stock <= p.min_stock ? 'var(--danger)' : 'var(--success)'}; font-weight:700; font-size:16px;">${p.stock}</span></td>
                    <td>${p.min_stock}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="openStockModal(${p.id}, '${p.name}', ${p.stock})"><i class="fas fa-edit"></i> កែស្តុក</button></td>
                </tr>`;
        });
        document.getElementById('stock-total').innerText = total;
        document.getElementById('stock-low').innerText = low;
        document.getElementById('stock-ok').innerText = ok;
    } catch (err) { console.error(err); }
}

function openStockModal(productId, productName, currentStock) {
    document.getElementById('stockProductId').value = productId;
    document.getElementById('stockProductName').value = productName;
    document.getElementById('stockCurrent').value = currentStock;
    document.getElementById('stockForm').reset();
    document.getElementById('stockProductId').value = productId;
    document.getElementById('stockProductName').value = productName;
    document.getElementById('stockCurrent').value = currentStock;
    document.getElementById('stockModal').classList.add('active');
}
function closeStockModal() { document.getElementById('stockModal').classList.remove('active'); }

async function handleStockSubmit(e) {
    e.preventDefault();
    const productId = document.getElementById('stockProductId').value;
    const type = document.getElementById('stockType').value;
    let quantity = parseInt(document.getElementById('stockQuantity').value);
    if (type === 'sale') quantity = -quantity;
    const data = { product_id: parseInt(productId), quantity, movement_type: type, notes: document.getElementById('stockNotes').value, created_by: 'Admin' };
    try {
        await fetchWithAuth(`${API_URL}/admin/stock-movements`, { method: 'POST', body: JSON.stringify(data) });
        showToast('ស្តុកត្រូវបានកែសម្រួល!', 'success');
        closeStockModal(); loadStock();
    } catch (err) { showToast('មានកំហុសក្នុងការកែស្តុក', 'error'); }
}

// ===== SETTINGS =====
async function loadSettings() {
    try {
        const data = await fetchWithAuth(`${API_URL}/admin/settings`).then(r => r.json());
        document.getElementById('setting-store-name').value = data.store_name || '';
        document.getElementById('setting-email').value = data.admin_email || '';
        document.getElementById('setting-phone').value = data.phone || '';
        document.getElementById('setting-address').value = data.address || '';
    } catch (err) { console.error(err); }
}

async function saveSettings() {
    const data = { store_name: document.getElementById('setting-store-name').value, admin_email: document.getElementById('setting-email').value, phone: document.getElementById('setting-phone').value, address: document.getElementById('setting-address').value };
    try {
        await fetchWithAuth(`${API_URL}/admin/settings`, { method: 'PUT', body: JSON.stringify(data) });
        showToast('ការកំណត់តរូវបានរក្សាទុក!', 'success');
    } catch (err) { showToast('មានកំហុសកនុងការរក្សាទុក', 'error'); }
}

// ===== INVENTORY ALERTS =====
async function checkInventoryAlerts() {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/inventory-alerts`);
        const alerts = await res.json();
        const badge = document.getElementById('inventory-badge'); // Note: This ID might need to be added to HTML if missing
        // For now, we use the notif-badge logic in realtime
    } catch (e) { console.error(e); }
}

function showInventoryAlerts() {
    fetchWithAuth(`${API_URL}/admin/inventory-alerts`).then(res => res.json()).then(alerts => {
        const list = document.getElementById('inventory-list');
        if (alerts.length === 0) { list.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;"><i class="fas fa-check-circle" style="color:var(--success); font-size:40px; margin-bottom:10px; display:block;"></i>All products are well stocked!</p>'; } 
        else {
            list.innerHTML = alerts.map(a => `
                <div style="display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--border); border-radius:8px; margin-bottom:8px; background:${a.status === 'Out of Stock' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)'};">
                    <div style="width:40px; height:40px; border-radius:8px; background:${a.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)'}; color:white; display:flex; align-items:center; justify-content:center;"><i class="fas fa-${a.status === 'Out of Stock' ? 'times' : 'exclamation'}"></i></div>
                    <div style="flex:1;"><div style="font-weight:600;">${a.name}</div><div style="font-size:12px; color:var(--text-secondary);">${a.status} - ${a.stock} left</div></div>
                </div>`).join('');
        }
        document.getElementById('inventoryModal').classList.add('active');
    });
}
function closeInventoryModal() { document.getElementById('inventoryModal').classList.remove('active'); }

// ===== LOGOUT =====
function handleLogout() {
    if (!confirm('តើអ្នកបរាកដជាចង់ចាកចេញ?')) return;
    clearToken();
    window.location.href = 'loginadmin.html';
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); showToast('Search feature coming soon!', 'warning', 'Shortcut'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); if (!document.getElementById('section-products').classList.contains('hidden')) { openProductModal(); } else { switchSection('products'); setTimeout(openProductModal, 100); } }
    if (e.key === 'Escape') { closeProductModal(); closeDiscountModal(); closeInventoryModal(); closeStockModal(); closeBanModal(); }
    if (e.altKey && e.key === 'd') { e.preventDefault(); switchSection('dashboard'); }
});

// Close modals on outside click
document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('active'); });
});