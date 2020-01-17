FROM node:current-alpine as dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm","start"]

FROM dev-stage as build
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]