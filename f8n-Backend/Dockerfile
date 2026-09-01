# Use Python 3.11 slim image
FROM python:3.11.9-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV FLASK_APP=wsgi:app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Upgrade pip, setuptools, and wheel
RUN pip install --upgrade pip setuptools wheel

# Copy requirements file
COPY requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Platform-agnostic: honors whatever $PORT the host injects (Render/Railway/Fly all do this),
# defaults to 8000 for local/docker-compose use.
ENV PORT=8000
EXPOSE 8000

# Flask-SocketIO needs an async worker; eventlet is the simplest fit for gunicorn.
CMD exec gunicorn --worker-class eventlet -w 1 --timeout 120 --bind 0.0.0.0:${PORT} wsgi:app
