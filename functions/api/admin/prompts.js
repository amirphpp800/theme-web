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
        
        // Get existing prompts
        const promptsList = await env.DB.get('prompts_list');
        const prompts = promptsList ? JSON.parse(promptsList) : [];
        
        // Check for duplicates by title
        const titleKey = `${promptData.title.fa.trim()}-${promptData.title.en.trim()}`;
        const isDuplicate = prompts.some(p => 
            `${p.title.fa.trim()}-${p.title.en.trim()}` === titleKey
        );
        
        if (isDuplicate) {
            return new Response(JSON.stringify({ error: 'Prompt with this title already exists' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Generate unique ID
        const promptId = crypto.randomUUID();
        
        // Create prompt object
        const newPrompt = {
            id: promptId,
            title: {
                fa: promptData.title.fa.trim(),
                en: promptData.title.en.trim()
            },
            prompt: promptData.prompt.trim(),
            image: promptData.image,
            createdAt: new Date().toISOString()
        };
        
        // Add new prompt
        prompts.push(newPrompt);
        
        // Save back to KV with error handling
        try {
            await env.DB.put('prompts_list', JSON.stringify(prompts));
            await env.DB.put(`prompt:${promptId}`, JSON.stringify(newPrompt));
        } catch (kvError) {
            console.error('KV storage error:', kvError);
            return new Response(JSON.stringify({ error: 'Failed to save prompt to database' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ 
            success: true, 
            prompt: newPrompt,
            message: 'Prompt added successfully'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Add prompt error:', error);
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
        
        if (!promptId || promptId === 'prompts') {
            return new Response(JSON.stringify({ error: 'Valid prompt ID required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Get existing prompts
        const promptsList = await env.DB.get('prompts_list');
        const prompts = promptsList ? JSON.parse(promptsList) : [];
        
        // Check if prompt exists
        const promptExists = prompts.some(p => p.id === promptId);
        if (!promptExists) {
            return new Response(JSON.stringify({ error: 'Prompt not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        // Remove prompt from list
        const updatedPrompts = prompts.filter(p => p.id !== promptId);
        
        // Save updated list and delete individual prompt with error handling
        try {
            await env.DB.put('prompts_list', JSON.stringify(updatedPrompts));
            await env.DB.delete(`prompt:${promptId}`);
        } catch (kvError) {
            console.error('KV deletion error:', kvError);
            return new Response(JSON.stringify({ error: 'Failed to delete prompt from database' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        return new Response(JSON.stringify({ 
            success: true,
            message: 'Prompt deleted successfully',
            deletedId: promptId
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (error) {
        console.error('Delete prompt error:', error);
        return new Response(JSON.stringify({ error: 'Failed to delete prompt' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
