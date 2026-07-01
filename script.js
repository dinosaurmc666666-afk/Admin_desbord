// ==================== DATA ====================
const STORAGE_KEY = 'storeData';

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

// ==================== BROADCAST CHANNEL ====================
const channel = new BroadcastChannel('store_channel');
channel.addEventListener('message', function(e) {
  if (e.data.type === 'refresh') {
    appData = loadData();
    if (currentPage === 'products') renderProducts();
    else if (currentPage === 'cart') renderCart();
    else if (currentPage === 'orders') renderOrders();
    updateCartBadge();
  }
});

// ==================== STORAGE EVENT (fallback) ====================
window.addEventListener('storage', function(e) {
  if (e.key === STORAGE_KEY) {
    appData = loadData();
    if (currentPage === 'products') renderProducts();
    else if (currentPage === 'cart') renderCart();
    else if (currentPage === 'orders') renderOrders();
    updateCartBadge();
  }
});

// ==================== STATE ====================
let appData = loadData();
let cart = JSON.parse(localStorage.getItem('userCart')) || [];
let currentPage = 'products';

// ==================== DOM REFS ====================
const productGrid = document.getElementById('productGrid');
const cartContent = document.getElementById('cartContent');
const ordersContent = document.getElementById('ordersContent');
const cartCount = document.getElementById('cartCount');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

const checkoutModal = document.getElementById('checkoutModal');
const checkoutTotal = document.getElementById('checkoutTotal');
const customerNameInput = document.getElementById('customerName');
const checkoutConfirm = document.getElementById('checkoutConfirm');
const checkoutCancel = document.getElementById('checkoutCancel');
const checkoutClose = document.getElementById('checkoutClose');

// ==================== NAVIGATION ====================
const navLinks = document.querySelectorAll('.user-nav .nav-link');
const pages = {
  products: document.getElementById('page-products'),
  cart: document.getElementById('page-cart'),
  orders: document.getElementById('page-orders')
};

function navigateTo(page) {
  Object.values(pages).forEach(p => p.classList.remove('active'));
  if (pages[page]) pages[page].classList.add('active');
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });
  currentPage = page;
  if (page === 'products') renderProducts();
  else if (page === 'cart') renderCart();
  else if (page === 'orders') renderOrders();
}

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo(link.dataset.page);
  });
});

