export interface GoogleAuthApiResponse {
  key?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface Enable2FAResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export class GoogleAuthApiService {
  private readonly baseUrl = 'https://api-test.free2ex.com/v3/Identity';
  
  async getSecretKey(token: string): Promise<{ success: boolean; key?: string; error?: string; status?: number }> {
    try {
      const apiUrl = `${this.baseUrl}/GoogleAuthenticator?sendNotification=false&token=${encodeURIComponent(token)}`;
      
      console.log('=== ЗАПРОС К API ===');
      console.log('Token length:', token.length);
      console.log('URL:', apiUrl);
      console.log('=====================');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Cloudflare-Worker/1.0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка API:', errorText);
        
        let errorMessage = 'Ошибка получения ключа';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // Используем дефолтное сообщение
        }
        
        return {
          success: false,
          error: errorMessage,
          status: response.status
        };
      }
      
      const data = await response.json() as GoogleAuthApiResponse;
      
      return {
        success: true,
        key: data.key,
        status: response.status
      };
      
    } catch (error: any) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error.message || 'Ошибка соединения'
      };
    }
  }
  
  async enable2FA(token: string, code: string): Promise<Enable2FAResponse> {
    try {
      const apiUrl = `${this.baseUrl}/GoogleAuthenticator/Enable`;
      
      const requestBody = {
        isEnableClientFactor: true,
        value: token,
        code: code,
        state: ''
      };
      
      console.log('Sending enable 2FA request to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Cloudflare-Worker/1.0'
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
      
      if (response.status === 200) {
        return {
          success: true,
          message: '2FA успешно включена!'
        };
      } else {
        return {
          success: false,
          error: responseData.error?.message || responseData.message || 'Ошибка активации 2FA'
        };
      }
      
    } catch (error: any) {
      console.error('Enable 2FA error:', error);
      return {
        success: false,
        error: error.message || 'Ошибка соединения'
      };
    }
  }
}

export const googleAuthApi = new GoogleAuthApiService();
