# 🛒 MercadoPago Integration - Checkout Pro

Integração completa do MercadoPago com AdonisJS incluindo **Checkout Pro** com redirecionamento automático e **Webhook** para notificações.

## 🚀 Funcionalidades

- ✅ **Checkout Pro** - Redirecionamento para site do MercadoPago
- ✅ **Webhooks** - Notificações automáticas de pagamento
- ✅ **URLs de Retorno** - Success, Failure e Pending
- ✅ **Busca por Referência Externa** - Consulta de pagamentos
- ✅ **Suporte a Frete** - Adição de custos de envio
- ✅ **CORS** - Configurado para requisições cross-origin
- ✅ **TypeScript** - Tipagem completa
- ✅ **Logs Detalhados** - Debug completo das operações

## 📋 Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Conta no [MercadoPago Developers](https://www.mercadopago.com.br/developers)
- Credenciais de TEST (sandbox)

## ⚙️ Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
TZ=UTC
PORT=3333
HOST=localhost
LOG_LEVEL=info
APP_KEY=um-app-key-muito-seguro-de-32-caracteres-aqui
NODE_ENV=development

# MercadoPago - CREDENCIAIS DE TESTE
MP_ACCESS_TOKEN=TEST-your-access-token-here
MP_PUBLIC_KEY=TEST-your-public-key-here
```

> **⚠️ IMPORTANTE**: Use sempre credenciais de **TEST** para desenvolvimento!

### 3. Obter Credenciais do MercadoPago

1. Acesse [MercadoPago Developers](https://www.mercadopago.com.br/developers)
2. Vá em **Suas aplicações** → **Criar aplicação**
3. Configure sua aplicação e obtenha as credenciais de **TEST**
4. Substitua no arquivo `.env`

## 🏃‍♂️ Como Executar

### Opção 1: Script PowerShell (Windows)
```powershell
.\start-server.ps1
```

### Opção 2: Script Bash (Linux/Mac)
```bash
./start-server.sh
```

### Opção 3: Manual
```bash
npm run dev
```

O servidor estará disponível em: **http://localhost:3333**

## 🧪 Como Testar

### 1. Teste Básico de Conectividade

```bash
curl http://localhost:3333/
```

### 2. Teste com Página HTML

1. Abra o arquivo `checkout-pro-example.html` no navegador
2. Preencha os dados do produto e comprador
3. Clique em "Ir para Checkout do Mercado Pago"
4. Complete o pagamento no sandbox
5. Será redirecionado de volta para a aplicação

### 3. Teste via API

```bash
curl -X POST http://localhost:3333/checkout-pro/create \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "produto-1",
        "title": "MEMBRANA P/ ELETROLUX MEF41",
        "quantity": 1,
        "unit_price": 30.00,
        "currency_id": "BRL"
      }
    ],
    "payer": {
      "email": "comprador-teste@example.com",
      "name": "João",
      "surname": "Silva"
    },
    "external_reference": "PEDIDO-2024-001",
    "shipping_cost": 15.50
  }'
```

## 📡 Endpoints Disponíveis

### Checkout Pro

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/checkout-pro/create` | Criar preferência de pagamento |
| `GET` | `/checkout-pro/success` | Página de sucesso |
| `GET` | `/checkout-pro/failure` | Página de erro |
| `GET` | `/checkout-pro/pending` | Página de pendente |

### Webhooks

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/webhook/mercadopago` | Webhook geral |
| `POST` | `/checkout-pro/webhook` | Webhook específico Checkout Pro |

### Consultas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/mercadopago/external-ref/:id` | Buscar por referência externa |

## 🔔 Webhooks

### Configuração ngrok (Para Testes)

1. Instale o ngrok: `npm install -g ngrok`
2. Execute: `ngrok http 3333`
3. Use a URL HTTPS gerada como `notification_url`

### Estrutura do Webhook

```json
{
  "id": 12345,
  "live_mode": false,
  "type": "payment",
  "date_created": "2024-01-01T00:00:00Z",
  "application_id": 123,
  "user_id": 456,
  "version": 1,
  "api_version": "v1",
  "action": "payment.updated",
  "data": {
    "id": "789"
  }
}
```

## 🛡️ Fluxo de Redirecionamento

### 1. Criação da Preferência
```
Cliente → Backend → MercadoPago API
                 ← Preference ID + init_point
```

### 2. Redirecionamento para Pagamento
```
Cliente → MercadoPago Checkout → Pagamento
```

### 3. Retorno após Pagamento
```
MercadoPago → Backend (success/failure/pending)
           → Cliente (JSON response)
```

### 4. Notificação via Webhook
```
MercadoPago → Backend (/webhook/mercadopago)
           → Processamento interno
```

## 🧾 Estrutura de Dados

### Criação de Preferência

```json
{
  "items": [
    {
      "id": "produto-1",
      "title": "Nome do Produto",
      "quantity": 1,
      "unit_price": 30.00,
      "currency_id": "BRL"
    }
  ],
  "payer": {
    "email": "comprador@example.com",
    "name": "Nome",
    "surname": "Sobrenome"
  },
  "external_reference": "PEDIDO-123",
  "shipping_cost": 15.50,
  "back_urls": {
    "success": "http://localhost:3333/checkout-pro/success",
    "failure": "http://localhost:3333/checkout-pro/failure",
    "pending": "http://localhost:3333/checkout-pro/pending"
  },
  "auto_return": "approved",
  "notification_url": "http://localhost:3333/webhook/mercadopago"
}
```

### Resposta da Preferência

```json
{
  "success": true,
  "preference_id": "123456789-a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6",
  "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  "sandbox_init_point": "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  "checkout_url": "https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=...",
  "external_reference": "PEDIDO-123",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Troubleshooting

### Erro: "Invalid credentials"
- Verifique se as credenciais no `.env` estão corretas
- Certifique-se de usar credenciais de **TEST**

### Erro: "CORS"
- O CORS está configurado automaticamente
- Verifique se os headers estão sendo enviados corretamente

### Webhook não recebe notificações
- Use ngrok para expor sua aplicação local
- Configure a URL pública como `notification_url`
- Verifique se a URL está acessível externamente

### Redirecionamento não funciona
- Verifique se as `back_urls` estão corretas
- Certifique-se de que o servidor está rodando na porta configurada

## 📚 Documentação

- [MercadoPago Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing)
- [MercadoPago Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/webhooks)
- [AdonisJS Documentation](https://docs.adonisjs.com/)

## 📁 Estrutura do Projeto

```
├── app/
│   └── controllers/
│       ├── payments_controller.ts      # Controller original com webhooks
│       └── checkout_pro_controller.ts  # Controller Checkout Pro
├── start/
│   └── routes.ts                      # Definição das rotas
├── config/
│   └── cors.ts                        # Configuração CORS
├── checkout-pro-example.html          # Página de teste
├── start-server.ps1                   # Script PowerShell
├── start-server.sh                    # Script Bash
└── README.md                          # Esta documentação
```

## 🤝 Suporte

Para dúvidas ou problemas:

1. Verifique os logs no console
2. Consulte a documentação oficial do MercadoPago
3. Teste com credenciais de sandbox primeiro

---

**✨ Desenvolvido com AdonisJS + TypeScript**
