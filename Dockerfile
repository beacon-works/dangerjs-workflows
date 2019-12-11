FROM node:slim

WORKDIR /beacon/workflows

RUN npm install -g yarn

ADD . /beacon/workflows

RUN yarn install && yarn cache clean

ENTRYPOINT cd /beacon/workflows && entrypoint.sh