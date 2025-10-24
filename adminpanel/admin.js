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

// Image upload elements
const imageTabBtns = document.querySelectorAll('.image-tab-btn');
const wallpaperImageTabBtns = document.querySelectorAll('.wallpaper-image-tab-btn');
const promptImageFile = document.getElementById('prompt-image-file');
const wallpaperImageFile = document.getElementById('wallpaper-image-file');
const promptRemoveFileBtn = document.getElementById('prompt-remove-file');
const wallpaperRemoveFileBtn = document.getElementById('wallpaper-remove-file');

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
    
    // Image upload event listeners
    setupImageUploadListeners();
    
    // Password visibility toggle
    setupPasswordToggle();
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

// Prevent duplicate requests
let addPromptRequestId = null;

async function handleAddPrompt(event) {
    event.preventDefault();
    
    // Prevent multiple submissions
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled || addPromptRequestId) return;
    
    // Generate unique request ID
    addPromptRequestId = Date.now() + Math.random();
    const currentRequestId = addPromptRequestId;
    
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'در حال اضافه کردن...';
    
    // Get image source (URL or uploaded file)
    let imageSource = '';
    const imageUrlInput = document.getElementById('prompt-image');
    const imageFileInput = document.getElementById('prompt-image-file');
    const activeTab = document.querySelector('.image-tab-btn.active')?.dataset.tab;
    
    if (activeTab === 'url') {
        imageSource = imageUrlInput.value;
        if (!imageSource) {
            alert('لطفاً لینک تصویر را وارد کنید!');
            return;
        }
    } else if (activeTab === 'upload') {
        const file = imageFileInput.files[0];
        if (!file) {
            alert('لطفاً فایل تصویر را انتخاب کنید!');
            return;
        }
        try {
            imageSource = await fileToBase64(file);
        } catch (error) {
            alert('خطا در خواندن فایل!');
            return;
        }
    }
    
    const promptData = {
        title: {
            fa: document.getElementById('prompt-title-fa').value,
            en: document.getElementById('prompt-title-en').value
        },
        prompt: document.getElementById('prompt-text').value,
        image: imageSource,
        imageType: activeTab // 'url' or 'upload'
    };
    
    try {
        // Check if this request is still valid
        if (currentRequestId !== addPromptRequestId) return;
        
        const response = await fetch('/api/admin/prompts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
                'X-Request-ID': currentRequestId.toString()
            },
            body: JSON.stringify(promptData)
        });
        
        // Check again after request
        if (currentRequestId !== addPromptRequestId) return;
        
        const data = await response.json();
        
        if (response.ok) {
            alert('پرامپت با موفقیت اضافه شد!');
            addPromptForm.reset();
            resetImageUpload('prompt');
            await loadPrompts();
        } else {
            alert(data.error || 'خطا در اضافه کردن پرامپت');
        }
    } catch (error) {
        console.error('Add prompt error:', error);
        alert('خطا در اضافه کردن پرامپت');
    } finally {
        // Only reset if this is still the current request
        if (currentRequestId === addPromptRequestId) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            addPromptRequestId = null;
        }
    }
}

// Prevent duplicate wallpaper requests
let addWallpaperRequestId = null;

