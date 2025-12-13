FROM php:8.4-fpm

# Installa estensioni e dipendenze
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    lftp \
    rsync \
    default-mysql-client \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Installa Xdebug
RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# Installa Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Installa Laravel installer globalmente
RUN composer global require laravel/installer \
    && echo 'export PATH="$PATH:$HOME/.config/composer/vendor/bin:$HOME/.composer/vendor/bin"' >> /root/.bashrc

# Imposta la variabile PATH anche per i RUN successivi
ENV PATH="/root/.config/composer/vendor/bin:/root/.composer/vendor/bin:$PATH"

# Installa Node.js + npm
RUN curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm

# Installa dipendenze per Playwright (complete)
RUN apt-get install -y \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libxss1 \
    libasound2 \
    libglib2.0-0t64 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0t64 \
    libatk-bridge2.0-0t64 \
    libcups2t64 \
    libxkbcommon0 \
    libatspi2.0-0t64 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libcairo2 \
    libpango-1.0-0 \
    libasound2t64

# Verifica versioni (opzionale)
RUN node -v && npm -v

# Imposta la directory di lavoro
WORKDIR /var/www/html

# Installa Playwright e browser automaticamente (se package.json contiene @playwright/test)
# Questo viene eseguito durante il build dell'immagine
RUN if [ -f package.json ] && grep -q "@playwright/test" package.json; then \
        echo "Installing Playwright and browsers..."; \
        npm install && npx playwright install --with-deps chromium; \
    else \
        echo "Playwright not found in package.json, skipping installation"; \
    fi

# Configura PHP per upload di file più grandi
RUN echo "upload_max_filesize = 50M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size = 50M" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "max_execution_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "max_input_time = 300" >> /usr/local/etc/php/conf.d/uploads.ini && \
    echo "memory_limit = 256M" >> /usr/local/etc/php/conf.d/uploads.ini

# Configura Xdebug
RUN echo "xdebug.mode=debug,develop" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini && \
    echo "xdebug.start_with_request=yes" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini && \
    echo "xdebug.client_host=host.docker.internal" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini && \
    echo "xdebug.client_port=9003" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini && \
    echo "xdebug.idekey=VSCODE" >> /usr/local/etc/php/conf.d/docker-php-ext-xdebug.ini

CMD ["php-fpm"]