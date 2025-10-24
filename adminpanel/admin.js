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
const wallpaperCoverTabBtns = document.querySelectorAll('.wallpaper-cover-tab-btn');
const wallpaperFileTabBtns = document.querySelectorAll('.wallpaper-file-tab-btn');
const promptImageFile = document.getElementById('prompt-image-file');
const wallpaperCoverFile = document.getElementById('wallpaper-cover-file');
const wallpaperFileInput = document.getElementById('wallpaper-file-input');
const promptRemoveFileBtn = document.getElementById('prompt-remove-file');
const wallpaperCoverRemoveFileBtn = document.getElementById('wallpaper-cover-remove-file');
const wallpaperFileRemoveBtn = document.getElementById('wallpaper-file-remove');

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
            console.error('File read error:', error);
            alert('خطا در خواندن فایل: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            addPromptRequestId = null;
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

    // Get cover image
    let coverImageSource = '';
    const coverActiveTab = document.querySelector('.wallpaper-cover-tab-btn.active')?.dataset.tab;
    
    if (coverActiveTab === 'url') {
        coverImageSource = document.getElementById('wallpaper-cover-image').value;
        if (!coverImageSource) {
            alert('لطفاً لینک تصویر کاور را وارد کنید!');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            addWallpaperRequestId = null;
            return;
        }
    } else if (coverActiveTab === 'upload') {
        const coverFile = document.getElementById('wallpaper-cover-file').files[0];
        if (!coverFile) {
            alert('لطفاً فایل تصویر کاور را انتخاب کنید!');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            addWallpaperRequestId = null;
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', coverFile);
            formData.append('type', 'wallpaper-cover');

            const uploadResponse = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('خطا در آپلود تصویر کاور');
            }

            const uploadData = await uploadResponse.json();
            coverImageSource = uploadData.imageUrl;

        } catch (error) {
            alert('خطا در آپلود تصویر کاور: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            addWallpaperRequestId = null;
            return;
        }
    }

    // Get wallpaper file
    let downloadUrl = '';
    const fileActiveTab = document.querySelector('.wallpaper-file-tab-btn.active')?.dataset.tab;
    
    if (fileActiveTab === 'url') {
        downloadUrl = document.getElementById('wallpaper-file-url').value;
        if (!downloadUrl) {
            alert('لطفاً لینک فایل والپیپر را وارد کنید!');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            addWallpaperRequestId = null;
            return;
        }
    } else if (fileActiveTab === 'upload') {
        const wallpaperFile = document.getElementById('wallpaper-file-input').files[0];
        if (!wallpaperFile) {
            alert('لطفاً فایل والپیپر را انتخاب کنید!');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            addWallpaperRequestId = null;
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', wallpaperFile);
            formData.append('type', 'wallpaper-file');

            const uploadResponse = await fetch('/api/admin/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                throw new Error('خطا در آپلود فایل والپیپر');
            }

            const uploadData = await uploadResponse.json();
            downloadUrl = uploadData.downloadUrl;

        } catch (error) {
            alert('خطا در آپلود فایل والپیپر: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            addWallpaperRequestId = null;
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
        image: coverImageSource, // Cover image for display
        downloadUrl: downloadUrl, // Actual file for download
        coverType: coverActiveTab,
        fileType: fileActiveTab,
        type: wallpaperType,
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
            resetImageUpload('wallpaper-cover');
            resetImageUpload('wallpaper-file');
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
        addWallpaperRequestId = null;
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
            // Remove duplicates based on ID
            const uniquePrompts = data.prompts.filter((prompt, index, self) => 
                index === self.findIndex(p => p.id === prompt.id)
            );
            displayPrompts(uniquePrompts);
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
    if (!promptId || promptId === 'undefined' || promptId === 'null') {
        alert('شناسه پرامپت نامعتبر است');
        return;
    }

    if (!confirm('آیا مطمئن هستید که می‌خواهید این پرامپت را حذف کنید؟')) {
        return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
        alert('لطفاً مجدداً وارد شوید');
        showLoginSection();
        return;
    }

    try {
        // Use the correct API endpoint format
        const response = await fetch('/api/admin/prompts', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({ promptId: promptId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
            }
            
            if (response.status === 401) {
                alert('جلسه شما منقضی شده است. لطفاً مجدداً وارد شوید.');
                showLoginSection();
                return;
            }
            
            throw new Error(errorData.error || 'خطا در حذف پرامپت');
        }

        const data = await response.json();
        alert('پرامپت با موفقیت حذف شد!');
        await loadPrompts(); // Reload the list

    } catch (error) {
        console.error('Delete prompt error:', error);
        if (error.message.includes('Failed to fetch')) {
            alert('خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.');
        } else {
            alert(`خطا در حذف پرامپت: ${error.message}`);
        }
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

    // Wallpaper cover tabs
    wallpaperCoverTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchImageTab('wallpaper-cover', btn.dataset.tab));
    });

    // Wallpaper file tabs
    wallpaperFileTabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchImageTab('wallpaper-file', btn.dataset.tab));
    });

    // File input changes
    if (promptImageFile) {
        promptImageFile.addEventListener('change', (e) => handleFileSelect(e, 'prompt'));
    }

    if (wallpaperCoverFile) {
        wallpaperCoverFile.addEventListener('change', (e) => handleFileSelect(e, 'wallpaper-cover'));
    }

    if (wallpaperFileInput) {
        wallpaperFileInput.addEventListener('change', (e) => handleFileSelect(e, 'wallpaper-file'));
    }

    // Remove file buttons
    if (promptRemoveFileBtn) {
        promptRemoveFileBtn.addEventListener('click', () => removeFile('prompt'));
    }

    if (wallpaperCoverRemoveFileBtn) {
        wallpaperCoverRemoveFileBtn.addEventListener('click', () => removeFile('wallpaper-cover'));
    }

    if (wallpaperFileRemoveBtn) {
        wallpaperFileRemoveBtn.addEventListener('click', () => removeFile('wallpaper-file'));
    }

    // Drag and drop
    setupDragAndDrop('prompt');
    setupDragAndDrop('wallpaper-cover');
    setupDragAndDrop('wallpaper-file');
}

