// Cloudflare Pages Function for wallpaper downloads
export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { wallpaperId } = await request.json();
        
        if (!wallpaperId) {
            return new Response(JSON.stringify({ error: 'Wallpaper ID is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get session token (optional for free wallpapers)
        const cookies = request.headers.get('Cookie') || '';
        const sessionMatch = cookies.match(/session=([^;]+)/);
        const sessionToken = sessionMatch ? sessionMatch[1] : 
                           request.headers.get('Authorization')?.replace('Bearer ', '');
        
        let user = null;
        if (sessionToken) {
            const sessionData = await env.DB.get(`session:${sessionToken}`);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                if (new Date(session.expiresAt) >= new Date()) {
                    const userData = await env.DB.get(`user_by_id:${session.userId}`);
                    if (userData) {
                        user = JSON.parse(userData);
                    }
                }
            }
        }
        
        // Get wallpaper from KV store
        const wallpapersList = await env.DB.get('wallpapers_list');
        const wallpapers = wallpapersList ? JSON.parse(wallpapersList) : [];
        
        const wallpaper = wallpapers.find(w => w.id.toString() === wallpaperId.toString());
        if (!wallpaper) {
            return new Response(JSON.stringify({ error: 'Wallpaper not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Check if premium wallpaper requires authentication
        if (wallpaper.type === 'premium') {
            if (!user) {
                return new Response(JSON.stringify({ 
                    error: 'Authentication required for premium wallpapers',
                    requiresAuth: true 
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
            
            if (!user.isPremium) {
                return new Response(JSON.stringify({ 
                    error: 'Premium subscription required',
                    requiresPremium: true 
                }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Track download and purchase
        if (user) {
            user.downloads = (user.downloads || 0) + 1;
            await env.DB.put(`user_by_id:${user.id}`, JSON.stringify(user));
            await env.DB.put(`user:${user.phone}`, JSON.stringify(user));
            
            // If premium wallpaper, save to user purchases
            if (wallpaper.type === 'premium') {
                const purchasesData = await env.DB.get(`user_purchases:${user.id}`);
                const purchases = purchasesData ? JSON.parse(purchasesData) : [];
                
                // Check if already purchased
                const alreadyPurchased = purchases.find(p => p.wallpaper.id === wallpaperId);
                if (!alreadyPurchased) {
                    const purchase = {
                        id: crypto.randomUUID(),
                        wallpaper: wallpaper,
                        purchaseDate: new Date().toISOString(),
                        userId: user.id
                    };
                    purchases.push(purchase);
                    await env.DB.put(`user_purchases:${user.id}`, JSON.stringify(purchases));
                }
            }
        }
        
        // Log download for analytics
        const downloadLog = {
            wallpaperId,
            userId: user?.id || 'anonymous',
            timestamp: new Date().toISOString(),
            type: wallpaper.type
        };
        
        await env.DB.put(`download:${crypto.randomUUID()}`, JSON.stringify(downloadLog), {
            expirationTtl: 30 * 24 * 60 * 60 // Keep for 30 days
        });
        
        return new Response(JSON.stringify({ 
            success: true, 
            downloadUrl: wallpaper.downloadUrl || wallpaper.image,
            message: wallpaper.type === 'premium' ? 'Premium download started' : 'Free download started'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Download failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
