
FROM node:18-alpine

WORKDIR /app


COPY package*.json ./
COPY prisma ./prisma/

RUN npm install
RUN npx prisma generate

COPY . .

RUN rm -rf dist && npm run build

EXPOSE 5000


CMD ["node", "dist/server.js"]