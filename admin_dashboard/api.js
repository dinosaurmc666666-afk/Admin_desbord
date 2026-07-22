// ============================================
// API Configuration & Helper Functions
// ============================================

// ⚠️ ប្តូរ URL នេះទៅជា Tunnel URL របស់អ្នក
const API_BASE = 'https://api.anajakcode.site';
// សម្រាប់ Localhost: const API_BASE = 'http://localhost:15660';

const API = {
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
        fetch(`${API_BASE}/api/admin/stats`).then(r => r.json())
};

// Logout Function (Simple)
function logout() {
    if (confirm('តើអ្នកចង់ចាកចេញពី Admin Panel?')) {
        window.location.href = '/'; // Redirect to home page
    }
}
