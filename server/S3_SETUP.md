# Yandex Object Storage (S3)

## Переменные окружения

Добавьте в `.env`:

```
S3__Bucket=ваш_бакет
S3__ServiceUrl=https://storage.yandexcloud.net
S3__AccessKeyId=ваш_access_key
S3__SecretAccessKey=ваш_secret_key
S3__PublicBaseUrl=https://storage.yandexcloud.net/ваш_бакет
S3__BackgroundUrl=https://storage.yandexcloud.net/ваш_бакет/background.jpg
```

Фоновая картинка загружается из `S3__BackgroundUrl`. Загрузите файл `background.jpg` в корень бакета.

## Лимиты загрузки

- Максимальный размер файла: **50 МБ**
- Таймаут загрузки: 2 минуты
- Форматы: JPEG, PNG, GIF, WebP

При превышении лимита сервер вернёт ошибку «Размер файла превышает 50 МБ».

## ERR_NETWORK при загрузке

Если видите «NetworkError: запрос не дошёл до сервера» — чаще всего мешает **nginx**.

### Nginx: client_max_body_size

По умолчанию nginx ограничивает тело запроса **1 МБ**. Для загрузки картинок до 50 МБ добавьте в конфиг:

```nginx
server {
    listen 80;
    server_name gallery.baxic.ru;
    
    client_max_body_size 50m;
    proxy_read_timeout 120s;
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;

    location / {
        proxy_pass http://127.0.0.1:5000;  # или адрес вашего Node-сервера
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Проверка и перезагрузка:
```bash
nginx -t && nginx -s reload
```

### Другие причины ERR_NETWORK

- **CORS** — проверьте, что nginx не режет заголовки и сервер отвечает на OPTIONS
- **Прокси/балансировщик** — аналогичные лимиты на размер тела запроса
- **Сервер недоступен** — проверьте, что `https://gallery.baxic.ru` открывается и API отвечает

## Админ-панель

Загрузка картинок и фона доступна только пользователям с ролью `ADMIN`. Чтобы назначить админа, обновите роль в БД:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'ваш@email.com';
```

## Публичный доступ к бакету

Чтобы картинки были доступны по URL, настройте публичный доступ в Yandex Cloud Console:

1. Object Storage → бакет `canban` → Настройки
2. Включите публичный доступ на чтение для бакета

Или через ACL: установите `public-read` для объектов при загрузке.
