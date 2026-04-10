export async function googleAuthenticatorHandler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Ошибка: token не передан", { status: 400 });
    }

    const apiUrl = `https://api-test.free2ex.com/v3/Identity/GoogleAuthenticator?sendNotification=false&token=${encodeURIComponent(token)}`;

    console.log("Запрос к API:", apiUrl); // для логов

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Cloudflare-Worker-GA/1.0",   // Добавили User-Agent
      },
    });

    console.log("Статус ответа API:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ошибка API:", errorText);
      
      return new Response(`Ошибка от API (${response.status}): ${errorText.substring(0, 200)}`, { 
        status: 502 
      });
    }

    const data = await response.json() as any;

    if (!data.key) {
      return new Response("API вернул ответ без ключа", { status: 500 });
    }

    // HTML страница (оставил красивую)
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Authenticator</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600&display=swap');
    body {
      margin: 0; height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      font-family: 'Inter', sans-serif; color: white;
    }
    .container { text-align: center; max-width: 620px; padding: 2rem; }
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3.6rem; margin: 0 0 1.5rem 0;
      background: linear-gradient(90deg, #22d3ee, #a78bfa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .key-box {
      background: rgba(255,255,255,0.08); border: 2px solid #a78bfa;
      border-radius: 16px; padding: 1.8rem; font-size: 1.65rem;
      letter-spacing: 5px; word-break: break-all; margin: 2rem 0;
    }
    p { font-size: 1.25rem; opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Google Authenticator</h1>
    <p>Ваш секретный ключ:</p>
    <div class="key-box">${data.key}</div>
    <p>Скопируйте этот ключ и добавьте в приложение Google Authenticator</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });

  } catch (err: any) {
    console.error("Ошибка в handler:", err.message);
    return new Response(`Внутренняя ошибка: ${err.message}`, { status: 500 });
  }
}
