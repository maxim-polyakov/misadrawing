# Misa's drawings (Misadrawing)

Веб-галерея рисунков: React-клиент, Node.js API, PostgreSQL (Neon), загрузка файлов в Yandex Object Storage (S3), авторизация по email/паролю и через Google OAuth.

## Структура проекта

| Каталог   | Описание |
|----------|----------|
| `client` | React (Create React App), MobX, React Router |
| `server` | Express, Drizzle ORM, Passport (Google), S3 SDK |

## Требования

- Node.js 18+
- PostgreSQL (рекомендуется [Neon](https://neon.tech/) или аналог)
- Бакет в [Yandex Object Storage](https://cloud.yandex.ru/docs/storage/) (для картинок)

## Локальный запуск

### Сервер

```bash
cd server
# создайте server/.env (DATABASE_URL, SECRET_KEY, при необходимости S3 и Google OAuth)
npm install
npm run db:migrate     # применить миграции БД
npm run dev            # разработка
# или
npm start              # продакшен (tsx index.js)
```

Сервер по умолчанию: `http://localhost:5000`

### Клиент

```bash
cd client
npm install
# создайте .env с REACT_APP_API_URL=http://localhost:5000
npm start
```

Клиент: `http://localhost:3000`

## Переменные окружения

### `server/.env`

- `PORT` — порт API (по умолчанию 5000)
- `DATABASE_URL` — строка подключения к PostgreSQL
- `SECRET_KEY` — секрет для JWT
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `CLIENT_URL`, `API_URL`
- S3: `S3__Bucket`, `S3__ServiceUrl`, `S3__AccessKeyId`, `S3__SecretAccessKey`, `S3__PublicBaseUrl`, `S3__BackgroundUrl`

Подробнее: [server/S3_SETUP.md](server/S3_SETUP.md), [server/GOOGLE_AUTH.md](server/GOOGLE_AUTH.md).

### `client/.env`

- `REACT_APP_API_URL` — базовый URL API (например `https://ваш-домен` или `http://localhost:5000`)

## Docker

Из корня репозитория:

```bash
docker compose up -d --build
```

- API: порт `5000`
- Клиент (статика после сборки): порт `3000`

Заполните `server/.env` и `client/.env` перед сборкой/запуском.

## Администратор

Роль `ADMIN` в таблице `users` даёт доступ к загрузке картинок и фона, удалению из галереи. Назначение вручную в БД:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'ваш@email.com';
```

## Полезные команды (server)

| Команда | Назначение |
|---------|------------|
| `npm run db:generate` | сгенерировать миграции Drizzle после изменения схемы |
| `npm run db:migrate` | применить миграции |

## Nginx / загрузки

Для больших файлов на продакшене в nginx задайте минимум `client_max_body_size 50m` и увеличьте таймауты прокси. Пример: [nginx-upload.conf.example](nginx-upload.conf.example).

## Лицензия

Тот же тип, что указан в `package.json` проектов (см. `client` / `server`).
