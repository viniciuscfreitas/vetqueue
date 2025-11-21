# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build arguments for URLs
ARG VITE_API_URL
ARG VITE_SITE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SITE_URL=$VITE_SITE_URL

# Build the app
RUN npm run build

# Install serve to run the static application
RUN npm install -g serve

# Expose port
EXPOSE 5173

# Start the app using serve
CMD ["serve", "-s", "dist", "-l", "5173"]
