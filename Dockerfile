FROM ubuntu:bionic

# Apache and Python
RUN apt-get -qq -y update && apt-get -qq -y install python3-minimal python3-pip \
	virtualenv apache2 libapache2-mod-wsgi-py3

# Node
RUN apt-get -y -qq update && apt-get -y -qq install curl
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get -y -qq install nodejs

WORKDIR /secretum


RUN rm /etc/apache2/sites-enabled/*
COPY apache.conf /etc/apache2/sites-enabled/

RUN virtualenv -p python3 pyenv

COPY requirements.txt /secretum/
RUN . pyenv/bin/activate && pip install -r requirements.txt

COPY package.json package-lock.json /secretum/
RUN npm install

COPY gulpfile.js /secretum/
COPY webapp /secretum/webapp
RUN npm run build

COPY . /secretum/

# Django Log File
RUN mkdir /secretum/log
RUN touch /secretum/log/django.log
RUN chgrp -R www-data /secretum/log && chmod -R g+w /secretum/log

# Django Static Folder
RUN . pyenv/bin/activate && ./manage.py collectstatic --no-input

EXPOSE 80
CMD apachectl -D FOREGROUND
