document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded');
    
    // Check if all required elements exist
    const requiredIds = [
        'stat-revenue', 'stat-orders', 'stat-products', 'stat-users',
        'pending-orders-badge', 'notif-badge', 'revenueChart'
    ];
    
    requiredIds.forEach(id => {
        const el = document.getElementById(id);
        if (!el) {
            console.warn(`️ Element #${id} not found!`);
        } else {
            console.log(`✅ Element #${id} found`);
        }
    });
    
    initNavigation();
    initTheme();
    setupKeyboardShortcuts();
    setupModalCloseHandlers();
    
    // Load dashboard
    loadDashboard();
});

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
    
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.toggle('mobile-open');
            } else {
                document.getElementById('sidebar').classList.toggle('collapsed');
            }
        });
    }
    
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
    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
        target.classList.add('active');
    }
    
    if (sectionId === 'dashboard') { 
        loadDashboard(); 
        startRealtimeMonitoring(); 
    } else if (sectionId === 'products') { 
        loadProducts(); 
    } else if (sectionId === 'orders') { 
        loadOrders(); 
    } else if (sectionId === 'users') { 
        loadUsers(); 
    } else if (sectionId === 'discounts') { 
        loadDiscounts(); 
    } else if (sectionId === 'stock') { 
        loadStock(); 
    } else if (sectionId === 'settings') { 
        loadSettings(); 
    }
    
    clearInterval(realtimeInterval);
}

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

function setupModalCloseHandlers() {
    document.querySelectorAll('.modal').forEach(m => { 
        m.addEventListener('click', (e) => { 
            if (e.target === m) {
                m.classList.remove('active');
            } 
        }); 
    });
}

// Add stub functions for features not implemented yet
function loadOrders() { console.log('Loading orders...'); }
function loadUsers() { console.log('Loading users...'); }
function loadDiscounts() { console.log('Loading discounts...'); }
function loadStock() { console.log('Loading stock...'); }
function loadSettings() { console.log('Loading settings...'); }
function openDiscountModal() { console.log('Opening discount modal...'); }
function closeDiscountModal() { console.log('Closing discount modal...'); }
function openStockModal() { console.log('Opening stock modal...'); }
function closeStockModal() { console.log('Closing stock modal...'); }
function openBanModal() { console.log('Opening ban modal...'); }
function closeBanModal() { console.log('Closing ban modal...'); }
function closeInventoryModal() { console.log('Closing inventory modal...'); }
function showInventoryAlerts() { console.log('Showing inventory alerts...'); }
function handleLogout() { 
    if (confirm('តើអ្នកប្រាកដជាចង់ចាកចេញ?')) {
        clearToken();
        window.location.href = 'login/index.html';
    }
}
