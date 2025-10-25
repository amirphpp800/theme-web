// Cloudflare Pages Function for user profile
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        // Get session token
        const cookies = request.headers.get('Cookie') || '';
        const sessionMatch = cookies.match(/session=([^;]+)/);
        const sessionToken = sessionMatch ? sessionMatch[1] : 
                           request.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (!sessionToken) {
            return new Response(JSON.stringify({ error: 'Authentication required' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get session from KV
        const sessionData = await env.DB.get(`session:${sessionToken}`);
        if (!sessionData) {
            return new Response(JSON.stringify({ error: 'Invalid session' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const session = JSON.parse(sessionData);
        
        // Check if session is expired
        if (new Date(session.expiresAt) < new Date()) {
            await env.DB.delete(`session:${sessionToken}`);
            return new Response(JSON.stringify({ error: 'Session expired' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get user data
        const userData = await env.DB.get(`user_by_id:${session.userId}`);
        if (!userData) {
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const user = JSON.parse(userData);
        const { password: _, ...userResponse } = user;
        
        return new Response(JSON.stringify({ 
            success: true, 
            user: userResponse 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get profile' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
