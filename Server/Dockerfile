FROM node:24-bookworm-slim

WORKDIR /app

# Install OpenSSL for Prisma compatibility
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definitions and Prisma files required by the postinstall script
COPY package*.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./prisma7.config.ts

# Install dependencies and generate Prisma client without real database credentials
RUN DATABASE_URL="postgresql://user:password@localhost:5432/devspace?schema=public" npm ci

# Copy the remaining backend source files
COPY . .

# Set production environment
ENV NODE_ENV=production

# Backend port
EXPOSE 5000

# Start the API, applying pending migrations first
CMD ["npm", "start"]
