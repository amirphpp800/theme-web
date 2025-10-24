// Admin system status check
export async function onRequestGet(context) {
    const { env } = context;
    
    try {
        // Check KV connection
        let kvStatus = false;
        let kvError = null;
        
        try {
            // Try to perform a simple KV operation
            await env.DB.put('health_check', 'ok', { expirationTtl: 60 });
            const testValue = await env.DB.get('health_check');
            kvStatus = testValue === 'ok';
            await env.DB.delete('health_check');
        } catch (error) {
            kvError = error.message;
        }
        
        // Check admin credentials configuration
        const adminUser = env.ADMIN_USER;
        const adminPass = env.ADMIN_PASS;
        const adminConfigured = !!(adminUser && adminPass && adminUser !== '' && adminPass !== '');
        
        return new Response(JSON.stringify({
            success: true,
            status: {
                kv: {
                    connected: kvStatus,
                    error: kvError
                },
                adminConfig: {
                    configured: adminConfigured,
                    hasUsername: !!(adminUser && adminUser !== ''),
                    hasPassword: !!(adminPass && adminPass !== '')
                }
            }
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Failed to check system status',
            status: {
                kv: {
                    connected: false,
                    error: error.message
                },
                adminConfig: {
                    configured: false,
                    hasUsername: false,
                    hasPassword: false
                }
            }
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