function switchImageTab(type, tab) {
    let tabBtns, tabClass;
    
    if (type === 'prompt') {
        tabBtns = imageTabBtns;
        tabClass = 'image-input-tab';
    } else if (type === 'wallpaper-cover') {
        tabBtns = wallpaperCoverTabBtns;
        tabClass = 'wallpaper-cover-input-tab';
    } else if (type === 'wallpaper-file') {
        tabBtns = wallpaperFileTabBtns;
        tabClass = 'wallpaper-file-input-tab';
    }

    // Update tab buttons
    tabBtns.forEach(btn => {
        btn.classList.remove('active', 'bg-black', 'text-white');
        btn.classList.add('text-gray-600');
    });

    const targetBtn = Array.from(tabBtns).find(btn => btn.dataset.tab === tab);
    if (targetBtn) {
        targetBtn.classList.add('active', 'bg-black', 'text-white');
        targetBtn.classList.remove('text-gray-600');
    }

    // Update tab content
    let urlTabId, uploadTabId;
    
    if (type === 'prompt') {
        urlTabId = 'prompt-image-url-tab';
        uploadTabId = 'prompt-image-upload-tab';
    } else if (type === 'wallpaper-cover') {
        urlTabId = 'wallpaper-cover-url-tab';
        uploadTabId = 'wallpaper-cover-upload-tab';
    } else if (type === 'wallpaper-file') {
        urlTabId = 'wallpaper-file-url-tab';
        uploadTabId = 'wallpaper-file-upload-tab';
    }
    
    const urlTab = document.getElementById(urlTabId);
    const uploadTab = document.getElementById(uploadTabId);

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

    // File type validation
    const allowedTypes = {
        'prompt': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        'wallpaper-cover': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
        'wallpaper-file': ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/zip', 'application/x-rar-compressed', 'application/x-zip-compressed']
    };

    // Different validation for different types
    if (type === 'prompt') {
        if (!allowedTypes.prompt.includes(file.type)) {
            alert('لطفاً فقط فایل تصویری (JPG, PNG, GIF, WebP) برای پرامپت انتخاب کنید!');
            return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB for prompts
        if (file.size > maxSize) {
            alert('حجم فایل نباید بیشتر از 5MB باشد!');
            return;
        }
    } else if (type === 'wallpaper-cover') {
        if (!allowedTypes['wallpaper-cover'].includes(file.type)) {
            alert('لطفاً فقط فایل تصویری (JPG, PNG, GIF, WebP) برای کاور انتخاب کنید!');
            return;
        }
        const maxSize = 5 * 1024 * 1024; // 5MB for cover images
        if (file.size > maxSize) {
            alert('حجم تصویر کاور نباید بیشتر از 5MB باشد!');
            return;
        }
    } else if (type === 'wallpaper-file') {
        const maxSize = 100 * 1024 * 1024; // 100MB for wallpaper files
        if (file.size > maxSize) {
            alert('حجم فایل والپیپر نباید بیشتر از 100MB باشد!');
            return;
        }
    }

    // Show preview
    showFilePreview(file, type);
}

function showFilePreview(file, type) {
    let uploadAreaId, previewId, fileNameId, fileSizeId, previewImgId, fileIconId;
    
    if (type === 'prompt') {
        uploadAreaId = 'prompt-upload-area';
        previewId = 'prompt-upload-preview';
        fileNameId = 'prompt-file-name';
        fileSizeId = 'prompt-file-size';
        previewImgId = 'prompt-preview-img';
        fileIconId = 'prompt-file-icon';
    } else if (type === 'wallpaper-cover') {
        uploadAreaId = 'wallpaper-cover-upload-area';
        previewId = 'wallpaper-cover-preview';
        fileNameId = 'wallpaper-cover-file-name';
        fileSizeId = 'wallpaper-cover-file-size';
        previewImgId = 'wallpaper-cover-preview-img';
        fileIconId = 'wallpaper-cover-file-icon';
    } else if (type === 'wallpaper-file') {
        uploadAreaId = 'wallpaper-file-upload-area';
        previewId = 'wallpaper-file-preview';
        fileNameId = 'wallpaper-file-name';
        fileSizeId = 'wallpaper-file-size';
        previewImgId = 'wallpaper-file-preview-img';
        fileIconId = 'wallpaper-file-icon';
    }

    const uploadArea = document.getElementById(uploadAreaId);
    const preview = document.getElementById(previewId);
    const fileName = document.getElementById(fileNameId);

    if (!uploadArea || !preview || !fileName) return;

    uploadArea.classList.add('hidden');
    preview.classList.remove('hidden');
    fileName.textContent = file.name;

    // Show file size if element exists
    const fileSize = document.getElementById(fileSizeId);
    if (fileSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        fileSize.textContent = `حجم: ${sizeMB} مگابایت`;
    }

    // Handle different file types for preview
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById(previewImgId);
            const fileIcon = document.getElementById(fileIconId);

            if (previewImg) {
                previewImg.src = e.target.result;
                previewImg.classList.remove('hidden');
            }
            if (fileIcon) {
                fileIcon.classList.add('hidden');
            }
        };
        reader.readAsDataURL(file);
    } else {
        // For non-image files, show file icon
        const previewImg = document.getElementById(previewImgId);
        const fileIcon = document.getElementById(fileIconId);

        if (previewImg) {
            previewImg.classList.add('hidden');
        }
        if (fileIcon) {
            fileIcon.classList.remove('hidden');
        }
    }
}

