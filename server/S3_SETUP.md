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
