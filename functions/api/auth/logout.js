// Cloudflare Pages Function for user logout
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // Get session token from cookie or Authorization header
        const cookies = request.headers.get('Cookie') || '';
        const sessionMatch = cookies.match(/session=([^;]+)/);
        const sessionToken = sessionMatch ? sessionMatch[1] : 
                           request.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (!sessionToken) {
            return new Response(JSON.stringify({ error: 'No session found' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Delete session from KV
        await env.DB.delete(`session:${sessionToken}`);
        
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Logout failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
