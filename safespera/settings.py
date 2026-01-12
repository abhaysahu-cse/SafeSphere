# safespera/settings.py
"""
Django settings for safespera project — production-ready defaults.

Environment variables used:
- DJANGO_SECRET_KEY (recommended)
- DJANGO_DEBUG (True/False)
- DJANGO_ALLOWED_HOSTS (comma-separated)
- DATABASE_URL (optional; if not set, uses local sqlite)
"""

from pathlib import Path
import os
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-q@to37sgiwh-8m$i#fj+17q36_jmyi-^q*w8#6&)!1bez^sn-+"  # fallback, keep local dev safe
)
DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")

# Allowed hosts from env (comma separated) or fallback to localhost during dev
_allowed = os.environ.get("DJANGO_ALLOWED_HOSTS", "*")
if _allowed.strip() == "" or _allowed == "*":
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [h.strip() for h in _allowed.split(",") if h.strip()]



# Application definition
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "safe",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",   # <-- add here (first after SecurityMiddleware)
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "safespera.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        # add a top-level templates dir if you decide to use it
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "safespera.wsgi.application"

# DATABASE: use DATABASE_URL if present, otherwise default to local sqlite3
if os.environ.get("DATABASE_URL"):
    DATABASES = {
        "default": dj_database_url.parse(os.environ.get("DATABASE_URL"), conn_max_age=600)
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# Static & media (keep your current config — ensure staticfiles works)
STATIC_URL = "/static/"
STATICFILES_DIRS = [os.path.join(BASE_DIR, "public/static")]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# WhiteNoise: compressed static files (safe & simple)
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"

# Media (if you use file uploads; keep in repo layout)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "public/static")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Security / proxy settings (useful on many hosts)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
