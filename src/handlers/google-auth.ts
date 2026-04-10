export async function googleAuthenticatorHandler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Ошибка: token не передан", { 
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Формируем URL точно как в curl
    const apiUrl = `https://api-test.free2ex.com/v3/Identity/GoogleAuthenticator?sendNotification=false&token=${encodeURIComponent(token)}`;

    console.log("→ Запрос к API:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", // более «человеческий»
        "Cache-Control": "no-cache",
      },
    });

    console.log("← Статус от API:", response.status);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Ошибка API:", errorBody);
      return new Response(`API вернул ошибку ${response.status}: ${errorBody}`, { 
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const data = await response.json() as any;

    if (!data?.key) {
      return new Response("API не вернул ключ Google Authenticator", { 
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Красивая HTML-страница
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
    .container { text-align: center; max-width: 640px; padding: 2rem; }
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3.7rem; margin: 0 0 1rem 0;
      background: linear-gradient(90deg, #22d3ee, #a78bfa);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .key-box {
      background: rgba(255,255,255,0.08);
      border: 2px solid #a78bfa;
      border-radius: 16px;
      padding: 1.8rem 1rem;
      font-size: 1.55rem;
      letter-spacing: 4px;
      word-break: break-all;
      margin: 2rem 0;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    p { font-size: 1.22rem; opacity: 0.9; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Google Authenticator</h1>
    <p>Ваш секретный ключ:</p>
    <div class="key-box">${data.key}</div>
    <p>Скопируйте этот ключ и добавьте в приложение<br>Google Authenticator</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });

  } catch (err: any) {
    console.error("Ошибка:", err);
    return new Response("Внутренняя ошибка Worker: " + err.message, { 
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
