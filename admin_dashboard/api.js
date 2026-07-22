// ============================================
// API Configuration & Helper Functions
// ============================================

const API_BASE = 'https://api.anajakcode.site'; // Change this!
// For local testing: const API_BASE = 'http://localhost:15660';

const API = {
    // ---- AUTH ----
    login: (email, password) => 
        fetch(`${API_BASE}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        }).then(r => r.json()),

    // ---- PRODUCTS ----
    getProducts: () => 
        fetch(`${API_BASE}/api/products`).then(r => r.json()),

    getProduct: (id) => 
        fetch(`${API_BASE}/api/products/${id}`).then(r => r.json()),

    addProduct: (data) => 
        fetch(`${API_BASE}/api/admin/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(r => r.json()),

    updateProduct: (id, data) => 
        fetch(`${API_BASE}/api/admin/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(r => r.json()),

    deleteProduct: (id) => 
        fetch(`${API_BASE}/api/admin/products/${id}`, {
            method: 'DELETE'
        }).then(r => r.json()),

    uploadFile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return fetch(`${API_BASE}/api/admin/upload`, {
            method: 'POST',
            body: formData
        }).then(r => r.json());
    },

    // ---- ORDERS ----
    getOrders: () => 
        fetch(`${API_BASE}/api/admin/orders`).then(r => r.json()),

    updateOrderStatus: (id, status) => 
        fetch(`${API_BASE}/api/admin/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        }).then(r => r.json()),

    // ---- USERS ----
    getUsers: () => 
        fetch(`${API_BASE}/api/admin/users`).then(r => r.json()),

    deleteUser: (id) => 
        fetch(`${API_BASE}/api/admin/users/${id}`, {
            method: 'DELETE'
        }).then(r => r.json()),

    banUser: (id) => 
        fetch(`${API_BASE}/api/admin/users/${id}/ban`, {
            method: 'PUT'
        }).then(r => r.json()),

    unbanUser: (id) => 
        fetch(`${API_BASE}/api/admin/users/${id}/unban`, {
            method: 'PUT'
        }).then(r => r.json()),

    // ---- STATS ----
    getStats: () => 
        fetch(`${API_BASE}/api/admin/stats`).then(r => r.json()),

    // ---- DISCOUNTS ----
    getDiscounts: () => 
        fetch(`${API_BASE}/api/admin/discounts`).then(r => r.json()),

    addDiscount: (data) => 
        fetch(`${API_BASE}/api/admin/discounts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(r => r.json()),

    deleteDiscount: (id) => 
        fetch(`${API_BASE}/api/admin/discounts/${id}`, {
            method: 'DELETE'
        }).then(r => r.json())
};

// Auth Guard
function checkAuth() {
    const loggedIn = localStorage.getItem('admin_logged_in');
    if (!loggedIn) {
        window.location.href = './login/index.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_logged_in');
    window.location.href = './login/index.html';
}

function getUserInfo() {
    const data = localStorage.getItem('admin_token');
    return data ? JSON.parse(data) : null;
}
