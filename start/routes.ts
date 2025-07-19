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
  return controller.createCreditCardPreference(ctx);
})

router.get('/payment/:id', async (ctx) => {
  addCorsHeaders(ctx)
  const controller = new PaymentsController()
  return controller.getPayment(ctx);
})

router.post('/webhook/mercadopago', async (ctx) => {
  const controller = new PaymentsController()
  return controller.handleWebhook(ctx)
})
