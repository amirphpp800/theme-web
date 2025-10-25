// Sample data for prompts and wallpapers with bilingual support
const promptsData = [];

const wallpapersData = [
];

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

// Notification System
let notificationId = 0;

function showNotification(message, type = 'info', duration = 4000) {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const id = ++notificationId;
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('data-id', id);
    
    // Get appropriate icon based on type
    let iconSvg = '';
    switch(type) {
        case 'success':
            iconSvg = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
            break;
        case 'error':
            iconSvg = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
            break;
        case 'warning':
            iconSvg = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>';
            break;
        case 'info':
        default:
            iconSvg = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
            break;
    }
    
    notification.innerHTML = `
        <svg class="notification-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${iconSvg}
        </svg>
        <div class="notification-content">${message}</div>
        <button class="notification-close" onclick="hideNotification(${id})">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
        <div class="notification-progress" style="width: 100%;"></div>
    `;
    
    container.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Auto dismiss with progress bar
    if (duration > 0) {
        const progressBar = notification.querySelector('.notification-progress');
        if (progressBar) {
            progressBar.style.transition = `width ${duration}ms linear`;
            setTimeout(() => {
                progressBar.style.width = '0%';
            }, 50);
        }
        
        setTimeout(() => {
            hideNotification(id);
        }, duration);
    }
    
    return id;
}

function hideNotification(id) {
    const notification = document.querySelector(`[data-id="${id}"]`);
    if (!notification) return;
    
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function clearAllNotifications() {
    const container = document.getElementById('notification-container');
    if (!container) return;
    
    const notifications = container.querySelectorAll('.notification');
    notifications.forEach(notification => {
        notification.classList.remove('show');
        notification.classList.add('hide');
    });
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 300);
}

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
const contactBtn = document.getElementById('contact-btn');
const aboutBtn = document.getElementById('about-btn');
const closeContactModal = document.getElementById('close-contact-modal');
const closeAboutModal = document.getElementById('close-about-modal');
const contactForm = document.getElementById('contact-form');

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
    
    // Update phone placeholders for new language
    const loginCountrySelect = document.getElementById('login-country-select');
    const loginPhoneInput = document.getElementById('login-phone');
    const registerCountrySelect = document.getElementById('country-select');
    const registerPhoneInput = document.getElementById('register-phone');
    
    if (loginCountrySelect && loginPhoneInput) {
        updatePhonePlaceholder(loginCountrySelect, loginPhoneInput);
    }
    if (registerCountrySelect && registerPhoneInput) {
        updatePhonePlaceholder(registerCountrySelect, registerPhoneInput);
    }
    
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

    // Render content for the selected section
    if (targetSection === 'prompts') {
        renderPrompts();
    } else if (targetSection === 'wallpapers') {
        renderWallpapers();
    }
}

// Load prompts from API with caching and deduplication
let promptsCache = null;
let promptsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function loadPromptsFromAPI() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (promptsCache && (now - promptsCacheTime) < CACHE_DURATION) {
        return promptsCache;
    }
    
    try {
        const response = await fetch('/api/content/prompts');
        const data = await response.json();
        
        if (data.success && data.prompts) {
            // Deduplicate prompts by ID and title
            const uniquePrompts = [];
            const seenIds = new Set();
            const seenTitles = new Set();
            
            for (const prompt of data.prompts) {
                const titleKey = `${prompt.title.fa}-${prompt.title.en}`;
                if (!seenIds.has(prompt.id) && !seenTitles.has(titleKey)) {
                    seenIds.add(prompt.id);
                    seenTitles.add(titleKey);
                    uniquePrompts.push(prompt);
                }
            }
            
            promptsCache = uniquePrompts;
            promptsCacheTime = now;
            return uniquePrompts;
        }
    } catch (error) {
        console.error('Failed to load prompts from API:', error);
    }
    
    // Return cached data if available, otherwise empty array
    return promptsCache || [];
}

// Load wallpapers from API with caching and deduplication
let wallpapersCache = null;
let wallpapersCacheTime = 0;

