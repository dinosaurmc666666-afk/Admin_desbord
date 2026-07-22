// ============================================
// PRODUCT FUNCTIONS
// ============================================
async function loadProducts() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        
        const tbody = document.getElementById('product-table-body');
        if (!tbody) {
            console.warn('⚠️ product-table-body not found');
            return;
        }
        
        tbody.innerHTML = '';
        const products = data.products || data || [];
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No products found</td></tr>';
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
        console.error('❌ Products load error:', err); 
        showToast('Failed to load products', 'error'); 
    }
}

async function editProduct(id) {
    try {
        const res = await fetchWithAuth(`${API_URL}/products/${id}`);
        if (!res) return;
        
        const p = await res.json();
        
        const title = document.getElementById('productModalTitle');
        if (title) title.innerText = 'កែសមរួលផលិតផល';
        
        const prodId = document.getElementById('prodId');
        const prodName = document.getElementById('prodName');
        const prodPrice = document.getElementById('prodPrice');
        const prodCost = document.getElementById('prodCost');
        const prodStock = document.getElementById('prodStock');
        const prodMinStock = document.getElementById('prodMinStock');
        const prodCategory = document.getElementById('prodCategory');
        const prodSku = document.getElementById('prodSku');
        const prodDesc = document.getElementById('prodDesc');
        
        if (prodId) prodId.value = p.id;
        if (prodName) prodName.value = p.name;
        if (prodPrice) prodPrice.value = p.price;
        if (prodCost) prodCost.value = p.cost_price || 0;
        if (prodStock) prodStock.value = p.stock;
        if (prodMinStock) prodMinStock.value = p.min_stock || 5;
        if (prodCategory) prodCategory.value = p.category || '';
        if (prodSku) prodSku.value = p.sku || '';
        if (prodDesc) prodDesc.value = p.description || '';
        
        const modal = document.getElementById('productModal');
        if (modal) modal.classList.add('active');
        
    } catch (err) { 
        showToast('Failed to load product', 'error'); 
    }
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('prodId').value;
    const fileInput = document.getElementById('prodImage');
    let imageUrl = '';
    
    if (fileInput && fileInput.files.length > 0) {
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        try {
            const res = await fetch(`${API_URL}/admin/upload`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${getToken()}` }, 
                body: formData 
            });
            const data = await res.json();
            if (data.url) imageUrl = data.url;
        } catch (err) { 
            console.error('❌ Upload error:', err); 
        }
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
        if (id) { 
            await fetchWithAuth(`${API_URL}/admin/products/${id}`, { 
                method: 'PUT', 
                body: JSON.stringify(productData) 
            }); 
            showToast('ផលិតផលត្រូវបានកែសម្រួល!', 'success'); 
        } else { 
            await fetchWithAuth(`${API_URL}/admin/products`, { 
                method: 'POST', 
                body: JSON.stringify(productData) 
            }); 
            showToast('ផលិតផលត្រូវបានបន្ែម!', 'success'); 
        }
        closeProductModal(); 
        loadProducts();
    } catch (err) { 
        showToast('មានកំហុសក្នុងការរក្សាទុក', 'error'); 
    }
}

async function deleteProduct(id) {
    if (!confirm('តើអ្នកប្រាកដជាចង់លុបផលិតផលនេះ?')) return;
    try { 
        await fetchWithAuth(`${API_URL}/admin/products/${id}`, { method: 'DELETE' }); 
        showToast('ផលិតផលត្រូវបានលុប!', 'success'); 
        loadProducts(); 
    } catch (err) { 
        showToast('មានកំហុសក្នុងការលុប', 'error'); 
    }
}

// ============================================
// ORDER FUNCTIONS
// ============================================
async function loadOrders() {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/orders`);
        if (!res) return;
        
        const data = await res.json();
        console.log('📦 Orders data:', data);
        
        const tbody = document.getElementById('order-table-body');
        if (!tbody) {
            console.warn('⚠️ order-table-body not found');
            return;
        }
        
        tbody.innerHTML = '';
        const orders = data.orders || [];
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No orders found</td></tr>';
            return;
        }
        
        orders.forEach(order => {
            const statusClass = order.status || 'pending';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>#${order.order_number || order.id}</strong></td>
                    <td>
                        <div class="customer-cell">
                            <div class="customer-avatar">${(order.customer_name || '?').charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="customer-name">${order.customer_name}</div>
                                <div class="customer-email">${order.customer_email}</div>
                            </div>
                        </div>
                    </td>
                    <td><strong>$${order.total_price}</strong></td>
                    <td><span class="status-badge ${statusClass}">${statusClass}</span></td>
                    <td>${new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="viewOrder(${order.id})"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-sm btn-success" onclick="printInvoice(${order.id})"><i class="fas fa-print"></i></button>
                    </td>
                </tr>
            `;
        });
        
    } catch (err) {
        console.error('❌ Error loading orders:', err);
    }
}

async function viewOrder(id) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/orders/${id}`);
        if (!res) return;
        
        const order = await res.json();
        const itemsList = order.items.map(i => `- ${i.product_name} x${i.quantity} = $${i.subtotal}`).join('\n');
        
        alert(`Order #${order.order_number}\nCustomer: ${order.customer_name}\nTotal: $${order.total_price}\nStatus: ${order.status}\n\nItems:\n${itemsList}`);
    } catch (err) {
        showToast('Failed to load order', 'error');
    }
}

async function printInvoice(id) {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/orders/${id}`);
        if (!res) return;
        
        const order = await res.json();
        const content = document.getElementById('invoice-content');
        if (!content) return;
        
        content.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
                <div>
                    <strong>Invoice #:</strong> ${order.order_number || order.id}<br>
                    <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}
                </div>
                <div style="text-align:right;">
                    <strong>Customer:</strong><br>
                    ${order.customer_name}<br>
                    ${order.customer_email}<br>
                    ${order.customer_phone || ''}
                </div>
            </div>
            <table style="width:100%; border-collapse:collapse; margin:20px 0;">
                <thead>
                    <tr style="background:#f1f5f9;">
                        <th style="padding:10px; text-align:left;">Product</th>
                        <th style="padding:10px;">Qty</th>
                        <th style="padding:10px;">Price</th>
                        <th style="padding:10px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(i => `
                        <tr style="border-bottom:1px solid #e2e8f0;">
                            <td style="padding:10px;">${i.product_name}</td>
                            <td style="padding:10px; text-align:center;">${i.quantity}</td>
                            <td style="padding:10px; text-align:right;">$${i.price}</td>
                            <td style="padding:10px; text-align:right;">$${i.subtotal}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="text-align:right; font-size:18px; margin-top:20px;">
                ${order.discount_code ? `<p>Discount (${order.discount_code}): -$${order.discount_amount}</p>` : ''}
                <p><strong>Total: $${order.total_price}</strong></p>
                <p style="font-size:14px;">Status: ${order.status} | Payment: ${order.payment_status}</p>
            </div>
        `;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const invoicePrint = document.getElementById('invoice-print');
            if (invoicePrint) {
                printWindow.document.write(`<html><head><title>Invoice #${order.order_number || order.id}</title></head><body>${invoicePrint.innerHTML}</body></html>`);
                printWindow.document.close();
                printWindow.print();
            }
        }
    } catch (err) {
        showToast('Failed to print invoice', 'error');
    }
}

