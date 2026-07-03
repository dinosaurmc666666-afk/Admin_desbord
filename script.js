// API Configuration
const API_BASE = 'https://us.apsara.lol:15660/api';

// Global Variables
let products = [];
let orders = [];
let users = [];
let editingProductId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateDate();
    setupNavigation();
    loadDashboard();
    loadProducts();
    setupProductModal();
    setupSearchAndFilters();
});

// Update Date
function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('km-KH', options);
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            showSection(section);
            
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        if (confirm('តើអ្នកពិតជាចង់ចាកចេញមែនទេ?')) {
            window.location.href = '../user/index.html';
        }
    });
}

function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${sectionName}Section`).classList.add('active');
    
    const titles = {
        'dashboard': 'Dashboard',
        'products': 'គ្រប់គ្រងទំនិញ',
        'orders': 'ការបញ្ជាទិញ',
        'users': 'អ្នកប្រើបរាស់'
    };
    document.getElementById('pageTitle').textContent = titles[sectionName];
    
    if (sectionName === 'products') loadProducts();
    if (sectionName === 'orders') loadOrders();
    if (sectionName === 'users') loadUsers();
}

// Dashboard
async function loadDashboard() {
    try {
        const [productsRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE}/products/`),
            fetch(`${API_BASE}/orders/user/1`).catch(() => ({ json: () => [] }))
        ]);
        
        products = await productsRes.json();
        orders = await ordersRes.json();
        
        document.getElementById('totalProducts').textContent = products.length;
        document.getElementById('totalOrders').textContent = orders.length;
        document.getElementById('totalUsers').textContent = '0'; // ត្រូវបន្ថែម API ដើម្បីយកចំនួន user
        document.getElementById('totalRevenue').textContent = 
            '$' + orders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2);
        
        // Recent Orders
        const recentOrders = orders.slice(-5).reverse();
        const recentBody = document.getElementById('recentOrdersBody');
        recentBody.innerHTML = recentOrders.map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>User ${o.user_id}</td>
                <td>${o.items?.length || 0} ទំនិញ</td>
                <td class="text-success">$${o.total_amount}</td>
                <td><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
                <td>${new Date(o.created_at).toLocaleDateString('km-KH')}</td>
            </tr>
        `).join('');
        
        if (recentOrders.length === 0) {
            recentBody.innerHTML = '<tr><td colspan="6" class="text-center">មិនមានការបញ្ជាទិញ</td></tr>';
        }
    } catch (err) {
        console.error('Failed to load dashboard:', err);
        showToast('មិនអាចផ្ទុកទិន្នន័យ Dashboard បាន', 'error');
    }
}

// Products Management
async function loadProducts() {
    try {
        const res = await fetch(`${API_BASE}/products/`);
        products = await res.json();
        renderProducts(products);
    } catch (err) {
        console.error('Failed to load products:', err);
        showToast('មិនអាចផ្ទុកទំនិញបាន', 'error');
    }
}

function renderProducts(productsToRender) {
    const tbody = document.getElementById('productsTableBody');
    
    if (productsToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>មិនមានទំនិញ</h3>
                        <p>ចុចប៊ូតុង "បន្ថែមទំនិញ" ដើម្បីបន្ថែមទំនិញថ្មី</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = productsToRender.map(p => `
        <tr>
            <td>
                <img src="${API_BASE}${p.image_url}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/60'">
            </td>
            <td><strong>${p.title}</strong></td>
            <td>$${p.original_price}</td>
            <td class="text-success">$${p.discount_price}</td>
            <td>${p.description.substring(0, 50)}${p.description.length > 50 ? '...' : ''}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editProduct(${p.id})" title="កែប្រែ">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})" title="លុប">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Product Modal
