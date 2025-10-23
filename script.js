// Sample prompts data - empty by default
const promptsData = [];

// Sample wallpapers data - empty by default  
const wallpapersData = [];

// Global variables
let currentLanguage = 'fa';
let currentFilter = 'all';
let currentUser = null;
let currentCaptcha = '';
const langToggle = document.getElementById('lang-toggle');
const langText = document.getElementById('lang-text');
const navButtons = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.section');
const promptsGrid = document.getElementById('prompts-grid');
const wallpapersGrid = document.getElementById('wallpapers-grid');
const filterButtons = document.querySelectorAll('.filter-btn');

// Authentication elements
const authModal = document.getElementById('auth-modal');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const closeModalBtn = document.getElementById('close-modal');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginFormElement = document.getElementById('login-form-element');
const registerFormElement = document.getElementById('register-form-element');
const loggedOutSection = document.getElementById('logged-out');
const loggedInSection = document.getElementById('logged-in');
const userNameSpan = document.getElementById('user-name');

// Modal elements
const contactModal = document.getElementById('contact-modal');
const aboutModal = document.getElementById('about-modal');
const profileModal = document.getElementById('profile-modal');
const contactBtn = document.getElementById('contact-btn');
const aboutBtn = document.getElementById('about-btn');
const profileBtn = document.getElementById('profile-btn');
const closeContactModal = document.getElementById('close-contact-modal');
const closeAboutModal = document.getElementById('close-about-modal');
const closeProfileModal = document.getElementById('close-profile-modal');
const contactForm = document.getElementById('contact-form');

// Local storage management
function saveUserState() {
    const userState = {
        language: currentLanguage,
        filter: currentFilter,
        currentSection: getCurrentActiveSection(),
        timestamp: Date.now()
    };
    localStorage.setItem('userState', JSON.stringify(userState));
}

function loadUserState() {
    try {
        const savedState = localStorage.getItem('userState');
        if (savedState) {
            const userState = JSON.parse(savedState);
            
            // Check if state is not too old (24 hours)
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            if (Date.now() - userState.timestamp < maxAge) {
                // Restore language
                if (userState.language) {
                    currentLanguage = userState.language;
                }
                
                // Restore filter
                if (userState.filter) {
                    currentFilter = userState.filter;
                }
                
                // Restore section (will be applied after DOM is ready)
                if (userState.currentSection) {
                    setTimeout(() => {
                        switchSection(userState.currentSection);
                        updateActiveFilter();
                    }, 100);
                }
                
                return true;
            }
        }
    } catch (error) {
        console.log('Failed to load user state:', error);
    }
    return false;
}

function getCurrentActiveSection() {
    const activeSection = document.querySelector('.section:not(.hidden)');
    if (activeSection) {
        return activeSection.id.replace('-section', '');
    }
    return 'prompts'; // default
}

