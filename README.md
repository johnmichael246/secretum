# SECRETUM
![Logo](https://i.imgur.com/kHfcW4r.png)

## The Goal
Secretum is a password manager with the following feature targets:
* an offline-ready mobile-friendly web application
* an advanced and transparent syncronization module
* end-to-end encryption of passwords between devices
* easily extendable and customizable through a robust API

## Architecture
![Architecture](https://i.imgur.com/ZE47cVq.png)

## Technology Stack
* Back-end: PostgreSQL, Python
* Front-end: ECMAScript 2016, React, IndexedDB, AppCache

## Screenshot (IPhone 6 / Safari 9)
![Screenshot](https://i.imgur.com/rdzx735.png)

## Building and Deployment
### Prerequisites

1. Python v3+
2. PostgreSQL v9+
3. NodeJS v6+

### Setup

1. Initialize schema with `./database/schema.sql`.
2. Upload dataset for testing from `./database/fakedata.sql`.
3. Install psycopg2 with `pip install psycopg2`.
4. Modify the first lines of `./service/app.py` with PG database parameters and desired API port.
5. Modify `./web/app.js` (look for construction of a Store object) to match hostname and port of the API service.
6. Run `npm install`.

### Deployment

1. Run `python service/app.py`.
2. Run `node build/build.js`. This will build the project into `./output/webapp` and launch `./build/simple.py` in the output directory. You can now open `http://localhost:8000` to launch the front-end app.

## What's the story behind Secretum?
Some years ago I got tired with remembering complex password to keep my accounts secure. Obviously, I did not trust any of the proprietary password managers, while open source projects seemed a bit outdated with respect to their technology stacks. This repository
started as a dump of source code I coded for myself over these years and a vision of a perfect password manager I could trust and enjoy interacting with.
