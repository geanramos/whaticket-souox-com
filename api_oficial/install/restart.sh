git pull

echo "Atualizando dependências do Node.js..."
npm install

echo "Contruindo a aplicação novamente"
npm run build

echo "Reiniciando a API"
pm2 restart all