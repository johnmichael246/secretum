# SECRETUM
![Logo](https://i.imgur.com/kHfcW4r.png)
[![Build Status](https://travis-ci.org/equalsdanny/secretum.svg?branch=master)](https://travis-ci.org/equalsdanny/secretum)

## The Goal
Secretum is a password manager with the following feature targets:
* an offline-ready mobile-friendly web application
* an advanced and transparent syncronization module
* end-to-end encryption of passwords between devices
* easily extendable and customizable through a robust API

## Architecture
![Architecture](https://i.imgur.com/Wkr92XP.png?1)

## Technology Stack
* Back-end: Python, Django
* Front-end: ECMAScript 2016, React, IndexedDB, AppCache

## Screenshot (IPhone 6 / Safari 9)
![Screenshot](https://i.imgur.com/rdzx735.png)

## Building and Deployment
### System prerequisites
1. Python v3+
2. NodeJS v6+

### Installing dependencies
1. `pip install django`
2. `npm install`

### Preparing a database
1. Optionally, install a DB driver (e.g. `pip install psycopg2`), or stay with built-in SQLite.
2. Initialize a database: `python manage.py migrate`.
3. Optionally, load a dataset for testing: `python manage.py loaddata fakedata`.

### Building for development
1. Build the webapp and start a watchdog with `npm run build-watch`.
2. Run the Django server: `python manage.py runserver`.
3. Goto `http://localhost:8000`.

### Production deployment
You have to write your own Django project settings and prepare an indepedent database.
Replace `devsite.settings` with your own settings module in `manage.py`, when ready.

## What's the story behind Secretum?
Some years ago I got tired with remembering complex password to keep my accounts secure. Obviously, I did not trust any of the proprietary password managers, while open source projects seemed a bit outdated with respect to their technology stacks. This repository
started as a dump of source code I coded for myself over these years and a vision of a perfect password manager I could trust and enjoy interacting with.
