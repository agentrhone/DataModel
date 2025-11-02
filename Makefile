.PHONY: help dev build start test coverage lint format typecheck db-generate db-push db-migrate db-seed

PNPM ?= pnpm
name ?=

help:
	@echo "Available targets:"
	@echo "  dev           - Start Next.js dev server"
	@echo "  build         - Build Next.js app"
	@echo "  start         - Start production server"
	@echo "  test          - Run unit tests (Vitest)"
	@echo "  coverage      - Run tests with coverage"
	@echo "  lint          - Run ESLint"
	@echo "  format        - Run Prettier on the repo"
	@echo "  typecheck     - TypeScript type check"
	@echo "  db-generate   - Generate Prisma client"
	@echo "  db-push       - Push Prisma schema to DB"
	@echo "  db-migrate    - Create/run migration (use: make db-migrate name=init)"
	@echo "  db-seed       - Seed database"

dev:
	$(PNPM) dev

build:
	$(PNPM) build

start:
	$(PNPM) start

test:
	$(PNPM) test

coverage:
	$(PNPM) test:coverage

lint:
	$(PNPM) lint

format:
	$(PNPM) format

typecheck:
	npx tsc -p tsconfig.json --noEmit

db-generate:
	$(PNPM) prisma generate

db-push:
	$(PNPM) prisma db push

db-migrate:
	@if [ -z "$(name)" ]; then \
		echo "Please provide migration name: make db-migrate name=init"; \
		exit 1; \
	fi
	$(PNPM) prisma migrate dev --name $(name)

db-seed:
	$(PNPM) db:seed

