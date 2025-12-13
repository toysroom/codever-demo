# =============================================================================
# EasternStar CRM - Makefile
# =============================================================================

# Variables
COMPOSE_PROJECT_NAME ?= zelante-app
APP_NAME ?= Zelante DEV
APP_URL_PORT ?= 8180
DB_CONNECTION ?= mysql
DB_HOST ?= mysql
DB_PORT ?= 3306
DB_DATABASE ?= zelante
DB_USERNAME ?= zelante
DB_PASSWORD ?= zelante
TELESCOPE_ENABLED ?= true

PHP_CONTAINER=$(COMPOSE_PROJECT_NAME)
APP_PATH=/var/www/html
JENKINS_CONTAINER=zelante-jenkins
COMPOSER=composer
NPM=npm
ARTISAN=php artisan

.PHONY: help up down reup build-images build-images-e2e bash clean logs jenkins init setup install-tools frontend-install dev build qa-install qa qa-ci phpstan phpmd pint pint-test php-lint security lint format migrate migrate-fresh seed artisan tinker cache-clear queue-work test test-e2e-install test-e2e test-e2e-ui test-e2e-debug test-e2e-report test-e2e-serve test-e2e-serve-alt

# =============================================================================
# HELP - Show available commands
# =============================================================================
help:
	@echo "EasternStar CRM - Available Commands:"
	@echo ""
	@echo "🐳 DOCKER COMMANDS:"
	@echo "  up              Start Docker containers in background"
	@echo "  down            Stop Docker containers"
	@echo "  reup            Restart Docker containers"
	@echo "  build-images    Build Docker images"
	@echo "  build-images-e2e Build Docker images with Playwright support"
	@echo "  bash            Enter PHP container shell"
	@echo "  clean           Remove all containers and volumes (DANGER!)"
	@echo "  logs            Show container logs"
	@echo "  jenkins         Get Jenkins initial admin password"
	@echo ""
	@echo "🚀 BACKEND COMMANDS (Laravel/PHP):"
	@echo "  init            Initialize Laravel project"
	@echo "  setup           Setup project configuration"
	@echo "  install-tools   Install Laravel packages and tools"
	@echo "  migrate         Run database migrations"
	@echo "  migrate-fresh   Fresh migration with seeding"
	@echo "  seed            Run database seeders"
	@echo "  artisan         Run artisan command (usage: make artisan <command>)"
	@echo "  tinker          Open Laravel tinker"
	@echo "  cache-clear     Clear all Laravel caches"
	@echo "  queue-work      Start queue worker"
	@echo "  test            Run PHP tests"
	@echo ""
	@echo "🔧 QUALITY ASSURANCE (Backend):"
	@echo "  qa-install      Install QA tools (PHPStan, Pint, PHPMD)"
	@echo "  qa              Run all QA checks (modifies files)"
	@echo "  qa-ci           Run all QA checks (CI mode, no modifications)"
	@echo "  phpstan         Run PHPStan static analysis"
	@echo "  phpmd           Run PHPMD mess detector"
	@echo "  pint            Run Laravel Pint formatter (modifies files)"
	@echo "  pint-test       Test Pint formatting (no modifications)"
	@echo "  php-lint        Check PHP syntax errors (php -l)"
	@echo "  security        Run Composer security audit"
	@echo ""
	@echo "⚛️  FRONTEND COMMANDS (React/Node.js):"
	@echo "  frontend-install Install npm dependencies"
	@echo "  dev             Start Vite development server"
	@echo "  build           Build assets for production"
	@echo "  lint            Run ESLint on JavaScript/React files"
	@echo "  format          Format JavaScript/React with Prettier"
	@echo ""
	@echo "🧪 E2E TEST COMMANDS (Playwright):"
	@echo "  test-e2e-install Install Playwright browsers"
	@echo "  test-e2e        Run all Playwright E2E tests"
	@echo "  test-e2e-ui     Run Playwright tests with UI (headed mode)"
	@echo "  test-e2e-debug  Run Playwright tests in debug mode"
	@echo "  test-e2e-report Generate HTML report for Playwright tests"
	@echo "  test-e2e-serve  Serve Playwright HTML report on localhost:9324"
	@echo "  test-e2e-serve-alt Alternative: Serve with Python HTTP server"

