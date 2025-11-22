FROM node:18-alpine as BUILD

WORKDIR /app

COPY package*.json .

RUN npm install

FROM node:18-alpine as PROD 

WORKDIR /app
COPY --from=BUILD /app/node_modules /app/node_modules
COPY server.js .

EXPOSE 3001

CMD ["node","server.js"]
