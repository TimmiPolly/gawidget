export interface LayoutOptions {
  title?: string;
  styles?: string;
  scripts?: string;
}

export function renderLayout(content: string, options: LayoutOptions = {}): string {
  const title = options.title || 'Google Authenticator';
  const styles = options.styles || '';
  const scripts = options.scripts || '';
  
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600&display=swap" rel="stylesheet">
  ${styles}
</head>
<body>
  ${content}
  ${scripts}
</body>
</html>`;
}
