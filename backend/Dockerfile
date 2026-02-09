# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Command to run the application
# We use uvicorn with 0.0.0.0 to allow external traffic
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
