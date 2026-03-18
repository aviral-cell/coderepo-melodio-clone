#!/usr/bin/env bash

set -uo pipefail

task="${1:-}"

if [[ -z "$task" ]]; then
	echo "Usage: $0 <task-name>" >&2
	exit 1
fi

backend_path="backend/__tests__/${task}"
frontend_path="frontend/__tests__/${task}"
ran_any=false
exit_code=0

if [[ -d "$backend_path" ]]; then
	ran_any=true
	(
		cd backend
		bun run test -- --testPathPattern="__tests__/${task}/"
	) || exit_code=$?
fi

if [[ -d "$frontend_path" ]]; then
	ran_any=true
	vitest run --project frontend "$frontend_path/" || exit_code=$?
fi

if [[ "$ran_any" == false ]]; then
	echo "No tests found for ${task}" >&2
	exit 1
fi

exit "$exit_code"
