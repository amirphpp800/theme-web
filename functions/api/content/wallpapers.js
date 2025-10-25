// Get wallpapers for main site
export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        // Get wallpapers from KV
        const wallpapersList = await env.DB.get('wallpapers_list');
        const wallpapers = wallpapersList ? JSON.parse(wallpapersList) : [];
        
        return new Response(JSON.stringify({ 
            success: true, 
            wallpapers: wallpapers 
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to load wallpapers' 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store'
            }
        });
    }
}