// ============================================
// USER FUNCTIONS
// ============================================
async function loadUsers() {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/users`);
        if (!res) return;
        
        const data = await res.json();
        console.log('👥 Users data:', data);
        
        const tbody = document.getElementById('user-table-body');
        if (!tbody) {
            console.warn('⚠️ user-table-body not found');
            return;
        }
        
        tbody.innerHTML = '';
        const users = data.users || [];
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No users found</td></tr>';
            return;
        }
        
        users.forEach(user => {
            const statusClass = user.is_banned ? 'banned' : 'active';
            const statusText = user.is_banned ? 'Banned' : 'Active';
            const actionBtn = user.is_banned 
                ? `<button class="btn btn-sm btn-success" onclick="openBanModal(${user.id}, '${user.name}', false)"><i class="fas fa-unlock"></i> Unban</button>`
                : `<button class="btn btn-sm btn-danger" onclick="openBanModal(${user.id}, '${user.name}', true)"><i class="fas fa-ban"></i> Ban</button>`;
            
            tbody.innerHTML += `
                <tr>
                    <td>
                        <div class="customer-cell">
                            <div class="customer-avatar">${(user.name || '?').charAt(0).toUpperCase()}</div>
                            <strong>${user.name}</strong>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td><span class="status-badge active">${user.role}</span></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        });
        
    } catch (err) {
        console.error('❌ Error loading users:', err);
    }
}

