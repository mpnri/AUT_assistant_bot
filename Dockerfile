FROM node:20.9.0-alpine3.17

RUN yarn install
COPY . .

CMD [ "yarn", "start" ]
