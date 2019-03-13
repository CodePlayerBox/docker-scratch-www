#!/bin/sh

### Start server
DEBUG=app node server.js

### Never stop it
while :
do
  sleep 60
done
