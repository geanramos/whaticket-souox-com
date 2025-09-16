
# Tutorial de Instalação API Whatsapp Oficial

Abaixo você vai ver passo a passo como fazer a instalação da API para receber e enviar mensagens do WhatsApp Oficial da Meta


## Requisitos

Maior parte das dependencias serão instaladas automaticamente com ajuda dos scripts

* VPS
* Node 20
* Prisma
* Docker
* Docker Compose
* Nginx
* Certbot
* PM2
## Primeiros Passos

Após se conectar na sua vps, é necessário gerar uma chave SSH para clonar este repositorio na sua VPS, siga os passos abaixo.

```bash
  ssh-keygen
```

Apos digitar isto no terminal de enter e continue ate que mostre uma mensagem parecida

``` bash
The key's randomart image is:
+---[RSA 3072]----+
|        .o +.o.Eo|
|        .oo +.ooo|
|        o o. =...|
|         + ++.o. |
|        S =.o+. o|
|       ........+ |
|       ooo.o. .  |
|     .=+=oo.oo   |
|     .+Bo. .o..  |
+----[SHA256]-----+
```

Após receber esta mensagem, digite os códigos abaixo.

``` bash
eval $(ssh-agent)
```

``` bash
ssh-add ~/.ssh/id_rsa
```

``` bash
cat ~/.ssh/id_rsa.pub
```

Copie o conteudo mostrado na tela e guarde.

Clique no link abaixo, apos a página carregar clique que está no canto superior esquerdo "New SSH Key", coloque um nome no "Title", cole o conteudo que foi copiado no passo anterior e cole no campo "key" e confirme.

- [Pagina do Github](https://github.com/settings/keys)

Depois disso sua chave SSH já está configurada no servidor, agora vamos clonar o repositorio.

Digite o comando no seu servidor agora

``` bash
sudo apt install -y git
```

Este comando vai instalar o git no seu servidor, agora vamos clonar o projeto

``` bash
cd ~
```

Digite o comando abaixo para voltar para a pasta principal do seu servidor

Entre na pasta do servidor

Crie o arquivo .env usando o comando abaixo

```
sudo nano .env
```

Copie e preencha conforme descrito dentro do .env

```
DATABASE_LINK="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_URL}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public"
DATABASE_URL="api.example.com.br"
DATABASE_PORT="5432"
DATABASE_USER="NOME DO SEU USUÁRIO DO BANCO"
DATABASE_PASSWORD="SENHA DO SEU USUÁRIO DO BANCO"
DATABASE_NAME="NOME DO BANCO DE DADOS"
TOKEN_ADMIN="TOKEN DA APLICAÇÃO"
RABBITMQ_URL="amqp://rabbitmq"
URL_BACKEND_MULT100="URL DA SUA API DO MULT100"
REDIS_URI=redis://:senha@IP_DO_SERVER:6379
```

Vamos rodar os arquivos para lhe auxiliar na instalação, estes arquivos vão instalar dependencias necessárias para o projeto.

Para isso tu precisa dar as permissões para os arquivos, digite os comando abaixo

```
chmod +x install/init.sh
```

```
chmod +x install/start.sh
```

Assim nos criamos arquivos que o seu sistema operacional vai entender que precisam ser executados

```
./install/init.sh
```

```
./install/start.sh
```
## Documentação da API

Para está API existe uma documentação que você pode usar como referencia ou passar para alguém se conectar com sua API para usar este serviço.

A url desta API sempre sera o seu dominio /swagger

```
Exemplo:

api.oficial.com.br/swagger
```

Onde temos o texto "api.oficial.com.br" coloque o seu dominio.

Abaixo também vou deixar um passo a passo para chamar as requisições
## Usando a API

Para utilizar está API após terminar a instalação você ira precisar instalar o Postman ou outro software parecido.


- [Postman](https://www.postman.com/downloads/)

Após realizar o download do Postman, va em import e cole o link abaixo

```
https://api.postman.com/collections/8351387-31ce44bc-39d8-4844-969e-da685f1a1032?access_key=PMAT-01HZN852WQXPHQAQX6SNJ0M1EG
```

Configure sua environments, crie uma nova, coloque qualquer nome que quiser, na a direta você pode criar as variaveis.

Crie uma chamada "url" sem as aspas duplas e cole o seu dominio

Ex: https://api.oficial.com.br

Crie um outro campo chamado "token" sem as aspas duplas e apos chamar a rota de login copie e cole seu token

OBS: atenção para que consiga usar tem que colocar os valores nos campos "Initial Value" e "Current Value"

## Autores

- [@gustavosilvarossi](https://github.com/gustavosilvarossi)

