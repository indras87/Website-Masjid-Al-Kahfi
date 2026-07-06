# Frontend Dockerfile - Development Optimized
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Install dependencies
RUN npm ci
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Run in development mode (hot reload enabled)
CMD ["npm", "run", "dev"]
