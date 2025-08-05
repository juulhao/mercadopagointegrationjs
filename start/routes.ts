/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import PaymentsController from '#controllers/payments_controller'
import router from '@adonisjs/core/services/router'
import { HttpContext } from '@adonisjs/core/http'

// Função para adicionar headers CORS
function addCorsHeaders(ctx: HttpContext) {
  ctx.response.header('Access-Control-Allow-Origin', '*')
  ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
  ctx.response.header('Access-Control-Allow-Credentials', 'true')
}

// Servir página principal
router.get('/', async (ctx) => {
  addCorsHeaders(ctx)
  return ctx.response.redirect('/index.html')
})

// Rota OPTIONS para lidar com preflight CORS em rotas específicas
router.route('*', ['OPTIONS'], async (ctx: HttpContext) => {
  addCorsHeaders(ctx)
  ctx.response.status(200)
  return ctx.response.send('')
})

// === NOVAS ROTAS PARA PAYMENT BRICK ===
// Criar preferência para Payment Brick
router.post('/api/create-preference', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new PaymentsController()
  return controller.createPreference(ctx);
})

// Processar pagamento via Payment Brick
router.post('/api/process-payment', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new PaymentsController()
  return controller.processPayment(ctx);
})

// === ROTAS ANTIGAS (MANTIDAS PARA COMPATIBILIDADE) ===
router.post('/payment', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new PaymentsController()
  return controller.directToMercadoLivreCheckoutPayments(ctx);
})

router.get('/payment/external/:external_reference', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new PaymentsController()
  return controller.getPaymentsByExternalReference(ctx);
})

// Rota de busca por external reference (como mencionado na documentação)
router.get('/mercadopago/external-ref/:external_reference', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new PaymentsController()
  return controller.getPaymentsByExternalReference(ctx);
})

// === PÁGINAS DE RESULTADO ===
router.get('/success', async (ctx) => {
  addCorsHeaders(ctx)
  const paymentId = ctx.request.qs().payment_id
  return `
    <html>
      <head>
        <title>Pagamento Aprovado</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; background: #f0f8f0; }
          .success { color: #00a650; font-size: 2rem; margin-bottom: 20px; }
          .details { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="details">
          <div class="success">✅ Pagamento Aprovado!</div>
          <p>Seu pagamento foi processado com sucesso.</p>
          ${paymentId ? `<p><strong>ID do Pagamento:</strong> ${paymentId}</p>` : ''}
          <button onclick="window.location.href='/'" style="background: #00a650; color: white; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 1rem;">
            🏠 Voltar à Loja
          </button>
        </div>
      </body>
    </html>
  `
})

router.get('/failure', async (ctx) => {
  addCorsHeaders(ctx)
  return `
    <html>
      <head>
        <title>Pagamento Rejeitado</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; background: #fff0f0; }
          .error { color: #dc3545; font-size: 2rem; margin-bottom: 20px; }
          .details { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="details">
          <div class="error">❌ Pagamento Rejeitado</div>
          <p>Não foi possível processar seu pagamento.</p>
          <p>Verifique os dados e tente novamente.</p>
          <button onclick="window.location.href='/'" style="background: #dc3545; color: white; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 1rem;">
            🔄 Tentar Novamente
          </button>
        </div>
      </body>
    </html>
  `
})

router.get('/pending', async (ctx) => {
  addCorsHeaders(ctx)
  return `
    <html>
      <head>
        <title>Pagamento Pendente</title>
        <style>
          body { font-family: Arial; text-align: center; padding: 50px; background: #f8f9fa; }
          .pending { color: #ffc107; font-size: 2rem; margin-bottom: 20px; }
          .details { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="details">
          <div class="pending">⏳ Pagamento Pendente</div>
          <p>Seu pagamento está sendo processado.</p>
          <p>Você receberá uma confirmação em breve.</p>
          <button onclick="window.location.href='/'" style="background: #ffc107; color: #212529; border: none; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-size: 1rem;">
            🏠 Voltar à Loja
          </button>
        </div>
      </body>
    </html>
  `
})

// === WEBHOOK (SEM CORS PARA RECEBER DO MERCADO PAGO) ===

router.post('/webhook/mercadopago', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new PaymentsController()
  return controller.handleWebhook(ctx);
})

router.put('/payment/external/:external_reference', async (ctx) => {
  addCorsHeaders(ctx) 
  const controller = new PaymentsController()
  return controller.refreshPaymentStatus(ctx);
});

