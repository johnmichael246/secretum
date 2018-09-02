FROM ubuntu:bionic

RUN apt-get -y update && apt-get install -y python3-minimal python3-pip nodejs npm
RUN apt-get -y install virtualenv

WORKDIR /secretum

EXPOSE 80
