FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000 DATABASE_PATH=/data/heart-memories.sqlite
COPY server ./server
COPY --from=build /app/dist ./dist
EXPOSE 3000
VOLUME ["/data"]
CMD ["node", "server/index.mjs"]
