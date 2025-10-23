// Get prompts for main site
export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        // Get prompts from KV
        const promptsList = await env.DB.get('prompts_list');
        const prompts = promptsList ? JSON.parse(promptsList) : [];
        
        return new Response(JSON.stringify({ 
            success: true, 
            prompts: prompts 
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: 'Failed to load prompts' 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
