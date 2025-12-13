#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-src/.env}"
APP_NAME="${2:-Zelante DEV}"
APP_URL_PORT="${3:-8180}"
DB_CONNECTION="${4:-mysql}"
DB_HOST="${5:-mysql}"
DB_PORT="${6:-3306}"
DB_DATABASE="${7:-zelante}"
DB_USERNAME="${8:-zelante}"
DB_PASSWORD="${9:-zelante}"
TELESCOPE_ENABLED="${10:-true}"

# Crea il file se non esiste
touch "$ENV_FILE"

# Funzione per impostare una variabile nel .env
set_env_var() {
    local key="$1"
    local value="$2"
    local file="$3"
    
    # Pattern per trovare la chiave (commentata o no, con o senza spazi)
    local pattern="^[[:space:]]*#?[[:space:]]*${key}[[:space:]]*="
    
    # Crea un file temporaneo
    local temp_file="${file}.tmp"
    
    # Leggi il file e processa ogni riga
    local key_found=0
    > "$temp_file"  # Crea file temporaneo vuoto
    
    if [[ -f "$file" ]] && [[ -s "$file" ]]; then
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Controlla se questa riga contiene la chiave (commentata o no)
            if echo "$line" | grep -qE "$pattern"; then
                # Sostituisci la riga con la nuova variabile non commentata
                echo "${key}=${value}" >> "$temp_file"
                key_found=1
            else
                # Mantieni la riga originale
                echo "$line" >> "$temp_file"
            fi
        done < "$file"
    fi
    
    # Se la chiave non è stata trovata, aggiungila alla fine
    if [[ $key_found -eq 0 ]]; then
        # Aggiungi una riga vuota se il file non è vuoto e non termina con newline
        if [[ -f "$temp_file" ]] && [[ -s "$temp_file" ]]; then
            # Verifica se l'ultima riga termina con newline
            local last_char=$(tail -c 1 "$temp_file" 2>/dev/null || echo "")
            if [[ -n "$last_char" ]]; then
                echo "" >> "$temp_file"
            fi
        fi
        echo "${key}=${value}" >> "$temp_file"
    fi
    
    # Sostituisci il file originale con quello temporaneo
    mv "$temp_file" "$file"
}

# Imposta tutte le variabili richieste
set_env_var "APP_NAME" "\"${APP_NAME}\"" "$ENV_FILE"
set_env_var "APP_ENV" "local" "$ENV_FILE"
set_env_var "APP_DEBUG" "true" "$ENV_FILE"
set_env_var "APP_URL" "http://localhost:${APP_URL_PORT}" "$ENV_FILE"
set_env_var "APP_LOCALE" "it" "$ENV_FILE"
set_env_var "APP_FALLBACK_LOCALE" "en" "$ENV_FILE"
set_env_var "APP_FAKER_LOCALE" "en_US" "$ENV_FILE"
set_env_var "DB_CONNECTION" "$DB_CONNECTION" "$ENV_FILE"
set_env_var "DB_HOST" "$DB_HOST" "$ENV_FILE"
set_env_var "DB_PORT" "$DB_PORT" "$ENV_FILE"
set_env_var "DB_DATABASE" "$DB_DATABASE" "$ENV_FILE"
set_env_var "DB_USERNAME" "$DB_USERNAME" "$ENV_FILE"
set_env_var "DB_PASSWORD" "$DB_PASSWORD" "$ENV_FILE"
set_env_var "TELESCOPE_ENABLED" "$TELESCOPE_ENABLED" "$ENV_FILE"

echo "✅ Ensured Laravel .env at $ENV_FILE"

