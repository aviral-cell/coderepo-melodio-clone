#!/bin/bash

MODE="${1:---seed}"
STATE_DIR=".cache"
STATE_FILE="$STATE_DIR/melodio-seed-signature"
SEED_SOURCE="backend/src/scripts/seed.ts"
BACKEND_ENV_FILE="backend/.env"
BACKEND_ENV_EXAMPLE="backend/.env.example"

echo "Setting up Melodio..."

ensure_mongo_running() {
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
}

ensure_env_files() {
	if [ ! -f "$BACKEND_ENV_FILE" ]; then
		cp "$BACKEND_ENV_EXAMPLE" "$BACKEND_ENV_FILE"
	fi

	if [ ! -f frontend/.env ]; then
		cp frontend/.env.example frontend/.env
	fi
}

get_mongodb_uri() {
	sed -n 's/^MONGODB_URI=//p' "$BACKEND_ENV_FILE" | tail -n 1
}

get_seed_source_hash() {
	shasum -a 256 "$SEED_SOURCE" | awk '{print $1}'
}

get_seed_signature() {
	local mongodb_uri
	local seed_hash
	mongodb_uri="$(get_mongodb_uri)"
	seed_hash="$(get_seed_source_hash)"
	printf '%s\n%s\n' "$mongodb_uri" "$seed_hash" | shasum -a 256 | awk '{print $1}'
}

record_seed_signature() {
	mkdir -p "$STATE_DIR"
	get_seed_signature > "$STATE_FILE"
}

should_seed() {
	local current_signature
	current_signature="$(get_seed_signature)"

	if [ ! -f "$STATE_FILE" ]; then
		return 0
	fi

	local previous_signature
	previous_signature="$(cat "$STATE_FILE")"

	if [ "$current_signature" != "$previous_signature" ]; then
		return 0
	fi

	return 1
}

run_seed() {
	echo "Seeding database..."
	bun run seed
	if [ $? -ne 0 ]; then
		echo "Warning: Database seeding failed. The application may start with an empty database."
		return 1
	fi

	record_seed_signature

	echo "Setup complete!"
	echo ""
	echo "Login credentials:"
	echo "  Email: alex.morgan@melodio.com"
	echo "  Password: password123"
	echo ""
	echo "To start the application, run:"
	echo "  bun start"
	echo ""

	return 0
}

ensure_mongo_running
ensure_env_files

if [ "$MODE" = "--start" ]; then
	echo "Startup checks complete."
	exit 0
fi

if [ "$MODE" = "--ensure-seeded" ]; then
	if should_seed; then
		run_seed
	else
		echo "Seed unchanged. Skipping database seed."
	fi
	exit 0
fi

if [ "$MODE" = "--seed" ]; then
	run_seed
	exit 0
fi

echo "Unknown setup mode: $MODE"
exit 1