# =============================================================================
# 🐳 DOCKER COMMANDS
# =============================================================================

# Build Docker images
build-images:
	@echo "🐳 Building Docker images..."
	docker compose build

# Build Docker images with Playwright (for E2E testing)
build-images-e2e:
	@echo "🐳 Building Docker images with Playwright support..."
	docker compose build --no-cache

# Start containers in background
up:
	@echo "🐳 Starting Docker containers..."
	docker compose up -d

# Stop containers
down:
	@echo "🐳 Stopping Docker containers..."
	docker compose down

# Restart containers
reup: down up

# Complete setup with Playwright (build + start + install)
setup-e2e: build-images-e2e up install-tools

# Enter PHP container shell
bash:
	@echo "🐳 Entering PHP container shell..."
	docker exec -it $(PHP_CONTAINER) bash

# Remove all containers and volumes (DANGER!)
clean:
	@echo "⚠️  WARNING: This will remove all containers and volumes!"
	@echo "🐳 Removing all containers and volumes..."
	docker compose down -v

# Show container logs
logs:
	@echo "🐳 Showing container logs..."
	docker compose logs -f $(PHP_CONTAINER)

# Get Jenkins initial admin password
jenkins:
	@echo "🐳 Getting Jenkins initial admin password..."
	docker exec -it $(JENKINS_CONTAINER) cat /var/jenkins_home/secrets/initialAdminPassword

# =============================================================================
# 🚀 BACKEND COMMANDS (Laravel/PHP)
# =============================================================================

# Initialize Laravel project
init:
	@echo "🚀 Initializing Laravel project..."
	docker exec -it $(PHP_CONTAINER) bash -c '\
		set -e; \
		cd /var/www/html; \
		if [ ! -f artisan ]; then \
			echo "📦 Creating temporary Laravel in tmp/laravel-temp..."; \
			rm -rf tmp/laravel-temp; \
			mkdir -p tmp; \
			laravel new tmp/laravel-temp --react --pest --npm --verbose --no-interaction; \
			echo "📁 Copying to /var/www/html preserving .git..."; \
			rsync -a --ignore-existing --exclude=\".git\" tmp/laravel-temp/ .; \
			echo "✅ Laravel ready."; \
		else \
			echo "✅ Laravel already present, no action needed."; \
		fi'

# Setup project configuration
setup:
	@echo "🚀 Setting up project configuration..."
	@if [ ! -f .env ]; then \
		echo "COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME)" > .env; \
		echo "✅ Created .env with COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME)"; \
	else \
		if ! grep -q "^COMPOSE_PROJECT_NAME=" .env; then \
			echo "COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME)" >> .env; \
			echo "✅ Added COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) to existing .env"; \
		else \
			echo "ℹ️  COMPOSE_PROJECT_NAME already set in .env"; \
		fi; \
	fi
	@mkdir -p src
	@chmod +x scripts/setup-env.sh
	@./scripts/setup-env.sh "src/.env" "$(APP_NAME)" "$(APP_URL_PORT)" "$(DB_CONNECTION)" "$(DB_HOST)" "$(DB_PORT)" "$(DB_DATABASE)" "$(DB_USERNAME)" "$(DB_PASSWORD)" "$(TELESCOPE_ENABLED)"
	docker cp php/phpstan.neon $(PHP_CONTAINER):$(APP_PATH)/phpstan.neon
	docker exec -it $(PHP_CONTAINER) bash -c '\
		cd $(APP_PATH); \
		echo "✅ Copied phpstan.neon to $(APP_PATH)"; \
		if grep -q "server:" vite.config.ts; then \
			echo "✅ Server already configured in vite.config.ts"; \
		else \
			echo "🔧 Adding server block to vite.config.ts..."; \
			sed -i"" -e "/defineConfig({/a\\" -e "  server: { host: '\''0.0.0.0'\'', port: 5173, strictPort: true, hmr: { host: '\''localhost'\'', port: 5173 } }," vite.config.ts; \
			echo "✅ vite.config.ts modification completed."; \
		fi; \
		'

