# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
# nginx's own entrypoint runs envsubst on *.template files here at container
# start, writing the result to /etc/nginx/conf.d/ -- lets BACKEND_HOST/PORT
# vary per environment (docker-compose vs. Helm) without rebuilding the image.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=8000
EXPOSE 80
