FROM node:slim

WORKDIR /beacon/workflows

RUN npm install -g yarn

ADD . /beacon/workflows

RUN yarn install && yarn cache clean

RUN cd /beacon/workflows

ENTRYPOINT ["/entrypoint.sh"]