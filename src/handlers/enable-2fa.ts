export async function enable2FAHandler(request: Request): Promise<Response> {
  try {
    const body = await request.json() as { code: string; token: string };
    const { code, token } = body;
    
    console.log('Enable 2FA request received');
    console.log('Code length:', code?.length);
    console.log('Token exists:', !!token);
    
    // Валидация
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Код должен содержать 6 цифр'
      }), {
        status: 400,
        headers: corsHeaders()
      });
    }
    
    if (!token) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Токен не передан'
      }), {
        status: 400,
        headers: corsHeaders()
      });
    }
    
    // Запрос к API партнера
    const apiUrl = 'https://api-test.free2ex.com/v3/Identity/GoogleAuthenticator/Enable';
    
    const requestBody = {
      isEnableClientFactor: true,
      value: token,
      code: code,
      state: ""
    };
    
    console.log('Sending request to partner API...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Cloudflare-Worker/1.0'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Partner API response status:', response.status);
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }
    
    if (response.status === 200) {
      console.log('2FA enabled successfully');
      return new Response(JSON.stringify({
        success: true,
        message: '2FA успешно включена!'
      }), {
        status: 200,
        headers: corsHeaders()
      });
    } else {
      console.error('Partner API error:', responseData);
      return new Response(JSON.stringify({
        success: false,
        error: responseData.error?.message || responseData.message || 'Ошибка активации 2FA',
        details: responseData
      }), {
        status: response.status,
        headers: corsHeaders()
      });
    }
    
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Внутренняя ошибка сервера'
    }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

function corsHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
