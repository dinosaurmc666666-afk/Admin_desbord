import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ✅ Firebase Config របស់អ្នក
const firebaseConfig = {
    apiKey: "AIzaSyC42F7V4_h1VmAtAWuoFL8TxW-b3ym-524",
    authDomain: "ahnajakcode.firebaseapp.com",
    databaseURL: "https://ahnajakcode-default-rtdb.firebaseio.com",
    projectId: "ahnajakcode",
    storageBucket: "ahnajakcode.firebasestorage.app",
    messagingSenderId: "540215503567",
    appId: "1:540215503567:web:c05f16eb75d1da6c3da5ba"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let editingProductId = null;

// ========== LOGIN & LOGOUT ==========
window.login = function() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    if(u === 'admin' && p === '123456') {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadAllData();
        listenForChanges(); // ✅ ចាប់ផតើមស្តាប់ការផ្លាស់ប្តូរពី User
    } else {
        alert('Invalid credentials!');
    }
}

window.logout = function() {
    location.reload();
}

// ========== REAL-TIME SYNC (សំខាន់!) ==========
function listenForChanges() {
    console.log("🔄 Listening for changes from User Dashboard...");
    
    // ស្តាប់ Products (ពេល User ទិញ Stock នឹងថយ)
    onValue(ref(database, 'products'), (snap) => {
        loadProductsTable();
        loadStats();
    });

    // ស្ាប់ Orders (ពេល User Checkout Order នឹងចូលមក)
    onValue(ref(database, 'orders'), (snap) => {
        loadOrdersTable();
        loadStats();
    });
}

// ========== NAVIGATION ==========
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(btn.dataset.section + 'Section').classList.add('active');
        });
    });
});

// ========== PRODUCTS FUNCTIONS ==========
function loadProductsTable() {
    get(ref(database, 'products')).then(snap => {
        const data = snap.val() || {};
        const arr = Object.entries(data).map(([id, val]) => ({id, ...val}));
        const tbody = document.getElementById('productsTable');
        
        if(arr.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = arr.map(p => `
            <tr>
                <td>#${p.id}</td>
                <td><img src="${p.image || 'https://via.placeholder.com/50'}" width="40"></td>
                <td>${p.name}</td>
                <td>$${parseFloat(p.price).toFixed(2)}</td>
                <td>${p.stock}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    });
}

// ✅ ដំណោះស្រាយ Button Add Product (Assign to window)
window.showAddProductModal = function() {
    editingProductId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Add New Product';
    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productDescription').value = '';
    document.getElementById('productModal').classList.add('active');
}

window.editProduct = async function(id) {
    const snap = await get(ref(database, 'products/' + id));
    const p = snap.val();
    if(!p) return;
    
    editingProductId = id;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Product';
    document.getElementById('productName').value = p.name;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productStock').value = p.stock;
    document.getElementById('productImage').value = p.image || '';
    document.getElementById('productDescription').value = p.description || '';
    document.getElementById('productModal').classList.add('active');
}

window.saveProduct = async function() {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const image = document.getElementById('productImage').value.trim();
    const desc = document.getElementById('productDescription').value.trim();

    if(!name || isNaN(price) || isNaN(stock)) return alert('Please fill required fields!');

    try {
        if(editingProductId) {
            await update(ref(database, 'products/' + editingProductId), { name, price, stock, image, description: desc });
        } else {
            const snap = await get(ref(database, 'products'));
            const current = snap.val() || {};
            const newId = Object.keys(current).length > 0 ? Math.max(...Object.keys(current).map(k=>parseInt(k))) + 1 : 1;
            
            // ✅ ដាក់ទិន្នន័យចូល Firebase -> User នឹងឃើញភ្ាមៗ
            await set(ref(database, 'products/' + newId), { name, price, stock, image, description: desc });
        }
        closeModal();
        alert('✅ Saved! Check User Dashboard (/products) now.');
    } catch(e) {
        console.error(e);
        alert('Error saving product');
    }
}

window.deleteProduct = async function(id) {
    if(confirm('Delete this product?')) {
        await remove(ref(database, 'products/' + id));
    }
}

window.closeModal = function() {
    document.getElementById('productModal').classList.remove('active');
}

// ========== ORDERS & STATS ==========
function loadOrdersTable() {
    get(ref(database, 'orders')).then(snap => {
        const data = snap.val() || {};
        const arr = Object.entries(data).map(([id, val]) => ({id, ...val})).reverse(); // ថ្មីបង្ហាញមុន
        
        const tbody = document.getElementById('ordersTable');
        if(arr.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center">No orders yet</td></tr>';
            return;
        }

        tbody.innerHTML = arr.map(o => `
            <tr>
                <td>#${o.id}</td>
                <td>${o.userName}</td>
                <td>${o.productName}</td>
                <td>${o.quantity}</td>
                <td>$${parseFloat(o.total).toFixed(2)}</td>
                <td>${o.date}</td>
                <td><span class="badge ${o.status}">${o.status}</span></td>
                <td>
                    <select onchange="updateStatus('${o.id}', this.value)" class="status-select">
                        <option value="Pending" ${o.status=='Pending'?'selected':''}>Pending</option>
                        <option value="Completed" ${o.status=='Completed'?'selected':''}>Completed</option>
                        <option value="Cancelled" ${o.status=='Cancelled'?'selected':''}>Cancelled</option>
                    </select>
                </td>
            </tr>
        `).join('');
    });
}

window.updateStatus = function(id, status) {
    update(ref(database, 'orders/' + id), { status });
}

function loadStats() {
    Promise.all([get(ref(database, 'products')), get(ref(database, 'orders'))]).then(([pSnap, oSnap]) => {
        const products = Object.keys(pSnap.val() || {}).length;
        const orders = Object.values(oSnap.val() || {});
        const revenue = orders.filter(o=>o.status==='Completed').reduce((s,o)=>s+parseFloat(o.total),0);
        
        document.getElementById('statsGrid').innerHTML = `
            <div class="stat-card"><h3><i class="fas fa-box"></i> Products</h3><div class="val">${products}</div></div>
            <div class="stat-card green"><h3><i class="fas fa-dollar-sign"></i> Revenue</h3><div class="val">$${revenue.toFixed(2)}</div></div>
            <div class="stat-card blue"><h3><i class="fas fa-shopping-bag"></i> Orders</h3><div class="val">${orders.length}</div></div>
        `;
    });
}

function loadAllData() {
    loadProductsTable();
    loadOrdersTable();
    loadStats();
            }
