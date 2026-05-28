# ======== Build stage ========
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# test mode
# ARG NODE_ENV=dev

# env setting
# ENV NODE_ENV=${NODE_ENV}

# RUN yarn test

# production mode
ARG NODE_ENV=production

# env setting
ENV NODE_ENV=${NODE_ENV}

ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build the NestJS app
RUN yarn build

# ======== Production stage ========
FROM node:20-alpine

WORKDIR /app

# Copy only package files for production
COPY package.json yarn.lock ./

# Install production dependencies
RUN yarn install --frozen-lockfile --production

# Install Postgres client so pg_isready is available
RUN apk add --no-cache postgresql-client

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 8080

ENV NODE_OPTIONS=""

# Start the app
CMD ["node", "dist/main.js"]