import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware de CORS no formato correto para AdonisJS
 */
export default function corsMiddleware() {
  return async (ctx: HttpContext, next: NextFn) => {
    // Adicionar headers CORS
    ctx.response.header('Access-Control-Allow-Origin', '*')
    ctx.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    ctx.response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
    ctx.response.header('Access-Control-Allow-Credentials', 'true')
    ctx.response.header('Access-Control-Max-Age', '86400')

    // Se for uma requisição OPTIONS (preflight), responder imediatamente
    if (ctx.request.method() === 'OPTIONS') {
      ctx.response.status(200)
      return ctx.response.send('')
    }

    // Continuar com o próximo middleware
    await next()
  }
}
