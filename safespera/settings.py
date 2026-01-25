# safespera/safespera/settings.py
"""
Django settings for safespera project — production-ready defaults.

Environment variables used (recommended):
- DJANGO_SECRET_KEY (optional; fallback used if not set)
- DJANGO_DEBUG (True/False string)
- DJANGO_ALLOWED_HOSTS (comma-separated)
- USE_REMOTE_DB (set to "1" to enable DATABASE_URL usage)
- DATABASE_URL (optional; only used when USE_REMOTE_DB == "1")
"""

from pathlib import Path
import os
import dj_database_url
from django.utils.translation import gettext_lazy as _

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent

# --- Security ---
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-fallback-for-local-dev-only"  # keep local dev safe
)
DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("1", "true", "yes")

# Allowed hosts
_allowed = os.environ.get("DJANGO_ALLOWED_HOSTS", "*")
if _allowed.strip() == "" or _allowed == "*":
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [h.strip() for h in _allowed.split(",") if h.strip()]

# --- Application definition ---
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
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",  # required for i18n
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
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.template.context_processors.i18n",
                "django.template.context_processors.static",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "safespera.wsgi.application"

# --- DATABASES: Local-first (SQLite). Only use DATABASE_URL if USE_REMOTE_DB == "1" ---
# This makes local development reliable and prevents accidental MySQL connection attempts.
# USE_REMOTE_DB = os.environ.get("USE_REMOTE_DB", "0") == "1"
# DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

DATABASES = {
    'default': {
      'ENGINE': 'django.db.backends.mysql',
        'NAME': 'safeshpere',
        'USER': 'root',
        'PASSWORD': 'Aaryan@123',
        'HOST': '127.0.0.1',
        'PORT': '3306',
    }
}

# --- Password validation ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Internationalization ---
LANGUAGE_CODE = "en"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_L10N = True
USE_TZ = True

LANGUAGES = [
    ("en", _("English")),
    ("hi", _("हिन्दी")),
]

LOCALE_PATHS = [
    BASE_DIR / "locale",
]

# --- Static & Media ---
STATIC_URL = "/static/"
STATICFILES_DIRS = [os.path.join(BASE_DIR, "public/static")]
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "public/static")

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Security / proxy
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ---- End of settings.py ----
