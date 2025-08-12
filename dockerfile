FROM node:22.16.0-alpine3.22 AS base

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install all dependencies including dev dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
# Set environment variables for build
ENV NODE_ENV=development
ENV PORT=3333
ENV HOST=localhost
# Run build command directly with ace
RUN node ace build --ignore-ts-errors

# Production stage
FROM base
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3333
ENV HOST=0.0.0.0
# Copy production node_modules
COPY --from=deps /app/node_modules /app/node_modules
# Copy build output
COPY --from=build /app/build /app
# Copy .env file
COPY .env .env
EXPOSE 3333
CMD ["node", "bin/server.js"]
