FROM node:slim

COPY . .

RUN npm install yarn -g

RUN yarn

RUN yarn danger ci

ENTRYPOINT ["node", "/lib/main.js"]