FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads
EXPOSE 4000
CMD ["sh", "-c", "node src/models/migrate.js && node src/models/seed.js && node src/index.js"]
