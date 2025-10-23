// Admin Panel JavaScript
let isLoggedIn = false;

// DOM Elements
const loginSection = document.getElementById('login-section');
const adminPanel = document.getElementById('admin-panel');
const adminLoginForm = document.getElementById('admin-login-form');
const logoutBtn = document.getElementById('logout-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const addPromptForm = document.getElementById('add-prompt-form');
const addWallpaperForm = document.getElementById('add-wallpaper-form');
const wallpaperTypeSelect = document.getElementById('wallpaper-type');
const priceSection = document.getElementById('price-section');

// Check login status on page load
document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setupEventListeners();
    loadExistingContent();
    checkSystemStatus();
});

function checkLoginStatus() {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
        showAdminPanel();
    }
}

async function checkSystemStatus() {
    try {
        const response = await fetch('/api/admin/status');
        const data = await response.json();
        
        updateStatusIndicator('kv-status', data.status.kv.connected, 
            data.status.kv.connected ? 'متصل' : 'قطع', 
            data.status.kv.error);
            
        updateStatusIndicator('admin-config-status', data.status.adminConfig.configured, 
            data.status.adminConfig.configured ? 'تعریف شده' : 'تعریف نشده');
            
    } catch (error) {
        console.error('Failed to check system status:', error);
        updateStatusIndicator('kv-status', false, 'خطا در بررسی');
        updateStatusIndicator('admin-config-status', false, 'خطا در بررسی');
    }
}

function updateStatusIndicator(elementId, isSuccess, statusText, errorMessage = null) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const dot = element.querySelector('.w-2.h-2');
    const text = element.querySelector('span');
    
    // Remove animation
    dot.classList.remove('animate-pulse', 'bg-gray-400');
    
    if (isSuccess) {
        dot.classList.add('bg-green-500');
        text.textContent = statusText;
        text.className = 'text-green-600 font-medium';
    } else {
        dot.classList.add('bg-red-500');
        text.textContent = statusText;
        text.className = 'text-red-600 font-medium';
        
        if (errorMessage) {
            text.title = errorMessage;
        }
    }
}

function setupEventListeners() {
    // Login form
    adminLoginForm.addEventListener('submit', handleLogin);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // Refresh status button
    const refreshStatusBtn = document.getElementById('refresh-status');
    if (refreshStatusBtn) {
        refreshStatusBtn.addEventListener('click', checkSystemStatus);
    }
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Forms
    addPromptForm.addEventListener('submit', handleAddPrompt);
    addWallpaperForm.addEventListener('submit', handleAddWallpaper);
    
    // Wallpaper type change
    wallpaperTypeSelect.addEventListener('change', togglePriceSection);
}

async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            showAdminPanel();
            alert('با موفقیت وارد شدید!');
        } else {
            alert(data.error || 'خطا در ورود');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('خطا در ورود');
    }
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    showLoginSection();
    alert('با موفقیت خارج شدید!');
}

function showAdminPanel() {
    loginSection.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    isLoggedIn = true;
    loadExistingContent();
}

function showLoginSection() {
    loginSection.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    isLoggedIn = false;
}

function switchTab(tabName) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active', 'bg-black', 'text-white');
        btn.classList.add('text-gray-600');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    activeBtn.classList.add('active', 'bg-black', 'text-white');
    activeBtn.classList.remove('text-gray-600');
    
    // Update tab content
    tabContents.forEach(content => {
        content.classList.add('hidden');
    });
    
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
}

function togglePriceSection() {
    const wallpaperType = wallpaperTypeSelect.value;
    if (wallpaperType === 'free') {
        priceSection.style.display = 'none';
    } else {
        priceSection.style.display = 'block';
    }
}

async function handleAddPrompt(event) {
    event.preventDefault();
    
    const promptData = {
        title: {
            fa: document.getElementById('prompt-title-fa').value,
            en: document.getElementById('prompt-title-en').value
        },
        prompt: document.getElementById('prompt-text').value,
        image: document.getElementById('prompt-image').value
    };
    
    try {
        const response = await fetch('/api/admin/prompts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(promptData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('پرامپت با موفقیت اضافه شد!');
            addPromptForm.reset();
            loadPrompts();
        } else {
            alert(data.error || 'خطا در اضافه کردن پرامپت');
        }
    } catch (error) {
        console.error('Add prompt error:', error);
        alert('خطا در اضافه کردن پرامپت');
    }
}

