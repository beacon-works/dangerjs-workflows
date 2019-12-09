FROM node:12-slim

LABEL maintainer="Beacon Works"
LABEL "com.github.actions.name"="Beacon Works"
LABEL "com.github.actions.description"="Runs Danger JS action configured for Beacon Works"
LABEL "com.github.actions.icon"="zap"
LABEL "com.github.actions.color"="blue"

RUN apt-get update \
    apy-get upgrade -y \
    apt-get install -y git
RUN mkdir -p /usr/src/danger
RUN git clone https://github.com/danger/danger-js.git
COPY ./danger-js /usr/src/danger
RUN cd /usr/src/danger && \
    yarn && \
    yarn run build:fast && \
    chmod +x distribution/commands/danger.js && \
    ln -s $(pwd)/distribution/commands/danger.js /usr/bin/danger

ENTRYPOINT ["danger", "ci"]