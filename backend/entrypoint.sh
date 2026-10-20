#!/bin/sh
set -eu
alembic -c /app/alembic.ini upgrade head
if [ "${DEMO_MODE:-true}" = "true" ]; then python -m signal_app.seed; fi
exec uvicorn signal_app.main:app --host 0.0.0.0 --port 8000
