FROM node:slim

COPY . .

RUN yarn global add danger

RUN yarn

ENTRYPOINT ["ls"]

# ENTRYPOINT ["danger --dangerfile ./dangerfile.ts", "ci"]