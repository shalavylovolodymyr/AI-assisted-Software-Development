.PHONY: setup migrate seed api web test lint build check
setup:
	python3.12 -m venv .venv
	.venv/bin/pip install -r backend/requirements.lock
	npm ci
migrate:
	PYTHONPATH=backend/src .venv/bin/alembic -c backend/alembic.ini upgrade head
seed:
	PYTHONPATH=backend/src .venv/bin/python -m signal_app.seed
api:
	PYTHONPATH=backend/src .venv/bin/uvicorn signal_app.main:app --host 127.0.0.1 --port 8000
web:
	npm run dev
test:
	.venv/bin/pytest backend/tests --cov=signal_app.domain --cov=signal_app.application --cov-report=term-missing
	npm run test:frontend
lint:
	.venv/bin/ruff check backend scripts
	.venv/bin/ruff format --check backend scripts
	npm run lint --workspace frontend
build:
	npm run build
check: lint test build
