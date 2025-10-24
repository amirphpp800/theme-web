// Sample data for prompts and wallpapers with bilingual support
const promptsData = [];

const wallpapersData = [
];

// Global variables
let currentLanguage = 'fa';
let currentFilter = 'all';
let currentUser = null;
let currentCaptcha = '';
let authLoading = false; // Added to manage authentication loading state
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
}

// API caching
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Load prompts from API with caching
async function loadPromptsFromAPI() {
    const cacheKey = 'prompts';
    const cached = apiCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch('/api/content/prompts', {
            signal: controller.signal,
            headers: { 'Cache-Control': 'max-age=300' }
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.success && data.prompts.length > 0) {
            apiCache.set(cacheKey, {
                data: data.prompts,
                timestamp: Date.now()
            });
            return data.prompts;
        }
    } catch (error) {
        console.error('Failed to load prompts from API:', error);
    }

    // Fallback to hardcoded data
    return promptsData;
}

// Load wallpapers from API with caching
async function loadWallpapersFromAPI() {
    const cacheKey = 'wallpapers';
    const cached = apiCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch('/api/content/wallpapers', {
            signal: controller.signal,
            headers: { 'Cache-Control': 'max-age=300' }
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.success && data.wallpapers.length > 0) {
            apiCache.set(cacheKey, {
                data: data.wallpapers,
                timestamp: Date.now()
            });
            return data.wallpapers;
        }
    } catch (error) {
        console.error('Failed to load wallpapers from API:', error);
    }

    // Fallback to hardcoded data
    return wallpapersData;
}

