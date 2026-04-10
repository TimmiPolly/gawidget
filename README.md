```markdown
# Google Authenticator 2FA Setup

Cloudflare Worker для настройки двухфакторной аутентификации через Google Authenticator.

## Установка

```bash
git clone https://github.com/username/google-authenticator-worker
cd google-authenticator-worker
npm install
```

## Конфигурация

Создайте KV namespace для логирования (опционально):

```bash
wrangler kv:namespace create "MY_KV"
```

Пропишите ID в `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "MY_KV"
id = "your-namespace-id"
```

## Команды

```bash
npm run dev      # Локальный запуск
npm run deploy   # Деплой в Cloudflare
npm run tail     # Просмотр логов
```

## API

### GET /GoogleAuthenticator

Получение страницы настройки 2FA.

| Параметр | Тип | Описание |
|----------|-----|----------|
| token | string | Токен инициализации |

**Пример:** `/GoogleAuthenticator?token=IISL7Btnv8lnzWyY...`

**Ответ:** HTML страница с QR-кодом и формой ввода.

---

### POST /enable-2fa

Активация 2FA.

| Поле | Тип | Описание |
|------|-----|----------|
| code | string | 6-значный код из приложения |
| token | string | Токен инициализации |

**Запрос:**
```json
{
  "code": "123456",
  "token": "IISL7Btnv8lnzWyY..."
}
```

**Ответ (200):**
```json
{
  "success": true,
  "message": "2FA успешно включена!"
}
```

**Ответ (400):**
```json
{
  "success": false,
  "error": "Неверный код"
}
```

## Структура

```
src/
├── index.ts
├── router.ts
├── handlers/
│   ├── google-authenticator.ts
│   └── enable-2fa.ts
├── templates/
│   ├── layout.ts
│   ├── setup-page.ts
│   └── debug-page.ts
├── services/
│   └── google-auth-api.ts
└── utils/
    └── token-utils.ts
```

## Переменные окружения

| Переменная | Описание | Обязательно |
|------------|----------|-------------|
| MY_KV | KV namespace для логов | Нет |

## Технологии

- Cloudflare Workers
- TypeScript
- QRCode.js

## Лицензия

MIT
```