// ==================== PRODUCTS ====================
function renderProducts() {
  if (!appData) {
    productGrid.innerHTML = '<p>No data. Please reset data from admin.</p>';
    return;
  }
  const products = appData.products || [];
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;

  const filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(search);
    const matchCategory = category === '' || p.category === category;
    return matchName && matchCategory;
  });

  if (!filtered.length) {
    productGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#94a3b8;">No products found.</p>';
    return;
  }

  productGrid.innerHTML = filtered.map(p => {
    const inCart = cart.some(item => item.id === p.id);
    const stock = p.stock > 0;
    return `
      <div class="product-card">
        <img src="${p.image || 'https://via.placeholder.com/200'}" alt="${p.name}" />
        <div class="info">
          <h4>${p.name}</h4>
          <div class="category">${p.category || 'Other'}</div>
          <div class="price">$${p.price.toFixed(2)}</div>
          <div class="stock ${stock ? '' : 'out'}">${stock ? `In stock (${p.stock})` : 'Out of stock'}</div>
          <div class="actions">
            <button class="btn-add" data-id="${p.id}" ${!stock || inCart ? 'disabled' : ''}>
              ${inCart ? 'In Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  productGrid.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      addToCart(id);
    });
  });
}

function addToCart(productId) {
  if (!appData) return;
  const product = appData.products.find(p => p.id === productId);
  if (!product || product.stock <= 0) return;
  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (existing.qty < product.stock) {
      existing.qty++;
    } else {
      alert('Not enough stock.');
      return;
    }
  } else {
    cart.push({ id: productId, qty: 1 });
  }
  localStorage.setItem('userCart', JSON.stringify(cart));
  updateCartBadge();
  renderProducts();
  if (currentPage === 'cart') renderCart();
}

function updateCartBadge() {
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  cartCount.textContent = total;
}

// ==================== CART ====================
function renderCart() {
  if (!cart.length) {
    cartContent.innerHTML = `<div class="cart-empty">Your cart is empty.</div>`;
    return;
  }

  let html = '';
  let total = 0;
  cart.forEach(item => {
    const product = appData ? appData.products.find(p => p.id === item.id) : null;
    if (!product) return;
    const subtotal = product.price * item.qty;
    total += subtotal;
    html += `
      <div class="cart-item">
        <img src="${product.image || 'https://via.placeholder.com/200'}" alt="${product.name}" />
        <div class="details">
          <h4>${product.name}</h4>
          <div class="price">$${product.price.toFixed(2)} each</div>
        </div>
        <div class="qty-control">
          <button class="qty-dec" data-id="${item.id}">-</button>
          <span>${item.qty}</span>
          <button class="qty-inc" data-id="${item.id}">+</button>
        </div>
        <div class="subtotal">$${subtotal.toFixed(2)}</div>
        <button class="remove-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
      </div>
    `;
  });

  html += `
    <div class="cart-total">Total: $${total.toFixed(2)}</div>
    <div style="text-align:right;">
      <button class="checkout-btn" id="checkoutBtn" ${cart.length === 0 ? 'disabled' : ''}>Proceed to Checkout</button>
    </div>
  `;

  cartContent.innerHTML = html;

  cartContent.querySelectorAll('.qty-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      changeQty(id, 1);
    });
  });
  cartContent.querySelectorAll('.qty-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      changeQty(id, -1);
    });
  });
  cartContent.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      removeFromCart(id);
    });
  });
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const product = appData ? appData.products.find(p => p.id === id) : null;
  if (!product) return;
  const newQty = item.qty + delta;
  if (newQty < 1) {
    removeFromCart(id);
    return;
  }
  if (newQty > product.stock) {
    alert('Not enough stock.');
    return;
  }
  item.qty = newQty;
  localStorage.setItem('userCart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('userCart', JSON.stringify(cart));
  updateCartBadge();
  renderCart();
  if (currentPage === 'products') renderProducts();
}

// ==================== CHECKOUT ====================
function openCheckout() {
  if (!cart.length) return;
  const total = cart.reduce((sum, item) => {
    const product = appData ? appData.products.find(p => p.id === item.id) : null;
    return sum + (product ? product.price * item.qty : 0);
  }, 0);
  checkoutTotal.textContent = total.toFixed(2);
  customerNameInput.value = '';
  checkoutModal.classList.add('active');
}

function closeCheckout() {
  checkoutModal.classList.remove('active');
}

checkoutCancel.addEventListener('click', closeCheckout);
checkoutClose.addEventListener('click', closeCheckout);
checkoutModal.addEventListener('click', (e) => {
  if (e.target === checkoutModal) closeCheckout();
});

checkoutConfirm.addEventListener('click', () => {
  const name = customerNameInput.value.trim();
  if (!name) {
    alert('Please enter your name.');
    return;
  }
  if (!appData) return;
  const orderProducts = cart.map(item => ({ id: item.id, qty: item.qty }));
  const total = cart.reduce((sum, item) => {
    const product = appData.products.find(p => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);

  const newOrder = {
    id: Date.now(),
    userId: 999,
    products: orderProducts,
    total: total,
    status: 'Pending',
    date: new Date().toISOString().slice(0,10),
    customerName: name
  };
  appData.orders.push(newOrder);
  cart.forEach(item => {
    const product = appData.products.find(p => p.id === item.id);
    if (product) product.stock -= item.qty;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  cart = [];
  localStorage.setItem('userCart', JSON.stringify(cart));
  updateCartBadge();
  closeCheckout();
  renderCart();
  renderProducts();
  if (currentPage === 'orders') renderOrders();
  alert('Order placed successfully!');
});

// ==================== ORDERS ====================
function renderOrders() {
  if (!appData || !appData.orders.length) {
    ordersContent.innerHTML = `<div class="orders-empty">No orders placed yet.</div>`;
    return;
  }
  const userOrders = appData.orders.filter(o => o.userId === 999 || o.customerName);
  if (!userOrders.length) {
    ordersContent.innerHTML = `<div class="orders-empty">No orders for you.</div>`;
    return;
  }
  ordersContent.innerHTML = userOrders.map(o => {
    const itemsHtml = o.products.map(p => {
      const prod = appData.products.find(pr => pr.id === p.id);
      return prod ? `${prod.name} x${p.qty}` : `Product ${p.id} x${p.qty}`;
    }).join(', ');
    return `
      <div class="order-card">
        <div class="order-header">
          <span><strong>Order #${o.id}</strong> - ${o.date}</span>
          <span class="status ${o.status.toLowerCase()}">${o.status}</span>
        </div>
        <div class="order-items">${itemsHtml}</div>
        <div class="order-total">Total: $${o.total.toFixed(2)}</div>
      </div>
    `;
  }).join('');
}

// ==================== LOGOUT ====================
document.getElementById('userLogout').addEventListener('click', () => {
  if (confirm('Logout?')) {
    location.reload();
  }
});

// ==================== FILTERS ====================
searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);

// ==================== INIT ====================
if (!appData) {
  console.warn('No store data found. Please reset data from admin.');
}
updateCartBadge();
navigateTo('products');
