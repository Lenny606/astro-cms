#!/bin/bash
set -e

# Usage: ./deploy_frontend.sh [API_URL]
# Example: ./deploy_frontend.sh http://api.example.com

# Default API URL
PUBLIC_API_URL=${PUBLIC_API_URL:-http://localhost:8000}

# Override with first argument if provided
if [ -n "$1" ]; then
    PUBLIC_API_URL="$1"
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed or not in PATH."
    exit 1
fi

echo "Deploying Frontend with API URL: $PUBLIC_API_URL"

# Build the image
echo "Building Docker image..."
# Build from the root directory context
docker build \
  --build-arg PUBLIC_API_URL="$PUBLIC_API_URL" \
  -f infrastructure/astro/Dockerfile \
  -t astro-frontend .

# Stop and remove existing container if it exists
if [ "$(docker ps -aq -f name=astro-frontend-container)" ]; then
    echo "Stopping and removing existing container..."
    docker stop astro-frontend-container 2>/dev/null || true
    docker rm astro-frontend-container 2>/dev/null || true
fi

# Run the new container
echo "Starting new container..."
docker run -d \
  -p 4321:4321 \
  --name astro-frontend-container \
  astro-frontend

echo "Frontend deployed successfully at http://localhost:4321"
