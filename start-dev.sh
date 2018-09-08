#!/bin/bash

cd /secretum
#npm run build-watch &

source /secretum/pyenv/bin/activate

/secretum/manage.py migrate
/secretum/manage.py runserver 0:80
