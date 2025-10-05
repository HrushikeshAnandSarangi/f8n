# 1. Use a more specific and stable base image
FROM python:3.11.9-slim

# 2. Set environment variables for better Python performance
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Create a non-root directory for the application
WORKDIR /app

# 4. Copy and install dependencies
COPY requirements.txt ./
# Force pip to use the official index to avoid repository issues
RUN pip install --no-cache-dir --index-url https://pypi.org/simple/ -r requirements.txt

# 5. Copy the rest of the application code
COPY . .

# 6. Expose the port Gunicorn will run on
EXPOSE 8000

# 7. Use Gunicorn to run the app instead of the development server
#    Replace 'f8n.wsgi' with your actual Django project's WSGI file path.
CMD ["python","manage.py","runserver","0.0.0.0:8000"]