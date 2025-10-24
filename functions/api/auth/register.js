
// Cloudflare Pages Function for user registration
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { name, phone, username, password } = await request.json();
        
        // Validate input - support both phone and username registration
        if (!name || !password || (!phone && !username)) {
            return new Response(JSON.stringify({ error: 'Name, password, and either phone or username are required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Validate phone number format if provided
        if (phone && !phone.match(/^\+\d{1,4}\d{4,15}$/)) {
            return new Response(JSON.stringify({ error: 'Invalid phone number format' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Validate username format if provided
        if (username && (!username.match(/^[a-zA-Z0-9_]{3,20}$/) || username.length < 3)) {
            return new Response(JSON.stringify({ error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Check if user already exists by phone
        if (phone) {
            const existingUserByPhone = await env.DB.get(`user:${phone}`);
            if (existingUserByPhone) {
                return new Response(JSON.stringify({ error: 'Phone number already registered' }), {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Check if user already exists by username
        if (username) {
            const existingUserByUsername = await env.DB.get(`username:${username.toLowerCase()}`);
            if (existingUserByUsername) {
                return new Response(JSON.stringify({ error: 'Username already taken' }), {
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
            username: username || null,
            password: await hashPassword(password),
            createdAt: new Date().toISOString(),
            downloads: 0,
            isPremium: false
        };
        
        // Store user in KV with multiple keys for lookup
        if (phone) {
            await env.DB.put(`user:${phone}`, JSON.stringify(user));
        }
        if (username) {
            await env.DB.put(`username:${username.toLowerCase()}`, JSON.stringify(user));
        }
        await env.DB.put(`user_by_id:${user.id}`, JSON.stringify(user));
        
        // Generate session token for auto-login
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
            sessionToken,
            autoLogin: true
        }), {
            status: 201,
            headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
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
