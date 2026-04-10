export async function helloHandler(): Promise<Response> {
  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello from Worker</title>
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
      z-index: 2;
    }

    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 5.5rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      background: linear-gradient(90deg, #a78bfa, #ec4899, #f43f5e);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      text-shadow: 0 10px 30px rgba(167, 139, 250, 0.3);
      animation: float 3s ease-in-out infinite;
    }

    p {
      font-size: 1.4rem;
      margin: 0 0 2rem 0;
      opacity: 0.85;
    }

    .glow {
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, transparent 70%);
      filter: blur(80px);
      animation: pulse 8s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
  <div class="glow" style="top: 20%; left: 20%;"></div>
  <div class="glow" style="bottom: 20%; right: 20%;"></div>

  <div class="container">
    <h1>Hello!</h1>
    <p>Твой Cloudflare Worker работает красиво ✨</p>
    <a href="/" style="display: inline-block; margin-top: 1rem; padding: 14px 32px; background: rgba(255,255,255,0.1); color: white; text-decoration: none; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.2);">На главную</a>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
