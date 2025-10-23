# Cloudflare Pages Deployment Guide

## Prerequisites
1. Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. Git repository

## Setup Steps

### 1. Create KV Namespace
```bash
# Create production KV namespace
wrangler kv:namespace create "DB"

# Create preview KV namespace  
wrangler kv:namespace create "DB" --preview
```

### 2. Update wrangler.toml
Replace the KV namespace IDs in `wrangler.toml` with the ones generated above.

### 3. Deploy to Cloudflare Pages

#### Option A: Using Wrangler CLI
```bash
# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy . --project-name prompts-wallpapers
```

#### Option B: Using Cloudflare Dashboard
1. Go to Cloudflare Dashboard > Pages
2. Create a new project
3. Connect your Git repository
4. Set build settings:
   - Build command: (leave empty)
   - Build output directory: `/`
5. Add environment variables:
   - KV namespace binding: `DB`

### 4. Configure KV Bindings
In Cloudflare Dashboard:
1. Go to Pages > Your Project > Settings > Functions
2. Add KV namespace binding:
   - Variable name: `DB`
   - KV namespace: Select your created namespace

## Project Structure
```
/
├── functions/
│   └── api/
│       ├── auth/
│       │   ├── login.js
│       │   ├── register.js
│       │   └── logout.js
│       ├── user/
│       │   └── profile.js
│       └── wallpapers/
│           └── download.js
├── index.html
├── script.js
├── styles.css
├── wrangler.toml
└── DEPLOYMENT.md
```

## API Endpoints

### User Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/user/profile` - Get user profile
- `POST /api/wallpapers/download` - Download wallpaper

### Admin Panel
- `POST /api/admin/login` - Admin login
- `GET /api/admin/prompts` - Get all prompts (admin)
- `POST /api/admin/prompts` - Add new prompt (admin)
- `DELETE /api/admin/prompts/{id}` - Delete prompt (admin)
- `GET /api/admin/wallpapers` - Get all wallpapers (admin)
- `POST /api/admin/wallpapers` - Add new wallpaper (admin)
- `DELETE /api/admin/wallpapers/{id}` - Delete wallpaper (admin)

### Content API
- `GET /api/content/prompts` - Get prompts for main site
- `GET /api/content/wallpapers` - Get wallpapers for main site

## KV Database Structure
```
Keys:
- user:{phone} -> User object
- user_by_id:{userId} -> User object
- session:{sessionToken} -> Session object
- admin_session:{adminToken} -> Admin session object
- download:{downloadId} -> Download log
- prompts_list -> Array of all prompts
- prompt:{promptId} -> Individual prompt object
- wallpapers_list -> Array of all wallpapers
- wallpaper:{wallpaperId} -> Individual wallpaper object
```

## Features
- ✅ User authentication (register/login/logout)
- ✅ Phone number based registration with country selection
- ✅ 4-digit captcha verification
- ✅ Session management with cookies
- ✅ KV database for user data
- ✅ Premium wallpaper access control
- ✅ Download tracking
- ✅ Bilingual support (Persian/English)
- ✅ Responsive design
- ✅ Clean iPhone-like UI
- ✅ Admin panel for content management
- ✅ Dynamic content loading from KV database
- ✅ Authentication required for all actions

## Admin Panel
- **URL**: `/adminpanel`
- **Credentials**: Set via environment variables `ADMIN_USER` and `ADMIN_PASS`
- **Features**:
  - Add/delete prompts with cover images
  - Add/delete wallpapers with pricing
  - Real-time content management
  - Secure authentication with session tokens

## Security Notes
- Passwords are hashed with SHA-256 (use bcrypt in production)
- Sessions expire after 7 days
- Premium content requires authentication
- All API endpoints include error handling

## Environment Variables
No additional environment variables needed. KV binding is configured in wrangler.toml.

## Testing
1. Test authentication flow
2. Test premium wallpaper downloads
3. Test language switching
4. Test responsive design on mobile

## Support
The site is optimized for Cloudflare Pages with:
- Edge functions for API
- KV database for persistence
- Global CDN for fast loading
- Automatic HTTPS