// Prompt rendering with optimizations
async function renderPrompts() {
    // Show loading state
    promptsGrid.innerHTML = `
        <div class="col-span-full flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
    `;

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
                <img src="${prompt.image}" alt="${title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ci8+CjxwYXRoIGQ9Ik0xNzU 4MjVIMTYyVW9yZSBmcm9tIHRoZSBmb3JtIGFyZSB3ZWxsIGluc3RlYWQgYSBnb29kIHByb2plY3QgdG8gYmVmb3JlIHRoZSBwaG9uZS5wYXRoIGQ9Ik0xNzUgMTI1SDE2MjVWMTc1SDE3NVYxMjVaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg=='; this.classList.add('image-placeholder');">

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

// Password visibility toggle
function setupPasswordToggle(formType) {
    const toggleBtn = document.getElementById(`toggle-${formType}-password`);
    const passwordInput = document.getElementById(`${formType}-password`);
    const eyeClosed = document.getElementById(`${formType}-eye-closed`);
    const eyeOpen = document.getElementById(`${formType}-eye-open`);

    if (toggleBtn && passwordInput && eyeClosed && eyeOpen) {
        toggleBtn.addEventListener('click', () => {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeClosed.classList.add('hidden');
                eyeOpen.classList.remove('hidden');
            } else {
                passwordInput.type = 'password';
                eyeClosed.classList.remove('hidden');
                eyeOpen.classList.add('hidden');
            }
        });
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

// Authentication functions with caching and retry
let authCheckPromise = null;
let authRetryCount = 0;
const MAX_AUTH_RETRIES = 3;

async function checkAuthStatus() {
    if (authCheckPromise) {
        return authCheckPromise;
    }

    authCheckPromise = (async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch('/api/user/profile', {
                headers: { 'Cache-Control': 'max-age=300' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                authRetryCount = 0;
                updateAuthUI();
            } else {
                currentUser = null;
                updateAuthUI();
            }
        } catch (error) {
            console.error('Auth check failed:', error);

            // Retry logic
            if (authRetryCount < MAX_AUTH_RETRIES && error.name !== 'AbortError') {
                authRetryCount++;
                setTimeout(() => {
                    authCheckPromise = null;
                    checkAuthStatus();
                }, 1000 * authRetryCount); // Progressive delay
            } else {
                currentUser = null;
                updateAuthUI();
                authRetryCount = 0;
            }
        } finally {
            authCheckPromise = null;
        }
    })();

    return authCheckPromise;
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

// Login form handler with optimization
async function handleLogin(event) {
    event.preventDefault();

    if (authLoading) return;

    let phone = null;
    let username = null;
    const password = document.getElementById('login-password').value;

    // Check which login mode is active
    if (loginMode === 'phone') {
        const country = document.getElementById('login-country').value;
        const phoneNumber = document.getElementById('login-phone').value.trim();

        if (!phoneNumber || !password) {
            showNotification('لطفاً شماره تلفن و رمز عبور را وارد کنید', 'error');
            return;
        }

        phone = country + phoneNumber;
    } else {
        username = document.getElementById('login-username').value.trim();

        if (!username || !password) {
            showNotification('لطفاً نام کاربری و رمز عبور را وارد کنید', 'error');
            return;
        }
    }

    // Show loading state
    authLoading = true;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'در حال ورود...';
    submitBtn.disabled = true;

    try {
        const requestBody = { password };
        if (phone) requestBody.phone = phone;
        if (username) requestBody.username = username;

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('sessionToken', data.sessionToken);
            showNotification('ورود با موفقیت انجام شد!', 'success');
            hideModal();
            updateAuthUI();

            // Reset form
            event.target.reset();
        } else {
            showNotification(data.error || 'نام کاربری یا رمز عبور اشتباه است', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('خطا در اتصال به سرور', 'error');
    } finally {
        authLoading = false;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Register form handler with optimization and debouncing
let registerTimeout = null;
async function handleRegister(event) {
    event.preventDefault();

    if (authLoading) return;

    // Clear previous timeout
    if (registerTimeout) {
        clearTimeout(registerTimeout);
    }

    const name = document.getElementById('register-name').value.trim();
    const country = document.getElementById('register-country').value;
    const phoneNumber = document.getElementById('register-phone').value.trim();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const captcha = document.getElementById('register-captcha').value.trim();

    if (!name || !phoneNumber || !password || !captcha) {
        showNotification('لطفاً تمام فیلدها را پر کنید', 'error');
        return;
    }
    
    // Check for username uniqueness if provided
    if (username) {
        const response = await fetch('/api/user/check-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await response.json();
        if (!data.isUnique) {
            showNotification('این نام کاربری قبلاً استفاده شده است.', 'error');
            return;
        }
    }

    // Check for phone uniqueness
    const phone = country + phoneNumber;
    const phoneResponse = await fetch('/api/user/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    });
    const phoneData = await phoneResponse.json();
    if (!phoneData.isUnique) {
        showNotification('این شماره تلفن قبلاً ثبت شده است.', 'error');
        return;
    }


    if (captcha !== currentCaptcha) {
        showNotification('کپچا اشتباه است', 'error');
        generateCaptcha();
        document.getElementById('register-captcha').value = '';
        return;
    }

    // Show loading state
    authLoading = true;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'در حال ثبت‌نام...';
    submitBtn.disabled = true;

    try {
        const requestBody = { name, phone: phone, password };
        if (username) {
            requestBody.username = username;
        }

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (response.ok) {
            currentUser = data.user;
            localStorage.setItem('sessionToken', data.sessionToken);
            showNotification('ثبت‌نام با موفقیت انجام شد!', 'success');
            hideModal();
            updateAuthUI();

            // Reset form
            event.target.reset();
            generateCaptcha();
        } else {
            showNotification(data.error || 'خطا در ثبت‌نام', 'error');
            generateCaptcha();
            document.getElementById('register-captcha').value = '';
        }
    } catch (error) {
        console.error('Register error:', error);
        showNotification('خطا در اتصال به سرور', 'error');
        generateCaptcha();
        document.getElementById('register-captcha').value = '';
    } finally {
        authLoading = false;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
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

// Wallpaper rendering with optimizations
async function renderWallpapers() {
    // Show loading state
    wallpapersGrid.innerHTML = `
        <div class="col-span-full flex justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
    `;

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
            showNotification(successMessage, 'success');
        } else {
            if (data.requiresAuth) {
                const message = currentLanguage === 'fa' 
                    ? 'برای دانلود والپیپر پریمیوم باید وارد حساب کاربری شوید.'
                    : 'Please login to download premium wallpapers.';
                showNotification(message, 'warning');
                showModal();
                showLoginForm();
            } else if (data.requiresPremium) {
                const message = currentLanguage === 'fa' 
                    ? 'برای دانلود این والپیپر نیاز به اشتراک پریمیوم دارید.'
                    : 'Premium subscription required for this wallpaper.';
                showNotification(message, 'warning');
            } else {
                showNotification(data.error || (currentLanguage === 'fa' ? 'خطا در دانلود' : 'Download failed'), 'error');
            }
        }
    } catch (error) {
        console.error('Download error:', error);
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
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    function initializeDOMElements() {
        // All DOM element initializations and event listener setups go here
        // For example:
        langToggle.addEventListener('click', toggleLanguage);

        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                switchSection(section);
            });
        });

        loginBtn.addEventListener('click', () => {
            showModal();
            showLoginForm();
        });

        registerBtn.addEventListener('click', () => {
            showModal();
            showRegisterForm();
        });

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

        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) {
                hideModal();
            }
        });

        const refreshCaptchaBtn = document.getElementById('refresh-captcha');
        if (refreshCaptchaBtn) {
            refreshCaptchaBtn.addEventListener('click', generateCaptcha);
        }

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

        setupPasswordToggle('login');
        setupPasswordToggle('register');

        const loginCountrySelect = document.getElementById('login-country-select');
        const loginPhoneInput = document.getElementById('login-phone');
        const registerCountrySelect = document.getElementById('country-select');
        const registerPhoneInput = document.getElementById('register-phone');

        if (loginCountrySelect && loginPhoneInput) {
            loginCountrySelect.addEventListener('change', () => {
                updatePhonePlaceholder(loginCountrySelect, loginPhoneInput);
            });
            updatePhonePlaceholder(loginCountrySelect, loginPhoneInput);
        }

        if (registerCountrySelect && registerPhoneInput) {
            registerCountrySelect.addEventListener('change', () => {
                updatePhonePlaceholder(registerCountrySelect, registerPhoneInput);
            });
            updatePhonePlaceholder(registerCountrySelect, registerPhoneInput);
        }

        contactBtn.addEventListener('click', showContactModal);
        aboutBtn.addEventListener('click', showAboutModal);
        closeContactModal.addEventListener('click', hideContactModal);
        closeAboutModal.addEventListener('click', hideAboutModal);
        contactForm.addEventListener('submit', handleContactForm);

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

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                currentFilter = filter;

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

                renderWallpapers();
            });
        });
    }

    // Initialize language and auth
    initLanguage();
    checkAuthStatus();

    // Initialize captcha
    generateCaptcha();

    // Lazy load content
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            renderPrompts();
            renderWallpapers();
        });
    } else {
        // Fallback for browsers that don't support requestIdleCallback
        renderPrompts();
        renderWallpapers();
    }

    // Update language and setup modals
    updateLanguage();
    // setupModals(); // Assuming setupModals is defined elsewhere or integrated into initializeDOMElements
    // setupCountryCode(); // Assuming setupCountryCode is defined elsewhere or integrated into initializeDOMElements

    // Prefetch critical resources
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            loadPromptsFromAPI();
            loadWallpapersFromAPI();
        });
    }

    // Call the function to initialize all DOM elements and their event listeners
    initializeDOMElements();
});