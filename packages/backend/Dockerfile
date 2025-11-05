FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run generate

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

