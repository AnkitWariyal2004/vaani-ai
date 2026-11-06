import os
import sys
from pathlib import Path

# Add backend directory to python sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django
django.setup()

# Ensure migrations exist on ephemeral serverless environment
from django.core.management import call_command
try:
    call_command("migrate", interactive=False)
except Exception as e:
    pass

from django.core.wsgi import get_wsgi_application
app = get_wsgi_application()
