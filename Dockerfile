FROM node:slim

COPY . /

# RUN yarn install && yarn cache clean

# ENTRYPOINT cd /beacon/workflows && yarn danger ci --dangerfile ${INPUT_DANGERFILE}

ENTRYPOINT ["/entrypoint.sh"]