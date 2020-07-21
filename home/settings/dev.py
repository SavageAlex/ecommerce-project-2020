'''Use this for development'''

from .base import *

ALLOWED_HOSTS += ['127.0.0.1']
DEBUG = True

WSGI_APPLICATION = 'home.wsgi.dev.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'djreactecommerce',
        'USER': 'postgres',
        'PASSWORD': 'test123',
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}

CORS_ORIGIN_WHITELIST = (
    'http://localhost:3000',
)

# Stripe

STIPE_PUBLIC_KEY = config('STRIPE_TEST_PUBLIC_KEY')
STIPE_SECRET_KEY = config('STRIPE_TEST_SECRET_KEY')
