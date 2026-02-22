# Build Stage
FROM node:20-slim AS build
WORKDIR /app

# Copy package files (from frontend directory)
COPY frontend/package*.json ./

# Install all dependencies
RUN npm install

# Copy the rest of the frontend source code
COPY frontend/ ./

# Accept build arguments
ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL

# Build the project
RUN npm run build

# Runtime Stage
FROM node:20-slim AS runtime
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Copy only the necessary files for production (from the build stage)
# Astro with Node adapter usually places results in dist/
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 4321

# Start the server
# By default, Astro's Node adapter uses dist/server/entry.mjs
CMD ["node", "./dist/server/entry.mjs"]