function setupProductModal() {
    const modal = document.getElementById('productModal');
    const closeBtn = document.querySelector('#productModal .close-btn');
    const addBtn = document.getElementById('addProductBtn');
    const form = document.getElementById('productForm');
    const imageInput = document.getElementById('productImage');
    const imagePreview = document.getElementById('imagePreview');

    // Open Modal
    addBtn.onclick = () => {
        editingProductId = null;
        document.getElementById('modalTitle').textContent = 'បន្ថែមទំនិញថ្មី';
        form.reset();
        imagePreview.innerHTML = '';
        modal.classList.add('active');
    };

    // Close Modal
    closeBtn.onclick = () => modal.classList.remove('active');
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.onclick = () => modal.classList.remove('active');
    });
    
    window.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
    };

    // Image Preview
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('ទំហំរូបភាពមិនលើសពី 5MB', 'error');
                imageInput.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('title', document.getElementById('productTitle').value.trim());
        formData.append('original_price', parseFloat(document.getElementById('productOriginalPrice').value));
        formData.append('discount_price', parseFloat(document.getElementById('productDiscountPrice').value));
        formData.append('description', document.getElementById('productDescription').value.trim());
        
        const imageFile = document.getElementById('productImage').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        try {
            let res;
            if (editingProductId) {
                // Edit mode (ត្រូវបន្ថែម API endpoint សម្រាប់ edit)
                res = await fetch(`${API_BASE}/products/${editingProductId}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                // Add mode
                res = await fetch(`${API_BASE}/products/`, {
                    method: 'POST',
                    body: formData
                });
            }
            
            if (res.ok) {
                showToast(editingProductId ? 'កែប្រែទំនិញជោគជ័យ!' : 'បន្ថែមទំនិញជោគជ័យ!', 'success');
                modal.classList.remove('active');
                form.reset();
                imagePreview.innerHTML = '';
                editingProductId = null;
                loadProducts();
                loadDashboard();
            } else {
                const error = await res.json();
                showToast(error.detail || 'មានបញ្ហាក្នុងការរក្សាទុក', 'error');
            }
        } catch (err) {
            console.error('Failed to save product:', err);
            showToast('មិនអាចភ្ជាប់ទៅកាន់ Server បាន', 'error');
        }
    });
}

// Edit Product
async function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'កែប្រែទំនិញ';
    document.getElementById('productId').value = id;
    document.getElementById('productTitle').value = product.title;
    document.getElementById('productOriginalPrice').value = product.original_price;
    document.getElementById('productDiscountPrice').value = product.discount_price;
    document.getElementById('productDescription').value = product.description;
    
    // Show current image
    const imagePreview = document.getElementById('imagePreview');
    imagePreview.innerHTML = `<img src="${API_BASE}${product.image_url}" alt="Current">`;
    
    document.getElementById('productModal').classList.add('active');
}

// Delete Product
async function deleteProduct(id) {
    if (!confirm('តើអ្នកពិតជាចង់លុបទំនិញនេះមែនទេ?\n\nការលុបនេះមិនអាចត្រឡប់មកវិញបានទេ!')) {
        return;
    }
    
    try {
        // ត្រូវបន្ថែម DELETE endpoint ក្នុង Backend
        const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            showToast('លុបទំនិញជោគជ័យ', 'success');
            loadProducts();
            loadDashboard();
        } else {
            showToast('មិនអាចលុបទំនិញបាន', 'error');
        }
    } catch (err) {
        console.error('Failed to delete product:', err);
        showToast('មានបញ្ហាក្ុងការភ្ជាប់', 'error');
    }
}

// Orders Management
async function loadOrders() {
    try {
        const res = await fetch(`${API_BASE}/orders/user/1`).catch(() => ({ json: () => [] }));
        orders = await res.json();
        renderOrders(orders);
    } catch (err) {
        console.error('Failed to load orders:', err);
        showToast('មិនអាចផ្ទុកការបញ្ជាទិញបាន', 'error');
    }
}

function renderOrders(ordersToRender) {
    const tbody = document.getElementById('ordersTableBody');
    
    if (ordersToRender.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <h3>មិនមានការបញ្ជាទិញ</h3>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = ordersToRender.map(o => `
        <tr>
            <td><strong>#${o.id}</strong></td>
            <td>User ${o.user_id}</td>
            <td>${o.items?.length || 0} ទំនិញ</td>
            <td class="text-success">$${o.total_amount}</td>
            <td><span class="status-badge status-${o.status.toLowerCase()}">${o.status}</span></td>
            <td>${new Date(o.created_at).toLocaleString('km-KH')}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewOrder(${o.id})">
                    <i class="fas fa-eye"></i> មើល
                </button>
            </td>
        </tr>
    `).join('');
}

function viewOrder(id) {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    
    const modal = document.getElementById('orderModal');
    const details = document.getElementById('orderDetails');
    
    details.innerHTML = `
        <div class="order-detail-item">
            <span class="order-detail-label">លេខ Order:</span>
            <span class="order-detail-value">#${order.id}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">User ID:</span>
            <span class="order-detail-value">${order.user_id}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">សរុប:</span>
            <span class="order-detail-value">$${order.total_amount}</span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">ស្ថានភាព:</span>
            <span class="order-detail-value"><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></span>
        </div>
        <div class="order-detail-item">
            <span class="order-detail-label">កាលបរិច្ឆេទ:</span>
            <span class="order-detail-value">${new Date(order.created_at).toLocaleString('km-KH')}</span>
        </div>
    `;
    
    modal.classList.add('active');
}

// Users Management
async function loadUsers() {
    try {
        // ត្រូវបន្ថែម API endpoint /users/ ក្នុង Backend
        // បច្ចុប្បន្គ្រាន់តែបង្ហាញ mock data
        users = [];
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>មិនទាន់មានអ្នកប្រើប្រាស់</h3>
                        <p>ឬត្រូវបន្ថែម API endpoint /users/</p>
                    </div>
                </td>
            </tr>
        `;
    } catch (err) {
        console.error('Failed to load users:', err);
    }
}

// Search and Filters
function setupSearchAndFilters() {
    // Product Search
    document.getElementById('productSearch')?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const filtered = products.filter(p => 
            p.title.toLowerCase().includes(search) ||
            p.description.toLowerCase().includes(search)
        );
        renderProducts(filtered);
    });

    // Product Sort
    document.getElementById('productSort')?.addEventListener('change', (e) => {
        const sort = e.target.value;
        let sorted = [...products];
        
        if (sort === 'price-low') {
            sorted.sort((a, b) => a.discount_price - b.discount_price);
        } else if (sort === 'price-high') {
            sorted.sort((a, b) => b.discount_price - a.discount_price);
        }
        
        renderProducts(sorted);
    });

    // Order Search
    document.getElementById('orderSearch')?.addEventListener('input', (e) => {
        const search = e.target.value.toLowerCase();
        const filtered = orders.filter(o => 
            o.id.toString().includes(search) ||
            o.user_id.toString().includes(search)
        );
        renderOrders(filtered);
    });

    // Order Status Filter
    document.getElementById('orderStatusFilter')?.addEventListener('change', (e) => {
        const status = e.target.value;
        if (status === 'all') {
            renderOrders(orders);
        } else {
            const filtered = orders.filter(o => o.status === status);
            renderOrders(filtered);
        }
    });

    // User Search
    document.getElementById('userSearch')?.addEventListener('input', (e) => {
        // Implement user search when API is available
    });
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Close all modals on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }
});
