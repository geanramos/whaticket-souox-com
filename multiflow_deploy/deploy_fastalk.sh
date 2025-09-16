#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# VARIÁVEIS
# -------------------------------------------------------------------
BASE_PATH="/novo_sistema"

# Nomes das imagens Docker (pode ser ajustado se usar um registry)
IMG_BACKEND="multiflow_backend:latest"
IMG_TRANSCRICAO="multiflow_api_transcricao:latest"
IMG_FRONTEND="multiflow_frontend:latest"
IMG_OFICIAL="multiflow_api_oficial:latest"
# -------------------------------------------------------------------

install_docker() {
  if ! command -v docker &> /dev/null; then
    echo "[INFO] Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
  else
    echo "[OK] Docker já instalado."
  fi
}

install_compose() {
  if ! command -v docker-compose &> /dev/null; then
    echo "[INFO] Instalando Docker Compose..."
    curl -sSL \
      "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
  else
    echo "[OK] Docker Compose já instalado."
  fi
}

build_local_images() {
  local INST_DIR="$1"
  echo "[INFO] Construindo imagens Docker a partir do código-fonte local..."

  # Caminhos para os diretórios dos componentes e Dockerfiles
  # O código-fonte do Multiflow DEVE estar em $INST_DIR/multiflow_source
  # Os Dockerfiles DEVE estar em $INST_DIR/dockerfiles

  docker build -t "$IMG_BACKEND" -f "$INST_DIR/dockerfiles/Dockerfile_backend" "$INST_DIR/multiflow_source/backend"
  docker build -t "$IMG_TRANSCRICAO" -f "$INST_DIR/dockerfiles/Dockerfile_apitranscricao" "$INST_DIR/multiflow_source/api_transcricao"
  docker build -t "$IMG_FRONTEND" -f "$INST_DIR/dockerfiles/Dockerfile_frontend" "$INST_DIR/multiflow_source/frontend"
  docker build -t "$IMG_OFICIAL" -f "$INST_DIR/dockerfiles/Dockerfile_apioficial" "$INST_DIR/multiflow_source/api_oficial"
  echo "[OK] Imagens Docker construídas a partir do código-fonte local."
}