async function loadWallpapersFromAPI() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (wallpapersCache && (now - wallpapersCacheTime) < CACHE_DURATION) {
        return wallpapersCache;
    }
    
    try {
        const response = await fetch('/api/content/wallpapers');
        const data = await response.json();
        
        if (data.success && data.wallpapers) {
            // Deduplicate wallpapers by ID and title
            const uniqueWallpapers = [];
            const seenIds = new Set();
            const seenTitles = new Set();
            
            for (const wallpaper of data.wallpapers) {
                const titleKey = `${wallpaper.title.fa}-${wallpaper.title.en}`;
                if (!seenIds.has(wallpaper.id) && !seenTitles.has(titleKey)) {
                    seenIds.add(wallpaper.id);
                    seenTitles.add(titleKey);
                    uniqueWallpapers.push(wallpaper);
                }
            }
            
            wallpapersCache = uniqueWallpapers;
            wallpapersCacheTime = now;
            return uniqueWallpapers;
        }
    } catch (error) {
        console.error('Failed to load wallpapers from API:', error);
    }
    
    // Return cached data if available, otherwise empty array
    return wallpapersCache || [];
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
        const loginText = currentLanguage === 'fa' ? 'ورود برای مشاهده' : 'Login to View';
        
        // Create preview text based on login status
        let previewText;
        let buttonText;
        let buttonAction;
        
        if (currentUser) {
            // User is logged in - show full preview and copy functionality
            previewText = prompt.prompt.length > 80 ? prompt.prompt.substring(0, 80) + '...' : prompt.prompt;
            buttonText = copyText;
            buttonAction = `event.stopPropagation(); copyPromptFromCard('${prompt.prompt.replace(/'/g, "\\'")}', '${title.replace(/'/g, "\\'")}')`;
        } else {
            // User is not logged in - show limited preview and login prompt
            previewText = prompt.prompt.length > 30 ? prompt.prompt.substring(0, 30) + '...' : prompt.prompt;
            buttonText = loginText;
            buttonAction = `event.stopPropagation(); showLoginPrompt()`;
        }
        
        const lockOverlay = !currentUser ? `
            <!-- Lock overlay for non-logged users -->
            <div class="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <div class="bg-white/20 rounded-full p-3">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                </div>
            </div>
        ` : '';
        
        promptCard.innerHTML = `
            <div class="relative cursor-pointer group h-80 overflow-hidden" onclick="showPromptModal('${prompt.id}')">
                <!-- Background Image -->
                <img src="${prompt.image}" alt="${title}" loading="lazy" decoding="async" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDE2MjVWMTc1SDE3NVYxMjVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg=='; this.classList.add('image-placeholder');">
                
                <!-- Dark gradient overlay for text readability -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                <!-- Hover overlay -->
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                
                ${lockOverlay}
                
                <!-- Content overlay -->
                <div class="absolute inset-0 flex flex-col justify-between p-4">
                    <!-- Top section - View icon (appears on hover) -->
                    <div class="flex justify-center items-start">
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div class="bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                                <svg class="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Bottom section - Title, preview text, and button -->
                    <div class="space-y-3">
                        <h3 class="text-white font-bold text-lg leading-tight drop-shadow-lg">${title}</h3>
                        <p class="text-white/90 text-sm leading-relaxed drop-shadow-md line-clamp-2">${previewText}</p>
                        <button class="copy-btn w-full bg-white/90 hover:bg-white text-black py-2.5 px-4 rounded-2xl font-medium transition-all duration-200 backdrop-blur-sm shadow-lg" 
                                onclick="${buttonAction}">
                            ${buttonText}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        promptsGrid.appendChild(promptCard);
    });
}

// Show login prompt for non-logged users
function showLoginPrompt() {
    const message = currentLanguage === 'fa' 
        ? 'برای کپی کردن و مشاهده پرامپت‌ها باید وارد حساب کاربری خود شوید.'
        : 'Please login to copy and view prompts.';
    showNotification(message, 'warning');
    showModal();
    showLoginForm();
}

// Prompt Modal functions
async function showPromptModal(promptId) {
    // Check if user is logged in
    if (!currentUser) {
        const message = currentLanguage === 'fa' 
            ? 'برای مشاهده پرامپت کامل باید وارد حساب کاربری خود شوید.'
            : 'Please login to view full prompts.';
        showNotification(message, 'warning');
        showModal();
        showLoginForm();
        return;
    }
    
    const prompts = await loadPromptsFromAPI();
    const prompt = prompts.find(p => p.id == promptId);
    if (!prompt) return;
    
    const modal = document.getElementById('prompt-modal');
    const modalImage = document.getElementById('prompt-modal-image');
    const modalTitle = document.getElementById('prompt-modal-title');
    const modalText = document.getElementById('prompt-modal-text');
    const modalCopyBtn = document.getElementById('prompt-modal-copy');
    
    // Set modal content
    modalImage.src = prompt.image;
    modalImage.alt = prompt.title[currentLanguage];
    modalTitle.textContent = prompt.title[currentLanguage];
    modalText.textContent = prompt.prompt;
    
    // Update copy button onclick
    modalCopyBtn.onclick = () => copyPromptFromCard(prompt.prompt, prompt.title[currentLanguage]);
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hidePromptModal() {
    const modal = document.getElementById('prompt-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
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
    
    showNotification(successMessage, 'success');
    
    // Reset form
    contactForm.reset();
    hideContactModal();
}

// Authentication mode management
let loginMode = 'phone'; // 'phone' or 'username'
let registerMode = 'phone'; // 'phone' or 'username'

function toggleLoginMode(mode) {
    loginMode = mode;
    const phoneFields = document.getElementById('login-phone-fields');
    const usernameFields = document.getElementById('login-username-fields');
    const phoneBtn = document.getElementById('login-mode-phone');
    const usernameBtn = document.getElementById('login-mode-username');
    
    if (mode === 'phone') {
        phoneFields.classList.remove('hidden');
        usernameFields.classList.add('hidden');
        phoneBtn.classList.add('bg-black', 'text-white');
        phoneBtn.classList.remove('text-gray-600');
        usernameBtn.classList.remove('bg-black', 'text-white');
        usernameBtn.classList.add('text-gray-600');
        
        // Update required attributes
        document.getElementById('login-phone').required = true;
        document.getElementById('login-username').required = false;
    } else {
        phoneFields.classList.add('hidden');
        usernameFields.classList.remove('hidden');
        usernameBtn.classList.add('bg-black', 'text-white');
        usernameBtn.classList.remove('text-gray-600');
        phoneBtn.classList.remove('bg-black', 'text-white');
        phoneBtn.classList.add('text-gray-600');
        
        // Update required attributes
        document.getElementById('login-phone').required = false;
        document.getElementById('login-username').required = true;
    }
}

function toggleRegisterMode(mode) {
    registerMode = mode;
    const phoneFields = document.getElementById('register-phone-fields');
    const usernameFields = document.getElementById('register-username-fields');
    const phoneBtn = document.getElementById('register-mode-phone');
    const usernameBtn = document.getElementById('register-mode-username');
    
    if (mode === 'phone') {
        phoneFields.classList.remove('hidden');
        usernameFields.classList.add('hidden');
        phoneBtn.classList.add('bg-black', 'text-white');
        phoneBtn.classList.remove('text-gray-600');
        usernameBtn.classList.remove('bg-black', 'text-white');
        usernameBtn.classList.add('text-gray-600');
        
        // Update required attributes
        document.getElementById('register-phone').required = true;
        document.getElementById('register-username').required = false;
    } else {
        phoneFields.classList.add('hidden');
        usernameFields.classList.remove('hidden');
        usernameBtn.classList.add('bg-black', 'text-white');
        usernameBtn.classList.remove('text-gray-600');
        phoneBtn.classList.remove('bg-black', 'text-white');
        phoneBtn.classList.add('text-gray-600');
        
        // Update required attributes
        document.getElementById('register-phone').required = false;
        document.getElementById('register-username').required = true;
    }
}

// Phone placeholder management
function updatePhonePlaceholder(selectElement, inputElement) {
    const selectedCountry = selectElement.value;
    const isEnglish = currentLanguage === 'en';
    
    if (selectedCountry === '+98') {
        // Iran format
        if (isEnglish) {
            inputElement.placeholder = '9123456789';
        } else {
            inputElement.placeholder = '۹۱۲۳۴۵۶۷۸۹';
        }
    } else if (selectedCountry === '+1') {
        // USA format
        if (isEnglish) {
            inputElement.placeholder = '2025551234';
        } else {
            inputElement.placeholder = '۲۰۲۵۵۵۱۲۳۴';
        }
    }
}

// Password visibility toggle - Enhanced version
function setupPasswordToggle(formType) {
    const toggleBtn = document.getElementById(`toggle-${formType}-password`);
    const passwordInput = document.getElementById(`${formType}-password`);
    const eyeClosed = document.getElementById(`${formType}-eye-closed`);
    const eyeOpen = document.getElementById(`${formType}-eye-open`);
    
    if (toggleBtn && passwordInput && eyeClosed && eyeOpen) {
        // Remove any existing event listeners
        const newToggleBtn = toggleBtn.cloneNode(true);
        toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
        
        // Get references to the new elements
        const newEyeClosed = newToggleBtn.querySelector(`#${formType}-eye-closed`);
        const newEyeOpen = newToggleBtn.querySelector(`#${formType}-eye-open`);
        
        newToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                newEyeClosed.classList.add('hidden');
                newEyeOpen.classList.remove('hidden');
            } else {
                passwordInput.type = 'password';
                newEyeClosed.classList.remove('hidden');
                newEyeOpen.classList.add('hidden');
            }
        });
        
        // Prevent form submission on button click
        newToggleBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
        });
    }
}

