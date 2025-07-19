import { HttpContext } from "@adonisjs/core/http";
import { MercadoPagoConfig, Preference } from "mercadopago";
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

    public async directToMercadoLivreCheckoutPayments(ctx: HttpContext) {
        try {
            const body = await ctx.request.body();
            console.log('Body received for payment:', body);

            const preferenceBody = {
                items: body.items,
                payer: body.payer,
                external_reference: body.external_reference,
                shipments: {
                    cost: body.shipping_cost,
                    mode: 'shipping_cost',
                },
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

    

}