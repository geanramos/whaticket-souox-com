git pull

echo "Atualizando dependências do Node.js..."
npm install

echo "Contruindo a aplicação novamente"
npm run build

echo "Iniciando a API"
pm2 start dist/main.js --name=api_oficial