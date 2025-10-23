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
        
        // Generate unique ID
        const wallpaperId = crypto.randomUUID();
        
        // Create wallpaper object
        const newWallpaper = {
            id: wallpaperId,
            title: {
                fa: wallpaperData.title.fa,
                en: wallpaperData.title.en
            },
            image: wallpaperData.image,
            type: wallpaperData.type,
            price: wallpaperData.price || null,
            resolution: wallpaperData.resolution,
            downloads: 0,
            createdAt: new Date().toISOString()
        };
        
        // Get existing wallpapers
        const wallpapersList = await env.DB.get('wallpapers_list');
        const wallpapers = wallpapersList ? JSON.parse(wallpapersList) : [];
        
        // Add new wallpaper
        wallpapers.push(newWallpaper);
        
        // Save back to KV
        await env.DB.put('wallpapers_list', JSON.stringify(wallpapers));
        await env.DB.put(`wallpaper:${wallpaperId}`, JSON.stringify(newWallpaper));
        
        return new Response(JSON.stringify({ 
            success: true, 
            wallpaper: newWallpaper,
            message: 'Wallpaper added successfully'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
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
        
        if (!wallpaperId) {
            return new Response(JSON.stringify({ error: 'Wallpaper ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get existing wallpapers
        const wallpapersList = await env.DB.get('wallpapers_list');
        const wallpapers = wallpapersList ? JSON.parse(wallpapersList) : [];
        
        // Remove wallpaper from list
        const updatedWallpapers = wallpapers.filter(w => w.id !== wallpaperId);
        
        // Save updated list
        await env.DB.put('wallpapers_list', JSON.stringify(updatedWallpapers));
        
        // Delete individual wallpaper
        await env.DB.delete(`wallpaper:${wallpaperId}`);
        
        return new Response(JSON.stringify({ 
            success: true,
            message: 'Wallpaper deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to delete wallpaper' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
