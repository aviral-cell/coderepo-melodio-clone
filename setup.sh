#!/bin/bash

MODE="${1:---seed}"

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

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
fi

if [ "$MODE" = "--prepare" ]; then
  echo "Install preflight complete."
  exit 0
fi

if [ "$MODE" = "--start" ]; then
  echo "Startup checks complete."
  exit 0
fi

if [ "$MODE" = "--seed" ]; then
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
  exit 0
fi

echo "Unknown setup mode: $MODE"
exit 1
