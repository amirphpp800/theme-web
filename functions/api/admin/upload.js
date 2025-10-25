// Admin image upload endpoint
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // Check admin authentication
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const token = authHeader.substring(7);
        const adminSession = await env.DB.get(`admin_session:${token}`);
        if (!adminSession) {
            return new Response(JSON.stringify({ error: 'Invalid session' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const { imageData, fileName, type } = await request.json();
        
        if (!imageData || !fileName || !type) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${type}_${timestamp}.${fileExtension}`;
        
        // Store image data in KV (in production, use R2 or external storage)
        const imageKey = `image:${uniqueFileName}`;
        await env.DB.put(imageKey, imageData);
        
        // Return the image URL/key
        return new Response(JSON.stringify({
            success: true,
            imageUrl: `/api/images/${uniqueFileName}`,
            imageKey: uniqueFileName
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ error: 'Upload failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
