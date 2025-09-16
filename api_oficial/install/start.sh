#!/bin/bash

# Parar a execução do script em caso de erro
set -e

# Solicitar o nome do domínio do usuário
read -p "Digite o nome do domínio (ex: whaticket.softforge.com.br): " DOMAIN_NAME

# Solicitar o e-mail do usuário
read -p "Digite o seu e-mail para o Certbot: " EMAIL

# Instalar dependências do Node.js
echo "Instalando dependências do Node.js..."
npm install

# Construir a aplicação
echo "Construindo a aplicação..."
npm run build

# Construir e iniciar os contêineres Docker
echo "Construindo e iniciando os contêineres Docker..."
docker-compose up --build -d

# Aguardar a inicialização dos contêineres Docker
echo "Aguardando a inicialização dos contêineres Docker..."
sleep 20 # Aguarda 20 segundos

# Verificar se os contêineres estão em execução
echo "Verificando se os contêineres estão em execução..."
while ! docker-compose ps | grep -q 'Up'; do
    echo "Aguardando os contêineres..."
    sleep 5
done

# Executar migrações do banco de dados
echo "Executando migrações do banco de dados..."
npx prisma migrate dev

echo "Criando cliente do banco de dados"
npx prisma generate client

# Iniciar a aplicação com PM2
echo "Iniciando a aplicação com PM2..."
pm2 start dist/main.js --name=api_oficial

# Exibir o status dos processos gerenciados pelo PM2
pm2 status

# Instalar Nginx
echo "Instalando Nginx..."
sudo apt update
sudo apt install -y nginx

# Configurar Nginx
echo "Configurando Nginx..."
NGINX_CONFIG="
server {
    server_name $DOMAIN_NAME;

    location / {
        proxy_pass http://127.0.0.1:6000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
"

echo "$NGINX_CONFIG" | sudo tee /etc/nginx/sites-available/whaticket
sudo ln -s /etc/nginx/sites-available/whaticket /etc/nginx/sites-enabled/

# Remover o link simbólico do arquivo de configuração padrão do Nginx, se existir
sudo rm -f /etc/nginx/sites-enabled/default

# Reiniciar Nginx para aplicar as mudanças
echo "Reiniciando Nginx..."
sudo systemctl restart nginx

# Instalar Certbot
echo "Instalando Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Obter e instalar o certificado SSL
echo "Obtendo e instalando o certificado SSL com Certbot..."
sudo certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $EMAIL

# Reiniciar Nginx para aplicar o certificado
echo "Reiniciando Nginx..."
sudo systemctl restart nginx

# Mensagem final de conclusão
echo "Deploy concluído com sucesso. Node.js, npm, PM2, Docker, Docker Compose, Nginx e Certbot foram instalados e configurados."
echo "Você pode precisar reiniciar o sistema ou fazer logout e login novamente para aplicar as mudanças de grupo do Docker."
