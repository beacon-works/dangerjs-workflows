FROM node:12

COPY . .

ENTRYPOINT ["/entrypoint.sh"]