function removeFile(type) {
    let fileInputId, uploadAreaId, previewId;
    
    if (type === 'prompt') {
        fileInputId = 'prompt-image-file';
        uploadAreaId = 'prompt-upload-area';
        previewId = 'prompt-upload-preview';
    } else if (type === 'wallpaper-cover') {
        fileInputId = 'wallpaper-cover-file';
        uploadAreaId = 'wallpaper-cover-upload-area';
        previewId = 'wallpaper-cover-preview';
    } else if (type === 'wallpaper-file') {
        fileInputId = 'wallpaper-file-input';
        uploadAreaId = 'wallpaper-file-upload-area';
        previewId = 'wallpaper-file-preview';
    }

    const fileInput = document.getElementById(fileInputId);
    const uploadArea = document.getElementById(uploadAreaId);
    const preview = document.getElementById(previewId);

    if (fileInput) fileInput.value = '';
    if (uploadArea) uploadArea.classList.remove('hidden');
    if (preview) preview.classList.add('hidden');
}

function resetImageUpload(type) {
    // Reset to URL tab
    switchImageTab(type, 'url');

    // Clear URL input based on type
    let urlInputId;
    if (type === 'prompt') {
        urlInputId = 'prompt-image';
    } else if (type === 'wallpaper-cover') {
        urlInputId = 'wallpaper-cover-image';
    } else if (type === 'wallpaper-file') {
        urlInputId = 'wallpaper-file-url';
    }
    
    const urlInput = document.getElementById(urlInputId);
    if (urlInput) urlInput.value = '';

    // Clear file upload
    removeFile(type);
}

function setupDragAndDrop(type) {
    let uploadAreaId, fileInputId;
    
    if (type === 'prompt') {
        uploadAreaId = 'prompt-upload-area';
        fileInputId = 'prompt-image-file';
    } else if (type === 'wallpaper-cover') {
        uploadAreaId = 'wallpaper-cover-upload-area';
        fileInputId = 'wallpaper-cover-file';
    } else if (type === 'wallpaper-file') {
        uploadAreaId = 'wallpaper-file-upload-area';
        fileInputId = 'wallpaper-file-input';
    }
    
    const uploadArea = document.getElementById(uploadAreaId);
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
            const fileInput = document.getElementById(fileInputId);
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

    if (toggleBtn && passwordInput && eyeClosed && eyeOpen) {
        // Prevent form submission when clicking toggle
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeClosed.classList.add('hidden');
                eyeOpen.classList.remove('hidden');
                toggleBtn.setAttribute('aria-label', 'مخفی کردن رمز عبور');
            } else {
                passwordInput.type = 'password';
                eyeClosed.classList.remove('hidden');
                eyeOpen.classList.add('hidden');
                toggleBtn.setAttribute('aria-label', 'نمایش رمز عبور');
            }
        });

        // Set initial aria-label
        toggleBtn.setAttribute('aria-label', 'نمایش رمز عبور');
    }
}

// Initialize price section visibility
togglePriceSection();