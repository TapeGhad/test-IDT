# 1. Build the widget bundles (type-check included)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Serve the demo page next to the standalone Web Component bundle
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY demo/ /usr/share/nginx/html/
COPY --from=build /app/dist/wc/ /usr/share/nginx/html/