async function handleBanSubmit(e) {
    e.preventDefault();
    
    const userId = document.getElementById('banUserId').value;
    const action = document.getElementById('banAction').value;
    const reason = document.getElementById('banReason').value;
    
    try {
        await fetchWithAuth(`${API_URL}/admin/users/${userId}`, { 
            method: 'PUT', 
            body: JSON.stringify({ 
                is_banned: action === 'ban', 
                banned_reason: reason 
            }) 
        });
        
        showToast(action === 'ban' ? 'User banned!' : 'User unbanned!', 'success');
        closeBanModal();
        loadUsers();
    } catch (err) {
        showToast('Failed to update user', 'error');
    }
}

// ============================================
// DISCOUNT FUNCTIONS
// ============================================
async function loadDiscounts() {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/discounts`);
        if (!res) return;
        
        const data = await res.json();
        console.log('🏷️ Discounts data:', data);
        
        const tbody = document.getElementById('discount-table-body');
        if (!tbody) {
            console.warn('⚠️ discount-table-body not found');
            return;
        }
        
        tbody.innerHTML = '';
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No discounts found</td></tr>';
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
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="deleteDiscount(${d.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
    } catch (err) {
        console.error('❌ Error loading discounts:', err);
    }
}

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
        await fetchWithAuth(`${API_URL}/admin/discounts`, { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
        
        showToast('កូដបញ្ចុះតម្លៃត្ូវបានបង្កើត!', 'success');
        closeDiscountModal();
        loadDiscounts();
    } catch (err) {
        showToast('មានកំហុសក្នុងការបង្ើតកូដ', 'error');
    }
}

async function deleteDiscount(id) {
    if (!confirm('តើអ្កប្រាកដជាចង់លុបកូដនេះ?')) return;
    try { 
        await fetchWithAuth(`${API_URL}/admin/discounts/${id}`, { method: 'DELETE' }); 
        showToast('កូដត្រូវបានលុប!', 'success'); 
        loadDiscounts(); 
    } catch (err) { 
        showToast('មានកំហុសក្នុងការលុប', 'error'); 
    }
}

// ============================================
// STOCK FUNCTIONS
// ============================================
async function loadStock() {
    try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        
        const tbody = document.getElementById('stock-table-body');
        if (!tbody) {
            console.warn('⚠️ stock-table-body not found');
            return;
        }
        
        tbody.innerHTML = '';
        const products = data.products || data || [];
        let total = 0, low = 0, ok = 0;
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No products</td></tr>';
            return;
        }
        
        products.forEach(p => {
            total++;
            if (p.stock <= (p.min_stock || 5)) low++; else ok++;
            
            const stockColor = p.stock <= (p.min_stock || 5) ? 'var(--danger)' : 'var(--success)';
            
            tbody.innerHTML += `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td><code>${p.sku || '-'}</code></td>
                    <td><span style="color:${stockColor}; font-weight:700; font-size:16px;">${p.stock}</span></td>
                    <td>${p.min_stock || 5}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="openStockModal(${p.id}, '${p.name}', ${p.stock})">
                            <i class="fas fa-edit"></i> កែស្តុក
                        </button>
                    </td>
                </tr>
            `;
        });
        
        const stockTotal = document.getElementById('stock-total');
        const stockLow = document.getElementById('stock-low');
        const stockOk = document.getElementById('stock-ok');
        
        if (stockTotal) stockTotal.innerText = total;
        if (stockLow) stockLow.innerText = low;
        if (stockOk) stockOk.innerText = ok;
        
    } catch (err) {
        console.error('❌ Stock load error:', err);
    }
}

async function handleStockSubmit(e) {
    e.preventDefault();
    
    const productId = document.getElementById('stockProductId').value;
    const type = document.getElementById('stockType').value;
    let quantity = parseInt(document.getElementById('stockQuantity').value);
    
    if (type === 'sale') quantity = -quantity;
    
    const data = { 
        product_id: parseInt(productId), 
        quantity: quantity, 
        movement_type: type, 
        notes: document.getElementById('stockNotes').value, 
        created_by: 'Admin' 
    };
    
    try {
        await fetchWithAuth(`${API_URL}/admin/stock-movements`, { 
            method: 'POST', 
            body: JSON.stringify(data) 
        });
        
        showToast('ស្តុកត្រូវបានកែសម្រួល!', 'success');
        closeStockModal();
        loadStock();
    } catch (err) {
        showToast('មានកំហុសក្នុងការកែស្តុក', 'error');
    }
}

// ============================================
// SETTINGS FUNCTIONS
// ============================================
async function loadSettings() {
    try {
        const res = await fetchWithAuth(`${API_URL}/admin/settings`);
        if (!res) return;
        
        const data = await res.json();
        
        const storeName = document.getElementById('setting-store-name');
        const email = document.getElementById('setting-email');
        const phone = document.getElementById('setting-phone');
        const address = document.getElementById('setting-address');
        
        if (storeName) storeName.value = data.store_name || '';
        if (email) email.value = data.admin_email || '';
        if (phone) phone.value = data.phone || '';
        if (address) address.value = data.address || '';
        
    } catch (err) {
        console.error('❌ Settings load error:', err);
    }
}

async function saveSettings() {
    const data = { 
        store_name: document.getElementById('setting-store-name').value, 
        admin_email: document.getElementById('setting-email').value, 
        phone: document.getElementById('setting-phone').value, 
        address: document.getElementById('setting-address').value 
    };
    
    try { 
        await fetchWithAuth(`${API_URL}/admin/settings`, { 
            method: 'PUT', 
            body: JSON.stringify(data) 
        }); 
        showToast('ការកំណត់ត្រូវបានរក្សាទុក!', 'success'); 
    } catch (err) { 
        showToast('មានកំហុសក្ុងការរក្សាទុក', 'error'); 
    }
}

// ============================================
// INVENTORY ALERTS
// ============================================
function showInventoryAlerts() {
    fetchWithAuth(`${API_URL}/admin/inventory-alerts`)
        .then(res => res ? res.json() : null)
        .then(alerts => {
            if (!alerts) return;
            
            const list = document.getElementById('inventory-list');
            if (!list) return;
            
            if (alerts.length === 0) { 
                list.innerHTML = '<p style="text-align:center; color:var(--text-secondary); padding:20px;"><i class="fas fa-check-circle" style="color:var(--success); font-size:40px; margin-bottom:10px; display:block;"></i>All products are well stocked!</p>'; 
            } else {
                list.innerHTML = alerts.map(a => `
                    <div style="display:flex; align-items:center; gap:12px; padding:12px; border:1px solid var(--border); border-radius:8px; margin-bottom:8px; background:${a.status === 'Out of Stock' ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)'};">
                        <div style="width:40px; height:40px; border-radius:8px; background:${a.status === 'Out of Stock' ? 'var(--danger)' : 'var(--warning)'}; color:white; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-${a.status === 'Out of Stock' ? 'times' : 'exclamation'}"></i>
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:600;">${a.name}</div>
                            <div style="font-size:12px; color:var(--text-secondary);">${a.status} - ${a.stock} left</div>
                        </div>
                    </div>
                `).join('');
            }
            
            const modal = document.getElementById('inventoryModal');
            if (modal) modal.classList.add('active');
        });
}