function updateActiveFilter() {
    // Update filter button states
    filterButtons.forEach(btn => {
        btn.classList.remove('active', 'bg-black', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-700');
        if (btn.dataset.filter === currentFilter) {
            btn.classList.remove('bg-gray-100', 'text-gray-700');
            btn.classList.add('active', 'bg-black', 'text-white');
        }
    });
}

// Language management
function initLanguage() {
    const savedLang = localStorage.getItem('language') || 'fa';
    currentLanguage = savedLang;
    updateLanguage();
}

function toggleLanguage() {
    currentLanguage = currentLanguage === 'fa' ? 'en' : 'fa';
    localStorage.setItem('language', currentLanguage);
    updateLanguage();
    saveUserState(); // Save state when language changes
}

function updateLanguage() {
    const html = document.documentElement;
    const body = document.body;
    
    if (currentLanguage === 'en') {
        html.setAttribute('lang', 'en');
        html.setAttribute('dir', 'ltr');
        body.classList.add('en-font');
        langText.textContent = 'فا';
    } else {
        html.setAttribute('lang', 'fa');
        html.setAttribute('dir', 'rtl');
        body.classList.remove('en-font');
        langText.textContent = 'EN';
    }
    
    // Update all elements with data attributes
    document.querySelectorAll('[data-fa][data-en]').forEach(element => {
        const text = currentLanguage === 'fa' ? element.getAttribute('data-fa') : element.getAttribute('data-en');
        element.textContent = text;
    });
    
    // Update input placeholders
    document.querySelectorAll('[data-fa-placeholder][data-en-placeholder]').forEach(element => {
        const placeholder = currentLanguage === 'fa' ? element.getAttribute('data-fa-placeholder') : element.getAttribute('data-en-placeholder');
        element.placeholder = placeholder;
    });
    
    // Re-render content
    renderPrompts();
    renderWallpapers();
}

// Captcha functions
function generateCaptcha() {
    currentCaptcha = Math.floor(1000 + Math.random() * 9000).toString();
    const captchaDisplay = document.getElementById('captcha-display');
    if (captchaDisplay) {
        captchaDisplay.textContent = currentCaptcha;
    }
    return currentCaptcha;
}

function validateCaptcha(userInput) {
    return userInput === currentCaptcha;
}

// Navigation management
function switchSection(targetSection) {
    // Hide all sections
    sections.forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });
    
    // Show target section
    const target = document.getElementById(`${targetSection}-section`);
    if (target) {
        target.classList.add('active');
        target.classList.remove('hidden');
    }
    
    // Update navigation buttons
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#6b7280';
    });
    
    const activeBtn = document.querySelector(`[data-section="${targetSection}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.backgroundColor = 'black';
        activeBtn.style.color = 'white';
    }
    
    // Save state when section changes
    saveUserState();
}

// Load prompts from API
async function loadPromptsFromAPI() {
    try {
        const response = await fetch('/api/content/prompts');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.prompts && data.prompts.length > 0) {
                return data.prompts;
            }
        }
    } catch (error) {
        // Silent fallback - don't log errors for missing API
        console.log('API not available, using fallback data');
    }
    
    // Fallback to hardcoded data
    return promptsData;
}

// Load wallpapers from API
async function loadWallpapersFromAPI() {
    try {
        const response = await fetch('/api/content/wallpapers');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.wallpapers && data.wallpapers.length > 0) {
                return data.wallpapers;
            }
        }
    } catch (error) {
        // Silent fallback - don't log errors for missing API
        console.log('API not available, using fallback data');
    }
    
    // Fallback to hardcoded data
    return wallpapersData;
}

// Prompt rendering
async function renderPrompts() {
    promptsGrid.innerHTML = '';
    
    const prompts = await loadPromptsFromAPI();
    
    if (prompts.length === 0) {
        const noPromptsTitle = currentLanguage === 'fa' ? 'پرامپتی موجود نیست' : 'No prompts available';
        const noPromptsDesc = currentLanguage === 'fa' ? 'پرامپت‌ها پس از اضافه شدن توسط ادمین اینجا نمایش داده می‌شوند' : 'Prompts will appear here once added by admin';
        
        promptsGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">
                    ${noPromptsTitle}
                </h3>
                <p class="text-gray-500">
                    ${noPromptsDesc}
                </p>
            </div>
        `;
        return;
    }
    
    prompts.forEach(prompt => {
        const promptCard = document.createElement('div');
        promptCard.className = 'prompt-card bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100';
        
        const title = prompt.title[currentLanguage];
        const copyText = currentLanguage === 'fa' ? 'کپی پرامپت' : 'Copy Prompt';
        
        promptCard.innerHTML = `
            <div class="relative">
                <img src="${prompt.image}" alt="${title}" class="w-full h-48 object-cover" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE2MjVWMTc1SDE3NVYxMjVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg=='; this.classList.add('image-placeholder');">
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-4 text-black">${title}</h3>
                <div class="mb-6">
                <p class="text-gray-600 text-sm bg-gray-50 p-4 rounded-2xl font-mono leading-relaxed border-l-4" style="border-left-color: #A9B689;">
                    ${prompt.prompt}
                </p>
            </div>
                <button class="copy-btn w-full bg-black hover:opacity-80 text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-200" 
                        onclick="copyPrompt('${prompt.prompt.replace(/'/g, "\\'")}', this)">
                    ${copyText}
                </button>
            </div>
        `;
        
        promptsGrid.appendChild(promptCard);
    });
}

