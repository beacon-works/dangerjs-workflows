FROM node:slim

WORKDIR /beacon/workflows

RUN npm install -g yarn

ADD . /beacon/workflows

RUN yarn install && yarn cache clean

ENTRYPOINT [ "sh", "-c", "yarn danger ci" ]  

# ENTRYPOINT ["/beacon/workflows/entrypoint.sh"]