#!/bin/bash

echo "Setting up Melodio..."

# Start MongoDB if not already running
echo "Checking MongoDB status..."
if pgrep mongod > /dev/null; then
  echo "MongoDB is already running"
else
  echo "Starting MongoDB..."
  mongod --config /etc/mongod.conf --fork > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "MongoDB started successfully"
  else
    echo "Warning: Could not start MongoDB. Please ensure MongoDB is installed and configured."
  fi
fi

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Install dependencies
bun install

# Seed database
echo "Seeding database..."
bun run seed
if [ $? -ne 0 ]; then
echo "Warning: Database seeding failed. The application may start with an empty database."
fi

echo "Setup complete!"
echo ""
echo "Login credentials:"
echo "  Email: alex.morgan@melodio.com"
echo "  Password: password123"
echo ""
echo "To start the application, run:"
echo "  bun start"
echo ""
