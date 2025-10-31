FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .
RUN npm run generate

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

