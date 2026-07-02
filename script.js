// Initialize default data
function initData() {
    if (!localStorage.getItem('products')) {
        const defaultProducts = [
            { id: 1, name: 'iPhone 15 Pro', price: 999, stock: 50, image: 'https://via.placeholder.com/150/667eea/ffffff?text=iPhone', description: 'Latest iPhone with A17 Pro chip and titanium design' },
            { id: 2, name: 'Samsung Galaxy S24', price: 899, stock: 30, image: 'https://via.placeholder.com/150/48bb78/ffffff?text=Galaxy', description: 'Premium Android with AI features' },
            { id: 3, name: 'MacBook Pro M3', price: 1999, stock: 20, image: 'https://via.placeholder.com/150/ed8936/ffffff?text=MacBook', description: 'Powerful laptop with M3 chip' },
            { id: 4, name: 'Sony WH-1000XM5', price: 399, stock: 40, image: 'https://via.placeholder.com/150/f56565/ffffff?text=Sony', description: 'Premium noise-cancelling headphones' }
        ];
        localStorage.setItem('products', JSON.stringify(defaultProducts));
    }
    
    if (!localStorage.getItem('orders')) {
        const defaultOrders = [
            { id: 1001, userId: 1, userName: 'John Doe', productId: 1, productName: 'iPhone 15 Pro', quantity: 2, total: 1998, date: '2026-06-28', status: 'Completed' },
            { id: 1002, userId: 2, userName: 'Jane Smith', productId: 2, productName: 'Samsung Galaxy S24', quantity: 1, total: 899, date: '2026-07-01', status: 'Pending' }
        ];
        localStorage.setItem('orders', JSON.stringify(defaultOrders));
    }
    
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { id: 1, name: 'John Doe', email: 'john@example.com', registeredDate: '2026-01-15' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', registeredDate: '2026-02-20' },
            { id: 3, name: 'Bob Wilson', email: 'bob@example.com', registeredDate: '2026-03-10' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

let editingProductId = null;

// Login
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === '123456') {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadAllData();
    } else {
        alert('Invalid credentials! Use: admin / 123456');
    }
}

function logout() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Navigation
document.addEventListener('DOMContentLoaded', () => {
    initData();
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(btn.dataset.section + 'Section').classList.add('active');
            
            loadAllData();
        });
    });
});

function loadAllData() {
    loadProductsTable();
    loadOrdersTable();
    loadUsersTable();
    loadStats();
}

// Products
function loadProductsTable() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const tbody = document.getElementById('productsTable');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>#${p.id}</td>
            <td><img src="${p.image || 'https://via.placeholder.com/50'}" alt="${p.name}"></td>
            <td>${p.name}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="editProduct(${p.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

function showAddProductModal() {
    editingProductId = null;
    document.getElementById('modalTitle').textContent = 'Add New Product';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productModal').classList.add('active');
}

function editProduct(id) {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productName').value = product.name;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productImage').value = product.image || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productModal').classList.add('active');
}

function saveProduct() {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const image = document.getElementById('productImage').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    
    if (!name || isNaN(price) || isNaN(stock)) {
        alert('Please fill all required fields!');
        return;
    }
    
    let products = JSON.parse(localStorage.getItem('products') || '[]');
    
    if (editingProductId) {
        const idx = products.findIndex(p => p.id === editingProductId);
        products[idx] = { ...products[idx], name, price, stock, image, description };
    } else {
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price, stock, image, description });
    }
    
    localStorage.setItem('products', JSON.stringify(products));
    closeModal();
    loadAllData();
    alert('Product saved successfully!');
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    let products = JSON.parse(localStorage.getItem('products') || '[]');
    products = products.filter(p => p.id !== id);
    localStorage.setItem('products', JSON.stringify(products));
    loadAllData();
    alert('Product deleted!');
}

function closeModal() {
    document.getElementById('productModal').classList.remove('active');
}

// Orders
function loadOrdersTable() {
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const tbody = document.getElementById('ordersTable');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No orders yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${o.userName}</td>
            <td>${o.productName}</td>
            <td>${o.quantity}</td>
            <td>$${o.total.toFixed(2)}</td>
            <td>${o.date}</td>
            <td><span class="status status-${o.status.toLowerCase()}">${o.status}</span></td>
            <td>
                <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:5px;border-radius:5px;">
                    <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
        </tr>
    `).join('');
}

function updateOrderStatus(id, status) {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const idx = orders.findIndex(o => o.id === id);
    orders[idx].status = status;
    localStorage.setItem('orders', JSON.stringify(orders));
    loadStats();
}

// Users
function loadUsersTable() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const tbody = document.getElementById('usersTable');
    
    tbody.innerHTML = users.map(u => {
        const userOrders = orders.filter(o => o.userId === u.id).length;
        return `
            <tr>
                <td>#${u.id}</td>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.registeredDate}</td>
                <td>${userOrders}</td>
            </tr>
        `;
    }).join('');
}

// Stats
function loadStats() {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const totalRevenue = orders
        .filter(o => o.status === 'Completed')
        .reduce((sum, o) => sum + o.total, 0);
    
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    
    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <h3>Total Products</h3>
            <div class="value">${products.length}</div>
        </div>
        <div class="stat-card">
            <h3>Total Revenue</h3>
            <div class="value">$${totalRevenue.toFixed(2)}</div>
        </div>
        <div class="stat-card">
            <h3>Total Orders</h3>
            <div class="value">${orders.length}</div>
        </div>
        <div class="stat-card">
            <h3>Pending Orders</h3>
            <div class="value">${pendingOrders}</div>
        </div>
    `;
}

// Listen for storage changes from user dashboard
window.addEventListener('storage', (e) => {
    if (e.key === 'orders' || e.key === 'products' || e.key === 'users') {
        loadAllData();
    }
});
