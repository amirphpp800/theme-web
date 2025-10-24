require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 5000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later'
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many uploads, please try again later'
});

const UPLOADS_DIR = './uploads';
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/zip'];

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      await fs.mkdir(UPLOADS_DIR, { recursive: true });
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and zip files are allowed.'));
    }
  }
});

const DB_FILE = './data/db.json';
let db = {
  users: {},
  sessions: {},
  adminSessions: {},
  prompts: [],
  wallpapers: [],
  downloads: {}
};

async function initDB() {
  try {
    await fs.mkdir('./data', { recursive: true });
    try {
      const data = await fs.readFile(DB_FILE, 'utf8');
      db = JSON.parse(data);
    } catch (err) {
      await saveDB();
    }
  } catch (err) {
    console.error('DB init error:', err);
  }
}

async function saveDB() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('DB save error:', err);
  }
}

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

function generateToken() {
  return crypto.randomUUID();
}

async function getSession(req) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.session ||
                req.headers['x-session-token'];
  if (!token) return null;
  
  const session = db.sessions[`session:${token}`];
  if (!session) return null;
  
  if (new Date(session.expiresAt) < new Date()) {
    delete db.sessions[`session:${token}`];
    await saveDB();
    return null;
  }
  
  return session;
}

async function getAdminSession(req) {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
                req.headers['x-admin-token'];
  if (!token) return null;
  
  const session = db.adminSessions[`admin_session:${token}`];
  if (!session) return null;
  
  if (new Date(session.expiresAt) < new Date()) {
    delete db.adminSessions[`admin_session:${token}`];
    await saveDB();
    return null;
  }
  
  return session;
}

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, phone, username, password } = req.body;
    
    if (!name || !password || (!phone && !username)) {
      return res.status(400).json({ error: 'Name, password, and either phone or username are required' });
    }
    
    if (phone && !phone.match(/^\+\d{1,4}\d{4,15}$/)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    if (username && (!username.match(/^[a-zA-Z0-9_]{3,20}$/) || username.length < 3)) {
      return res.status(400).json({ error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' });
    }
    
    if (phone && db.users[`user:${phone}`]) {
      return res.status(409).json({ error: 'Phone number already registered' });
    }
    
    if (username && db.users[`username:${username.toLowerCase()}`]) {
      return res.status(409).json({ error: 'Username already taken' });
    }
    
    const user = {
      id: generateToken(),
      name,
      phone: phone || null,
      username: username || null,
      password: await hashPassword(password),
      createdAt: new Date().toISOString(),
      downloads: 0,
      isPremium: false
    };
    
    if (phone) db.users[`user:${phone}`] = user;
    if (username) db.users[`username:${username.toLowerCase()}`] = user;
    db.users[`user_by_id:${user.id}`] = user;
    
    const sessionToken = generateToken();
    const session = {
      userId: user.id,
      phone: user.phone,
      username: user.username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    db.sessions[`session:${sessionToken}`] = session;
    await saveDB();
    
    const { password: _, ...userResponse } = user;
    res.status(201).json({ 
      success: true, 
      user: userResponse,
      sessionToken,
      autoLogin: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { phone, username, password } = req.body;
    
    if (!password || (!phone && !username)) {
      return res.status(400).json({ error: 'Password and either phone or username are required' });
    }
    
    let user = null;
    
    if (phone) {
      user = db.users[`user:${phone}`];
    }
    
    if (!user && username) {
      user = db.users[`username:${username.toLowerCase()}`];
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const sessionToken = generateToken();
    const session = {
      userId: user.id,
      phone: user.phone,
      username: user.username,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    db.sessions[`session:${sessionToken}`] = session;
    await saveDB();
    
    const { password: _, ...userResponse } = user;
    res.json({ 
      success: true, 
      user: userResponse,
      sessionToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const session = await getSession(req);
    if (session) {
      const token = req.headers.authorization?.replace('Bearer ', '') || 
                    req.cookies?.session ||
                    req.headers['x-session-token'];
      delete db.sessions[`session:${token}`];
      await saveDB();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = db.users[`user_by_id:${session.userId}`];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password: _, ...userResponse } = user;
    res.json({ success: true, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.get('/api/user/purchases', async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    res.json({ success: true, purchases: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get purchases' });
  }
});

app.get('/api/content/prompts', async (req, res) => {
  try {
    res.json({ success: true, prompts: db.prompts || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load prompts' });
  }
});

app.get('/api/content/wallpapers', async (req, res) => {
  try {
    res.json({ success: true, wallpapers: db.wallpapers || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load wallpapers' });
  }
});

app.post('/api/wallpapers/download', async (req, res) => {
  try {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { wallpaperId } = req.body;
    const wallpaper = db.wallpapers.find(w => w.id === wallpaperId);
    
    if (!wallpaper) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }
    
    if (wallpaper.type === 'premium') {
      const user = db.users[`user_by_id:${session.userId}`];
      if (!user || !user.isPremium) {
        return res.status(403).json({ error: 'Premium access required' });
      }
    }
    
    const downloadId = generateToken();
    db.downloads[`download:${downloadId}`] = {
      userId: session.userId,
      wallpaperId,
      timestamp: new Date().toISOString()
    };
    
    const user = db.users[`user_by_id:${session.userId}`];
    if (user) {
      user.downloads = (user.downloads || 0) + 1;
    }
    
    await saveDB();
    
    res.json({ 
      success: true, 
      downloadUrl: wallpaper.fileUrl || wallpaper.coverUrl,
      message: 'Download started'
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.post('/api/admin/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const adminUsername = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASS;
    
    if (!adminUsername || !adminPassword) {
      console.error('SECURITY WARNING: Admin credentials not configured in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }
    
    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const adminToken = generateToken();
    const session = {
      token: adminToken,
      username: adminUsername,
      isAdmin: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    db.adminSessions[`admin_session:${adminToken}`] = session;
    await saveDB();
    
    res.json({ 
      success: true, 
      token: adminToken,
      message: 'Admin login successful'
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/admin/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: {
        kv: {
          connected: true,
          error: null
        },
        adminConfig: {
          configured: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Status check failed' });
  }
});

app.get('/api/admin/prompts', async (req, res) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json({ success: true, prompts: db.prompts || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get prompts' });
  }
});

app.post('/api/admin/prompts', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { titleEn, titleFa, promptText, coverUrl } = req.body;
    
    let imageUrl = coverUrl;
    if (req.file) {
      imageUrl = `/api/images/${req.file.filename}`;
    }
    
    const prompt = {
      id: generateToken(),
      title: { en: titleEn, fa: titleFa },
      promptText,
      coverUrl: imageUrl,
      createdAt: new Date().toISOString()
    };
    
    db.prompts.push(prompt);
    await saveDB();
    
    res.json({ success: true, prompt });
  } catch (error) {
    console.error('Add prompt error:', error);
    res.status(500).json({ error: 'Failed to add prompt' });
  }
});

app.delete('/api/admin/prompts/:id', async (req, res) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    db.prompts = db.prompts.filter(p => p.id !== id);
    await saveDB();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

app.get('/api/admin/wallpapers', async (req, res) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json({ success: true, wallpapers: db.wallpapers || [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get wallpapers' });
  }
});

app.post('/api/admin/wallpapers', uploadLimiter, upload.fields([
  { name: 'coverFile', maxCount: 1 },
  { name: 'wallpaperFile', maxCount: 1 }
]), async (req, res) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { titleEn, titleFa, type, price, coverUrl, fileUrl } = req.body;
    
    let coverImage = coverUrl;
    let wallpaperFile = fileUrl;
    
    if (req.files?.coverFile?.[0]) {
      coverImage = `/api/images/${req.files.coverFile[0].filename}`;
    }
    
    if (req.files?.wallpaperFile?.[0]) {
      wallpaperFile = `/api/files/${req.files.wallpaperFile[0].filename}`;
    }
    
    const wallpaper = {
      id: generateToken(),
      title: { en: titleEn, fa: titleFa },
      type: type || 'free',
      price: type === 'premium' ? (price || 0) : 0,
      coverUrl: coverImage,
      fileUrl: wallpaperFile,
      createdAt: new Date().toISOString()
    };
    
    db.wallpapers.push(wallpaper);
    await saveDB();
    
    res.json({ success: true, wallpaper });
  } catch (error) {
    console.error('Add wallpaper error:', error);
    res.status(500).json({ error: 'Failed to add wallpaper' });
  }
});

app.delete('/api/admin/wallpapers/:id', async (req, res) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    db.wallpapers = db.wallpapers.filter(w => w.id !== id);
    await saveDB();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete wallpaper' });
  }
});

app.post('/api/admin/upload', uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    const session = await getAdminSession(req);
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const url = req.file.mimetype.startsWith('image/') ? 
      `/api/images/${req.file.filename}` : `/api/files/${req.file.filename}`;
    
    res.json({ success: true, url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/images/:filename', async (req, res) => {
  try {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    await fs.access(filePath);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.sendFile(path.resolve(filePath));
  } catch (error) {
    res.status(404).send('Image not found');
  }
});

app.get('/api/files/:filename', async (req, res) => {
  try {
    const filePath = path.join(UPLOADS_DIR, req.params.filename);
    await fs.access(filePath);
    res.download(path.resolve(filePath));
  } catch (error) {
    res.status(404).send('File not found');
  }
});

app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

initDB().then(() => {
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;
  
  if (!adminUser || !adminPass || adminPass === 'admin123') {
    console.error('\n⚠️  SECURITY ERROR: Admin credentials must be configured!');
    console.error('Please set ADMIN_USER and ADMIN_PASS environment variables.');
    console.error('The admin password must not be the default "admin123".\n');
    process.exit(1);
  }
  
  app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log('✅ Server started with secure admin credentials');
  });
});