// Modal functions
function showContactModal() {
    contactModal.classList.remove('hidden');
    contactModal.classList.add('flex');
}

function hideContactModal() {
    contactModal.classList.add('hidden');
    contactModal.classList.remove('flex');
}

function showAboutModal() {
    aboutModal.classList.remove('hidden');
    aboutModal.classList.add('flex');
}

function hideAboutModal() {
    aboutModal.classList.add('hidden');
    aboutModal.classList.remove('flex');
}

function showProfileModal() {
    profileModal.classList.remove('hidden');
    profileModal.classList.add('flex');
    loadUserProfile();
}

function hideProfileModal() {
    profileModal.classList.add('hidden');
    profileModal.classList.remove('flex');
}

async function loadUserProfile() {
    if (!currentUser) return;
    
    // Update profile info
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-phone').textContent = currentUser.phone;
    document.getElementById('profile-downloads').textContent = currentUser.downloads || 0;
    
    // Format date
    const joinDate = new Date(currentUser.createdAt).toLocaleDateString(currentLanguage === 'fa' ? 'fa-IR' : 'en-US');
    document.getElementById('profile-date').textContent = joinDate;
    
    // Load purchased wallpapers
    await loadPurchasedWallpapers();
}

async function loadPurchasedWallpapers() {
    try {
        const response = await fetch('/api/user/purchases', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('userToken') || ''}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayPurchasedWallpapers(data.purchases || []);
        } else {
            displayPurchasedWallpapers([]);
        }
    } catch (error) {
        console.error('Failed to load purchases:', error);
        displayPurchasedWallpapers([]);
    }
}

function displayPurchasedWallpapers(purchases) {
    const purchasedContainer = document.getElementById('purchased-wallpapers');
    const noPurchases = document.getElementById('no-purchases');
    
    document.getElementById('profile-purchases').textContent = purchases.length;
    
    if (purchases.length === 0) {
        purchasedContainer.classList.add('hidden');
        noPurchases.classList.remove('hidden');
        return;
    }
    
    purchasedContainer.classList.remove('hidden');
    noPurchases.classList.add('hidden');
    purchasedContainer.innerHTML = '';
    
    purchases.forEach(purchase => {
        const wallpaperElement = document.createElement('div');
        wallpaperElement.className = 'bg-gray-50 rounded-2xl overflow-hidden';
        wallpaperElement.innerHTML = `
            <img src="${purchase.wallpaper.image}" alt="${purchase.wallpaper.title[currentLanguage]}" 
                 class="w-full h-24 object-cover">
            <div class="p-3">
                <h6 class="font-medium text-sm text-black mb-1">${purchase.wallpaper.title[currentLanguage]}</h6>
                <p class="text-xs text-gray-500">${new Date(purchase.purchaseDate).toLocaleDateString(currentLanguage === 'fa' ? 'fa-IR' : 'en-US')}</p>
                <button onclick="downloadPurchasedWallpaper('${purchase.wallpaper.id}')" 
                        class="w-full mt-2 bg-black text-white py-1 px-2 rounded-xl text-xs hover:opacity-80 transition-all duration-200">
                    ${currentLanguage === 'fa' ? 'دانلود مجدد' : 'Download Again'}
                </button>
            </div>
        `;
        purchasedContainer.appendChild(wallpaperElement);
    });
}

