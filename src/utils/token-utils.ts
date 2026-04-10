export function extractTokenFromUrl(url: string): string | null {
  const queryString = url.split('?')[1] || '';
  const tokenMatch = queryString.match(/token=([^&]*)/);
  return tokenMatch ? tokenMatch[1] : null;
}

export function decodeToken(rawToken: string): string {
  return decodeURIComponent(rawToken);
}

export function validateToken(token: string | null): { valid: boolean; error?: string; decoded?: string } {
  if (!token) {
    return { valid: false, error: 'Токен не передан' };
  }
  
  try {
    const decoded = decodeToken(token);
    
    if (decoded.length < 10) {
      return { valid: false, error: 'Токен слишком короткий' };
    }
    
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, error: 'Неверный формат токена' };
  }
}

export function generateOtpAuthUrl(secretKey: string, issuer: string = 'Free2EX', account: string = ''): string {
  const label = account ? `${issuer}:${account}` : issuer;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${secretKey}&issuer=${encodeURIComponent(issuer)}`;
}
