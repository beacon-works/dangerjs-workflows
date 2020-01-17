FROM node:slim

WORKDIR /beacon/workflows

ADD . /beacon/workflows

RUN yarn install && yarn cache clean

ENTRYPOINT cd /beacon/workflows && yarn danger ci --dangerfile=wrongfile

# ENTRYPOINT ["/beacon/workflows/entrypoint.sh"]