# Use an official Node runtime as the base image
FROM node:21.6.2 AS builder

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json to the container
COPY package*.json ./
COPY prisma ./prisma

# Install the dependencies
RUN npm install
RUN npx prisma generate

COPY . .

RUN npm run build

FROM node:21.6.2

RUN apt-get update && apt-get install -y \
    iputils-ping \
    curl \
    wget \
    vim \
    nano \
    sudo \
    && rm -rf /var/lib/apt/lists/*
    
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/public ./public

RUN npm install --production

EXPOSE 6000

# Set the entrypoint script
CMD ["node", "dist/main.js"]                                                               