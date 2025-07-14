
export async function handleCreateUser(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const userData = await request.json();
    
    // Import dynamically để tránh lỗi trong client-side
    const { createUserWithAdmin } = await import('./createUser');
    
    const user = await createUserWithAdmin(userData);
    
    return new Response(JSON.stringify({ success: true, user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
