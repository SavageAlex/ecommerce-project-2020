'''Use this for development'''

from .base import *

ALLOWED_HOSTS += ['127.0.0.1']
DEBUG = True

WSGI_APPLICATION = 'home.wsgi.dev.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DATABSE_NAME'),
        'USER': config('DATABASE_USER'),
        'PASSWORD': config('DATABASE_PASSWORD'),
        'HOST': config('DATABASE_HOST'),
        'PORT': config('DATABASE_PORT'),
    }
}

CORS_ORIGIN_WHITELIST = (
    'http://localhost:3000',
)

# Stripe

STIPE_PUBLIC_KEY = config('STRIPE_TEST_PUBLIC_KEY')
STIPE_SECRET_KEY = config('STRIPE_TEST_SECRET_KEY')
