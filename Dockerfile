FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --only=production
RUN npm install -g tsx

COPY . .

RUN npm run build
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "dist/main"]
