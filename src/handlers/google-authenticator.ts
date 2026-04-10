import { Env } from '../router';
import { renderSetupPage } from '../templates/setup-page';
import { renderDebugPage } from '../templates/debug-page';
import { googleAuthApi } from '../services/google-auth-api';
import { extractTokenFromUrl, validateToken, generateOtpAuthUrl } from '../utils/token-utils';

export async function googleAuthenticatorHandler(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const debugInfo = {
    requestUrl: request.url,
    tokenLength: 0,
    apiUrl: "",
    status: null as number | null,
    statusText: "",
    error: "",
    timestamp: new Date().toISOString()
  };

  try {
    // Извлекаем и валидируем токен
    const rawToken = extractTokenFromUrl(request.url);
    const validation = validateToken(rawToken);
    
    if (!validation.valid || !validation.decoded) {
      return new Response(validation.error || 'Ошибка валидации токена', { status: 400 });
    }
    
    const token = validation.decoded;
    debugInfo.tokenLength = token.length;
    
    // Логируем в KV (если доступно)
    if (env.MY_KV) {
      ctx.waitUntil(
        env.MY_KV.put(`request-${Date.now()}`, JSON.stringify({
          tokenPreview: token.substring(0, 20) + '...',
          timestamp: new Date().toISOString(),
          ip: request.headers.get('cf-connecting-ip') || 'unknown'
        }), { expirationTtl: 3600 })
      );
    }
    
    // Получаем секретный ключ от API
    const apiResult = await googleAuthApi.getSecretKey(token);
    debugInfo.status = apiResult.status || null;
    
    if (!apiResult.success || !apiResult.key) {
      debugInfo.error = apiResult.error || 'Не удалось получить ключ';
      return new Response(renderDebugPage(debugInfo, true), {
        status: apiResult.status || 502,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    const secretKey = apiResult.key;
    const otpauthUrl = generateOtpAuthUrl(secretKey);
    
    // Рендерим страницу настройки
    const html = renderSetupPage({
      secretKey,
      token,
      otpauthUrl
    });
    
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
    
  } catch (err: any) {
    debugInfo.error = err.message || String(err);
    console.error('Handler error:', err);
    
    return new Response(renderDebugPage(debugInfo, true), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}
