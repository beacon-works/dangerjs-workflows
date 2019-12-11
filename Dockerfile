FROM node:slim

WORKDIR /beacon/workflows

RUN npm install -g yarn

ADD . /beacon/workflows

RUN yarn install && yarn cache clean

RUN echo "$1 ---"
RUN echo "$dangerfile ---"

ENTRYPOINT echo Hello $1