# Install Laravel packages and tools
install-tools: migrate-fresh
	@echo "🚀 Installing Laravel packages and tools..."
	docker exec -it $(PHP_CONTAINER) bash -c '\
		cd $(APP_PATH); \
		echo "📦 Installing Pest..."; \
		$(COMPOSER) require pestphp/pest --dev --with-all-dependencies || true; \
		$(COMPOSER) require pestphp/pest-plugin-laravel --dev || true; \
		echo "📦 Installing Telescope..."; \
		$(COMPOSER) require laravel/telescope --dev; \
		$(ARTISAN) telescope:install; \
		echo "📦 Installing Debugbar..."; \
		$(COMPOSER) require barryvdh/laravel-debugbar --dev; \
		echo "📦 Installing Spatie Permission..."; \
		$(COMPOSER) require spatie/laravel-permission; \
		$(ARTISAN) vendor:publish --provider="Spatie\Permission\PermissionServiceProvider" --force; \
		echo "📦 Installing Spatie Activity Log..."; \
		$(COMPOSER) require spatie/laravel-activitylog; \
		$(ARTISAN) vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-config" --force; \
		$(ARTISAN) vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider" --tag="activitylog-migrations" --force; \
		echo "📦 Installing Laravel Boost..."; \
		$(COMPOSER) require laravel/boost --dev; \
		$(ARTISAN) boost:install || $(ARTISAN) boost:install; \
		echo "📦 Installing Spatie Media Library..."; \
		$(COMPOSER) require spatie/laravel-medialibrary; \
		echo "📦 Installing Spatie Event Sourcing..."; \
		$(COMPOSER) require spatie/laravel-event-sourcing; \
		echo "📦 Installing Spatie Backup..."; \
		$(COMPOSER) require spatie/laravel-backup; \
		echo "📦 Installing Spatie Flysystem Dropbox..."; \
		$(COMPOSER) require spatie/flysystem-dropbox; \
		echo "✅ All packages installed."; \
		'
	@echo "🧪 Installing Playwright browsers..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && npx playwright install --with-deps'
	@$(MAKE) migrate

# Run database migrations
migrate:
	@echo "🚀 Running database migrations..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(ARTISAN) migrate --force'

# Fresh migration with seeding
migrate-fresh:
	@echo "🚀 Running fresh migration with seeding..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(ARTISAN) migrate:fresh --force --seed'

# Run database seeders
seed:
	@echo "🚀 Running database seeders..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(ARTISAN) db:seed --force'

# Run artisan command
artisan:
	@echo "🚀 Running artisan command..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(ARTISAN) $(filter-out $@,$(MAKECMDGOALS))'

# Open Laravel tinker
tinker:
	@echo "🚀 Opening Laravel tinker..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(ARTISAN) tinker'

# Clear all Laravel caches
cache-clear:
	@echo "🚀 Clearing all Laravel caches..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(ARTISAN) cache:clear && $(ARTISAN) config:clear && $(ARTISAN) route:clear && $(ARTISAN) view:clear'

# Start queue worker
queue-work:
	@echo "🚀 Starting queue worker..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(ARTISAN) queue:work'

# Run PHP tests
test:
	@echo "🚀 Running PHP tests..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(ARTISAN) test'

# =============================================================================
# 🔧 QUALITY ASSURANCE (Backend)
# =============================================================================

# Install QA tools
qa-install:
	@echo "🔧 Installing QA tools..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(COMPOSER) require --dev \
		phpstan/phpstan \
		laravel/pint \
		squizlabs/php_codesniffer \
		phpmd/phpmd \
		larastan/larastan'

# Run all QA checks (modifies files)
qa:
	@echo "🔧 Running all QA checks (modifies files)..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && vendor/bin/phpstan analyse --memory-limit=512M --level=max app && vendor/bin/pint && vendor/bin/phpmd app text cleancode,codesize,design'

# Run all QA checks (CI mode, no modifications)
qa-ci:
	@echo "🔧 Running all QA checks (CI mode, no modifications)..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && vendor/bin/phpstan analyse --memory-limit=512M --level=max app && vendor/bin/pint --test && vendor/bin/phpmd app text cleancode,codesize,design'

# Run PHPStan static analysis
phpstan:
	@echo "🔧 Running PHPStan static analysis..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && vendor/bin/phpstan analyse --memory-limit=512M'

