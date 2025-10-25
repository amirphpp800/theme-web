# iMagera - AI Prompts & Wallpapers Platform

🎨 **مجموعه پرامپت‌ها و والپیپرهای هوش مصنوعی**

## ویژگی‌ها

### 🚀 **برای کاربران:**
- مجموعه‌ای از پرامپت‌های تولید تصویر با هوش مصنوعی
- والپیپرهای با کیفیت بالا (رایگان و پریمیوم)
- پشتیبانی از فایل‌های ZIP برای دانلود چندین فرمت
- رابط کاربری دوزبانه (فارسی/انگلیسی)
- سیستم احراز هویت پیشرفته
- طراحی Responsive و مدرن

### 🛠️ **برای ادمین:**
- پنل مدیریت کامل محتوا
- آپلود فایل‌های تصویری و ZIP (تا 50MB)
- مدیریت پرامپت‌ها و والپیپرها
- سیستم جلوگیری از تکرار محتوا
- آمار دانلود و مدیریت کاربران

## ساختار پروژه

```
├── index.html          # صفحه اصلی سایت
├── script.js           # منطق اصلی JavaScript
├── styles.css          # استایل‌های CSS
├── adminpanel/         # پنل مدیریت
│   ├── index.html      # صفحه پنل ادمین
│   └── admin.js        # منطق پنل ادمین
├── functions/          # API Functions (Cloudflare Workers)
│   └── api/
│       ├── admin/      # API های مدیریت
│       ├── auth/       # احراز هویت
│       ├── content/    # محتوا
│       └── user/       # کاربران
└── assets/
    ├── logo.svg        # لوگو سایت
    └── logo.png        # لوگو PNG

```

## تکنولوژی‌های استفاده شده

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Styling:** TailwindCSS
- **Backend:** Cloudflare Workers
- **Database:** Cloudflare KV
- **Fonts:** Vazirmatn (فارسی), Apple System Fonts (انگلیسی)

## نصب و راه‌اندازی

### 1. کلون کردن پروژه
```bash
git clone [repository-url]
cd imagera
```

### 2. تنظیم Cloudflare Workers
```bash
npm install -g wrangler
wrangler login
wrangler deploy
```

### 3. تنظیم متغیرهای محیطی
در فایل `wrangler.toml`:
```toml
[vars]
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "your-secure-password"
```

### 4. راه‌اندازی KV Storage
```bash
wrangler kv:namespace create "DB"
```

## استفاده

### دسترسی به سایت
- صفحه اصلی: `/`
- پنل ادمین: `/adminpanel/`

### مدیریت محتوا
1. وارد پنل ادمین شوید
2. پرامپت‌ها و والپیپرها را اضافه کنید
3. فایل‌های ZIP را برای والپیپرهای چندفرمته آپلود کنید

## ویژگی‌های امنیتی

- Rate limiting برای جلوگیری از spam
- Validation کامل ورودی‌ها
- سیستم احراز هویت امن
- CAPTCHA برای ثبت‌نام
- حفاظت در برابر حملات XSS

## بهینه‌سازی‌های انجام شده

- Caching محتوا (5 دقیقه)
- Lazy loading تصاویر
- Compression فایل‌ها
- Responsive images
- Progressive Web App features

## مجوز

این پروژه تحت مجوز MIT منتشر شده است.

## پشتیبانی

برای گزارش باگ یا درخواست ویژگی جدید، لطفاً issue ایجاد کنید.

---

**ساخته شده با ❤️ برای جامعه هوش مصنوعی ایران**
