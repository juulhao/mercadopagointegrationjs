# 🔥 Guia de Produção - Mercado Pago Integration

## ⚠️ **CHECKLIST ANTES DE IR PARA PRODUÇÃO**

### **1. 🔑 Credenciais de Produção**
- [ ] Obter credenciais de produção no [Painel Mercado Pago](https://www.mercadopago.com.br/developers/panel/app)
- [ ] Substituir `MP_ACCESS_TOKEN` e `MP_PUBLIC_KEY` no `.env`
- [ ] Verificar se as credenciais começam com `APP_USR-`
- [ ] Configurar `NODE_ENV=production`

### **2. 🌐 Domínio e SSL**
- [ ] Configurar domínio próprio (ex: `api.seusite.com`)
- [ ] Certificado SSL válido (HTTPS obrigatório)
- [ ] Configurar webhook URL no painel do Mercado Pago

### **3. 🔒 Segurança**
- [ ] Implementar validação de assinatura do webhook
- [ ] Configurar CORS apenas para domínios específicos
- [ ] Implementar rate limiting
- [ ] Logs de segurança habilitados

### **4. 💾 Banco de Dados**
- [ ] Configurar banco de dados para armazenar pedidos
- [ ] Implementar controle de transações
- [ ] Backup e recovery configurados

### **5. 🔔 Monitoramento**
- [ ] Logs centralizados
- [ ] Alertas para erros
- [ ] Métricas de performance
- [ ] Monitoramento de disponibilidade

## 🛠️ **Configuração de Produção**

### **1. Variáveis de Ambiente (.env)**

```bash
# Produção
NODE_ENV=production
PORT=3333
HOST=0.0.0.0

# Mercado Pago - PRODUÇÃO
MP_ACCESS_TOKEN=APP_USR-seu_access_token_aqui
MP_PUBLIC_KEY=APP_USR-sua_public_key_aqui

# URLs de retorno (substitua pelo seu domínio)
SUCCESS_URL=https://seusite.com/pagamento/sucesso
FAILURE_URL=https://seusite.com/pagamento/erro
PENDING_URL=https://seusite.com/pagamento/pendente

# Webhook
WEBHOOK_URL=https://api.seusite.com/webhook/mercadopago
```

### **2. Configuração no Painel Mercado Pago**

1. **Acesse:** [https://www.mercadopago.com.br/developers/panel/app](https://www.mercadopago.com.br/developers/panel/app)

2. **Configure o Webhook:**
   ```
   URL: https://api.seusite.com/webhook/mercadopago
   Eventos: payment, plan, subscription
   ```

3. **Obtenha as Credenciais:**
   - Access Token (APP_USR-...)
   - Public Key (APP_USR-...)

### **3. Validações Obrigatórias em Produção**

#### **Items do Pagamento:**
```json
{
  "items": [
    {
      "id": "produto_001",           // ✅ Obrigatório
      "title": "Nome do Produto",    // ✅ Obrigatório
      "quantity": 1,                 // ✅ Obrigatório > 0
      "unit_price": 29.90,          // ✅ Obrigatório > 0
      "currency_id": "BRL"          // ✅ Obrigatório
    }
  ]
}
```

#### **Dados do Pagador:**
```json
{
  "payer": {
    "email": "cliente@email.com",    // ✅ Obrigatório e válido
    "name": "João",                  // ✅ Recomendado
    "surname": "Silva",              // ✅ Recomendado
    "identification": {
      "type": "CPF",                 // ✅ Obrigatório para BR
      "number": "12345678909"        // ✅ Obrigatório
    },
    "phone": {
      "area_code": "11",
      "number": "999999999"
    }
  }
}
```

### **4. URLs de Retorno Personalizadas**

```json
{
  "back_urls": {
    "success": "https://seusite.com/pagamento/sucesso?ref={{external_reference}}",
    "failure": "https://seusite.com/pagamento/erro?ref={{external_reference}}",
    "pending": "https://seusite.com/pagamento/pendente?ref={{external_reference}}"
  },
  "auto_return": "approved"
}
```

## 🔒 **Implementações de Segurança**

### **1. Validação de Assinatura do Webhook**

```typescript
// TODO: Implementar no PaymentsController
private validateWebhookSignature(body: string, signature: string): boolean {
  const secret = env.get('MP_WEBHOOK_SECRET');
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return hash === signature;
}
```

### **2. Rate Limiting**

```typescript
// middleware/rate_limit.ts
import { HttpContext } from '@adonisjs/core/http'

export default class RateLimitMiddleware {
  async handle(ctx: HttpContext, next: Function) {
    // Implementar controle de taxa
    await next()
  }
}
```

### **3. CORS Restritivo**

```typescript
// config/cors.ts - Para produção
export default defineConfig({
  enabled: true,
  origin: [
    'https://seusite.com',
    'https://www.seusite.com'
  ],
  methods: ['GET', 'POST'],
  headers: true,
  credentials: true
})
```

## 📊 **Exemplo de Integração Frontend (Produção)**

```javascript
// Frontend - Criar pagamento
async function createPayment(orderData) {
  try {
    const response = await fetch('https://api.seusite.com/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer seu_token_frontend' // Se necessário
      },
      body: JSON.stringify({
        items: orderData.items,
        payer: {
          email: orderData.customerEmail,
          name: orderData.customerName,
          surname: orderData.customerSurname,
          identification: {
            type: "CPF",
            number: orderData.customerCPF
          }
        },
        external_reference: orderData.orderId,
        shipping_cost: orderData.shippingCost,
        back_urls: {
          success: `https://seusite.com/pedido/${orderData.orderId}/sucesso`,
          failure: `https://seusite.com/pedido/${orderData.orderId}/erro`,
          pending: `https://seusite.com/pedido/${orderData.orderId}/pendente`
        }
      })
    });

    const result = await response.json();
    
    if (result.environment === 'production') {
      // Redirecionar para checkout real
      window.location.href = result.checkout_url;
    }
    
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
  }
}
```

## 🚀 **Deploy e Monitoramento**

### **1. Deploy**
```bash
# Build da aplicação
npm run build

# Start em produção
npm start

# Ou com PM2
pm2 start ecosystem.config.js
```

### **2. Logs**
```bash
# Monitorar logs em tempo real
tail -f logs/app.log

# Logs do Mercado Pago especificamente
grep "MERCADO PAGO" logs/app.log
```

### **3. Health Check**
```bash
# Verificar se a API está respondendo
curl https://api.seusite.com/

# Testar webhook
curl -X POST https://api.seusite.com/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"test"}}'
```

## ⚠️ **Diferenças Produção vs Sandbox**

| Aspecto | Sandbox | Produção |
|---------|---------|-----------|
| **Credenciais** | TEST-... | APP_USR-... |
| **Checkout URL** | sandbox.mercadopago.com.br | www.mercadopago.com.br |
| **Pagamentos** | Falsos/Simulados | Reais com cobrança |
| **Cartões** | Dados de teste específicos | Cartões reais dos clientes |
| **Webhook** | Opcional para testes | Obrigatório para produção |
| **SSL** | Opcional | Obrigatório |
| **Validações** | Básicas | Completas e rigorosas |

## 🎯 **Próximos Passos**

1. **Obter credenciais de produção** no painel do Mercado Pago
2. **Configurar domínio com SSL** 
3. **Atualizar .env** com credenciais reais
4. **Testar com pequenos valores** primeiro
5. **Implementar monitoramento** completo
6. **Configurar backup** de dados
7. **Documentar** processos operacionais

---

**⚠️ IMPORTANTE:** Sempre teste extensivamente no sandbox antes de ir para produção!
