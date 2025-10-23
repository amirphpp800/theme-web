// Admin prompts management
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
            return handleGetPrompts(env);
        case 'POST':
            return handleAddPrompt(request, env);
        case 'DELETE':
            return handleDeletePrompt(request, env);
        default:
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
    }
}

async function handleGetPrompts(env) {
    try {
        // Get all prompts from KV
        const promptsList = await env.DB.get('prompts_list');
        const prompts = promptsList ? JSON.parse(promptsList) : [];
        
        return new Response(JSON.stringify({ 
            success: true, 
            prompts: prompts 
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to get prompts' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleAddPrompt(request, env) {
    try {
        const promptData = await request.json();
        
        // Validate required fields
        if (!promptData.title || !promptData.title.fa || !promptData.title.en || 
            !promptData.prompt || !promptData.image) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generate unique ID
        const promptId = crypto.randomUUID();
        
        // Create prompt object
        const newPrompt = {
            id: promptId,
            title: {
                fa: promptData.title.fa,
                en: promptData.title.en
            },
            prompt: promptData.prompt,
            image: promptData.image,
            createdAt: new Date().toISOString()
        };
        
        // Get existing prompts
        const promptsList = await env.DB.get('prompts_list');
        const prompts = promptsList ? JSON.parse(promptsList) : [];
        
        // Add new prompt
        prompts.push(newPrompt);
        
        // Save back to KV
        await env.DB.put('prompts_list', JSON.stringify(prompts));
        await env.DB.put(`prompt:${promptId}`, JSON.stringify(newPrompt));
        
        return new Response(JSON.stringify({ 
            success: true, 
            prompt: newPrompt,
            message: 'Prompt added successfully'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to add prompt' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function handleDeletePrompt(request, env) {
    try {
        const url = new URL(request.url);
        const promptId = url.pathname.split('/').pop();
        
        if (!promptId) {
            return new Response(JSON.stringify({ error: 'Prompt ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get existing prompts
        const promptsList = await env.DB.get('prompts_list');
        const prompts = promptsList ? JSON.parse(promptsList) : [];
        
        // Remove prompt from list
        const updatedPrompts = prompts.filter(p => p.id !== promptId);
        
        // Save updated list
        await env.DB.put('prompts_list', JSON.stringify(updatedPrompts));
        
        // Delete individual prompt
        await env.DB.delete(`prompt:${promptId}`);
        
        return new Response(JSON.stringify({ 
            success: true,
            message: 'Prompt deleted successfully'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to delete prompt' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
