# Gunicorn configuration file para Estudia Pro Backend
# https://docs.gunicorn.org/en/stable/settings.html

import multiprocessing

bind = "127.0.0.1:8000"

workers = 2
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 5

accesslog = "/home/ubuntu/estudia-pro/logs/gunicorn_access.log"
errorlog = "/home/ubuntu/estudia-pro/logs/gunicorn_error.log"
loglevel = "info"
capture_output = True

proc_name = "estudiapro"

daemon = False
pidfile = "/home/ubuntu/estudia-pro/gunicorn.pid"
user = "ubuntu"
group = "ubuntu"

raw_env = [
    "DJANGO_SETTINGS_MODULE=estudiapro.settings",
]

graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 100


preload_app = True
