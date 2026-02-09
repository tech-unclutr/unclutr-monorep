import multiprocessing
import os

# Gunicorn configuration file
# https://docs.gunicorn.org/en/stable/configure.html

bind = "0.0.0.0:8000"

# Workers
# Adjust based on available CPU cores. For I/O bound apps (like this one), 
# 2-4 workers per core is often a good starting point.
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"

# Threads
threads = 2

# Timeouts
# Increase timeout for long-running AI tasks if necessary
timeout = 120
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process Naming
proc_name = "squareup-backend"

# Environment
raw_env = [
    "ENVIRONMENT=production",
]
