# Zelante Docker Stack

Stack Docker per un progetto Laravel 12 con Inertia.js e React. Il codice applicativo vive in `src/`.

## Servizi inclusi

- **app**: PHP 8.4 FPM con estensioni necessarie, Composer e Node.js 22.
- **nginx**: reverse proxy configurato per servire `public/`.
- **mysql**: database MySQL 8.4 con volume persistente e directory `docker/mysql/init` per script SQL di bootstrap.
- **phpmyadmin**: interfaccia di amministrazione MySQL su `http://localhost:8080`.
- **jenkins**: server CI/CD disponibile su `http://localhost:8081/jenkins` con Docker CLI installato (richiede il socket del demone Docker host).
- **redis**: cache e queue driver per Laravel.
- **mailpit**: server SMTP di sviluppo e web UI su `http://localhost:8025`.
## Primi passi

1. Porta il codice Laravel (o crealo) dentro `src/`. Se parti da zero, copia `src/.env.example` in `src/.env` e aggiorna le variabili necessarie (ad esempio `APP_KEY`).
2. Costruisci e avvia lo stack:

   ```bash
   docker compose up -d --build
   ```

3. Per bootstrap completo di Laravel 12 + Inertia React + shadcn/ui, lancia lo script direttamente dentro il container `app`:

   ```bash
   docker compose exec app ./scripts/setup-laravel.sh
   ```

   Lo script è idempotente: puoi rilanciarlo per aggiornare dipendenze o ricreare file mancanti. Al termine avrai un progetto pronto con Breeze (Inertia + React), dipendenze shadcn/ui, componenti base e token tailwind.

4. Per lavorare sugli asset in hot reload:

   ```bash
   cd src
   npm install
   npm run dev -- --host
   ```

## Note aggiuntive

- Il container `app` include Node.js 22: puoi lanciare comandi npm anche da lì (es. `docker compose exec app npm run dev`).
- Per TLS locale copia i certificati in `docker/nginx/certs` e adatta la configurazione Nginx.
- Jenkins monta il socket Docker host per poter buildare immagini; assicurati che l'utente abbia i permessi adeguati.
- Aggiungi eventuali altri servizi (es. `meilisearch`, `minio`, `selenium`) replicando lo schema nel `docker-compose.yml`.
