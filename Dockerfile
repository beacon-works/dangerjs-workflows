FROM node:slim

COPY . .

ENTRYPOINT ["/entrypoint.sh]