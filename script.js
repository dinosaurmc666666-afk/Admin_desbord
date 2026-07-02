import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

console.log('✅ User Firebase initialized!');

let currentUser = null;
let cart = [];

window.userLogin = async function() {
    console.log(' userLogin() called');
    
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    
    if (!name || !email) {
        alert('Please enter your name and email!');
        return;
    }
    
    try {
        const usersRef = ref(database, 'users');
        const snapshot = await get(usersRef);
        const users = snapshot.val() || {};
        
        let user = Object.values(users).find(u => u.email === email);
        
        if (!user) {
            const userId = Object.keys(users).length + 1;
            user = {
                id: userId,
                name: name,
                email: email,
                registeredDate: new Date().toISOString().split('T')[0]
            };
            await set(ref(database, 'users/' + userId), user);
        }
        
        currentUser = user;
        
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('shopDashboard').style.display = 'block';
        document.getElementById('shopName').textContent = `Welcome, ${name}!`;
        
        loadProducts();
        listenForChanges();
    } catch (error) {
        console.error('Error during login:', error);
        alert('Error during login. Please try again.');
    }
}

window.userLogout = function() {
    currentUser = null;
    cart = [];
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('shopDashboard').style.display = 'none';
    document.getElementById('userName').value = '';
    document.getElementById('userEmail').value = '';
}

function listenForChanges() {
    console.log('🔄 Listening for product changes...');
    
    const productsRef = ref(database, 'products');
    onValue(productsRef, (snapshot) => {
        console.log('📦 Products updated from Firebase');
        loadProducts();
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
            
            if (btn.dataset.tab === 'my-orders') loadMyOrders();
            if (btn.dataset.tab === 'cart') renderCart();
            if (btn.dataset.tab === 'products') loadProducts();
        });
    });
});

function loadProducts() {
    console.log('📦 Loading products from Firebase...');
    
    const productsRef = ref(database, 'products');
    get(productsRef).then((snapshot) => {
        const products = snapshot.val() || {};
        const productsArray = Object.entries(products).map(([id, data]) => ({
            id: id,
            ...data
        }));
        
        const grid = document.getElementById('productsGrid');
        
        if (productsArray.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📦</div>
                    <p>No products available</p>
                    <p style="font-size: 12px; color: #999; margin-top: 10px;">
                        Please add products from Admin Dashboard
                    </p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = productsArray.map(p => `
            <div class="product-card">
                <img src="${p.image || 'https://via.placeholder.com/300/f093fb/ffffff?text=Product'}" 
                     alt="${p.name}" class="product-image" 
                     onerror="this.src='https://via.placeholder.com/300/f093fb/ffffff?text=Product'">
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">$${parseFloat(p.price).toFixed(2)}</div>
                    <div class="product-stock">
                        ${p.stock > 0 ? `✅ In Stock: ${p.stock}` : ' Out of Stock'}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="addToCart('${p.id}')" ${p.stock === 0 ? 'disabled' : ''}>
                            🛒 Add to Cart
                        </button>
                        <button class="btn btn-warning" onclick="viewProduct('${p.id}')">
                            👁️ View More
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }).catch((error) => {
        console.error('Error loading products:', error);
    });
}

window.filterProducts = function() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    
    const productsRef = ref(database, 'products');
    get(productsRef).then((snapshot) => {
        const products = snapshot.val() || {};
        const productsArray = Object.entries(products).map(([id, data]) => ({
            id: id,
            ...data
        }));
        
        const filtered = productsArray.filter(p => 
            p.name.toLowerCase().includes(query) || 
            (p.description && p.description.toLowerCase().includes(query))
        );
        
        const grid = document.getElementById('productsGrid');
        
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>No products found</p></div>';
            return;
        }
        
        grid.innerHTML = filtered.map(p => `
            <div class="product-card">
                <img src="${p.image || 'https://via.placeholder.com/300/f093fb/ffffff?text=Product'}" 
                     alt="${p.name}" class="product-image">
                <div class="product-info">
                    <div class="product-name">${p.name}</div>
                    <div class="product-price">$${parseFloat(p.price).toFixed(2)}</div>
                    <div class="product-stock">
                        ${p.stock > 0 ? `✅ In Stock: ${p.stock}` : ' Out of Stock'}
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-primary" onclick="addToCart('${p.id}')" ${p.stock === 0 ? 'disabled' : ''}>
                            🛒 Add to Cart
                        </button>
                        <button class="btn btn-warning" onclick="viewProduct('${p.id}')">
                            👁️ View More
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    });
}

window.viewProduct = function(id) {
    const productsRef = ref(database, 'products/' + id);
    get(productsRef).then((snapshot) => {
        const product = snapshot.val();
        if (!product) return;
        
        document.getElementById('detailContent').innerHTML = `
            <img src="${product.image || 'https://via.placeholder.com/600/f093fb/ffffff?text=Product'}" 
                 class="detail-image" 
                 onerror="this.src='https://via.placeholder.com/600/f093fb/ffffff?text=Product'">
            <div class="detail-name">${product.name}</div>
            <div class="detail-price">$${parseFloat(product.price).toFixed(2)}</div>
            <div class="detail-description">${product.description || 'No description available'}</div>
            <div class="detail-stock">
                ${product.stock > 0 ? `✅ ${product.stock} items in stock` : '❌ Out of stock'}
            </div>
            <button class="btn btn-primary" onclick="closeDetailModal(); addToCart('${id}')" 
                    ${product.stock === 0 ? 'disabled' : ''}>
                🛒 Add to Cart
            </button>
        `;
        document.getElementById('detailModal').classList.add('active');
    });
}

window.closeDetailModal = function() {
    document.getElementById('detailModal').classList.remove('active');
}

window.addToCart = function(productId) {
    const productsRef = ref(database, 'products/' + productId);
    get(productsRef).then((snapshot) => {
        const product = snapshot.val();
        if (!product || product.stock === 0) return;
        
        const existing = cart.find(item => item.id === productId);
        if (existing) {
            if (existing.quantity < product.stock) {
                existing.quantity++;
            } else {
                alert('Not enough stock!');
                return;
            }
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image
            });
        }
        
        updateCartCount();
        alert(`✅ ${product.name} added to cart!`);
    });
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function renderCart() {
    const content = document.getElementById('cartContent');
    
    if (cart.length === 0) {
        content.innerHTML = `
            <div class="empty-state">
                <div class="icon">🛒</div>
                <p>Your cart is empty</p>
            </div>
        `;
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    content.innerHTML = `
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">$${parseFloat(item.price).toFixed(2)} × ${item.quantity}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                        <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.id}')">🗑️</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="cart-summary">
            <div class="cart-summary-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row">
                <span>Tax (10%):</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="cart-summary-row cart-summary-total">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
            <button class="btn btn-primary checkout-btn" onclick="checkout()">
                💳 Checkout Now
            </button>
        </div>
    `;
}

window.updateQuantity = function(id, change) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    const newQty = item.quantity + change;
    if (newQty <= 0) {
        removeFromCart(id);
        return;
    }
    
    item.quantity = newQty;
    updateCartCount();
    renderCart();
}

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    updateCartCount();
    renderCart();
}

