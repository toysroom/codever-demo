FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
    && rm -rf /var/lib/apt/lists/*

ARG DOCKER_VERSION=26.1.3
ARG DOCKER_COMPOSE_VERSION=2.27.0

RUN set -eux; \
    arch="$(uname -m)"; \
    tmpdir="$(mktemp -d)"; \
    curl -fsSL "https://download.docker.com/linux/static/stable/${arch}/docker-${DOCKER_VERSION}.tgz" -o "${tmpdir}/docker.tgz"; \
    tar -xzf "${tmpdir}/docker.tgz" -C "${tmpdir}"; \
    install -m 0755 "${tmpdir}/docker/docker" /usr/local/bin/docker; \
    rm -rf "${tmpdir}"; \
    mkdir -p /usr/libexec/docker/cli-plugins; \
    curl -fsSL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-${arch}" -o /usr/libexec/docker/cli-plugins/docker-compose; \
    chmod +x /usr/libexec/docker/cli-plugins/docker-compose

USER jenkins
