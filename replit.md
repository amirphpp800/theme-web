# iMagera - AI Prompts & Wallpapers Collection

## Project Overview
A bilingual (Persian/English) web application for managing and sharing AI-generated prompts and wallpapers. Users can browse prompts, download wallpapers (free and premium), and admin can manage content through a dedicated admin panel.

## Tech Stack
- **Frontend**: HTML, CSS (Tailwind CSS), Vanilla JavaScript
- **Backend**: Node.js + Express
- **Database**: File-based JSON storage
- **File Uploads**: Multer for image/file handling

## Recent Changes (Latest)
- **2024-10-24**: Migrated from Cloudflare Pages to Replit
  - Created Express server to replace Cloudflare Pages Functions
  - Implemented file-based database to replace Cloudflare KV
  - Set up local development environment
  - Fixed registration form errors (element ID mismatches)
  - Fixed card duplication issue in render functions
  - Added proper authentication flow for downloads
  - **Security Improvements**:
    - Implemented bcrypt password hashing (replaced SHA-256)
    - Moved file uploads to filesystem (removed base64 from db.json)
    - Added rate limiting (10 auth attempts, 20 uploads per 15 min)
    - Added MIME type validation and file size limits
    - Enforced secure admin credentials (no default passwords)
    - Added dotenv for secure environment variable management

## Project Structure
```
├── server.js                 # Express server with all API endpoints
├── index.html               # Main application page
├── script.js                # Frontend JavaScript
├── styles.css               # Custom styles
├── adminpanel/             
│   ├── index.html          # Admin panel interface
│   └── admin.js            # Admin panel JavaScript
├── functions/              # Original Cloudflare Functions (reference only)
├── data/
│   └── db.json            # File-based database
├── package.json
└── .env                   # Environment variables (ADMIN_USER, ADMIN_PASS)
```

## Features
- ✅ Bilingual support (Persian/English)
- ✅ User authentication (phone or username based)
- ✅ Session management with tokens
- ✅ AI prompts browsing and copying (requires login)
- ✅ Wallpaper downloads (free and premium)
- ✅ Admin panel for content management
- ✅ File upload support for images and wallpapers
- ✅ Responsive design with iPhone-like UI
- ✅ 4-digit CAPTCHA verification
- ✅ Download tracking

## Admin Panel
- **URL**: `/adminpanel/`
- **Admin Credentials**: 
  - Configured via environment variables (ADMIN_USER, ADMIN_PASS)
  - **Default for this Repl**:
    - Username: `admin`
    - Password: `SecureP@ssw0rd2024!`
  - **⚠️ Important**: Change these credentials in the .env file for production use
- **Features**:
  - Add/delete prompts with cover images
  - Add/delete wallpapers with pricing options
  - Upload images and files
  - System status monitoring

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User
- `GET /api/user/profile` - Get user profile (requires authentication)
- `GET /api/user/purchases` - Get user purchases

### Content
- `GET /api/content/prompts` - Get all prompts
- `GET /api/content/wallpapers` - Get all wallpapers

### Wallpapers
- `POST /api/wallpapers/download` - Download wallpaper (requires authentication)

### Admin (requires admin authentication)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/status` - System status
- `GET /api/admin/prompts` - Get all prompts (admin)
- `POST /api/admin/prompts` - Add new prompt
- `DELETE /api/admin/prompts/:id` - Delete prompt
- `GET /api/admin/wallpapers` - Get all wallpapers (admin)
- `POST /api/admin/wallpapers` - Add new wallpaper
- `DELETE /api/admin/wallpapers/:id` - Delete wallpaper
- `POST /api/admin/upload` - Upload file

### Files
- `GET /api/images/:filename` - Get image file
- `GET /api/files/:filename` - Download file

## Environment Variables
**Required** - Server will not start without these:
```
ADMIN_USER=admin
ADMIN_PASS=SecureP@ssw0rd2024!
```

**⚠️ Security Note**: The admin password must be changed from the default. The server will refuse to start if using weak or default passwords like "admin123".

## Development
The server runs on port 5000 and binds to 0.0.0.0 to work with Replit's proxy system.

**Important**: 
- Static files (HTML, CSS, JS, images) are cached aggressively
- To see changes, perform a hard refresh in your browser (Ctrl+Shift+R or Cmd+Shift+R)
- Cache-Control headers are set to no-cache for HTML/JS/CSS files

## Database Structure
The file-based database (`data/db.json`) stores:
- `users`: User accounts keyed by phone/username/ID
- `sessions`: Active user sessions
- `adminSessions`: Active admin sessions
- `prompts`: Array of prompt objects
- `wallpapers`: Array of wallpaper objects
- `downloads`: Download logs
- `files`: Uploaded files stored as base64

## User Workflow
1. User visits the site and sees prompts/wallpapers
2. To copy prompts or download wallpapers, user must register/login
3. Registration requires: name, phone/username, password, CAPTCHA
4. After login, user can copy prompts and download wallpapers
5. Premium wallpapers require premium subscription

## Admin Workflow
1. Admin accesses `/adminpanel/`
2. Login with admin credentials
3. Add prompts with:
   - Bilingual titles (English/Persian)
   - Prompt text
   - Cover image (URL or upload)
4. Add wallpapers with:
   - Bilingual titles
   - Type (free/premium)
   - Price (for premium)
   - Cover image and wallpaper file

## Known Issues & Solutions
- **Card Duplication**: Fixed by ensuring render functions are called only once
- **Registration Errors**: Fixed by matching element IDs in HTML and JavaScript
- **401 Unauthorized on Download**: Fixed by implementing proper session checking
- **Syntax Errors**: Ensure all JavaScript is properly escaped in template strings

## Optimization Notes
- Lazy loading of content using requestIdleCallback
- API response caching (5-minute cache)
- Debounced registration form
- Auto-save user state every 30 seconds
- Efficient image loading with fallbacks

## Future Improvements
- Implement bcrypt for password hashing (currently using SHA-256)
- Add payment integration for premium wallpapers
- Implement proper image CDN
- Add search and filtering functionality
- Add user dashboard with purchase history
- Implement email verification
- Add social login options
