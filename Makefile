# Hoovy — dev + ops targets.
#
# Cross-shell friendly: avoids POSIX-only syntax so `make` works under
# Git Bash, WSL, and the default Windows cmd. `make dev` runs both servers
# in the current terminal via `npx concurrently` (so no extra windows).

.PHONY: help install dev up down logs pull-models seed test clean

help:
	@echo "Hoovy targets:"
	@echo "  make install      Create venv, install Python + npm deps"
	@echo "  make dev          Run backend + frontend natively (current terminal)"
	@echo "  make up           Bring up dockerized stack (ollama + app)"
	@echo "  make down         Stop docker stack"
	@echo "  make logs         Tail docker logs"
	@echo "  make pull-models  Pull gemma4:e2b into the ollama container (run once)"
	@echo "  make seed         Pre-generate scenario images (uses GEMINI_API_KEY if set)"
	@echo "  make test         Backend pytest + frontend typecheck"
	@echo "  make clean        Remove __pycache__, dist, build artifacts"

install:
	cd backend && python -m venv .venv && .venv\Scripts\pip install -e ".[dev]"
	cd frontend && npm install

# `--app-dir backend` lets uvicorn import app.main from the repo root without cd'ing.
# `npm --prefix frontend` works in any shell. Backslashes are required because
# Make's default shell on Windows is cmd, which parses forward-slash paths as flags.
dev:
	npx --yes concurrently --kill-others-on-fail \
		--names "API,WEB" --prefix-colors "magenta,cyan" \
		"backend\.venv\Scripts\uvicorn.exe --app-dir backend app.main:app --reload --reload-dir backend\\app --host 0.0.0.0 --port 8000" \
		"npm --prefix frontend run dev"

up:
	docker compose up -d --build
	@echo ""
	@echo "Stack up. First time? Pull the Gemma model into the ollama container:"
	@echo "  make pull-models"
	@echo ""
	@echo "Then open http://localhost:8000"

down:
	docker compose down

logs:
	docker compose logs -f --tail=100

pull-models:
	docker compose exec ollama ollama pull gemma4:e2b

seed:
	backend\.venv\Scripts\python scripts\regen_images.py --all

test:
	cd backend && .venv\Scripts\python -m pytest tests/ -q
	cd frontend && npm run typecheck

clean:
	cd backend && rm -rf .pytest_cache dist build *.egg-info
	cd frontend && rm -rf dist node_modules/.vite
