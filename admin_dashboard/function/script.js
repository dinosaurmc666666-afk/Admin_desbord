let revenueChart = null;
let realtimeInterval = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Dashboard initialized');
    
    initNavigation();
    initTheme();
    setupKeyboardShortcuts();
    setupModalCloseHandlers();
    
    // Load initial dashboard
    loadDashboard();
});

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    const menuLinks = document.querySelectorAll('.menu-link');
    
    menuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            console.log('🎯 Menu clicked:', section);
            
            switchSection(section);
            
            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('mobile-open');
        });
    });
    
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                if (window.innerWidth <= 768) {
                    sidebar.classList.toggle('mobile-open');
                } else {
                    sidebar.classList.toggle('collapsed');
                }
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.querySelector('.toggle-sidebar');
        if (window.innerWidth <= 768 && sidebar && !sidebar.contains(e.target) && (!menuBtn || !menuBtn.contains(e.target))) {
            sidebar.classList.remove('mobile-open');
        }
    });
}

function switchSection(sectionId) {
    console.log('🔄 Switching to section:', sectionId);
    
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });
    
    const targetSection = document.getElementById(`section-${sectionId}`);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('✅ Section shown:', sectionId);
        loadSectionData(sectionId);
    } else {
        console.error('❌ Section not found:', sectionId);
    }
}

function loadSectionData(sectionId) {
    console.log('📥 Loading data for:', sectionId);
    
    switch(sectionId) {
        case 'dashboard': loadDashboard(); startRealtimeMonitoring(); break;
        case 'products': loadProducts(); break;
        case 'orders': loadOrders(); break;
        case 'users': loadUsers(); break;
        case 'discounts': loadDiscounts(); break;
        case 'stock': loadStock(); break;
        case 'settings': loadSettings(); break;
        default: console.warn('⚠️ Unknown section:', sectionId);
    }
}

// ============================================
// THEME
// ============================================
function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
        });
    }
}

// ============================================
// MODALS
// ============================================
function setupModalCloseHandlers() {
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', (e) => {
            if (e.target === m) m.classList.remove('active');
        });
    });
}

function openProductModal() {
    const title = document.getElementById('productModalTitle');
    if (title) title.innerText = 'បន្ថែមផលិតផលថ្មី';
    const form = document.getElementById('productForm');
    if (form) form.reset();
    const prodId = document.getElementById('prodId');
    if (prodId) prodId.value = '';
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.classList.remove('active');
}

function openDiscountModal() {
    const form = document.getElementById('discountForm');
    if (form) form.reset();
    const discLimitGroup = document.getElementById('discLimitGroup');
    if (discLimitGroup) discLimitGroup.style.display = 'none';
    const discExpiryGroup = document.getElementById('discExpiryGroup');
    if (discExpiryGroup) discExpiryGroup.style.display = 'none';
    const modal = document.getElementById('discountModal');
    if (modal) modal.classList.add('active');
}

function closeDiscountModal() {
    const modal = document.getElementById('discountModal');
    if (modal) modal.classList.remove('active');
}

function toggleDiscLimit() {
    const type = document.getElementById('discLimitType');
    const group = document.getElementById('discLimitGroup');
    if (type && group) group.style.display = type.value === 'fixed' ? 'block' : 'none';
}

function toggleDiscExpiry() {
    const type = document.getElementById('discExpiryType');
    const group = document.getElementById('discExpiryGroup');
    if (type && group) group.style.display = type.value === 'unlimited' ? 'none' : 'block';
}

function openStockModal(productId, productName, currentStock) {
    const productIdInput = document.getElementById('stockProductId');
    const productNameInput = document.getElementById('stockProductName');
    const stockCurrentInput = document.getElementById('stockCurrent');
    
    if (productIdInput) productIdInput.value = productId;
    if (productNameInput) productNameInput.value = productName;
    if (stockCurrentInput) stockCurrentInput.value = currentStock;
    
    const form = document.getElementById('stockForm');
    if (form) form.reset();
    
    if (productIdInput) productIdInput.value = productId;
    if (productNameInput) productNameInput.value = productName;
    if (stockCurrentInput) stockCurrentInput.value = currentStock;
    
    const modal = document.getElementById('stockModal');
    if (modal) modal.classList.add('active');
}

function closeStockModal() {
    const modal = document.getElementById('stockModal');
    if (modal) modal.classList.remove('active');
}

function openBanModal(userId, userName, isBan) {
    const userIdInput = document.getElementById('banUserId');
    const banActionInput = document.getElementById('banAction');
    const modalTitle = document.getElementById('banModalTitle');
    const banReasonGroup = document.getElementById('banReasonGroup');
    const submitBtn = document.getElementById('banSubmitBtn');
    
    if (userIdInput) userIdInput.value = userId;
    if (banActionInput) banActionInput.value = isBan ? 'ban' : 'unban';
    if (modalTitle) modalTitle.innerText = isBan ? `Ban ${userName}` : `Unban ${userName}`;
    if (banReasonGroup) banReasonGroup.style.display = isBan ? 'block' : 'none';
    
    if (submitBtn) {
        submitBtn.innerHTML = isBan ? '<i class="fas fa-ban"></i> Ban' : '<i class="fas fa-unlock"></i> Unban';
        submitBtn.className = isBan ? 'btn btn-danger' : 'btn btn-success';
    }
    
    const modal = document.getElementById('banModal');
    if (modal) modal.classList.add('active');
}

function closeBanModal() {
    const modal = document.getElementById('banModal');
    if (modal) modal.classList.remove('active');
}

function closeInventoryModal() {
    const modal = document.getElementById('inventoryModal');
    if (modal) modal.classList.remove('active');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            showToast('Search feature coming soon!', 'warning');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            const productsSection = document.getElementById('section-products');
            if (productsSection && productsSection.classList.contains('active')) {
                openProductModal();
            } else {
                switchSection('products');
                setTimeout(openProductModal, 100);
            }
        }
        if (e.key === 'Escape') {
            closeProductModal();
            closeDiscountModal();
            closeInventoryModal();
            closeStockModal();
            closeBanModal();
        }
        if (e.altKey && e.key === 'd') {
            e.preventDefault();
            switchSection('dashboard');
        }
    });
}

// ============================================
// LOGOUT
// ============================================
function handleLogout() {
    if (confirm('តើអ្នកប្រាកដជាចង់ចាកចេញ?')) {
        clearToken();
        window.location.href = 'login/index.html';
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function showErrorMessage(msg) {
    const dashboard = document.getElementById('section-dashboard');
    if (dashboard) {
        dashboard.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--danger);">
                <i class="fas fa-exclamation-triangle" style="font-size:48px; margin-bottom:16px;"></i>
                <h3>Error Loading Data</h3>
                <p>${msg}</p>
                <button onclick="location.reload()" class="btn btn-primary" style="margin-top:16px;">
                    <i class="fas fa-sync"></i> Retry
                </button>
            </div>
        `;
    } else {
        alert('Error: ' + msg);
    }
}

// ============================================
// ✅ EXPOSE TO GLOBAL SCOPE (សំខាន់!)
// ============================================
Object.assign(window, {
    switchSection,
    openProductModal, closeProductModal,
    openDiscountModal, closeDiscountModal, toggleDiscLimit, toggleDiscExpiry,
    openStockModal, closeStockModal,
    openBanModal, closeBanModal,
    closeInventoryModal,
    handleLogout
});

console.log('✅ Script functions exposed to window');