# Run PHPMD mess detector
phpmd:
	@echo "🔧 Running PHPMD mess detector..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && vendor/bin/phpmd app text cleancode,codesize,design'

# Run Laravel Pint formatter (modifies files)
pint:
	@echo "🔧 Running Laravel Pint formatter (modifies files)..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && vendor/bin/pint'

# Test Pint formatting (no modifications)
pint-test:
	@echo "🔧 Testing Pint formatting (no modifications)..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && vendor/bin/pint --test'

# Check PHP syntax errors
php-lint:
	@echo "🔧 Checking PHP syntax errors..."
	@docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && \
		echo "Checking PHP files in app/..." && \
		find app -type f -name "*.php" -exec php -l {} \; | grep -v "No syntax errors" || true && \
		echo "" && \
		echo "Checking PHP files in routes/..." && \
		find routes -type f -name "*.php" -exec php -l {} \; | grep -v "No syntax errors" || true && \
		echo "" && \
		echo "Checking PHP files in database/..." && \
		find database -type f -name "*.php" -exec php -l {} \; | grep -v "No syntax errors" || true && \
		echo "" && \
		echo "Checking PHP files in tests/..." && \
		find tests -type f -name "*.php" -exec php -l {} \; | grep -v "No syntax errors" || true && \
		echo "" && \
		echo "✅ PHP syntax check completed"'

# Run Composer security audit
security:
	@echo "🔧 Running Composer security audit..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(COMPOSER) audit --no-interaction || true'

# =============================================================================
# ⚛️  FRONTEND COMMANDS (React/Node.js)
# =============================================================================

# Install npm dependencies
frontend-install:
	@echo "⚛️  Installing npm dependencies..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(NPM) install'
	@echo "📦 Installing Storybook..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(NPM) install --save-dev @storybook/react @storybook/react-vite storybook || true'
	@echo "📦 Installing Cypress..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(NPM) install --save-dev cypress || true'
	@echo "📦 Installing Playwright..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(NPM) install --save-dev @playwright/test || true'

# Start Vite development server
dev: frontend-install
	@echo "⚛️  Starting Vite development server..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(NPM) run dev'

# Build assets for production
build: frontend-install
	@echo "⚛️  Building assets for production..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(NPM) run build'

# Run ESLint on JavaScript/React files
lint:
	@echo "⚛️  Running ESLint on JavaScript/React files..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(NPM) run lint'

# Format JavaScript/React with Prettier
format:
	@echo "⚛️  Formatting JavaScript/React with Prettier..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && $(NPM) run format'

# =============================================================================
# 🧪 E2E TEST COMMANDS (Playwright)
# =============================================================================

# Install Playwright browsers
test-e2e-install:
	@echo "🧪 Installing Playwright browsers..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && npx playwright install'

# Run all Playwright E2E tests
test-e2e:
	@echo "🧪 Running Playwright E2E tests..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && npx playwright test'

# Run Playwright tests with UI (headed mode)
test-e2e-ui:
	@echo "🧪 Running Playwright E2E tests with UI..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && npx playwright test --headed'

# Run Playwright tests in debug mode
test-e2e-debug:
	@echo "🧪 Running Playwright E2E tests in debug mode..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && npx playwright test --debug'

# Generate HTML report for Playwright tests
test-e2e-report:
	@echo "🧪 Generating HTML report for Playwright tests..."
	docker exec $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && npx playwright test --reporter=html'
	@echo "📊 Report generated in: $(APP_PATH)/playwright-report/index.html"
	@echo "🌐 To view the report, run: make test-e2e-serve"

# Serve Playwright HTML report
test-e2e-serve:
	@echo "🌐 Serving Playwright HTML report on http://localhost:9324..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH) && npx playwright show-report --port 9323 --host 0.0.0.0'

# Alternative: Serve Playwright HTML report with Python HTTP server
test-e2e-serve-alt:
	@echo "🌐 Serving Playwright HTML report with Python HTTP server on http://localhost:9324..."
	docker exec -it $(PHP_CONTAINER) bash -c 'cd $(APP_PATH)/playwright-report && python3 -m http.server 9323 --bind 0.0.0.0'

# =============================================================================
# UTILITY TARGETS
# =============================================================================

# Target for passing arguments to artisan
%:
	@: