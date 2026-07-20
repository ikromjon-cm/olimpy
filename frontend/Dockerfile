FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY .env.docker ./.env
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/.env.docker ./.env
EXPOSE 3001
CMD ["npx", "next", "start", "-p", "3001"]
