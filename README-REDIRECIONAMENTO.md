# 🔄 Redirecionamento Após Pagamento - Guia Completo

## 📋 Visão Geral

Este guia explica como implementar o redirecionamento automático do usuário após o processamento de pagamentos no MercadoPago. O sistema redireciona para páginas diferentes baseado no status do pagamento.

## 🚀 Como Funciona

### 1. **Fluxo de Redirecionamento**

```
Usuário envia pagamento
        ↓
Backend processa via MercadoPago
        ↓
Frontend recebe resposta com status
        ↓
Sistema determina URL de redirecionamento
        ↓
Usuário é redirecionado automaticamente
```

### 2. **Status de Pagamento e Redirecionamentos**

| Status | Descrição | URL de Redirecionamento |
|--------|-----------|------------------------|
| `approved` | Pagamento aprovado | `./pagamento-sucesso.html` |
| `pending` | Pagamento pendente/em análise | `./pagamento-pendente.html` |
| `rejected` | Pagamento rejeitado | `./pagamento-erro.html` |
| `cancelled` | Pagamento cancelado | `./pagamento-erro.html` |

## 💻 Implementação no Frontend

### 1. **Configuração das URLs** (frontend-example.html)

```html
<div class="form-group">
    <label>URL Sucesso:</label>
    <input type="text" id="successUrl" value="./pagamento-sucesso.html">
</div>
<div class="form-group">
    <label>URL Erro:</label>
    <input type="text" id="failureUrl" value="./pagamento-erro.html">
</div>
<div class="form-group">
    <label>URL Pendente:</label>
    <input type="text" id="pendingUrl" value="./pagamento-pendente.html">
</div>
```

### 2. **Função de Redirecionamento**

```javascript
function redirectAfterPayment(paymentStatus, paymentData) {
    const redirectUrls = getRedirectUrls();
    let redirectUrl = null;
    
    // Determinar URL baseado no status
    switch (paymentStatus) {
        case 'approved':
            redirectUrl = redirectUrls.success;
            break;
        case 'pending':
            redirectUrl = redirectUrls.pending;
            break;
        case 'rejected':
        case 'cancelled':
        default:
            redirectUrl = redirectUrls.failure;
    }

    // Adicionar parâmetros para tracking
    const urlParams = new URLSearchParams({
        payment_id: paymentData.id || 'unknown',
        status: paymentStatus,
        amount: paymentData.transaction_amount || '0',
        timestamp: new Date().toISOString()
    });
    
    const finalUrl = `${redirectUrl}?${urlParams.toString()}`;
    
    // Redirecionar após 3 segundos
    setTimeout(() => {
        window.location.href = finalUrl; // ← Descomente para ativar
    }, 3000);
}
```

### 3. **Integração com Processamento de Pagamento**

```javascript
async function processPayment(cardToken) {
    try {
        const response = await fetch(`${API_BASE_URL}/payment/credit-card`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();
        
        if (response.ok && result.id) {
            const paymentStatus = result.status || 'unknown';
            // Redirecionar baseado no status
            redirectAfterPayment(paymentStatus, result);
        } else {
            // Redirecionar para página de erro
            redirectAfterPayment('rejected', { 
                id: 'error', 
                transaction_amount: paymentData.amount 
            });
        }
    } catch (error) {
        // Redirecionar para página de erro em caso de falha de comunicação
        redirectAfterPayment('rejected', { 
            id: 'communication_error', 
            transaction_amount: paymentData.amount 
        });
    }
}
```

## 📄 Páginas de Destino

### 1. **Página de Sucesso** (`pagamento-sucesso.html`)

- ✅ Confirmação visual de sucesso
- 📄 Detalhes da transação
- 🖨️ Opção para imprimir comprovante
- 🏠 Link para voltar ao site
- 📧 Informações de contato

### 2. **Página de Erro** (`pagamento-erro.html`)

- ❌ Mensagem de erro clara
- 💡 Sugestões para resolver o problema
- 🔄 Botão para tentar novamente
- 📞 Informações de suporte

### 3. **Página de Pendente** (`pagamento-pendente.html`)

- ⏳ Status de processamento
- 📋 Próximos passos explicados
- 🔍 Opção para verificar status
- 🔄 Auto-refresh opcional (30s)

## 🔧 Configuração em Produção

### 1. **Ativar Redirecionamento Automático**

No arquivo `frontend-example.html`, descomente a linha:

```javascript
// Para produção, descomente a linha abaixo:
window.location.href = finalUrl; // ← Descomente esta linha
```

### 2. **URLs de Produção**

Altere as URLs padrão para suas páginas reais:

```javascript
success: 'https://www.suaempresa.com/pagamento-sucesso',
failure: 'https://www.suaempresa.com/pagamento-erro',
pending: 'https://www.suaempresa.com/pagamento-pendente'
```

### 3. **Parâmetros da URL**

As páginas de destino recebem os seguintes parâmetros:

- `payment_id`: ID do pagamento no MercadoPago
- `status`: Status do pagamento
- `amount`: Valor em centavos
- `timestamp`: Data/hora da transação

**Exemplo de URL final:**
```
https://www.suaempresa.com/pagamento-sucesso.html?payment_id=123456&status=approved&amount=10000&timestamp=2024-01-15T10:30:00.000Z
```

## 🧪 Testando o Redirecionamento

### 1. **Teste Local**

1. Abra `frontend-example.html` no navegador
2. Configure as URLs de redirecionamento (já vem com páginas locais)
3. Faça um pagamento de teste
4. Observe o redirecionamento após 3 segundos
5. Clique no botão "Testar Redirecionamento" para simular

### 2. **Diferentes Cenários de Teste**

- **Sucesso**: Use dados de cartão APRO
- **Rejeição**: Use dados de cartão inválidos
- **Erro de Comunicação**: Pare o servidor backend durante o teste

## 🔄 Fluxos Alternativos

### 1. **Redirecionamento Imediato**

```javascript
// Redirecionamento sem delay
window.location.href = finalUrl;
```

### 2. **Confirmação do Usuário**

```javascript
// Pedir confirmação antes de redirecionar
if (confirm('Deseja ir para a página de confirmação?')) {
    window.location.href = finalUrl;
}
```

### 3. **Abertura em Nova Aba**

```javascript
// Abrir em nova aba mantendo a atual
window.open(finalUrl, '_blank');
```

## 🎯 Melhores Práticas

### 1. **UX/UI**

- ✅ Mostre loading/feedback durante processamento
- ✅ Conte down visual antes do redirecionamento
- ✅ Forneça botão manual caso auto-redirect falhe
- ✅ Mantenha informações importantes visíveis

### 2. **Segurança**

- ✅ Validar parâmetros na página de destino
- ✅ Não confiar apenas em parâmetros GET
- ✅ Verificar status real via API se necessário
- ✅ Implementar rate limiting

### 3. **Monitoramento**

- ✅ Log de todos os redirecionamentos
- ✅ Tracking de conversão por status
- ✅ Monitorar erros de redirecionamento
- ✅ Analytics de abandono de carrinho

## 📧 Suporte

Para dúvidas sobre implementação:
- 📧 suporte@suaempresa.com
- 📞 (11) 1234-5678
- 💬 Chat ao vivo 24/7

---

**Última atualização:** Janeiro 2024  
**Versão:** 1.0.0
