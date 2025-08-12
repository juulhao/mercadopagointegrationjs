# MercadoPago Integration JS

Este projeto implementa uma integração completa com a API do MercadoPago, oferecendo suporte para diversas formas de pagamento, incluindo Checkout Pro, Checkout Bricks e PIX.

## Requisitos

- [Docker](https://www.docker.com/get-started) (recomendado para instalação rápida)
- [Docker Compose](https://docs.docker.com/compose/install/) (incluído no Docker Desktop para Windows/Mac)
- [Node.js](https://nodejs.org/) v16 ou superior (apenas necessário para desenvolvimento local)
- [npm](https://www.npmjs.com/) (incluído com Node.js)

## Executando com Docker

A maneira mais simples de executar este projeto é usando Docker, o que garante um ambiente consistente sem precisar instalar dependências localmente.

### Preparando o ambiente

1. Clone o repositório:
```bash
git clone https://github.com/juulhao/mercadopagointegrationjs.git
cd mercadopagointegrationjs
```

2. Configure o arquivo `.env` com suas credenciais do MercadoPago:
```
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=sua_app_key
MP_ACCESS_TOKEN=seu_token_de_acesso
MP_PUBLIC_KEY=sua_chave_publica
NODE_ENV=development
```

> **Nota**: Para obter suas credenciais do MercadoPago, acesse o [Painel do MercadoPago](https://www.mercadopago.com.br/developers/panel/credentials).

### Executando o projeto

1. Construa a imagem Docker:
```bash
docker compose build
```

2. Inicie o contêiner:
```bash
docker compose up
```

> Para executar em segundo plano, use o comando `docker compose up -d`

A aplicação estará disponível em [http://localhost:3333](http://localhost:3333).

### Parando o projeto

Para parar a execução do contêiner:
```bash
docker compose down
```

## Formas de Pagamento Suportadas

- **Checkout Pro**: Solução completa de checkout do MercadoPago
- **Checkout Bricks**: Componentes modulares para integração personalizada
- **PIX**: Pagamentos instantâneos

## Exemplos de Uso

O projeto inclui vários exemplos HTML para demonstrar diferentes integrações:

- `checkout-pro-example.html`: Exemplo do Checkout Pro
- `checkout-bricks-example.html`: Exemplo do Checkout Bricks
- `test-pix.html`: Exemplo de integração com PIX

## Documentação Adicional

O projeto inclui vários arquivos Markdown com informações adicionais:

- `FORMAS-PAGAMENTO-MERCADOPAGO.md`: Detalhes sobre as formas de pagamento suportadas
- `COMO-SABER-SE-PAGOU.md`: Guia para verificar o status dos pagamentos
- `WEBHOOK-GUIDE.md`: Guia para configuração de webhooks
- `PRODUCTION-GUIDE.md`: Guia para implantação em produção

## Desenvolvimento Local (sem Docker)

Se preferir desenvolver sem Docker:

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

## Estrutura do Projeto

- `app/controllers/`: Controladores da aplicação
  - `bricks_controller.ts`: Controlador para o Checkout Bricks
  - `checkout_pro_controller.ts`: Controlador para o Checkout Pro
  - `payments_controller.ts`: Controlador para processamento de pagamentos
- `public/`: Arquivos estáticos e exemplos HTML
- `start/routes.ts`: Definição de rotas da API

## Suporte e Contribuições

Para relatar problemas ou sugerir melhorias, abra uma issue no repositório.

## Licença

UNLICENSED - Todos os direitos reservados
