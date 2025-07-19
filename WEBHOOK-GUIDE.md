# Webhook do Mercado Pago - Guia de Implementação

## 📡 URL do Webhook

```
POST /webhook/mercadopago
```

## 🔧 Configuração no Mercado Pago

1. **Acesse o painel do Mercado Pago:**
   - Vá para [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
   - Entre na sua aplicação

2. **Configure o Webhook:**
   - Vá em "Webhooks" 
   - Adicione a URL: `https://seudominio.com/webhook/mercadopago`
   - Selecione os eventos que deseja receber

## 📋 Tipos de Notificação Suportados

### 1. **Payment** (Pagamentos)
- ✅ Aprovado
- ⏳ Pendente  
- ❌ Rejeitado
- 🚫 Cancelado

### 2. **Plan** (Planos de Assinatura)
- Criação, atualização e cancelamento de planos

### 3. **Subscription** (Assinaturas)
- Status de assinaturas recorrentes

### 4. **Invoice** (Faturas)
- Geração e pagamento de faturas

### 5. **Point Integration** (Integração de Pontos)
- Notificações do Mercado Pago Point

## 🔍 Exemplo de Payload - Payment

```json
{
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "123456789"
  },
  "date_created": "2025-07-19T18:00:00.000-04:00",
  "id": 12345,
  "live_mode": false,
  "type": "payment",
  "user_id": "813456204"
}
```

## 🧪 Como Testar

### 1. **Teste Local com ngrok:**

```bash
# Instalar ngrok
brew install ngrok

# Expor porta local
ngrok http 3333

# Usar a URL gerada no webhook: https://abc123.ngrok.io/webhook/mercadopago
```

### 2. **Teste Manual:**

```bash
curl -X POST http://localhost:3333/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "123456789"
    },
    "action": "payment.created"
  }'
```

## 🏗️ Implementação Customizada

Para adicionar sua lógica de negócio, edite os métodos:

- `handleApprovedPayment()` - Pagamento aprovado
- `handlePendingPayment()` - Pagamento pendente
- `handleRejectedPayment()` - Pagamento rejeitado
- `handleCancelledPayment()` - Pagamento cancelado

## 🔒 Segurança

### Validação de Assinatura (Recomendado)

```typescript
// TODO: Implementar validação de assinatura
private validateSignature(body: string, signature: string): boolean {
  const secret = env.get('MP_WEBHOOK_SECRET');
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}
```

### Headers Importantes

- `x-signature` - Assinatura do webhook
- `x-request-id` - ID único da requisição
- `user-agent` - Sempre "MercadoPago"

## 📊 Logs e Monitoramento

O webhook gera logs detalhados:

- 🔔 Recebimento do webhook
- 💰 Processamento de pagamentos
- ✅❌ Status de processamento
- 🔥 Erros e exceções

## ⚠️ Boas Práticas

1. **Sempre responder 200 OK** rapidamente
2. **Processar de forma assíncrona** se necessário
3. **Implementar idempotência** para evitar processamento duplicado
4. **Validar dados** antes de processar
5. **Logar tudo** para debug
6. **Não confiar apenas no webhook** - sempre buscar dados da API

## 🚀 Próximos Passos

1. Configure o webhook no painel do Mercado Pago
2. Teste com ngrok em desenvolvimento
3. Implemente sua lógica de negócio nos métodos handle*
4. Configure monitoramento em produção
5. Adicione validação de assinatura para segurança
