help:
	@echo make dev
	@echo make start_web

dev:
	IPYTHONDIR=$PWD/.ipython uv run --group dev ipython


start_web:
	caddy run --config caddy.yaml --adapter caddyfile

start_api:
	uv run python -m src.main.app -p 8080