async function downloadPurchasedWallpaper(wallpaperId) {
    try {
        const response = await fetch('/api/wallpapers/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ wallpaperId: wallpaperId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Start download
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = `wallpaper-${wallpaperId}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert(data.error || (currentLanguage === 'fa' ? 'خطا در دانلود' : 'Download failed'));
        }
    } catch (error) {
        console.error('Download error:', error);
        alert(currentLanguage === 'fa' ? 'خطا در دانلود' : 'Download failed');
    }
}

function handleContactForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value;
    
    // Simulate form submission
    const successMessage = currentLanguage === 'fa' 
        ? 'پیام شما با موفقیت ارسال شد! به زودی با شما تماس خواهیم گرفت.'
        : 'Your message has been sent successfully! We will contact you soon.';
    
    alert(successMessage);
    
    // Reset form
    contactForm.reset();
    hideContactModal();
}

// Authentication functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateAuthUI();
        } else {
            currentUser = null;
            updateAuthUI();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        currentUser = null;
        updateAuthUI();
    }
}

function updateAuthUI() {
    if (currentUser) {
        loggedOutSection.classList.add('hidden');
        loggedInSection.classList.remove('hidden');
        userNameSpan.textContent = currentUser.name;
    } else {
        loggedOutSection.classList.remove('hidden');
        loggedInSection.classList.add('hidden');
    }
}

function showModal() {
    authModal.classList.remove('hidden');
    authModal.classList.add('flex');
}

function hideModal() {
    authModal.classList.add('hidden');
    authModal.classList.remove('flex');
}

function showLoginForm() {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
}

function showRegisterForm() {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
}

async function handleLogin(event) {
    event.preventDefault();
    
    const countryCode = document.getElementById('login-country-select').value;
    const phoneNumber = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    
    const fullPhone = countryCode + phoneNumber;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone: fullPhone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            updateAuthUI();
            hideModal();
            alert(currentLanguage === 'fa' ? 'با موفقیت وارد شدید!' : 'Login successful!');
        } else {
            alert(data.error || (currentLanguage === 'fa' ? 'خطا در ورود' : 'Login failed'));
        }
    } catch (error) {
        console.error('Login error:', error);
        alert(currentLanguage === 'fa' ? 'خطا در ورود' : 'Login failed');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const countryCode = document.getElementById('country-select').value;
    const phoneNumber = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const captchaInput = document.getElementById('captcha-input').value;
    
    // Validate captcha
    if (!validateCaptcha(captchaInput)) {
        alert(currentLanguage === 'fa' ? 'کد امنیتی اشتباه است!' : 'Security code is incorrect!');
        generateCaptcha(); // Generate new captcha
        document.getElementById('captcha-input').value = '';
        return;
    }
    
    const fullPhone = countryCode + phoneNumber;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, phone: fullPhone, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(currentLanguage === 'fa' ? 'حساب کاربری با موفقیت ایجاد شد!' : 'Account created successfully!');
            showLoginForm();
        } else {
            alert(data.error || (currentLanguage === 'fa' ? 'خطا در ثبت نام' : 'Registration failed'));
            generateCaptcha(); // Generate new captcha on error
            document.getElementById('captcha-input').value = '';
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert(currentLanguage === 'fa' ? 'خطا در ثبت نام' : 'Registration failed');
        generateCaptcha(); // Generate new captcha on error
        document.getElementById('captcha-input').value = '';
    }
}

async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            currentUser = null;
            updateAuthUI();
            alert(currentLanguage === 'fa' ? 'با موفقیت خارج شدید!' : 'Logout successful!');
        }
    } catch (error) {
        console.error('Logout error:', error);
        currentUser = null;
        updateAuthUI();
    }
}

// Wallpaper filtering
function filterWallpapers(filter, wallpapers) {
    let filtered = wallpapers;
    
    switch(filter) {
        case 'free':
            filtered = wallpapers.filter(w => w.type === 'free');
            break;
        case 'premium':
            filtered = wallpapers.filter(w => w.type === 'premium');
            break;
        default:
            filtered = wallpapers;
    }
    
    return filtered;
}

// Wallpaper rendering
async function renderWallpapers() {
    wallpapersGrid.innerHTML = '';
    
    const wallpapers = await loadWallpapersFromAPI();
    const filtered = filterWallpapers(currentFilter, wallpapers);
    
    if (filtered.length === 0) {
        const noWallpapersTitle = currentLanguage === 'fa' ? 'والپیپری موجود نیست' : 'No wallpapers available';
        const noWallpapersDesc = currentLanguage === 'fa' ? 'والپیپرها پس از اضافه شدن توسط ادمین اینجا نمایش داده می‌شوند' : 'Wallpapers will appear here once added by admin';
        
        wallpapersGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 text-gray-300">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">
                    ${noWallpapersTitle}
                </h3>
                <p class="text-gray-500">
                    ${noWallpapersDesc}
                </p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(wallpaper => {
        const wallpaperCard = document.createElement('div');
        wallpaperCard.className = 'wallpaper-card bg-white rounded-3xl shadow-sm overflow-hidden border border-gray-100';
        
        const title = wallpaper.title[currentLanguage];
        const price = wallpaper.price ? wallpaper.price[currentLanguage] : null;
        const downloadsText = currentLanguage === 'fa' ? 'دانلود' : 'downloads';
        const freeText = currentLanguage === 'fa' ? 'رایگان' : 'Free';
        const downloadButtonText = wallpaper.type === 'free' 
            ? (currentLanguage === 'fa' ? 'دانلود رایگان' : 'Free Download')
            : (currentLanguage === 'fa' ? 'خرید و دانلود' : 'Buy & Download');
        
        const priceInfo = wallpaper.type === 'free' ? 
            `<span class="free-badge text-white px-3 py-1 rounded-2xl text-sm font-semibold">${freeText}</span>` :
            `<span class="price-badge text-white px-3 py-1 rounded-2xl text-sm font-semibold">${price}</span>`;
        
        const formattedDownloads = currentLanguage === 'fa' 
            ? wallpaper.downloads.toLocaleString('fa-IR')
            : wallpaper.downloads.toLocaleString('en-US');
        
        wallpaperCard.innerHTML = `
            <div class="relative">
                <img src="${wallpaper.image}" alt="${title}" 
                     class="w-full h-56 object-cover" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDQ1MFYzNTBIMzUwVjI1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'; this.classList.add('image-placeholder')">
                <div class="absolute top-3 ${currentLanguage === 'fa' ? 'right-3' : 'left-3'}">
                    ${priceInfo}
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-3 text-black">${title}</h3>
                <div class="flex justify-between items-center text-sm text-gray-600 mb-4">
                    <span class="font-medium">${wallpaper.resolution}</span>
                    <span>${formattedDownloads} ${downloadsText}</span>
                </div>
                <button class="w-full bg-black hover:opacity-80 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200"
                        onclick="downloadWallpaper(${wallpaper.id})">
                    ${downloadButtonText}
                </button>
            </div>
        `;
        
        wallpapersGrid.appendChild(wallpaperCard);
    });
}

// Copy prompt functionality
function copyPrompt(prompt, button) {
    // Check if user is logged in
    if (!currentUser) {
        const message = currentLanguage === 'fa' 
            ? 'برای کپی کردن پرامپت باید وارد حساب کاربری خود شوید.'
            : 'Please login to copy prompts.';
        alert(message);
        showModal();
        showLoginForm();
        return;
    }
    
    navigator.clipboard.writeText(prompt).then(() => {
        const originalText = button.textContent;
        const copiedText = currentLanguage === 'fa' ? 'کپی شد!' : 'Copied!';
        button.textContent = copiedText;
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = prompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalText = button.textContent;
        const copiedText = currentLanguage === 'fa' ? 'کپی شد!' : 'Copied!';
        button.textContent = copiedText;
        button.classList.add('copied');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
        }, 2000);
    });
}

// Download wallpaper functionality
async function downloadWallpaper(id) {
    // Check if user is logged in
    if (!currentUser) {
        const message = currentLanguage === 'fa' 
            ? 'برای دانلود والپیپر باید وارد حساب کاربری خود شوید.'
            : 'Please login to download wallpapers.';
        alert(message);
        showModal();
        showLoginForm();
        return;
    }
    
    const wallpaper = wallpapersData.find(w => w.id === id);
    if (!wallpaper) return;
    
    try {
        const response = await fetch('/api/wallpapers/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ wallpaperId: id })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Start download
            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = `${wallpaper.title[currentLanguage]}.jpg`;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Update download count
            wallpaper.downloads++;
            renderWallpapers();
            
            const successMessage = currentLanguage === 'fa' ? 'دانلود شروع شد!' : 'Download started!';
            alert(successMessage);
        } else {
            if (data.requiresAuth) {
                const message = currentLanguage === 'fa' 
                    ? 'برای دانلود والپیپر پریمیوم باید وارد حساب کاربری شوید.'
                    : 'Please login to download premium wallpapers.';
                alert(message);
                showModal();
                showLoginForm();
            } else if (data.requiresPremium) {
                const message = currentLanguage === 'fa' 
                    ? 'برای دانلود این والپیپر نیاز به اشتراک پریمیوم دارید.'
                    : 'Premium subscription required for this wallpaper.';
                alert(message);
            } else {
                alert(data.error || (currentLanguage === 'fa' ? 'خطا در دانلود' : 'Download failed'));
            }
        }
    } catch (error) {
        console.error('Download error:', error);
        alert(currentLanguage === 'fa' ? 'خطا در دانلود' : 'Download failed');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load saved user state first
    loadUserState();
    
    // Save state before page unload
    window.addEventListener('beforeunload', saveUserState);
    
    // Periodic state saving (every 30 seconds)
    setInterval(saveUserState, 30000);
    
    // Initialize language
    initLanguage();
    
    // Generate initial captcha
    generateCaptcha();
    
    // Check authentication status
    checkAuthStatus();
    
    // Initial render
    renderPrompts();
    renderWallpapers();
    
    // Language toggle
    langToggle.addEventListener('click', toggleLanguage);
    
    // Navigation
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
        });
    });
    
    // Authentication event listeners
    loginBtn.addEventListener('click', () => {
        showModal();
        showLoginForm();
    });
    
    registerBtn.addEventListener('click', () => {
        showModal();
        showRegisterForm();
    });
    
    logoutBtn.addEventListener('click', handleLogout);
    
    closeModalBtn.addEventListener('click', hideModal);
    
    showRegisterBtn.addEventListener('click', showRegisterForm);
    
    showLoginBtn.addEventListener('click', showLoginForm);
    
    loginFormElement.addEventListener('submit', handleLogin);
    
    registerFormElement.addEventListener('submit', handleRegister);
    
    // Close modal when clicking outside
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            hideModal();
        }
    });
    
    // Captcha refresh button
    const refreshCaptchaBtn = document.getElementById('refresh-captcha');
    if (refreshCaptchaBtn) {
        refreshCaptchaBtn.addEventListener('click', generateCaptcha);
    }
    
    // Contact and About modal event listeners
    contactBtn.addEventListener('click', showContactModal);
    aboutBtn.addEventListener('click', showAboutModal);
    closeContactModal.addEventListener('click', hideContactModal);
    closeAboutModal.addEventListener('click', hideAboutModal);
    contactForm.addEventListener('submit', handleContactForm);
    
    // Profile modal event listeners
    if (profileBtn) {
        profileBtn.addEventListener('click', showProfileModal);
    }
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', hideProfileModal);
    }
    
    // Close modals when clicking outside
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            hideContactModal();
        }
    });
    
    aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            hideAboutModal();
        }
    });
    
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) {
                hideProfileModal();
            }
        });
    }
    
    // Filter buttons
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            currentFilter = filter;
            
            // Update active filter button
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.style.backgroundColor = '';
                b.style.color = '';
                b.classList.remove('bg-black', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-700');
            });
            
            btn.classList.add('active');
            btn.classList.remove('bg-gray-100', 'text-gray-700');
            btn.classList.add('bg-black', 'text-white');
            btn.style.backgroundColor = 'black';
            btn.style.color = 'white';
            
            // Save state when filter changes
            saveUserState();
            
            // Re-render wallpapers
            renderWallpapers();
        });
    });
    
    // Save state before page unload
    window.addEventListener('beforeunload', saveUserState);
    
    // Periodic state saving (every 30 seconds)
    setInterval(saveUserState, 30000);
});