window.showCart = function() {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="cart"]').classList.add('active');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('cartTab').classList.add('active');
    renderCart();
}

window.checkout = async function() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    if (!confirm('Confirm your order?')) return;
    
    try {
        const ordersRef = ref(database, 'orders');
        const ordersSnapshot = await get(ordersRef);
        const orders = ordersSnapshot.val() || {};
        
        for (const item of cart) {
            const newOrderId = Object.keys(orders).length > 0 
                ? Math.max(...Object.keys(orders).map(k => parseInt(k))) + 1 
                : 1001;
            
            await set(ref(database, 'orders/' + newOrderId), {
                userId: currentUser.id,
                userName: currentUser.name,
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                total: item.price * item.quantity,
                date: new Date().toISOString().split('T')[0],
                status: 'Pending'
            });
            
            const productRef = ref(database, 'products/' + item.id);
            const productSnapshot = await get(productRef);
            const product = productSnapshot.val();
            
            if (product) {
                await update(productRef, { stock: product.stock - item.quantity });
            }
        }
        
        cart = [];
        updateCartCount();
        renderCart();
        loadProducts();
        
        alert(`✅ Order placed successfully!`);
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('Error during checkout. Please try again.');
    }
}

window.loadMyOrders = function() {
    if (!currentUser) return;
    
    const ordersRef = ref(database, 'orders');
    get(ordersRef).then((snapshot) => {
        const orders = snapshot.val() || {};
        const myOrders = Object.entries(orders)
            .filter(([id, o]) => o.userId === currentUser.id)
            .map(([id, data]) => ({ id: id, ...data }));
        
        const list = document.getElementById('myOrdersList');
        
        if (myOrders.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📦</div>
                    <p>You haven't placed any orders yet</p>
                </div>
            `;
            return;
        }
        
        const grouped = {};
        myOrders.forEach(o => {
            if (!grouped[o.date]) grouped[o.date] = [];
            grouped[o.date].push(o);
        });
        
        list.innerHTML = Object.entries(grouped).map(([date, items]) => {
            const total = items.reduce((sum, i) => sum + parseFloat(i.total), 0);
            const status = items[0].status;
            return `
                <div class="order-card">
                    <div class="order-header">
                        <div>
                            <div class="order-id">Order #${items[0].id}</div>
                            <div style="color:#888;font-size:13px;">${date}</div>
                        </div>
                        <span class="order-status status-${status}">${status}</span>
                    </div>
                    <div class="order-items">
                        ${items.map(i => `
                            <div class="order-item">
                                <span>${i.productName} × ${i.quantity}</span>
                                <span>$${parseFloat(i.total).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-total">Total: $${total.toFixed(2)}</div>
                </div>
            `;
        }).join('');
    });
}

console.log('✅ User script loaded!');
