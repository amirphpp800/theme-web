// Admin file upload endpoint - supports all file types
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
        
        const contentType = request.headers.get('content-type');
        let fileData, fileName, fileType, uploadType;
        
        if (contentType && contentType.includes('multipart/form-data')) {
            // Handle FormData for direct file upload
            const formData = await request.formData();
            const file = formData.get('file');
            uploadType = formData.get('type');
            
            if (!file) {
                return new Response(JSON.stringify({ error: 'No file provided' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            fileName = file.name;
            fileType = file.type || 'application/octet-stream';
            const arrayBuffer = await file.arrayBuffer();
            fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
        } else {
            // Handle JSON for base64 data
            const { fileData: base64Data, fileName: name, type } = await request.json();
            
            if (!base64Data || !name || !type) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            fileData = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
            fileName = name;
            uploadType = type;
        }
        
        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = fileName.split('.').pop();
        const uniqueFileName = `${uploadType}_${timestamp}.${fileExtension}`;
        
        // Store file data in KV with metadata
        const fileKey = `file:${uniqueFileName}`;
        const fileMetadata = {
            originalName: fileName,
            mimeType: fileType || 'application/octet-stream',
            size: fileData.length,
            uploadedAt: new Date().toISOString(),
            type: uploadType
        };
        
        // Store file data and metadata separately
        await env.DB.put(fileKey, fileData);
        await env.DB.put(`${fileKey}_meta`, JSON.stringify(fileMetadata));
        
        // For wallpaper downloads, we'll serve the actual file
        const downloadUrl = `/api/files/${uniqueFileName}`;
        const displayUrl = fileType && fileType.startsWith('image/') ? 
                          `/api/images/${uniqueFileName}` : 
                          downloadUrl;
        
        return new Response(JSON.stringify({
            success: true,
            imageUrl: displayUrl, // For preview
            downloadUrl: downloadUrl, // For direct download
            fileName: uniqueFileName,
            originalName: fileName,
            fileType: fileType
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