validate_name() {
  [[ "$1" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]
}

generate_compose() {
  local INST="$1"

  read -p "Domínio FRONTEND (ex: https://app.exemplo.com): " FRONTEND_DOMAIN
  read -p "Domínio BACKEND  (ex: https://api.exemplo.com): " BACKEND_DOMAIN
  read -p "Porta externa PostgreSQL: "   PORT_DB
  read -p "Porta externa Redis: "        PORT_REDIS
  read -p "Porta externa PgBouncer: "    PORT_PG
  read -p "Porta externa Transcrição: "  PORT_TR
  read -p "Porta externa BACKEND: "      PORT_BE
  read -p "Porta externa FRONTEND: "     PORT_FE
  read -p "Porta externa API OFICIAL: "  PORT_OFICIAL

  # Solicitar credenciais e segredos
  read -p "Usuário do Banco de Dados: " DB_USER
  read -s -p "Senha do Banco de Dados: " DB_PASS
  echo
  read -p "Nome do Banco de Dados: " DB_NAME
  read -s -p "JWT Secret (Backend): " JWT_SECRET
  echo
  read -s -p "JWT Refresh Secret (Backend): " JWT_REFRESH_SECRET
  echo
  read -s -p "Token da API Oficial: " TOKEN_API_OFICIAL
  echo

  local DIR="$BASE_PATH/$INST"
  mkdir -p "$DIR/volumes/banco" "$DIR/volumes/redis"
  cd "$DIR"

  cat > docker-compose.yml <<EOF
version: '3.9'
services:
  redis:
    image: redis:latest
    container_name: redis_container_${INST}
    volumes:
      - ./volumes/redis:/data
    ports:
      - "${PORT_REDIS}:6379"
    environment:
      - TZ=America/Sao_Paulo
    networks:
      - net_${INST}

  postgres:
    image: postgres:17
    container_name: postgres_container_${INST}
    volumes:
      - ./volumes/banco:/var/lib/postgresql/data
    ports:
      - "${PORT_DB}:5432"
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASS}
      - POSTGRES_DB=${DB_NAME}
      - TZ=America/Sao_Paulo
    command: >
      postgres -c shared_buffers=256MB
               -c effective_cache_size=768MB
               -c maintenance_work_mem=64MB
               -c checkpoint_completion_target=0.9
               -c wal_buffers=16MB
               -c default_statistics_target=100
    networks:
      - net_${INST}

  pgbouncer:
    image: edoburu/pgbouncer:1.21.0-p2
    container_name: pgbouncer_container_${INST}
    restart: always
    ports:
      - "${PORT_PG}:6432"
    environment:
      DB_HOST: postgres_container_${INST}
      DB_USER: ${DB_USER}
      DB_PASSWORD: "${DB_PASS}"
      AUTH_TYPE: scram-sha-256
      TZ: America/Sao_Paulo
    networks:
      - net_${INST}

  backend:
    image: ${IMG_BACKEND}
    container_name: backend_node_${INST}
    working_dir: /app
    restart: always
    ports:
      - "${PORT_BE}:${PORT_BE}"
    environment:
      - TZ=America/Sao_Paulo
      - NODE_ENV=production
      - BACKEND_URL=${BACKEND_DOMAIN}
      - FRONTEND_URL=${FRONTEND_DOMAIN}
      - PORT=${PORT_BE}
      - DB_DIALECT=postgres
      - DB_HOST=pgbouncer_container_${INST}
      - DB_PORT=6432
      - DB_USER=${DB_USER}
      - DB_PASS=${DB_PASS}
      - DB_NAME=${DB_NAME}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - REDIS_URI=redis://redis_container_${INST}:6379
      - TRANSCRIBE_URL=http://trascricao_node_${INST}:4002
      - WEBHOONKS_N8N=true
    networks:
      - net_${INST}

  frontend:
    image: ${IMG_FRONTEND}
    container_name: frontend_node_${INST}
    restart: always
    ports:
      - "${PORT_FE}:80"
    environment:
      - TZ=America/Sao_Paulo
      - REACT_APP_BACKEND_URL=${BACKEND_DOMAIN}
    networks:
      - net_${INST}

  transcricao:
    image: ${IMG_TRANSCRICAO}
    container_name: trascricao_node_${INST}
    restart: always
    ports:
      - "${PORT_TR}:4002"
    environment:
      - TZ=America/Sao_Paulo
    networks:
      - net_${INST}

  api_oficial:
    image: ${IMG_OFICIAL}
    container_name: oficial_node_${INST}
    working_dir: /app
    restart: always
    ports:
      - "${PORT_OFICIAL}:${PORT_OFICIAL}"
    environment:
      - PORT=${PORT_OFICIAL}
      - TOKEN_API_OFICIAL=${TOKEN_API_OFICIAL}
    networks:
      - net_${INST}

networks:
  net_${INST}:
    driver: bridge
EOF

  echo "[OK] docker-compose.yml gerado em $DIR"
  echo "[INFO] Subindo containers em background..."
  docker-compose up -d
  echo "[PRONTO] Instalação e deploy concluídos."
}
# -------------------------------------------------------------------

# EXECUÇÃO
install_docker
install_compose

read -p "Nome da instância (apenas letras, números, _, . e -): " NAME
if ! validate_name "$NAME"; then
  echo "✖ Nome inválido." >&2
  exit 1
fi

# Diretório base para a instância
INSTANCE_BASE_DIR="$BASE_PATH/$NAME"
mkdir -p "$INSTANCE_BASE_DIR"

# Criar diretórios para o código-fonte e Dockerfiles
mkdir -p "$INSTANCE_BASE_DIR/multiflow_source/backend"
mkdir -p "$INSTANCE_BASE_DIR/multiflow_source/frontend"
mkdir -p "$INSTANCE_BASE_DIR/multiflow_source/api_oficial"
mkdir -p "$INSTANCE_BASE_DIR/multiflow_source/api_transcricao"
mkdir -p "$INSTANCE_BASE_DIR/dockerfiles"

# Copiar os Dockerfiles ajustados para o diretório de dockerfiles da instância
# Os Dockerfiles devem estar no mesmo diretório do script deploy_fastalk.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/Dockerfile_apioficial" "$INSTANCE_BASE_DIR/dockerfiles/Dockerfile_apioficial"
cp "$SCRIPT_DIR/Dockerfile_apitranscricao" "$INSTANCE_BASE_DIR/dockerfiles/Dockerfile_apitranscricao"
cp "$SCRIPT_DIR/Dockerfile_backend" "$INSTANCE_BASE_DIR/dockerfiles/Dockerfile_backend"
cp "$SCRIPT_DIR/Dockerfile_frontend" "$INSTANCE_BASE_DIR/dockerfiles/Dockerfile_frontend"

# Agora, construa as imagens a partir do código-fonte local
build_local_images "$INSTANCE_BASE_DIR"

generate_compose "$NAME"


