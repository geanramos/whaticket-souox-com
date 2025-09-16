#!/bin/bash

# Parar a execução do script em caso de erro
set -e

# Atualizar o sistema
sudo apt update -y
sudo apt upgrade -y

# Instalar dependências necessárias
sudo apt install -y curl gnupg

# Instalar Node.js 20.x e npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação do Node.js e npm
node -v
npm -v

# Instalar PM2
sudo npm install -g pm2

# Verificar instalação do PM2
pm2 -v

# Instalar Docker
# Remover versões antigas do Docker, se existirem
sudo apt remove -y docker docker-engine docker.io containerd runc

# Instalar pacotes de dependências
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Adicionar chave GPG oficial do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

# Atualizar pacotes e instalar Docker
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Verificar instalação do Docker
sudo systemctl status docker
docker --version

# Adicionar usuário atual ao grupo docker para evitar uso de sudo
sudo usermod -aG docker $USER

# Instalar Docker Compose
DOCKER_COMPOSE_VERSION="2.3.3"
sudo curl -L "https://github.com/docker/compose/releases/download/v$DOCKER_COMPOSE_VERSION/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permissão de execução ao Docker Compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação do Docker Compose
docker-compose --version

# Mensagem final de conclusão
echo "Node.js, npm, PM2, Docker e Docker Compose foram instalados com sucesso."
echo "Você pode precisar reiniciar o sistema ou fazer logout e login novamente para aplicar as mudanças de grupo do Docker."
