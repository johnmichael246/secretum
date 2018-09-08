import os
import json

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
from boto3.session import Session

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_contents(*args):
    with open(os.path.join(BASE_DIR, *args), 'r') as file:
        return '\n'.join(file.readlines())


# Core settings
APP_ENV = os.getenv('APP_ENV')
DEBUG = os.getenv('DEBUG')
SECRET_KEY = os.getenv('SECRET_KEY', 'this-is-a-public-secret')
ROOT_URLCONF = 'devsite.urls'
ALLOWED_HOSTS = ['*']

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
STATICFILES_DIRS = ['./dist']
APPEND_SLASH = True

# Secretum-specific settings
IDB_NAME = 'secretum_master'
VERSION = json.loads(get_contents('package.json'))['version']

# Database backend used by the service
# Defaults match the docker image of postgres
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': os.getenv('DB_HOST', 'db'),
        'PORT': os.getenv('DB_PORT', 5432),
        'NAME': os.getenv('DB_SCHEMA', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', '')
    }
}

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'service.app.ServiceConfig',
    'webapp.app.WebappConfig'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'service.middleware.RequireBasicAuthentication'
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

AWS_REGION = os.getenv('AWS_REGION')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

LOGGING_HANDLERS = {
    'file': {
        'class': 'logging.FileHandler',
        'filename': os.path.join(BASE_DIR, 'log', 'django.log'),
        'formatter': 'verbose',
    }
}

if DEBUG:
    LOGGING_HANDLERS['console'] = {
        'class': 'logging.StreamHandler',
        'formatter': 'verbose'
    }

if AWS_REGION is not None:
    boto3_session = Session(
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION
    )

    LOGGING_HANDLERS['cloudwatch'] = {
        'level': 'DEBUG',
        'class': 'watchtower.CloudWatchLogHandler',
        'boto3_session': boto3_session,
        'log_group': 'secretum',
        'stream_name': APP_ENV,
        'formatter': 'verbose',
    }

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': LOGGING_HANDLERS,
    'formatters': {
        'verbose': {
            'format': '%(asctime)s %(levelname)s %(module)s %(message)s'
        }
    },
    'loggers': {
        'django': {
            'handlers': list(LOGGING_HANDLERS.keys()),
            'level': 'DEBUG' if DEBUG is True else 'INFO'
        },
        'secretum': {
            'handlers': list(LOGGING_HANDLERS.keys()),
            'level': 'DEBUG' if DEBUG is True else 'INFO'
        },
    },

}

WSGI_APPLICATION = 'devsite.wsgi.application'

AUTH_PASSWORD_VALIDATORS = []

if not DEBUG:
    AUTH_PASSWORD_VALIDATORS = [
        {
            'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
        },
        {
            'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
        },
    ]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True
