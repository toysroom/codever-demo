# Review Docker Setup

## Container Attuali ✅

1. **app** (PHP 8.4 FPM) - ✅ OK
2. **nginx** - ✅ OK
3. **mysql** (8.4) - ✅ OK
4. **phpmyadmin** - ✅ OK
5. **jenkins** - ✅ OK

## Container Aggiunti ✅

6. **redis** - ✅ Aggiunto (per cache e queue)
7. **mailpit** - ✅ Aggiunto (per email in sviluppo)

## Cosa Serve per il Progetto

### ✅ Già Presente:
- PHP 8.4 con estensioni
- MySQL 8.4
- Nginx
- Composer cache
- Node.js (nel container PHP per Vite)

### ✅ Aggiunto:
- **Redis**: Per cache Laravel e queue
- **Mailpit**: Per testare email in sviluppo (web UI su :8025)

### ⚠️ Da Configurare (non container):

1. **Sistema Pagamenti**:
   - Laravel Cashier (Stripe) - pacchetto PHP, non container
   - O PayPal SDK - pacchetto PHP, non container

2. **File Storage** (se serve S3):
   - Non serve container, usa AWS S3 o compatibile
   - O storage locale (già presente)

3. **Queue Worker**:
   - Non serve container separato
   - Usa `php artisan queue:work` nel container app esistente
   - O supervisor per gestire worker

## Configurazione .env per Redis e Mailpit

```env
# Cache
CACHE_DRIVER=redis
CACHE_PREFIX=zelante

# Queue
QUEUE_CONNECTION=redis

# Session
SESSION_DRIVER=redis

# Mail (sviluppo)
MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@zelante.local"
MAIL_FROM_NAME="${APP_NAME}"
```

## Porte Docker

- **8480**: Nginx (applicazione)
- **8473**: Vite dev server
- **8481**: phpMyAdmin
- **8492**: Jenkins
- **6379**: Redis
- **8025**: Mailpit Web UI
- **1025**: Mailpit SMTP

## Verifica Setup

```bash
# Verifica container
docker compose ps

# Verifica Redis
docker exec zelante-redis redis-cli ping

# Verifica Mailpit
curl http://localhost:8025

# Verifica MySQL
docker exec zelante-mysql mysql -u zelante -pzelante -e "SELECT 1"
```

## Conclusione

✅ **Docker setup è completo** con Redis e Mailpit aggiunti.

Non servono altri container. Il sistema pagamenti (Stripe/PayPal) è un pacchetto PHP, non un container.
