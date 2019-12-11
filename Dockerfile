FROM node:slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app/
RUN npm install yarn -g
RUN yarn install 

ENTRYPOINT ["danger", "ci", "--dangerfile", "./dangerfile.ts"]

FROM node:slim

WORKDIR /beacon/workflows

RUN npm install -g yarn

ADD . /beacon/workflows

RUN yarn install && yarn cache clean

ENTRYPOINT cd /beacon/workflows && yarn danger ci