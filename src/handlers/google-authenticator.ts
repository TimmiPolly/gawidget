// Главный обработчик воркера
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    console.log("Request path:", url.pathname, "Method:", request.method);
    
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

async function googleAuthenticatorHandler(request: Request): Promise<Response> {
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
  
  // Экранируем токен для безопасной вставки в JavaScript
  const escapedToken = originalToken.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Authenticator Setup</title>
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body { 
      margin: 0; 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); 
      color: white; 
      font-family: 'Inter', sans-serif;
      padding: 20px;
    }
    
    .container { 
      max-width: 700px; 
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    h1 { 
      font-family: 'Space Grotesk', sans-serif; 
      font-size: 2.5rem; 
      margin: 0 0 0.5rem 0;
      background: linear-gradient(90deg, #22d3ee, #a78bfa); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent;
      text-align: center;
    }
    
    .subtitle {
      text-align: center;
      opacity: 0.8;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }
    
    .setup-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    @media (max-width: 600px) {
      .setup-section {
        grid-template-columns: 1fr;
      }
    }
    
    .qr-section {
      text-align: center;
    }
    
    .qr-label {
      font-size: 1rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    }
    
    #qrcode {
      display: flex;
      justify-content: center;
      align-items: center;
      background: white;
      padding: 20px;
      border-radius: 16px;
      margin-bottom: 1rem;
    }
    
    .manual-section {
      display: flex;
      flex-direction: column;
    }
    
    .key-box { 
      background: rgba(0, 0, 0, 0.3); 
      border: 2px solid #a78bfa; 
      border-radius: 12px; 
      padding: 1.2rem; 
      font-size: 1.3rem; 
      letter-spacing: 3px; 
      word-break: break-all; 
      margin: 1rem 0;
      font-family: 'Courier New', monospace;
      text-align: center;
    }
    
    .copy-btn {
      background: linear-gradient(90deg, #22d3ee, #a78bfa);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, opacity 0.2s;
      margin-top: 0.5rem;
    }
    
    .copy-btn:hover {
      transform: scale(1.02);
      opacity: 0.9;
    }
    
    .verification-section {
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 2rem;
      margin-top: 1rem;
    }
    
    .verification-title {
      font-size: 1.3rem;
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .code-input-container {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    
    .code-input {
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 2rem;
      width: 200px;
      text-align: center;
      color: white;
      font-family: 'Courier New', monospace;
      letter-spacing: 8px;
      outline: none;
      transition: border-color 0.3s;
    }
    
    .code-input:focus {
      border-color: #a78bfa;
    }
    
    .code-input.error {
      border-color: #ff6b6b;
      animation: shake 0.3s;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
    
    .verify-btn {
      background: #a78bfa;
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 160px;
    }
    
    .verify-btn:hover:not(:disabled) {
      background: #8b6cf0;
      transform: scale(1.02);
    }
    
    .verify-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .verification-status {
      text-align: center;
      margin-top: 1rem;
      min-height: 24px;
    }
    
    .success-message {
      color: #4ade80;
      font-weight: 500;
      padding: 10px;
      background: rgba(74, 222, 128, 0.1);
      border-radius: 8px;
    }
    
    .error-message {
      color: #ff6b6b;
      padding: 10px;
      background: rgba(255, 107, 107, 0.1);
      border-radius: 8px;
    }
    
    .info-text {
      font-size: 0.9rem;
      opacity: 0.7;
      margin-top: 0.5rem;
    }
    
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔐 Google Authenticator</h1>
    <p class="subtitle">Настройте двухфакторную аутентификацию</p>
    
    <div class="setup-section">
      <div class="qr-section">
        <div class="qr-label">📱 Отсканируйте QR-код</div>
        <div id="qrcode"></div>
        <p class="info-text">Используйте приложение Google Authenticator или любой другой TOTP-совместимый аутентификатор</p>
      </div>
      
      <div class="manual-section">
        <div class="qr-label">🔑 Или введите ключ вручную</div>
        <div class="key-box" id="secretKey">${key}</div>
        <button class="copy-btn" onclick="copySecretKey()">📋 Скопировать ключ</button>
        <p class="info-text" style="margin-top: 1rem;">Выберите "Ввести ключ вручную" в приложении и вставьте этот код</p>
      </div>
    </div>
    
    <div class="verification-section">
      <h3 class="verification-title">✅ Активируйте 2FA</h3>
      <div style="text-align: center;">
        <div class="code-input-container">
          <input 
            type="text" 
            id="verificationCode" 
            class="code-input" 
            placeholder="000000" 
            maxlength="6"
            inputmode="numeric"
            pattern="[0-9]*"
            oninput="validateInput(this)"
            onkeypress="return event.charCode >= 48 && event.charCode <= 57"
          >
          <button class="verify-btn" onclick="enable2FA()" id="verifyBtn">Установить 2FA</button>
        </div>
        <div class="verification-status" id="status"></div>
      </div>
    </div>
  </div>

  <script>
    const secretKey = '${key}';
    const originalToken = '${escapedToken}';
    const otpauthUrl = '${otpauthUrl}';
    
    // Генерируем QR-код
    window.onload = function() {
      new QRCode(document.getElementById("qrcode"), {
        text: otpauthUrl,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    };
    
    function copySecretKey() {
      navigator.clipboard.writeText(secretKey).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Скопировано!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }).catch(err => {
        // Fallback для старых браузеров
        const textArea = document.createElement("textarea");
        textArea.value = secretKey;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Скопировано!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      });
    }
    
    function validateInput(input) {
      // Удаляем все нецифровые символы
      input.value = input.value.replace(/[^0-9]/g, '');
      
      // Убираем класс ошибки при вводе
      input.classList.remove('error');
    }
    
    async function enable2FA() {
      const input = document.getElementById('verificationCode');
      const code = input.value;
      const btn = document.getElementById('verifyBtn');
      const status = document.getElementById('status');
      
      // Валидация
      if (code.length !== 6) {
        input.classList.add('error');
        status.innerHTML = '<span class="error-message">❌ Введите 6 цифр</span>';
        return;
      }
      
      if (!/^\\d{6}$/.test(code)) {
        input.classList.add('error');
        status.innerHTML = '<span class="error-message">❌ Только цифры</span>';
        return;
      }
      
      // Показываем загрузку
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Активация...';
      status.innerHTML = '<span style="opacity: 0.8;">Включение 2FA...</span>';
      
      try {
        // Прямой запрос к API партнера
        const apiUrl = 'https://api-test.free2ex.com/v3/Identity/GoogleAuthenticator/Enable';
        
        const requestBody = {
          isEnableClientFactor: true,
          value: originalToken,
          code: code,
          state: ""
        };
        
        console.log('Отправка запроса на активацию 2FA:', { code, tokenPreview: originalToken.substring(0, 50) + '...' });
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });
        
        console.log('Статус ответа:', response.status);
        
        if (response.status === 200) {
          status.innerHTML = '<span class="success-message">✅ 2FA успешно включена!</span>';
          input.classList.remove('error');
          input.disabled = true;
          btn.disabled = true;
          btn.innerHTML = '✅ Готово';
          
          console.log('2FA успешно активирована');
        } else {
          const errorText = await response.text();
          console.error('Ошибка активации 2FA:', errorText);
          
          let errorMessage = 'Ошибка активации 2FA';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
          } catch (e) {
            // Используем дефолтное сообщение
          }
          
          input.classList.add('error');
          status.innerHTML = '<span class="error-message">❌ ' + errorMessage + '</span>';
          btn.disabled = false;
          btn.innerHTML = 'Установить 2FA';
        }
      } catch (error) {
        console.error('Ошибка соединения:', error);
        status.innerHTML = '<span class="error-message">❌ Ошибка соединения. Попробуйте позже</span>';
        btn.disabled = false;
        btn.innerHTML = 'Установить 2FA';
      }
    }
    
    // Автофокус на поле ввода
    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('verificationCode').focus();
    });
    
    // Обработка Enter
    document.getElementById('verificationCode').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        enable2FA();
      }
    });
  </script>
</body>
</html>`;
  
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function createDebugPage(info: any, isError: boolean): Response {
  const html = `<!DOCTYPE html>
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
  <p><a href="/" style="color: #a78bfa;">← На главную</a></p>
</body>
</html>`;

  return new Response(html, { 
    status: isError ? 502 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8" } 
  });
}
