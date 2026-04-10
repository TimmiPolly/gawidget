import { renderLayout } from './layout';

export interface SetupPageData {
  secretKey: string;
  token: string;
  otpauthUrl: string;
}

export function renderSetupPage(data: SetupPageData): string {
  const escapedToken = data.token
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  
  const styles = `
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); 
      color: white; font-family: 'Inter', sans-serif; padding: 20px;
    }
    .container { 
      max-width: 700px; width: 100%;
      padding: 2.5rem; background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px); border-radius: 24px; 
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    h1 { 
      font-family: 'Space Grotesk', sans-serif;
      font-size: 2.5rem; margin: 0 0 0.5rem 0;
      background: linear-gradient(90deg, #22d3ee, #a78bfa); 
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      text-align: center;
    }
    .subtitle { text-align: center; opacity: 0.8; margin-bottom: 2rem; font-size: 1.1rem; }
    .setup-section { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    @media (max-width: 600px) { .setup-section { grid-template-columns: 1fr; } }
    #qrcode { 
      display: flex; justify-content: center; align-items: center; 
      background: white; padding: 20px; border-radius: 16px; margin: 0 auto 1rem;
      width: fit-content;
    }
    .qr-label { text-align: center; margin-bottom: 1rem; opacity: 0.9; }
    .key-box { 
      background: rgba(0, 0, 0, 0.3); border: 2px solid #a78bfa; border-radius: 12px; 
      padding: 1.2rem; font-size: 1.3rem; letter-spacing: 3px; word-break: break-all; 
      margin: 1rem 0; font-family: 'Courier New', monospace; text-align: center;
    }
    .copy-btn {
      background: linear-gradient(90deg, #22d3ee, #a78bfa); color: white;
      border: none; padding: 12px 24px; border-radius: 8px; font-size: 1rem;
      font-weight: 600; cursor: pointer; width: 100%;
      transition: transform 0.2s, opacity 0.2s;
    }
    .copy-btn:hover { transform: scale(1.02); opacity: 0.9; }
    .verification-section { border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 2rem; margin-top: 1rem; }
    .verification-title { font-size: 1.3rem; margin-bottom: 1.5rem; text-align: center; }
    .code-input-container { display: flex; gap: 12px; align-items: center; justify-content: center; margin-bottom: 1rem; }
    .code-input {
      background: rgba(0, 0, 0, 0.3); border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px; padding: 16px 20px; font-size: 2rem; width: 200px;
      text-align: center; color: white; font-family: 'Courier New', monospace;
      letter-spacing: 8px; outline: none; transition: border-color 0.3s;
    }
    .code-input:focus { border-color: #a78bfa; }
    .code-input.error { border-color: #ff6b6b; animation: shake 0.3s; }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
    .verify-btn {
      background: #a78bfa; color: white; border: none; padding: 16px 32px;
      border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s; min-width: 160px;
    }
    .verify-btn:hover:not(:disabled) { background: #8b6cf0; transform: scale(1.02); }
    .verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .verification-status { text-align: center; margin-top: 1rem; min-height: 24px; }
    .success-message { 
      color: #4ade80; font-weight: 500; padding: 10px;
      background: rgba(74, 222, 128, 0.1); border-radius: 8px;
    }
    .error-message { 
      color: #ff6b6b; padding: 10px;
      background: rgba(255, 107, 107, 0.1); border-radius: 8px;
    }
    .info-text { font-size: 0.9rem; opacity: 0.7; margin-top: 0.5rem; }
    .spinner {
      display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>`;
  
  const scripts = `
  <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
  <script>
    const config = {
      secretKey: '${data.secretKey}',
      token: '${escapedToken}',
      otpauthUrl: '${data.otpauthUrl}'
    };
  </script>
  <script>
    (function() {
      // Инициализация QR-кода
      new QRCode(document.getElementById("qrcode"), {
        text: config.otpauthUrl,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
      
      // Копирование ключа
      window.copyKey = function() {
        navigator.clipboard.writeText(config.secretKey).then(() => {
          const btn = event.target;
          const originalText = btn.textContent;
          btn.textContent = '✅ Скопировано!';
          setTimeout(() => btn.textContent = originalText, 2000);
        }).catch(() => {
          const textArea = document.createElement("textarea");
          textArea.value = config.secretKey;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          const btn = event.target;
          const originalText = btn.textContent;
          btn.textContent = '✅ Скопировано!';
          setTimeout(() => btn.textContent = originalText, 2000);
        });
      };
      
      // Валидация ввода
      window.validateInput = function(input) {
        input.value = input.value.replace(/[^0-9]/g, '');
        input.classList.remove('error');
      };
      
      // Активация 2FA
      window.enable2FA = async function() {
        const input = document.getElementById('verificationCode');
        const code = input.value;
        const btn = document.getElementById('verifyBtn');
        const status = document.getElementById('status');
        
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
        
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Активация...';
        status.innerHTML = '<span style="opacity: 0.8;">Включение 2FA...</span>';
        
        try {
          const response = await fetch('/enable-2fa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, token: config.token })
          });
          
          const result = await response.json();
          
          if (result.success) {
            status.innerHTML = '<span class="success-message">✅ ' + (result.message || '2FA успешно включена!') + '</span>';
            input.classList.remove('error');
            input.disabled = true;
            btn.disabled = true;
            btn.innerHTML = '✅ Готово';
          } else {
            input.classList.add('error');
            status.innerHTML = '<span class="error-message">❌ ' + (result.error || 'Ошибка активации') + '</span>';
            btn.disabled = false;
            btn.innerHTML = 'Установить 2FA';
          }
        } catch (error) {
          console.error('Enable 2FA error:', error);
          status.innerHTML = '<span class="error-message">❌ Ошибка соединения. Попробуйте позже</span>';
          btn.disabled = false;
          btn.innerHTML = 'Установить 2FA';
        }
      };
      
      // Обработка Enter
      document.getElementById('verificationCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          window.enable2FA();
        }
      });
      
      // Автофокус
      document.getElementById('verificationCode').focus();
    })();
  </script>`;
  
  const content = `
  <div class="container">
    <h1>🔐 Google Authenticator</h1>
    <p class="subtitle">Настройте двухфакторную аутентификацию</p>
    
    <div class="setup-section">
      <div>
        <div class="qr-label">📱 Отсканируйте QR-код</div>
        <div id="qrcode"></div>
        <p class="info-text" style="text-align: center;">Используйте Google Authenticator или другой TOTP-аутентификатор</p>
      </div>
      
      <div>
        <div class="qr-label">🔑 Или введите ключ вручную</div>
        <div class="key-box" id="secretKey">${data.secretKey}</div>
        <button class="copy-btn" onclick="copyKey()">📋 Скопировать ключ</button>
        <p class="info-text" style="margin-top: 1rem;">Выберите "Ввести ключ вручную" в приложении</p>
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
  </div>`;
  
  return renderLayout(content, { styles, scripts });
}
