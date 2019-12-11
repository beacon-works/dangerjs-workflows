FROM node:slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app/
RUN npm install yarn -g
RUN yarn install 

ENTRYPOINT ["danger", "ci", "--dangerfile", "./dangerfile.ts"]
