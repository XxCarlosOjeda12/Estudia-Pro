# Gunicorn configuration file para Estudia Pro Backend
# https://docs.gunicorn.org/en/stable/settings.html

import multiprocessing

# Bind
bind = "127.0.0.1:8000"

# Workers - Para t3.micro (2 vCPU), usar 2-4 workers
workers = 2
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5

# Logging
accesslog = "/home/ubuntu/estudia-pro/logs/gunicorn_access.log"
errorlog = "/home/ubuntu/estudia-pro/logs/gunicorn_error.log"
loglevel = "info"
capture_output = True

# Process naming
proc_name = "estudiapro"

# Server mechanics
daemon = False
pidfile = "/home/ubuntu/estudia-pro/gunicorn.pid"
user = "ubuntu"
group = "ubuntu"

# Environment
raw_env = [
    "DJANGO_SETTINGS_MODULE=estudiapro.settings",
]

# Graceful restart
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 100

# Preloading
preload_app = True
