FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate && npx nest build

FROM node:20-bullseye-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN apt-get update -qq && apt-get install -y -qq curl ca-certificates --no-install-recommends && rm -rf /var/lib/apt/lists/* && mkdir -p /app/uploads
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1; node dist/prisma/seed.js 2>&1 || echo 'Seed skipped'; node dist/src/main.js"]
