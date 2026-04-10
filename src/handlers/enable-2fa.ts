import { Env } from '../router';
import { googleAuthApi } from '../services/google-auth-api';

export async function enable2FAHandler(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const body = await request.json() as { code: string; token: string };
    const { code, token } = body;
    
    // Валидация
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Код должен содержать 6 цифр'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Токен не передан'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Логируем попытку в KV
    if (env.MY_KV) {
      ctx.waitUntil(
        env.MY_KV.put(`2fa-attempt-${Date.now()}`, JSON.stringify({
          code,
          tokenPreview: token.substring(0, 20) + '...',
          timestamp: new Date().toISOString(),
          ip: request.headers.get('cf-connecting-ip') || 'unknown'
        }), { expirationTtl: 3600 })
      );
    }
    
    // Вызываем API партнера
    const result = await googleAuthApi.enable2FA(token, code);
    
    // Логируем результат
    if (env.MY_KV && result.success) {
      ctx.waitUntil(
        env.MY_KV.put(`2fa-success-${Date.now()}`, JSON.stringify({
          timestamp: new Date().toISOString(),
          success: true
        }), { expirationTtl: 86400 })
      );
    }
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error: any) {
    console.error('Enable 2FA handler error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Внутренняя ошибка сервера'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