async function handleAddWallpaper(event) {
    event.preventDefault();
    
    // Prevent multiple submissions
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled || addWallpaperRequestId) return;
    
    // Generate unique request ID
    addWallpaperRequestId = Date.now() + Math.random();
    const currentRequestId = addWallpaperRequestId;
    
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'در حال اضافه کردن...';
    
    // Get image source (URL or uploaded file)
    let imageSource = '';
    let downloadUrl = '';
    const imageUrlInput = document.getElementById('wallpaper-image');
    const imageFileInput = document.getElementById('wallpaper-image-file');
    const activeTab = document.querySelector('.wallpaper-image-tab-btn.active')?.dataset.tab;
    
    if (activeTab === 'url') {
        imageSource = imageUrlInput.value;
        downloadUrl = imageSource; // For URL, download URL is the same
        if (!imageSource) {
            alert('لطفاً لینک تصویر را وارد کنید!');
            return;
        }
    } else if (activeTab === 'upload') {
        const file = imageFileInput.files[0];
        if (!file) {
            alert('لطفاً فایل را انتخاب کنید!');
            return;
        }
        
        // Upload file directly
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'wallpaper');
            
            const uploadResponse = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });
            
            if (!uploadResponse.ok) {
                throw new Error('خطا در آپلود فایل');
            }
            
            const uploadData = await uploadResponse.json();
            imageSource = uploadData.imageUrl; // For preview
            downloadUrl = uploadData.downloadUrl; // For actual download
            
        } catch (error) {
            alert('خطا در آپلود فایل: ' + error.message);
            return;
        }
    }
    
    const wallpaperType = document.getElementById('wallpaper-type').value;
    const price = wallpaperType === 'premium' ? parseInt(document.getElementById('wallpaper-price').value) : null;
    
    const wallpaperData = {
        title: {
            fa: document.getElementById('wallpaper-title-fa').value,
            en: document.getElementById('wallpaper-title-en').value
        },
        image: imageSource,
        downloadUrl: downloadUrl, // Separate download URL
        imageType: activeTab, // 'url' or 'upload'
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
            resetImageUpload('wallpaper');
            togglePriceSection();
            loadWallpapers();
        } else {
            alert(data.error || 'خطا در اضافه کردن والپیپر');
        }
    } catch (error) {
        console.error('Add wallpaper error:', error);
        alert('خطا در اضافه کردن والپیپر');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
    if (!promptId || promptId === 'undefined') {
        alert('شناسه پرامپت نامعتبر است');
        return;
    }
    
    if (!confirm('آیا مطمئن هستید که می‌خواهید این پرامپت را حذف کنید؟')) {
        return;
    }
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert('لطفاً مجدداً وارد شوید');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/prompts/${encodeURIComponent(promptId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: `HTTP ${response.status}: ${errorText}` };
            }
            throw new Error(errorData.error || 'خطا در حذف پرامپت');
        }
        
        const data = await response.json();
        alert('پرامپت با موفقیت حذف شد!');
        await loadPrompts();
        
    } catch (error) {
        console.error('Delete prompt error:', error);
        alert(`خطا در حذف پرامپت: ${error.message}`);
    }
}

async function deleteWallpaper(wallpaperId) {
    if (!wallpaperId || wallpaperId === 'undefined') {
        alert('شناسه والپیپر نامعتبر است');
        return;
    }
    
    if (!confirm('آیا مطمئن هستید که می‌خواهید این والپیپر را حذف کنید؟')) {
        return;
    }
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert('لطفاً مجدداً وارد شوید');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/wallpapers/${encodeURIComponent(wallpaperId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: `HTTP ${response.status}: ${errorText}` };
            }
            throw new Error(errorData.error || 'خطا در حذف والپیپر');
        }
        
        const data = await response.json();
        alert('والپیپر با موفقیت حذف شد!');
        await loadWallpapers();
        
    } catch (error) {
        console.error('Delete wallpaper error:', error);
        alert(`خطا در حذف والپیپر: ${error.message}`);
    }
}

// Image upload functions
function setupImageUploadListeners() {
    // Prompt image tabs
    imageTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchImageTab('prompt', btn.dataset.tab));
    });
    
    // Wallpaper image tabs
    wallpaperImageTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchImageTab('wallpaper', btn.dataset.tab));
    });
    
    // File input changes
    if (promptImageFile) {
        promptImageFile.addEventListener('change', (e) => handleFileSelect(e, 'prompt'));
    }
    
    if (wallpaperImageFile) {
        wallpaperImageFile.addEventListener('change', (e) => handleFileSelect(e, 'wallpaper'));
    }
    
    // Remove file buttons
    if (promptRemoveFileBtn) {
        promptRemoveFileBtn.addEventListener('click', () => removeFile('prompt'));
    }
    
    if (wallpaperRemoveFileBtn) {
        wallpaperRemoveFileBtn.addEventListener('click', () => removeFile('wallpaper'));
    }
    
    // Drag and drop
    setupDragAndDrop('prompt');
    setupDragAndDrop('wallpaper');
}

function switchImageTab(type, tab) {
    const tabBtns = type === 'prompt' ? imageTabBtns : wallpaperImageTabBtns;
    const tabClass = type === 'prompt' ? 'image-input-tab' : 'wallpaper-image-input-tab';
    
    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active', 'bg-black', 'text-white');
        btn.classList.add('text-gray-600');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tab}"]`);
    if (activeBtn && tabBtns.length > 0) {
        const targetBtn = Array.from(tabBtns).find(btn => btn.dataset.tab === tab);
        if (targetBtn) {
            targetBtn.classList.add('active', 'bg-black', 'text-white');
            targetBtn.classList.remove('text-gray-600');
        }
    }
    
    // Update tab content
    const urlTab = document.getElementById(`${type}-image-url-tab`);
    const uploadTab = document.getElementById(`${type}-image-upload-tab`);
    
    if (tab === 'url') {
        urlTab?.classList.remove('hidden');
        uploadTab?.classList.add('hidden');
    } else {
        urlTab?.classList.add('hidden');
        uploadTab?.classList.remove('hidden');
    }
}

