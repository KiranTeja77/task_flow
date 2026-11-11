# Jenkins with the tools the TaskFlow pipeline needs: Docker CLI + Compose, Maven and Node.js
FROM jenkins/jenkins:lts-jdk17

USER root

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl gnupg maven \
 # Docker CLI and Compose plugin (the daemon is the host's, via the mounted socket)
 && install -m 0755 -d /etc/apt/keyrings \
 && curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $(. /etc/os-release && echo $VERSION_CODENAME) stable" > /etc/apt/sources.list.d/docker.list \
 # Node.js 20
 && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get update \
 && apt-get install -y --no-install-recommends docker-ce-cli docker-compose-plugin nodejs \
 && rm -rf /var/lib/apt/lists/*

# Runs as root so the container can use the mounted /var/run/docker.sock
# (fine for a local college project; use a docker group for anything shared).
USER root
