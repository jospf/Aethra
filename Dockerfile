# Stage 1: Build the frontend React app
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Serve using Python/FastAPI
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies (like curl for container health check)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ .

# Copy built frontend assets to the backend's dist folder
COPY --from=frontend-builder /app/frontend/dist ./dist

# Set production environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start Uvicorn without --reload for production stability
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
