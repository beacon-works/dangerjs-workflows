FROM node:slim

WORKDIR /beacon/workflows

COPY . /beacon/workflows
# RUN yarn install && yarn cache clean

# ENTRYPOINT cd /beacon/workflows && yarn danger ci --dangerfile ${INPUT_DANGERFILE}

ENTRYPOINT ["cd", "/beacon/workflows", "/entrypoint.sh"]