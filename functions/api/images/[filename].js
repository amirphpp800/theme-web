// Serve uploaded images
export async function onRequestGet(context) {
    const { params, env } = context;
    
    try {
        const filename = params.filename;
        if (!filename) {
            return new Response('File not found', { status: 404 });
        }
        
        // Get image data from KV
        const imageData = await env.DB.get(`file:${filename}`);
        if (!imageData) {
            return new Response('Image not found', { status: 404 });
        }
        
        // Parse base64 data
        const [header, base64Data] = imageData.split(',');
        const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        
        // Convert base64 to binary
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        return new Response(binaryData, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Image serve error:', error);
        return new Response('Error serving image', { status: 500 });
    }
}
