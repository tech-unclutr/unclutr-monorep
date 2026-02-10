# Use official Python image (Full version to avoid missing shared libs for AI/GRPC)
FROM python:3.10

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
# Command to run the application
# Use shell form to expand PORT variable, but exec uvicorn to receive signals
# Copy startup script explicitly and make executable
COPY scripts/start_prod.sh /app/scripts/start_prod.sh
RUN chmod +x /app/scripts/start_prod.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health').read()" || exit 1

# Use list syntax for CMD to avoid shell wrapping
CMD ["/app/scripts/start_prod.sh"]
