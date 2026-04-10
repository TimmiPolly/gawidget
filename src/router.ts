import { googleAuthenticatorHandler } from './handlers/google-authenticator';
import { enable2FAHandler } from './handlers/enable-2fa';

export interface Env {
  MY_KV: KVNamespace;
}

export interface RouteHandler {
  (request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
}

export interface Route {
  path: string;
  method: string;
  handler: RouteHandler;
}

// Определение всех маршрутов
const routes: Route[] = [
  {
    path: '/GoogleAuthenticator',
    method: 'GET',
    handler: googleAuthenticatorHandler
  },
  {
    path: '/enable-2fa',
    method: 'POST',
    handler: enable2FAHandler
  }
];

// Функция для обработки CORS
function handleCORS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

// Функция для поиска подходящего маршрута
function findRoute(path: string, method: string): Route | undefined {
  return routes.find(route => route.path === path && route.method === method);
}

// Класс Router
class Router {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    console.log(`${method} ${path}`);
    
    // Обработка CORS preflight
    if (method === 'OPTIONS') {
      return handleCORS();
    }
    
    // Поиск маршрута
    const route = findRoute(path, method);
    
    if (route) {
      try {
        const startTime = Date.now();
        const response = await route.handler(request, env, ctx);
        const duration = Date.now() - startTime;
        
        console.log(`${method} ${path} - ${response.status} (${duration}ms)`);
        
        // Добавляем CORS заголовки к ответу
        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      } catch (error: any) {
        console.error(`Error in route ${method} ${path}:`, error);
        
        return new Response(JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // Корневой путь - информация о доступных маршрутах
    if (path === '/') {
      return new Response(JSON.stringify({
        message: 'Google Authenticator Worker',
        version: '1.0.0',
        availableRoutes: routes.map(r => ({ 
          method: r.method, 
          path: r.path 
        })),
        documentation: {
          'GET /GoogleAuthenticator': 'Get secret key and setup page. Query param: ?token=YOUR_TOKEN',
          'POST /enable-2fa': 'Enable 2FA. Body: { "code": "123456", "token": "YOUR_TOKEN" }'
        },
        timestamp: new Date().toISOString()
      }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 404 для несуществующих маршрутов
    return new Response(JSON.stringify({
      error: 'Not Found',
      path: path,
      method: method,
      availableRoutes: routes.map(r => ({ method: r.method, path: r.path }))
    }, null, 2), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Экспортируем экземпляр роутера
export const router = new Router();