// Initialize all password toggles
function initializePasswordToggles() {
    setupPasswordToggle('login');
    setupPasswordToggle('register');
    
    // Also setup for admin panel if exists
    const adminToggle = document.getElementById('toggle-admin-password');
    if (adminToggle) {
        setupPasswordToggle('admin');
    }
}

// Test function to simulate login (for development/testing)
function simulateLogin() {
    currentUser = {
        name: 'کاربر تست',
        phone: '+989123456789',
        id: 1
    };
    updateAuthUI();
    showNotification(currentLanguage === 'fa' ? 'ورود تست انجام شد!' : 'Test login successful!', 'success');
}

function simulateLogout() {
    currentUser = null;
    updateAuthUI();
    showNotification(currentLanguage === 'fa' ? 'خروج تست انجام شد!' : 'Test logout successful!', 'info');
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
    
    // Re-render prompts to update login-dependent content
    renderPrompts();
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

// Debounce function to prevent rapid submissions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Track login attempts to prevent spam
let loginAttempts = 0;
let lastLoginAttempt = 0;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_COOLDOWN = 60000; // 1 minute

async function handleLogin(event) {
    event.preventDefault();
    
    // Check rate limiting
    const now = Date.now();
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS && (now - lastLoginAttempt) < LOGIN_COOLDOWN) {
        const remainingTime = Math.ceil((LOGIN_COOLDOWN - (now - lastLoginAttempt)) / 1000);
        showNotification(
            currentLanguage === 'fa' 
                ? `تعداد تلاش‌های ورود بیش از حد. ${remainingTime} ثانیه صبر کنید.`
                : `Too many login attempts. Wait ${remainingTime} seconds.`, 
            'warning'
        );
        return;
    }
    
    // Disable submit button to prevent double submission
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = currentLanguage === 'fa' ? 'در حال ورود...' : 'Logging in...';
    
    const password = document.getElementById('login-password').value;
    let loginData = { password };
    
    if (loginMode === 'phone') {
        const countryCode = document.getElementById('login-country-select').value;
        const phoneNumber = document.getElementById('login-phone').value;
        loginData.phone = countryCode + phoneNumber;
    } else {
        const username = document.getElementById('login-username').value;
        loginData.username = username;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (response.ok) {
            loginAttempts = 0; // Reset attempts on success
            currentUser = data.user;
            updateAuthUI();
            hideModal();
            
            // Clear cache to refresh content
            promptsCache = null;
            wallpapersCache = null;
            
            showNotification(currentLanguage === 'fa' ? 'با موفقیت وارد شدید!' : 'Login successful!', 'success');
        } else {
            loginAttempts++;
            lastLoginAttempt = now;
            showNotification(data.error || (currentLanguage === 'fa' ? 'خطا در ورود' : 'Login failed'), 'error');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            showNotification(currentLanguage === 'fa' ? 'زمان ورود به پایان رسید' : 'Login timeout', 'error');
        } else {
            console.error('Login error:', error);
            showNotification(currentLanguage === 'fa' ? 'خطا در ورود' : 'Login failed', 'error');
        }
        loginAttempts++;
        lastLoginAttempt = now;
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Track registration attempts
let registerAttempts = 0;
let lastRegisterAttempt = 0;
const MAX_REGISTER_ATTEMPTS = 3;
const REGISTER_COOLDOWN = 300000; // 5 minutes

async function handleRegister(event) {
    event.preventDefault();
    
    // Check rate limiting
    const now = Date.now();
    if (registerAttempts >= MAX_REGISTER_ATTEMPTS && (now - lastRegisterAttempt) < REGISTER_COOLDOWN) {
        const remainingTime = Math.ceil((REGISTER_COOLDOWN - (now - lastRegisterAttempt)) / 60000);
        showNotification(
            currentLanguage === 'fa' 
                ? `تعداد تلاش‌های ثبت‌نام بیش از حد. ${remainingTime} دقیقه صبر کنید.`
                : `Too many registration attempts. Wait ${remainingTime} minutes.`, 
            'warning'
        );
        return;
    }
    
    const name = document.getElementById('register-name').value.trim();
    const password = document.getElementById('register-password').value;
    const captchaInput = document.getElementById('captcha-input').value;
    
    // Validate inputs
    if (name.length < 2) {
        showNotification(currentLanguage === 'fa' ? 'نام باید حداقل ۲ کاراکتر باشد' : 'Name must be at least 2 characters', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification(currentLanguage === 'fa' ? 'رمز عبور باید حداقل ۶ کاراکتر باشد' : 'Password must be at least 6 characters', 'error');
        return;
    }
    
    // Validate captcha
    if (!validateCaptcha(captchaInput)) {
        showNotification(currentLanguage === 'fa' ? 'کد امنیتی اشتباه است!' : 'Security code is incorrect!', 'error');
        generateCaptcha();
        document.getElementById('captcha-input').value = '';
        return;
    }
    
    // Disable submit button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = currentLanguage === 'fa' ? 'در حال ثبت‌نام...' : 'Registering...';
    
    let registerData = { name, password };
    
    if (registerMode === 'phone') {
        const countryCode = document.getElementById('country-select').value;
        const phoneNumber = document.getElementById('register-phone').value;
        registerData.phone = countryCode + phoneNumber;
    } else {
        const username = document.getElementById('register-username').value.trim();
        if (username.length < 3) {
            showNotification(currentLanguage === 'fa' ? 'نام کاربری باید حداقل ۳ کاراکتر باشد' : 'Username must be at least 3 characters', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        registerData.username = username;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();
        
        if (response.ok) {
            registerAttempts = 0; // Reset attempts on success
            showNotification(currentLanguage === 'fa' ? 'حساب کاربری با موفقیت ایجاد شد!' : 'Account created successfully!', 'success');
            showLoginForm();
            // Pre-fill login form
            if (registerMode === 'phone') {
                document.getElementById('login-country-select').value = document.getElementById('country-select').value;
                document.getElementById('login-phone').value = document.getElementById('register-phone').value;
            } else {
                document.getElementById('login-username').value = registerData.username;
            }
        } else {
            registerAttempts++;
            lastRegisterAttempt = now;
            showNotification(data.error || (currentLanguage === 'fa' ? 'خطا در ثبت نام' : 'Registration failed'), 'error');
            generateCaptcha();
            document.getElementById('captcha-input').value = '';
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            showNotification(currentLanguage === 'fa' ? 'زمان ثبت‌نام به پایان رسید' : 'Registration timeout', 'error');
        } else {
            console.error('Registration error:', error);
            showNotification(currentLanguage === 'fa' ? 'خطا در ثبت نام' : 'Registration failed', 'error');
        }
        registerAttempts++;
        lastRegisterAttempt = now;
        generateCaptcha();
        document.getElementById('captcha-input').value = '';
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
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
            showNotification(currentLanguage === 'fa' ? 'با موفقیت خارج شدید!' : 'Logout successful!', 'success');
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
        const zipText = currentLanguage === 'fa' ? 'ZIP' : 'ZIP';
        const imageText = currentLanguage === 'fa' ? 'تصویر' : 'Image';
        
        // Determine download button text based on file type
        let downloadButtonText;
        if (wallpaper.type === 'free') {
            downloadButtonText = wallpaper.fileType === 'zip' 
                ? (currentLanguage === 'fa' ? 'دانلود زیپ رایگان' : 'Free ZIP Download')
                : (currentLanguage === 'fa' ? 'دانلود رایگان' : 'Free Download');
        } else {
            downloadButtonText = wallpaper.fileType === 'zip'
                ? (currentLanguage === 'fa' ? 'خرید زیپ' : 'Buy ZIP Package')
                : (currentLanguage === 'fa' ? 'خرید و دانلود' : 'Buy & Download');
        }
        
        const priceInfo = wallpaper.type === 'free' ? 
            `<span class="free-badge bg-green-500 text-white px-3 py-1 rounded-2xl text-sm font-semibold">${freeText}</span>` :
            `<span class="price-badge bg-purple-500 text-white px-3 py-1 rounded-2xl text-sm font-semibold">${price}</span>`;
        
        // File type badge
        const fileTypeBadge = wallpaper.fileType === 'zip' ?
            `<span class="file-type-badge bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium">${zipText}</span>` :
            `<span class="file-type-badge bg-gray-500 text-white px-2 py-1 rounded-lg text-xs font-medium">${imageText}</span>`;
        
        const formattedDownloads = currentLanguage === 'fa' 
            ? wallpaper.downloads.toLocaleString('fa-IR')
            : wallpaper.downloads.toLocaleString('en-US');
        
        // Format file size if available
        const fileSizeText = wallpaper.fileSize ? 
            (currentLanguage === 'fa' 
                ? `${(wallpaper.fileSize / (1024 * 1024)).toFixed(1)} مگابایت`
                : `${(wallpaper.fileSize / (1024 * 1024)).toFixed(1)} MB`
            ) : null;
        
        wallpaperCard.innerHTML = `
            <div class="relative group cursor-pointer" onclick="showWallpaperPreview('${wallpaper.id}')">
                <img src="${wallpaper.image}" alt="${title}" loading="lazy" decoding="async" 
                     class="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNTAgMjUwSDQ1MFYzNTBIMzUwVjI1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'; this.classList.add('image-placeholder')">
                
                <!-- Overlay on hover -->
                <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div class="bg-white bg-opacity-90 rounded-full p-3 shadow-lg">
                            <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
                
                <!-- Badges -->
                <div class="absolute top-3 ${currentLanguage === 'fa' ? 'right-3' : 'left-3'} flex flex-col gap-2">
                    ${priceInfo}
                    ${fileTypeBadge}
                </div>
                
                <!-- Resolution badge -->
                <div class="absolute bottom-3 ${currentLanguage === 'fa' ? 'left-3' : 'right-3'}">
                    <span class="bg-black bg-opacity-70 text-white px-2 py-1 rounded-lg text-xs font-medium">${wallpaper.resolution}</span>
                </div>
            </div>
            
            <div class="p-6">
                <h3 class="text-xl font-bold mb-3 text-black">${title}</h3>
                
                <!-- Stats row -->
                <div class="flex justify-between items-center text-sm text-gray-600 mb-3">
                    <span>${formattedDownloads} ${downloadsText}</span>
                    ${fileSizeText ? `<span class="font-medium">${fileSizeText}</span>` : '<span></span>'}
                </div>
                
                <!-- Download button -->
                <button class="w-full bg-black hover:opacity-80 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        onclick="event.stopPropagation(); downloadWallpaper('${wallpaper.id}')">
                    ${wallpaper.fileType === 'zip' ? 
                        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4"></path></svg>' :
                        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
                    }
                    <span>${downloadButtonText}</span>
                </button>
            </div>
        `;
        
        wallpapersGrid.appendChild(wallpaperCard);
    });
}

// Copy prompt functionality from card click
function copyPromptFromCard(prompt, title) {
    // Check if user is logged in
    if (!currentUser) {
        const message = currentLanguage === 'fa' 
            ? 'برای کپی کردن پرامپت باید وارد حساب کاربری خود شوید.'
            : 'Please login to copy prompts.';
        showNotification(message, 'warning');
        showModal();
        showLoginForm();
        return;
    }
    
    navigator.clipboard.writeText(prompt).then(() => {
        const successMessage = currentLanguage === 'fa' 
            ? `پرامپت "${title}" کپی شد!`
            : `Prompt "${title}" copied!`;
        showNotification(successMessage, 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = prompt;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const successMessage = currentLanguage === 'fa' 
            ? `پرامپت "${title}" کپی شد!`
            : `Prompt "${title}" copied!`;
        showNotification(successMessage, 'success');
    });
}

// Legacy copy prompt functionality (keeping for compatibility)
function copyPrompt(prompt, button) {
    // Check if user is logged in
    if (!currentUser) {
        const message = currentLanguage === 'fa' 
            ? 'برای کپی کردن پرامپت باید وارد حساب کاربری خود شوید.'
            : 'Please login to copy prompts.';
        showNotification(message, 'warning');
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

// Show wallpaper preview modal
async function showWallpaperPreview(id) {
    const wallpapers = await loadWallpapersFromAPI();
    const wallpaper = wallpapers.find(w => w.id === id);
    if (!wallpaper) return;
    
    const title = wallpaper.title[currentLanguage];
    const price = wallpaper.price ? wallpaper.price[currentLanguage] : null;
    const freeText = currentLanguage === 'fa' ? 'رایگان' : 'Free';
    const fileSizeText = wallpaper.fileSize ? 
        (currentLanguage === 'fa' 
            ? `${(wallpaper.fileSize / (1024 * 1024)).toFixed(1)} مگابایت`
            : `${(wallpaper.fileSize / (1024 * 1024)).toFixed(1)} MB`
        ) : '';
    
    // Create modal HTML
    const modalHTML = `
        <div id="wallpaper-preview-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div class="flex flex-col md:flex-row h-full">
                    <!-- Image Section -->
                    <div class="md:w-2/3 bg-gray-50 flex items-center justify-center p-6">
                        <img src="${wallpaper.image}" alt="${title}" loading="lazy" decoding="async" class="max-w-full max-h-96 object-contain rounded-2xl shadow-lg">
                    </div>
                    
                    <!-- Info Section -->
                    <div class="md:w-1/3 p-6 flex flex-col">
                        <div class="flex justify-between items-start mb-4">
                            <h3 class="text-2xl font-bold text-black">${title}</h3>
                            <button onclick="closeWallpaperPreview()" class="text-gray-400 hover:text-gray-600 p-2">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="flex-1 space-y-4">
                            <!-- Price -->
                            <div class="flex items-center gap-2">
                                <span class="${wallpaper.type === 'free' ? 'bg-green-500' : 'bg-purple-500'} text-white px-3 py-1 rounded-2xl text-sm font-semibold">
                                    ${wallpaper.type === 'free' ? freeText : price}
                                </span>
                                <span class="${wallpaper.fileType === 'zip' ? 'bg-blue-500' : 'bg-gray-500'} text-white px-2 py-1 rounded-lg text-xs font-medium">
                                    ${wallpaper.fileType === 'zip' ? 'ZIP' : (currentLanguage === 'fa' ? 'تصویر' : 'Image')}
                                </span>
                            </div>
                            
                            <!-- Details -->
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-600">${currentLanguage === 'fa' ? 'رزولوشن:' : 'Resolution:'}</span>
                                    <span class="font-medium">${wallpaper.resolution}</span>
                                </div>
                                ${fileSizeText ? `
                                <div class="flex justify-between">
                                    <span class="text-gray-600">${currentLanguage === 'fa' ? 'حجم فایل:' : 'File Size:'}</span>
                                    <span class="font-medium">${fileSizeText}</span>
                                </div>
                                ` : ''}
                                <div class="flex justify-between">
                                    <span class="text-gray-600">${currentLanguage === 'fa' ? 'دانلودها:' : 'Downloads:'}</span>
                                    <span class="font-medium">${wallpaper.downloads.toLocaleString(currentLanguage === 'fa' ? 'fa-IR' : 'en-US')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Download Button -->
                        <button onclick="downloadWallpaper('${wallpaper.id}')" class="w-full bg-black hover:opacity-80 text-white py-3 px-6 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                            ${wallpaper.fileType === 'zip' ? 
                                '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4"></path></svg>' :
                                '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
                            }
                            <span>${currentLanguage === 'fa' ? 'دانلود' : 'Download'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeWallpaperPreview() {
    const modal = document.getElementById('wallpaper-preview-modal');
    if (modal) {
        modal.remove();
    }
}

// Download wallpaper functionality
async function downloadWallpaper(id) {
    // Check if user is logged in
    if (!currentUser) {
        const message = currentLanguage === 'fa' 
            ? 'برای دانلود والپیپر باید وارد حساب کاربری خود شوید.'
            : 'Please login to download wallpapers.';
        showNotification(message, 'warning');
        showModal();
        showLoginForm();
        return;
    }
    
    const wallpapers = await loadWallpapersFromAPI();
    const wallpaper = wallpapers.find(w => w.id === id);
    if (!wallpaper) {
        showNotification(currentLanguage === 'fa' ? 'والپیپر یافت نشد' : 'Wallpaper not found', 'error');
        return;
    }
    
    // Show loading state
    const downloadingText = currentLanguage === 'fa' ? 'در حال دانلود...' : 'Downloading...';
    showNotification(downloadingText, 'info', 0); // No auto-dismiss
    
    try {
        // Use the download URL if available, otherwise use the image URL
        const downloadUrl = wallpaper.downloadUrl || wallpaper.image;
        const fileName = wallpaper.fileType === 'zip' 
            ? `${wallpaper.title[currentLanguage]}.zip`
            : `${wallpaper.title[currentLanguage]}.jpg`;
        
        // Start download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update download count (simulate API call)
        wallpaper.downloads++;
        
        // Clear loading notification and show success
        clearAllNotifications();
        const successMessage = currentLanguage === 'fa' ? 'دانلود شروع شد!' : 'Download started!';
        showNotification(successMessage, 'success');
        
        // Close preview modal if open
        closeWallpaperPreview();
        
        // Re-render wallpapers to update download count
        renderWallpapers();
        
    } catch (error) {
        console.error('Download error:', error);
        clearAllNotifications();
        showNotification(currentLanguage === 'fa' ? 'خطا در دانلود' : 'Download failed', 'error');
    }
}

// Make test functions available globally for console testing
window.testLogin = simulateLogin;
window.testLogout = simulateLogout;

// Console message for developers
console.log('🎉 iMagera Admin System Ready!');
console.log('📝 All default prompts and wallpapers have been removed.');
console.log('🔧 Use admin panel at /adminpanel/ to add content.');
console.log('🧪 Test login: testLogin() | Test logout: testLogout()');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize language and auth
    initLanguage();
    checkAuthStatus();
    
    // Initialize captcha
    generateCaptcha();
    
    // Initialize password toggles
    initializePasswordToggles();
    
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
    
    // Mobile authentication event listeners
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    const registerBtnMobile = document.getElementById('register-btn-mobile');
    
    if (loginBtnMobile) {
        loginBtnMobile.addEventListener('click', () => {
            showModal();
            showLoginForm();
        });
    }
    
    if (registerBtnMobile) {
        registerBtnMobile.addEventListener('click', () => {
            showModal();
            showRegisterForm();
        });
    }
    
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
    
    // Login/Register mode toggle buttons
    const loginModePhone = document.getElementById('login-mode-phone');
    const loginModeUsername = document.getElementById('login-mode-username');
    const registerModePhone = document.getElementById('register-mode-phone');
    const registerModeUsername = document.getElementById('register-mode-username');
    
    if (loginModePhone) {
        loginModePhone.addEventListener('click', () => toggleLoginMode('phone'));
    }
    if (loginModeUsername) {
        loginModeUsername.addEventListener('click', () => toggleLoginMode('username'));
    }
    if (registerModePhone) {
        registerModePhone.addEventListener('click', () => toggleRegisterMode('phone'));
    }
    if (registerModeUsername) {
        registerModeUsername.addEventListener('click', () => toggleRegisterMode('username'));
    }
    
    // Password visibility toggle buttons are already initialized
    
    // Phone placeholder management
    const loginCountrySelect = document.getElementById('login-country-select');
    const loginPhoneInput = document.getElementById('login-phone');
    const registerCountrySelect = document.getElementById('country-select');
    const registerPhoneInput = document.getElementById('register-phone');
    
    if (loginCountrySelect && loginPhoneInput) {
        loginCountrySelect.addEventListener('change', () => {
            updatePhonePlaceholder(loginCountrySelect, loginPhoneInput);
        });
        // Set initial placeholder
        updatePhonePlaceholder(loginCountrySelect, loginPhoneInput);
    }
    
    if (registerCountrySelect && registerPhoneInput) {
        registerCountrySelect.addEventListener('change', () => {
            updatePhonePlaceholder(registerCountrySelect, registerPhoneInput);
        });
        // Set initial placeholder
        updatePhonePlaceholder(registerCountrySelect, registerPhoneInput);
    }
    
    // Contact and About modal event listeners
    contactBtn.addEventListener('click', showContactModal);
    aboutBtn.addEventListener('click', showAboutModal);
    closeContactModal.addEventListener('click', hideContactModal);
    closeAboutModal.addEventListener('click', hideAboutModal);
    contactForm.addEventListener('submit', handleContactForm);
    
    // Prompt modal event listeners
    const closePromptModal = document.getElementById('close-prompt-modal');
    const promptModal = document.getElementById('prompt-modal');
    if (closePromptModal) {
        closePromptModal.addEventListener('click', hidePromptModal);
    }
    if (promptModal) {
        promptModal.addEventListener('click', (e) => {
            if (e.target === promptModal) {
                hidePromptModal();
            }
        });
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
            
            // Re-render wallpapers
            renderWallpapers();
        });
    });
});
