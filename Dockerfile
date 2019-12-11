FROM node:10-slim

COPY . .

ENTRYPOINT ["npx", "--package", "danger", "--package","typescript", "--package", "@babel/cli", "--package", "danger-plugin-spellcheck", "--package", "simple-spellchecker", "danger", "ci", "--dangerfile", "./dangerfile.ts"]
