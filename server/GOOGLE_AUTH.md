# Настройка Google OAuth

## Ссылка для Google Cloud Console

**Authorized redirect URI** (укажите в [Google Cloud Console](https://console.cloud.google.com/apis/credentials)):

- **Production:** `https://gallery.baxic.ru/api/user/auth/google/callback`
- **Local:** `http://localhost:5000/api/user/auth/google/callback`

## Переменные окружения (.env)

```env
GOOGLE_CLIENT_ID=ваш_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш_client_secret
GOOGLE_CALLBACK_URL=https://gallery.baxic.ru/api/user/auth/google/callback
CLIENT_URL=https://ваш-клиент-домен
API_URL=https://gallery.baxic.ru
```

- `CLIENT_URL` — URL фронтенда (куда редиректить после успешного входа)
- `API_URL` — URL бэкенда (для callback, если не задан `GOOGLE_CALLBACK_URL`)
