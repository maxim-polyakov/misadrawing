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

# Устанавливаем serve для отдачи статики
RUN yarn global add serve && yarn cache clean

# В итоговый образ попадает только собранная статика (без node_modules),
# чтобы образ был маленьким и быстро импортировался в k3s
COPY --from=build /app/build ./build

EXPOSE 3000

# Запуск production-бандла
CMD ["serve", "-s", "build", "-l", "3000"]
