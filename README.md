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
![Architecture](https://i.imgur.com/ZE47cVq.png)

## Technology Stack
* Back-end: Python, Django
* Front-end: ECMAScript 2016, React, IndexedDB, AppCache

## Screenshot (IPhone 6 / Safari 9)
![Screenshot](https://i.imgur.com/rdzx735.png)

## Building and Deployment
### Prerequisites

1. Python v3+
2. Django v1.10+
3. NodeJS v6+

### Setup for development

1. Initialize an SQLite database: `python manage.py migrate`.
2. Optionally, load a dataset for testing: `python manage.py loaddata fakedata`.
3. Install NodeJS dependencies: `npm install`.
3. Build the webapp with `npm run build-webapp` or `npm run build-webapp-watch`.
4. Run the Django server: `python manage.py runserver`.
5. Goto `http://localhost:8000/app/index.html`

# Setup for deployment?
You have to write your own Django project settings and prepare an indepedent database.
Replace `devsite.settings` with your own settings module in `manage.py`, when ready.

## What's the story behind Secretum?
Some years ago I got tired with remembering complex password to keep my accounts secure. Obviously, I did not trust any of the proprietary password managers, while open source projects seemed a bit outdated with respect to their technology stacks. This repository
started as a dump of source code I coded for myself over these years and a vision of a perfect password manager I could trust and enjoy interacting with.
