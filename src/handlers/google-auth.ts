export async function googleAuthenticatorHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response("Ошибка: параметр token не передан", { 
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Делаем запрос к API
    const apiUrl = `https://api-test.free2ex.com/v3/Identity/GoogleAuthenticator?sendNotification=false&token=${encodeURIComponent(token)}`;
    
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return new Response(`Ошибка API: ${response.status}`, { 
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const data = await response.json() as { key?: string; uri?: string };

    if (!data.key) {
      return new Response("Не удалось получить ключ", { 
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
      margin: 0;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      font-family: 'Inter', sans-serif;
      color: white;
      overflow: hidden;
    }

    .container {
      text-align: center;
      max-width: 600px;
      padding: 2rem;
      z-index: 2;
    }

    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 3.8rem;
      margin: 0 0 1.5rem 0;
      background: linear-gradient(90deg, #22d3ee, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .key-box {
      background: rgba(255,255,255,0.08);
      border: 2px solid rgba(167, 139, 250, 0.5);
      border-radius: 16px;
      padding: 1.5rem 2rem;
      font-size: 1.6rem;
      font-weight: 600;
      letter-spacing: 4px;
      margin: 2rem 0;
      word-break: break-all;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    }

    p {
      font-size: 1.25rem;
      opacity: 0.9;
      line-height: 1.6;
    }

    .glow {
      position: absolute;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.3) 0%, transparent 70%);
      filter: blur(90px);
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="glow" style="top: 10%; left: 10%;"></div>
  <div class="glow" style="bottom: 10%; right: 10%;"></div>

  <div class="container">
    <h1>Google Authenticator</h1>
    <p>Ваш секретный ключ:</p>
    <div class="key-box">${data.key}</div>
    <p>Добавьте этот ключ в приложение Google Authenticator</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error) {
    console.error(error);
    return new Response("Внутренняя ошибка сервера", { 
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}
