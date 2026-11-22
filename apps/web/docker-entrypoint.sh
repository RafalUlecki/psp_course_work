#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

echo "Applying Prisma migrations..."
attempt=1
max_attempts=30
until ./node_modules/.bin/prisma migrate deploy; do
  if [ "${attempt}" -ge "${max_attempts}" ]; then
    echo "prisma migrate deploy failed after ${attempt} attempts" >&2
    exit 1
  fi
  echo "Database not ready, retrying in 2s (${attempt}/${max_attempts})..."
  attempt=$((attempt + 1))
  sleep 2
done

echo "Seeding demo data (idempotent)..."
./node_modules/.bin/tsx prisma/seedDemo.ts

echo "Starting Next.js on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}..."
exec ./node_modules/.bin/next start --hostname "${HOSTNAME:-0.0.0.0}" --port "${PORT:-3000}"
