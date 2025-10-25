// Admin login function
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { username, password } = await request.json();
        
        // Get admin credentials from environment variables
        const adminUsername = env.ADMIN_USER || 'admin';
        const adminPassword = env.ADMIN_PASS || 'admin123';
        
        // Validate credentials
        if (username !== adminUsername || password !== adminPassword) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generate admin token
        const adminToken = crypto.randomUUID();
        const session = {
            token: adminToken,
            username: adminUsername,
            isAdmin: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        
        // Store admin session in KV
        await env.DB.put(`admin_session:${adminToken}`, JSON.stringify(session), {
            expirationTtl: 24 * 60 * 60 // 24 hours in seconds
        });
        
        return new Response(JSON.stringify({ 
            success: true, 
            token: adminToken,
            message: 'Admin login successful'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Login failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
