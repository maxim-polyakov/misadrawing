FROM node:24-alpine AS build

WORKDIR /app

# Копируем package.json, yarn.lock и ставим зависимости
COPY package*.json yarn.lock ./
RUN yarn --frozen-lockfile

# Копируем весь код и собираем production-версию
COPY . .
RUN yarn build

FROM node:24-alpine

WORKDIR /app

# В итоговый образ попадают собранная статика и небольшой HTTP-сервер,
# который подставляет локализованные Open Graph метаданные.
COPY --from=build /app/build ./build
COPY server.cjs ./server.cjs
COPY src/utils/galleryLanguagePack.json ./galleryLanguagePack.json

EXPOSE 3000

CMD ["node", "server.cjs"]
