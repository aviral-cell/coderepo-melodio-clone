#!/bin/bash

if pgrep mongod > /dev/null; then
  echo "mongod is running"
else
  mongod --config /etc/mongod.conf --fork > /dev/null
  echo "mongod started"
fi

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
