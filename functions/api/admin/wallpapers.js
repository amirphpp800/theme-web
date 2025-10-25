// Admin wallpapers management
export async function onRequest(context) {
    const { request, env } = context;
    
    // Verify admin authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const sessionData = await env.DB.get(`admin_session:${token}`);
    
    if (!sessionData) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    const session = JSON.parse(sessionData);
    if (new Date(session.expiresAt) < new Date()) {
        return new Response(JSON.stringify({ error: 'Token expired' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // Handle different HTTP methods
    switch (request.method) {
        case 'GET':
            return handleGetWallpapers(env);
        case 'POST':
            return handleAddWallpaper(request, env);
        case 'DELETE':
            return handleDeleteWallpaper(request, env);
        default:
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
    }
}

async function handleGetWallpapers(env) {
    try {
        // Get all wallpapers from KV
        const wallpapersList = await env.DB.get('wallpapers_list');
        const wallpapers = wallpapersList ? JSON.parse(wallpapersList) : [];
        
        return new Response(JSON.stringify({ 
            success: true, 
            wallpapers: wallpapers 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get wallpapers' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleAddWallpaper(request, env) {
    try {
        const wallpaperData = await request.json();
        
        // Validate required fields
        if (!wallpaperData.title || !wallpaperData.title.fa || !wallpaperData.title.en || 
            !wallpaperData.image || !wallpaperData.type || !wallpaperData.resolution) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Validate premium wallpaper has price
        if (wallpaperData.type === 'premium' && !wallpaperData.price) {
            return new Response(JSON.stringify({ error: 'Premium wallpapers must have a price' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get existing wallpapers
        const wallpapersList = await env.DB.get('wallpapers_list');
        const wallpapers = wallpapersList ? JSON.parse(wallpapersList) : [];
        
        // Check for duplicates by title
        const titleKey = `${wallpaperData.title.fa.trim()}-${wallpaperData.title.en.trim()}`;
        const isDuplicate = wallpapers.some(w => 
            `${w.title.fa.trim()}-${w.title.en.trim()}` === titleKey
        );
        
        if (isDuplicate) {
            return new Response(JSON.stringify({ error: 'Wallpaper with this title already exists' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generate unique ID
        const wallpaperId = crypto.randomUUID();
        
        // Create wallpaper object
        const newWallpaper = {
            id: wallpaperId,
            title: {
                fa: wallpaperData.title.fa.trim(),
                en: wallpaperData.title.en.trim()
            },
            image: wallpaperData.image,
            downloadUrl: wallpaperData.downloadUrl || wallpaperData.image, // Support separate download URL
            fileType: wallpaperData.fileType || 'image', // 'image' or 'zip'
            type: wallpaperData.type,
            price: wallpaperData.price || null,
            resolution: wallpaperData.resolution,
            fileSize: wallpaperData.fileSize || null, // File size in bytes
            downloads: 0,
            createdAt: new Date().toISOString()
        };
        
        // Add new wallpaper
        wallpapers.push(newWallpaper);
        
        // Save back to KV with error handling
        try {
            await env.DB.put('wallpapers_list', JSON.stringify(wallpapers));
            await env.DB.put(`wallpaper:${wallpaperId}`, JSON.stringify(newWallpaper));
        } catch (kvError) {
            console.error('KV storage error:', kvError);
            return new Response(JSON.stringify({ error: 'Failed to save wallpaper to database' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ 
            success: true, 
            wallpaper: newWallpaper,
            message: 'Wallpaper added successfully'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Add wallpaper error:', error);
        return new Response(JSON.stringify({ error: 'Failed to add wallpaper' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleDeleteWallpaper(request, env) {
    try {
        const url = new URL(request.url);
        const wallpaperId = url.pathname.split('/').pop();
        
        if (!wallpaperId || wallpaperId === 'wallpapers') {
            return new Response(JSON.stringify({ error: 'Valid wallpaper ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get existing wallpapers
        const wallpapersList = await env.DB.get('wallpapers_list');
        const wallpapers = wallpapersList ? JSON.parse(wallpapersList) : [];
        
        // Check if wallpaper exists
        const wallpaperExists = wallpapers.some(w => w.id === wallpaperId);
        if (!wallpaperExists) {
            return new Response(JSON.stringify({ error: 'Wallpaper not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Remove wallpaper from list
        const updatedWallpapers = wallpapers.filter(w => w.id !== wallpaperId);
        
        // Save updated list and delete individual wallpaper with error handling
        try {
            await env.DB.put('wallpapers_list', JSON.stringify(updatedWallpapers));
            await env.DB.delete(`wallpaper:${wallpaperId}`);
        } catch (kvError) {
            console.error('KV deletion error:', kvError);
            return new Response(JSON.stringify({ error: 'Failed to delete wallpaper from database' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ 
            success: true,
            message: 'Wallpaper deleted successfully',
            deletedId: wallpaperId
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Delete wallpaper error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete wallpaper' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
