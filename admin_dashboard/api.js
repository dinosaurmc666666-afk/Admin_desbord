// ============================================
// API CONFIGURATION
// ============================================
const API_URL = 'https://api.anajakcode.site/api'; // ️ កែ URL នេះ

// ============================================
// AUTH HELPERS
// ============================================
function getToken() { return localStorage.getItem('admin_token'); }
function setToken(token) { localStorage.setItem('admin_token', token); }
function clearToken() { localStorage.removeItem('admin_token'); }

// Check auth on load
if (!getToken() && !window.location.pathname.includes('login')) {
    window.location.href = 'login/index.html';
}

// ============================================
// FETCH WITH AUTH
// ============================================
async function fetchWithAuth(url, options = {}) {
    const headers = { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };
    try {
        const response = await fetch(url, { ...options, headers });
        if (response.status === 401) {
            clearToken();
            window.location.href = 'login/index.html';
            return null;
        }
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        showToast('Connection failed', 'error');
        return null;
    }
}
