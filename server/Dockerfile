FROM node:24-alpine

WORKDIR /app

# Ставим только production-зависимости и чистим кэш yarn,
# чтобы образ был меньше и быстрее импортировался в k3s
COPY package*.json .
COPY yarn.lock .

RUN yarn --frozen-lockfile --production && yarn cache clean

COPY . .

CMD ["yarn", "start"]
