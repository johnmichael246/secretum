#!/bin/bash

# In case the db is not ready yet
wait 10

cd /secretum
source /secretum/pyenv/bin/activate

/secretum/manage.py migrate
/secretum/dev-seed.py

/secretum/manage.py runserver 0:80
