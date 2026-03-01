FROM node:24-alpine

WORKDIR /app

# Копируем package.json, yarn.lock и ставим зависимости
COPY package*.json yarn.lock ./
RUN yarn --frozen-lockfile

# Копируем весь код и собираем production-версию
COPY . .
RUN yarn build

# Устанавливаем serve для отдачи статики
RUN yarn global add serve

EXPOSE 3000

# Запуск production-бандла
CMD ["serve", "-s", "build", "-l", "3000"]