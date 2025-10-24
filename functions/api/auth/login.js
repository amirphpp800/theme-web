
// Cloudflare Pages Function for user login
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { phone, username, password } = await request.json();
        
        // Validate input - need either phone or username
        if (!password || (!phone && !username)) {
            return new Response(JSON.stringify({ error: 'Password and either phone or username are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        let user = null;
        
        // Try to get user by phone first
        if (phone) {
            const userData = await env.DB.get(`user:${phone}`);
            if (userData) {
                user = JSON.parse(userData);
            }
        }
        
        // If no user found by phone, try username
        if (!user && username) {
            const userData = await env.DB.get(`username:${username.toLowerCase()}`);
            if (userData) {
                user = JSON.parse(userData);
            }
        }
        
        if (!user) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Verify password
        const hashedPassword = await hashPassword(password);
        if (user.password !== hashedPassword) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generate session token
        const sessionToken = crypto.randomUUID();
        const session = {
            userId: user.id,
            phone: user.phone,
            username: user.username,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        // Store session in KV
        await env.DB.put(`session:${sessionToken}`, JSON.stringify(session), {
            expirationTtl: 7 * 24 * 60 * 60
        });
        
        // Return success with session token
        const { password: _, ...userResponse } = user;
        return new Response(JSON.stringify({ 
            success: true, 
            user: userResponse,
            sessionToken
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({ error: 'Login failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Simple password hashing (use bcrypt in production)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
