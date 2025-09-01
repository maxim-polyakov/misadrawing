FROM node:22.15.0

COPY package*.json .
COPY yarn.lock .

RUN yarn --frozen-lockfile

COPY . .

RUN yarn build

CMD ["yarn", "start:prod"]
