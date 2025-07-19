import { HttpContext } from "@adonisjs/core/http";
import { MercadoPagoConfig, Payment, Preference } from "mercadopago";
import env from '#start/env'
const client = new MercadoPagoConfig({
    accessToken: env.get('MP_ACCESS_TOKEN')?.toString()!,
    options: { timeout: 5000 }, // Reduzindo timeout para ser mais rápido
});
const preference = new Preference(client);

export default class PaymentsController {

    public async getPayment(ctx: HttpContext) {
        const paymentId = ctx.params.id;
        console.log("Payment ID:", paymentId);
        try {
            const request = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${env.get('MP_ACCESS_TOKEN')?.toString()!}`,
                    'Content-Type': 'application/json'
                }
            });
            const response = await request.json();
            const { additional_info, status } = response as any;
            console.log("Payment Result:", additional_info.items);
            return ctx.response.json({
                items: additional_info.items,
                status: status
            });

        } catch (error: any) {
            console.error('=== PAYMENT ERROR ===');
            console.error('Error object:', error);
        }
    }

    public async createCreditCardPreference(ctx: HttpContext) {
        try {
            const body = ctx.request.body();

            const preferenceBody = {
                items: body.items,
                payer: body.payer,
                payment_methods: body.payment_methods,
                external_reference: body.external_reference,
                shipments: {
                    cost: body.shipping_cost,
                    mode: 'shipping',
                }
            };

            const result = await preference.create({ body: preferenceBody });
            ctx.response.status(201);

            return ctx.response.json({
                id: result.id,
                init_point: result.init_point,
                sandbox_init_point: result.sandbox_init_point,
                external_reference: result.external_reference
            });
        } catch (error: any) {
            console.error('=== PAYMENT PREFERENCE ERROR ===');
            console.error('Error object:', error);

            ctx.response.status(error.status || 500);
            return ctx.response.json({
                error: error.message || 'Unknown error',
                details: error.cause || [],
                apiResponse: error.apiResponse || null
            });
        }

    }
    
   public async handleWebhook(ctx: HttpContext) {
    const body = ctx.request.body();
    console.log('🔔 Webhook Mercado Pago recebido:', body);

    // Exemplo: tratar notificações de pagamento
    if (body.type === 'payment' || body.topic === 'payment') {
        const paymentId = body.data?.id || body['data.id'];
        if (paymentId) {
            // Aqui você pode buscar detalhes do pagamento e atualizar seu sistema
            // Exemplo:
            // await this.getPaymentByIdAndUpdateOrder(paymentId);
            console.log('Pagamento notificado:', paymentId);
        }
    }

    // Sempre responda 200 OK rapidamente!
    return ctx.response.status(200).send('OK');
}

}