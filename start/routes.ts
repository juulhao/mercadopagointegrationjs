/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import PaymentsController from '#controllers/payments_controller'
import CheckoutProController from '#controllers/checkout_pro_controller'
import router from '@adonisjs/core/services/router'
import { HttpContext } from '@adonisjs/core/http'

// Função para adicionar headers CORS
function addCorsHeaders(ctx: HttpContext) {
  ctx.response.header('Access-Control-Allow-Origin', '*')
  ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
  ctx.response.header('Access-Control-Allow-Credentials', 'true')
}

router.get('/', async (ctx) => {
  addCorsHeaders(ctx)
  return 'It works!'
})
// Rota OPTIONS para lidar com preflight CORS em rotas específicas
router.route('*', ['OPTIONS'], async (ctx: HttpContext) => {
  addCorsHeaders(ctx)
  ctx.response.status(200)
  return ctx.response.send('')
})
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

// === ROTAS CHECKOUT PRO ===
// Criar preferência para Checkout Pro
router.post('/checkout-pro/create', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new CheckoutProController()
  return controller.createPreference(ctx);
})

// Páginas de redirecionamento após pagamento
router.get('/checkout-pro/success', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new CheckoutProController()
  return controller.success(ctx);
})

router.get('/checkout-pro/failure', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new CheckoutProController()
  return controller.failure(ctx);
})

router.get('/checkout-pro/pending', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new CheckoutProController()
  return controller.pending(ctx);
})

// Webhook específico para Checkout Pro (opcional)
router.post('/checkout-pro/webhook', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new CheckoutProController()
  return controller.webhook(ctx);
})

// Webhook geral do Mercado Pago
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

