// Главный обработчик воркера
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    console.log("Request path:", url.pathname, "Method:", request.method);
    
    // Обработка POST запроса на /enable-2fa
    if (url.pathname === '/enable-2fa' && request.method === 'POST') {
      console.log("Handling /enable-2fa POST request");
      return handleEnable2FA(request);
    }
    
    // Обработка OPTIONS запроса для CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }
    
    // Обработка GET запроса на /GoogleAuthenticator
    if (url.pathname === '/GoogleAuthenticator' && request.method === 'GET') {
      console.log("Handling /GoogleAuthenticator GET request");
      return googleAuthenticatorHandler(request);
    }
    
    // Обработка корневого пути
    if (url.pathname === '/') {
      return new Response('Worker is running. Use /GoogleAuthenticator?token=YOUR_TOKEN', { 
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }
    
    // Для всех остальных запросов
    console.log("404 Not Found for path:", url.pathname);
    return new Response('Not Found', { status: 404 });
  }
};

async function handleEnable2FA(request: Request): Promise<Response> {
  console.log("handleEnable2FA called");
  
  try {
    const body = await request.json() as { secret: string; code: string; token: string };
    const { secret, code, token } = body;
    
    console.log("Received code:", code);
    console.log("Token exists:", !!token);

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid code format" 
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    const enableUrl = 'https://api-test.free2ex.com/v3/Identity/GoogleAuthenticator/Enable';
    
    const requestBody = {
      isEnableClientFactor: true,
      value: token,
      code: code,
      state: ""
    };

    console.log("Sending request to:", enableUrl);

    const response = await fetch(enableUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    console.log("API Response status:", response.status);

    if (response.status === 200) {
      return new Response(JSON.stringify({ 
        success: true,
        message: "2FA успешно включена!"
      }), {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    } else {
      return new Response(JSON.stringify({ 
        success: false,
        error: responseData.error?.message || responseData.message || "Ошибка активации 2FA",
        details: responseData
      }), {
        status: response.status,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

  } catch (err: any) {
    console.error("Enable 2FA error:", err);
    return new Response(JSON.stringify({ 
      success: false,
      error: err.message || "Internal server error"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
}

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
    
    const rawQueryString = request.url.split('?')[1] || '';
    const tokenMatch = rawQueryString.match(/token=([^&]*)/);
    let token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return new Response("Ошибка: token не передан", { status: 400 });
    }

    debugInfo.tokenLength = token.length;

    token = decodeURIComponent(token);
    
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
      return createDebugPage(debugInfo, true);
    }

    const data = await response.json() as any;
    const secretKey = data.key || "Ключ не получен";
    
    return createSuccessPage(secretKey, token);

  } catch (err: any) {
    debugInfo.error = err.message || String(err);
    console.error(err);
    return createDebugPage(debugInfo, true);
  }
}

function createSuccessPage(key: string, originalToken: string): Response {
  const otpauthUrl = `otpauth://totp/Free2EX?secret=${key}&issuer=Free2EX`;
  
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Authenticator Setup</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); 
      color: white; font-family: 'Inter', sans-serif; padding: 20px;
    }
    .container { 
      max-width: 700px; padding: 2.5rem; background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px); border-radius: 24px; 
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    h1 { 
      font-size: 2.5rem; margin: 0 0 0.5rem 0;
      background: linear-gradient(90deg, #22d3ee, #a78bfa); 
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      text-align: center;
    }
    .subtitle { text-align: center; opacity: 0.8; margin-bottom: 2rem; }
    .setup-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    @media (max-width: 600px) { .setup-section { grid-template-columns: 1fr; } }
    #qrcode { 
      display: flex; justify-content: center; align-items: center; 
      background: white; padding: 20px; border-radius: 16px; margin-bottom: 1rem;
    }
    .key-box { 
      background: rgba(0, 0, 0, 0.3); border: 2px solid #a78bfa; border-radius: 12px; 
      padding: 1.2rem; font-size: 1.3rem; letter-spacing: 3px; word-break: break-all; 
      margin: 1rem 0; font-family: monospace; text-align: center;
    }
    .copy-btn {
      background: linear-gradient(90deg, #22d3ee, #a78bfa); color: white;
      border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem;
      font-weight: 600; cursor: pointer;
    }
    .verification-section { border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 2rem; }
    .code-input-container { display: flex; gap: 12px; justify-content: center; margin-bottom: 1rem; }
    .code-input {
      background: rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px; padding: 16px 20px; font-size: 2rem; width: 200px;
      text-align: center; color: white; font-family: monospace; letter-spacing: 8px;
    }
    .verify-btn {
      background: #a78bfa; color: white; border: none; padding: 16px 32px;
      border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer;
    }
    .verification-status { text-align: center; margin-top: 1rem; min-height: 24px; }
    .success-message { color: #4ade80; }
    .error-message { color: #ff6b6b; }
    .spinner {
      display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Google Authenticator</h1>
    <p class="subtitle">Настройте двухфакторную аутентификацию</p>
    <div class="setup-section">
      <div>
        <div style="text-align: center; margin-bottom: 1rem;">📱 Отсканируйте QR-код</div>
        <div id="qrcode"></div>
      </div>
      <div>
        <div style="margin-bottom: 1rem;">🔑 Или введите ключ вручную</div>
        <div class="key-box">${key}</div>
        <button class="copy-btn" onclick="copyKey()">📋 Скопировать ключ</button>
      </div>
    </div>
    <div class="verification-section">
      <h3 style="text-align: center; margin-bottom: 1.5rem;">✅ Активируйте 2FA</h3>
      <div class="code-input-container">
        <input type="text" id="code" class="code-input" placeholder="000000" maxlength="6" 
               oninput="this.value=this.value.replace(/[^0-9]/g,'')">
        <button class="verify-btn" onclick="enable2FA()" id="verifyBtn">Установить 2FA</button>
      </div>
      <div class="verification-status" id="status"></div>
    </div>
  </div>
  <script>
    const secretKey = '${key}';
    const token = '${originalToken.replace(/'/g, "\\'").replace(/\\n/g, '\\\\n')}';
    
    new QRCode(document.getElementById("qrcode"), {
      text: '${otpauthUrl}', width: 200, height: 200,
      colorDark: "#000000", colorLight: "#ffffff"
    });
    
    function copyKey() {
      navigator.clipboard.writeText(secretKey);
      const btn = event.target;
      btn.textContent = '✅ Скопировано!';
      setTimeout(() => btn.textContent = '📋 Скопировать ключ', 2000);
    }
    
    async function enable2FA() {
      const input = document.getElementById('code');
      const code = input.value;
      const btn = document.getElementById('verifyBtn');
      const status = document.getElementById('status');
      
      if (code.length !== 6) {
        status.innerHTML = '<span class="error-message">❌ Введите 6 цифр</span>';
        return;
      }
      
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Активация...';
      status.innerHTML = 'Включение 2FA...';
      
      try {
        const response = await fetch('/enable-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, token })
        });
        
        const result = await response.json();
        
        if (result.success) {
          status.innerHTML = '<span class="success-message">✅ 2FA успешно включена!</span>';
          input.disabled = true;
          btn.innerHTML = '✅ Готово';
        } else {
          status.innerHTML = '<span class="error-message">❌ ' + (result.error || 'Ошибка') + '</span>';
          btn.disabled = false;
          btn.innerHTML = 'Установить 2FA';
        }
      } catch (err) {
        status.innerHTML = '<span class="error-message">❌ Ошибка соединения</span>';
        btn.disabled = false;
        btn.innerHTML = 'Установить 2FA';
      }
    }
  </script>
</body>
</html>`;
  
  return new Response(html, { 
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}

function createDebugPage(info: any, isError: boolean): Response {
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Debug Info</title>
  <style>
    body { font-family: monospace; background:#1a1a2e; color:#fff; padding:20px; }
    pre { background:#16213e; padding:15px; border-radius:8px; overflow:auto; }
  </style>
</head>
<body>
  <h1>${isError ? '❌ Ошибка' : 'Debug Info'}</h1>
  <pre>${JSON.stringify(info, null, 2)}</pre>
</body>
</html>`;

  return new Response(html, { 
    status: isError ? 502 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}
