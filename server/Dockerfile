FROM node:24-alpine

WORKDIR /app

COPY package*.json .
COPY yarn.lock .

RUN yarn --frozen-lockfile

COPY . .

CMD ["yarn", "start"]
