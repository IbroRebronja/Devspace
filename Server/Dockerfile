
FROM node:24-bookworm-slim

WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy backend source files
COPY . .

# Generate Prisma client without requiring the real database credentials
RUN DATABASE_URL="postgresql://user:password@localhost:5432/devspace?schema=public" npx prisma generate

# Set production environment
ENV NODE_ENV=production

# Backend port
EXPOSE 5000

# Start the API
CMD ["npm", "start"]
