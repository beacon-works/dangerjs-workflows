FROM node:slim

COPY . .

RUN npm install yarn -g

RUN yarn

ENTRYPOINT ["node", "/lib/main.js"]