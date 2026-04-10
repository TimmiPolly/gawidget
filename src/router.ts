import { googleAuthenticatorHandler } from './handlers/google-authenticator';
import { enable2FAHandler } from './handlers/enable-2fa';

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    
    console.log(`${request.method} ${url.pathname}`);
    
    // Обработка CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }
    
    // Роутинг
    if (url.pathname === '/GoogleAuthenticator' && request.method === 'GET') {
      return googleAuthenticatorHandler(request);
    }
    
    if (url.pathname === '/enable-2fa' && request.method === 'POST') {
      return enable2FAHandler(request);
    }
    
    // Корневой путь
    if (url.pathname === '/') {
      return new Response('Worker is running. Available endpoints: GET /GoogleAuthenticator, POST /enable-2fa', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    // 404
    return new Response('Not Found', { status: 404 });
  }
};

function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
