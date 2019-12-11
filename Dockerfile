FROM node:10-slim

COPY . .

ENTRYPOINT ["npx", "--package", "danger@beta", "--package","typescript", "--package", "@babel/cli", "danger", "ci"]
