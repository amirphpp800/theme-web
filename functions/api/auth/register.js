// Cloudflare Pages Function for user registration
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { name, phone, username, password } = await request.json();
        
        // Validate input
        if (!name || !password || (!phone && !username)) {
            return new Response(JSON.stringify({ error: 'Name, password, and phone or username are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Optional phone validation when provided
        if (phone && !phone.match(/^\+\d{1,4}\d{4,15}$/)) {
            return new Response(JSON.stringify({ error: 'Invalid phone number format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Optional username validation when provided
        if (username && username.toString().trim().length < 3) {
            return new Response(JSON.stringify({ error: 'Username must be at least 3 characters' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Check if user already exists by phone or username
        if (phone) {
            const existingByPhone = await env.DB.get(`user:${phone}`);
            if (existingByPhone) {
                return new Response(JSON.stringify({ error: 'User with this phone already exists' }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        if (username) {
            const existingByUsername = await env.DB.get(`user_by_username:${username.toLowerCase()}`);
            if (existingByUsername) {
                return new Response(JSON.stringify({ error: 'User with this username already exists' }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Create user object
        const user = {
            id: crypto.randomUUID(),
            name,
            phone: phone || null,
            username: username ? username.toLowerCase() : null,
            password: await hashPassword(password),
            createdAt: new Date().toISOString(),
            downloads: 0,
            isPremium: false
        };
        
        // Store user in KV
        if (phone) {
            await env.DB.put(`user:${phone}`, JSON.stringify(user));
        }
        if (user.username) {
            await env.DB.put(`user_by_username:${user.username}`, JSON.stringify(user));
        }
        await env.DB.put(`user_by_id:${user.id}`, JSON.stringify(user));
        
        // Generate session token for auto-login
        const sessionToken = crypto.randomUUID();
        const session = {
            userId: user.id,
            phone: user.phone,
            username: user.username,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };
        
        // Store session in KV
        await env.DB.put(`session:${sessionToken}`, JSON.stringify(session), {
            expirationTtl: 7 * 24 * 60 * 60 // 7 days in seconds
        });
        
        // Return success with session token (don't send password back)
        const { password: _, ...userResponse } = user;
        return new Response(JSON.stringify({ 
            success: true, 
            user: userResponse,
            sessionToken,
            autoLogin: true
        }), {
            status: 201,
            headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Registration failed' }), {
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