function handleFileSelect(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Different validation for different types
    if (type === 'prompt') {
        // Prompts still need images only
        if (!file.type.startsWith('image/')) {
            alert('لطفاً فقط فایل تصویری برای پرامپت انتخاب کنید!');
            return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB for prompts
        if (file.size > maxSize) {
            alert('حجم فایل نباید بیشتر از 5MB باشد!');
            return;
        }
    } else if (type === 'wallpaper') {
        // Wallpapers can be any file type
        const maxSize = 50 * 1024 * 1024; // 50MB for wallpapers
        if (file.size > maxSize) {
            alert('حجم فایل نباید بیشتر از 50MB باشد!');
            return;
        }
    }
    
    // Show preview
    showFilePreview(file, type);
}

function showFilePreview(file, type) {
    const uploadArea = document.getElementById(`${type}-upload-area`);
    const preview = document.getElementById(`${type}-upload-preview`);
    const fileName = document.getElementById(`${type}-file-name`);
    
    if (!uploadArea || !preview || !fileName) return;
    
    uploadArea.classList.add('hidden');
    preview.classList.remove('hidden');
    fileName.textContent = file.name;
    
    // Show file size if element exists
    const fileSize = document.getElementById(`${type}-file-size`);
    if (fileSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        fileSize.textContent = `حجم: ${sizeMB} مگابایت`;
    }
    
    // Handle different file types for preview
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById(`${type}-preview-img`);
            const fileIcon = document.getElementById(`${type}-file-icon`);
            
            if (previewImg && fileIcon) {
                previewImg.src = e.target.result;
                previewImg.classList.remove('hidden');
                fileIcon.classList.add('hidden');
            }
        };
        reader.readAsDataURL(file);
    } else {
        // For non-image files, show file icon
        const previewImg = document.getElementById(`${type}-preview-img`);
        const fileIcon = document.getElementById(`${type}-file-icon`);
        
        if (previewImg && fileIcon) {
            previewImg.classList.add('hidden');
            fileIcon.classList.remove('hidden');
        }
    }
}

function removeFile(type) {
    const fileInput = document.getElementById(`${type}-image-file`);
    const uploadArea = document.getElementById(`${type}-upload-area`);
    const preview = document.getElementById(`${type}-upload-preview`);
    
    if (fileInput) fileInput.value = '';
    if (uploadArea) uploadArea.classList.remove('hidden');
    if (preview) preview.classList.add('hidden');
}

function resetImageUpload(type) {
    // Reset to URL tab
    switchImageTab(type, 'url');
    
    // Clear URL input
    const urlInput = document.getElementById(`${type}-image`);
    if (urlInput) urlInput.value = '';
    
    // Clear file upload
    removeFile(type);
}

function setupDragAndDrop(type) {
    const uploadArea = document.getElementById(`${type}-upload-area`);
    if (!uploadArea) return;
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById(`${type}-image-file`);
            if (fileInput) {
                fileInput.files = files;
                handleFileSelect({ target: { files } }, type);
            }
        }
    });
}

// Convert file to base64 for storage
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Password visibility toggle function for admin panel
function setupPasswordToggle() {
    const toggleBtn = document.getElementById('toggle-admin-password');
    const passwordInput = document.getElementById('admin-password');
    const eyeClosed = document.getElementById('admin-eye-closed');
    const eyeOpen = document.getElementById('admin-eye-open');
    
    if (!toggleBtn || !passwordInput || !eyeClosed || !eyeOpen) {
        return; // Elements not found, skip setup
    }
    
    toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (passwordInput.type === 'password') {
            // Show password
            passwordInput.type = 'text';
            eyeClosed.classList.add('hidden');
            eyeOpen.classList.remove('hidden');
        } else {
            // Hide password
            passwordInput.type = 'password';
            eyeClosed.classList.remove('hidden');
            eyeOpen.classList.add('hidden');
        }
    });
}

// Initialize price section visibility
togglePriceSection();
