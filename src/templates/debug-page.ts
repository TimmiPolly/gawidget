import { renderLayout } from './layout';

export function renderDebugPage(info: any, isError: boolean): string {
  const styles = `
  <style>
    body { 
      font-family: 'Courier New', monospace; 
      background: #1a1a2e; 
      color: #fff; 
      padding: 20px; 
      line-height: 1.5;
      margin: 0;
    }
    h1 { color: ${isError ? '#ff6b6b' : '#4ade80'}; }
    pre { 
      background: #16213e; 
      padding: 20px; 
      border-radius: 8px; 
      overflow: auto;
      border: 1px solid #2a3a5e;
    }
    .back-link { 
      display: inline-block; 
      margin-top: 20px; 
      color: #a78bfa; 
      text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }
  </style>`;
  
  const content = `
  <h1>${isError ? '❌ Ошибка' : '🐛 Debug Info'}</h1>
  <pre>${JSON.stringify(info, null, 2)}</pre>
  <a href="/" class="back-link">← На главную</a>`;
  
  return renderLayout(content, { styles, title: isError ? 'Ошибка' : 'Debug' });
}
