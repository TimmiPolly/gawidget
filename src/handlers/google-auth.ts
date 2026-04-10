export async function googleAuthenticatorHandler(request: Request): Promise<Response> {
  let debugInfo = {
    requestUrl: request.url,
    tokenLength: 0,
    apiUrl: "",
    status: null as number | null,
    statusText: "",
    error: "",
    rawResponse: ""
  };

  try {
    const url = new URL(request.url);
    
    // ВАЖНО: Получаем сырой query string и извлекаем токен вручную
    // чтобы избежать автоматического декодирования URL
    const rawQueryString = request.url.split('?')[1] || '';
    const tokenMatch = rawQueryString.match(/token=([^&]*)/);
    let token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return new Response("Ошибка: token не передан", { status: 400 });
    }

    debugInfo.tokenLength = token.length;

    // Декодируем токен только один раз, сохраняя все символы
    token = decodeURIComponent(token);
    
    // Кодируем заново для передачи в API
    const apiUrl = `https://api-test.free2ex.com/v3/Identity/GoogleAuthenticator?sendNotification=false&token=${encodeURIComponent(token)}`;

    debugInfo.apiUrl = apiUrl;

    console.log("=== ЗАПРОС К API ===");
    console.log("Token length:", token.length);
    console.log("Original token preview:", token.substring(0, 50) + "...");
    console.log("URL:", apiUrl);
    console.log("=====================");

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    debugInfo.status = response.status;
    debugInfo.statusText = response.statusText;

    if (!response.ok) {
      const errorText = await response.text();
      debugInfo.error = errorText;
      console.error("Ошибка API:", errorText);
      return createDebugPage(debugInfo);
    }

    const data = await response.json() as any;
    return createSuccessPage(data.key || "Ключ не получен");

  } catch (err: any) {
    debugInfo.error = err.message || String(err);
    console.error(err);
    return createDebugPage(debugInfo);
  }
}

function createSuccessPage(key: string): Response {
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Authenticator</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600&display=swap');
    body { margin:0; height:100vh; display:flex; align-items:center; justify-content:center;
           background:linear-gradient(135deg,#0f0c29,#302b63,#24243e); color:white; font-family:'Inter',sans-serif; }
    .container { text-align:center; max-width:660px; padding:2rem; }
    h1 { font-family:'Space Grotesk',sans-serif; font-size:3.8rem; margin:0 0 1rem 0;
         background:linear-gradient(90deg,#22d3ee,#a78bfa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .key-box { background:rgba(255,255,255,0.08); border:2px solid #a78bfa; border-radius:16px; 
               padding:1.8rem; font-size:1.6rem; letter-spacing:5px; word-break:break-all; margin:2rem 0; }
    p { font-size:1.25rem; opacity:0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Google Authenticator</h1>
    <p>Ваш секретный ключ:</p>
    <div class="key-box">${key}</div>
    <p>Скопируйте ключ и добавьте в приложение Google Authenticator</p>
  </div>
</body>
</html>`;
  
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function createDebugPage(info: any, isError: boolean): Response {
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debug Info</title>
  <style>
    body { font-family: monospace; background:#1a1a2e; color:#fff; padding:20px; line-height:1.5; }
    pre { background:#16213e; padding:15px; border-radius:8px; overflow:auto; }
    .error { color:#ff6b6b; }
  </style>
</head>
<body>
  <h1>${isError ? '❌ Ошибка' : 'Debug Info'}</h1>
  <pre>${JSON.stringify(info, null, 2)}</pre>
  <p><a href="/">← На главную</a></p>
</body>
</html>`;

  return new Response(html, { 
    status: isError ? 502 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}