async function handleAddWallpaper(event) {
    event.preventDefault();
    
    const wallpaperType = document.getElementById('wallpaper-type').value;
    const price = wallpaperType === 'premium' ? parseInt(document.getElementById('wallpaper-price').value) : null;
    
    const wallpaperData = {
        title: {
            fa: document.getElementById('wallpaper-title-fa').value,
            en: document.getElementById('wallpaper-title-en').value
        },
        image: document.getElementById('wallpaper-image').value,
        type: wallpaperType,
        resolution: document.getElementById('wallpaper-resolution').value,
        price: price ? {
            fa: `${price} تومان`,
            en: `${price} IRR`
        } : null
    };
    
    try {
        const response = await fetch('/api/admin/wallpapers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(wallpaperData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('والپیپر با موفقیت اضافه شد!');
            addWallpaperForm.reset();
            togglePriceSection();
            loadWallpapers();
        } else {
            alert(data.error || 'خطا در اضافه کردن والپیپر');
        }
    } catch (error) {
        console.error('Add wallpaper error:', error);
        alert('خطا در اضافه کردن والپیپر');
    }
}

async function loadExistingContent() {
    if (!isLoggedIn) return;
    
    await loadPrompts();
    await loadWallpapers();
}

async function loadPrompts() {
    try {
        const response = await fetch('/api/admin/prompts', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayPrompts(data.prompts);
        }
    } catch (error) {
        console.error('Load prompts error:', error);
    }
}

async function loadWallpapers() {
    try {
        const response = await fetch('/api/admin/wallpapers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayWallpapers(data.wallpapers);
        }
    } catch (error) {
        console.error('Load wallpapers error:', error);
    }
}

function displayPrompts(prompts) {
    const promptsList = document.getElementById('prompts-list');
    promptsList.innerHTML = '';
    
    prompts.forEach(prompt => {
        const promptElement = document.createElement('div');
        promptElement.className = 'flex items-center justify-between p-4 border border-gray-200 rounded-2xl';
        promptElement.innerHTML = `
            <div class="flex items-center gap-4">
                <img src="${prompt.image}" alt="${prompt.title.fa}" class="w-16 h-16 object-cover rounded-xl">
                <div>
                    <h4 class="font-medium text-black">${prompt.title.fa}</h4>
                    <p class="text-sm text-gray-600">${prompt.title.en}</p>
                </div>
            </div>
            <button onclick="deletePrompt('${prompt.id}')" class="px-4 py-2 text-red-600 hover:text-red-800 font-medium">
                حذف
            </button>
        `;
        promptsList.appendChild(promptElement);
    });
}

function displayWallpapers(wallpapers) {
    const wallpapersList = document.getElementById('wallpapers-list');
    wallpapersList.innerHTML = '';
    
    wallpapers.forEach(wallpaper => {
        const wallpaperElement = document.createElement('div');
        wallpaperElement.className = 'bg-gray-50 rounded-2xl p-4';
        wallpaperElement.innerHTML = `
            <img src="${wallpaper.image}" alt="${wallpaper.title.fa}" class="w-full h-32 object-cover rounded-xl mb-3">
            <h4 class="font-medium text-black mb-1">${wallpaper.title.fa}</h4>
            <p class="text-sm text-gray-600 mb-2">${wallpaper.title.en}</p>
            <div class="flex items-center justify-between">
                <span class="text-xs ${wallpaper.type === 'free' ? 'text-green-600' : 'text-purple-600'} font-medium">
                    ${wallpaper.type === 'free' ? 'رایگان' : wallpaper.price.fa}
                </span>
                <button onclick="deleteWallpaper('${wallpaper.id}')" class="text-red-600 hover:text-red-800 text-sm">
                    حذف
                </button>
            </div>
        `;
        wallpapersList.appendChild(wallpaperElement);
    });
}

async function deletePrompt(promptId) {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این پرامپت را حذف کنید؟')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/prompts/${promptId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            alert('پرامپت با موفقیت حذف شد!');
            loadPrompts();
        } else {
            alert('خطا در حذف پرامپت');
        }
    } catch (error) {
        console.error('Delete prompt error:', error);
        alert('خطا در حذف پرامپت');
    }
}

async function deleteWallpaper(wallpaperId) {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این والپیپر را حذف کنید؟')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/wallpapers/${wallpaperId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.ok) {
            alert('والپیپر با موفقیت حذف شد!');
            loadWallpapers();
        } else {
            alert('خطا در حذف والپیپر');
        }
    } catch (error) {
        console.error('Delete wallpaper error:', error);
        alert('خطا در حذف والپیپر');
    }
}

// Initialize price section visibility
togglePriceSection();
