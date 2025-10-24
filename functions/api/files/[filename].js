
// Direct file serving endpoint
export async function onRequestGet(context) {
    const { request, env } = context;
    
    try {
        const url = new URL(request.url);
        const filename = url.pathname.split('/').pop();
        
        if (!filename || filename.includes('..') || filename.includes('/')) {
            return new Response('Invalid filename', { status: 400 });
        }
        
        // Get file data and metadata
        const fileKey = `file:${filename}`;
        const fileData = await env.DB.get(fileKey);
        const metadataRaw = await env.DB.get(`${fileKey}_meta`);
        
        if (!fileData) {
            return new Response('File not found', { status: 404 });
        }
        
        let metadata = { mimeType: 'application/octet-stream', originalName: filename };
        if (metadataRaw) {
            metadata = { ...metadata, ...JSON.parse(metadataRaw) };
        }
        
        // Convert base64 to binary
        const binaryData = atob(fileData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
        }
        
        // Set appropriate headers for file download
        const headers = new Headers({
            'Content-Type': metadata.mimeType,
            'Content-Disposition': `attachment; filename="${metadata.originalName}"`,
            'Content-Length': bytes.length.toString(),
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'Access-Control-Allow-Origin': '*'
        });
        
        return new Response(bytes, { headers });
        
    } catch (error) {
        console.error('File serving error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}
