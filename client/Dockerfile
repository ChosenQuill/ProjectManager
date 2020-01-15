FROM node:current-alpine as run-stage

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm","start"]