# 1. Use a more specific and stable base image
FROM python:3.11.9-slim

# 2. Set environment variables for better Python performance
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# 3. Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    git \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 4. Create a non-root directory for the application
WORKDIR /app

# 5. Upgrade pip first
RUN pip install --upgrade pip setuptools wheel

# 6. Copy and install dependencies
COPY requirements.txt ./

# 7. Install dependencies with verbose output
RUN pip install --no-cache-dir -r requirements.txt --verbose

# 8. Copy the rest of the application code
COPY . .

# 9. Expose the port
EXPOSE 8000

# 10. Run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]