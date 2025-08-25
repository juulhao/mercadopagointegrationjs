import { HttpContext } from "@adonisjs/core/http";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import env from '#start/env'

const client = new MercadoPagoConfig({
    accessToken: env.get('MP_ACCESS_TOKEN')?.toString()!,
    options: { timeout: 5000 },
});

const preference = new Preference(client);
const payment = new Payment(client);

export default class PaymentsController {

    /**
     * Detecta se está usando credenciais de produção ou teste
     */
    private isProductionEnvironment(): boolean {
        const accessToken = env.get('MP_ACCESS_TOKEN')?.toString() || '';
        return accessToken.startsWith('APP_USR-');
    }

    /**
     * Retorna a URL base correta baseada no ambiente
     */
    private getCheckoutUrl(): string {
        return this.isProductionEnvironment()
            ? 'https://www.mercadopago.com.br/checkout/v1/redirect'
            : 'https://sandbox.mercadopago.com.br/checkout/v1/redirect';
    }

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
            console.log('BODY DO PAGAMENTO:', body);

            // Adiciona campos para Checkout Pro
            const preferenceBody: any = {
                items: body.items,
                payer: body.payer,
                external_reference: body.external_reference,
                shipments: body.shipping_cost ? {
                    cost: body.shipping_cost,
                    mode: 'shipping_cost',
                } : undefined,
                payment_methods: {
                    excluded_payment_methods: [
                       {
                        "id": "bolbradesco"
                       }
                    ],
                    excluded_payment_types: [
                        {
                            "id": "ticket"
                        }
                    ],
                    installments: 2,
                    default_installments: 2
                },
                notification_url: this.isProductionEnvironment()
                    ? body.notification_url || 'https://seudominio.com/webhook/mercadopago'
                    : undefined,
                back_urls: {
                    success: body.back_urls?.success || 'https://example.com/success',
                    failure: body.back_urls?.failure || 'https://example.com/failure',
                    pending: body.back_urls?.pending || 'https://example.com/pending'
                },
                auto_return: "approved"
            };

            // Remove campos undefined
            Object.keys(preferenceBody).forEach(key => {
                if (preferenceBody[key] === undefined) delete preferenceBody[key];
            });

            const result = await preference.create({ body: preferenceBody });
            ctx.response.status(201);

            // Log mais detalhado para produção
            if (this.isProductionEnvironment()) {
                console.log('🔥 PRODUÇÃO - Preferência criada:', {
                    id: result.id,
                    external_reference: result.external_reference,
                    amount: body.items?.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0)
                });
            } else {
                console.log('🔥 TESTE - Pagamento criado:', result);
            }

            // Retornar URL correta baseada no ambiente
            const isProduction = this.isProductionEnvironment();

            return ctx.response.json({
                id: result.id,
                init_point: result.init_point,
                sandbox_init_point: result.sandbox_init_point,
                checkout_url: isProduction ? result.init_point : result.sandbox_init_point,
                external_reference: result.external_reference,
                environment: isProduction ? 'production' : 'sandbox',
                message: isProduction
                    ? '🔥 AMBIENTE DE PRODUÇÃO - Use dados reais para pagamento'
                    : 'Ambiente de TESTE - Use cartão 4509 9535 6623 3704, CVV 123, Validade 11/25'
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

    /**
     * Cria uma preferência para Payment Brick
     * Método usado pelo frontend para inicializar o Payment Brick
     */
    public async createPreference(ctx: HttpContext) {
        try {
            const body = await ctx.request.body();
            console.log('🎯 Criando preferência para Payment Brick:', body);

            const preferenceBody = {
                items: body.items,
                payer: body.payer,
                external_reference: body.external_reference,
                payment_methods: {
                    excluded_payment_methods: [
                        "bolbradesco"
                    ],
                    excluded_payment_types: [
                        "ticket"
                    ],
                    installments: 2,
                },
                notification_url: this.isProductionEnvironment()
                    ? body.notification_url || 'https://seudominio.com/webhook/mercadopago'
                    : 'https://7912abc4a211.ngrok-free.app/webhook/mercadopago',
                statement_descriptor: "Loja Eletronica",
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
            };

            const result = await preference.create({ body: preferenceBody });

            console.log('✅ Preferência criada para Payment Brick:', {
                id: result.id,
                external_reference: result.external_reference,
                environment: this.isProductionEnvironment() ? 'production' : 'sandbox'
            });

            return ctx.response.json({
                success: true,
                preference_id: result.id,
                public_key: env.get('MP_PUBLIC_KEY')?.toString(),
                environment: this.isProductionEnvironment() ? 'production' : 'sandbox'
            });

        } catch (error: any) {
            console.error('❌ Erro ao criar preferência para Payment Brick:', error);
            ctx.response.status(error.status || 500);
            return ctx.response.json({
                success: false,
                error: error.message || 'Erro ao criar preferência',
                details: error.cause || []
            });
        }
    }

    /**
     * Processa pagamento via Payment Brick
     * Recebe os dados do formulário do Payment Brick e cria o pagamento
     */
    public async processPayment(ctx: HttpContext) {
        try {
            const body = await ctx.request.body();
            console.log('💳 Processando pagamento via Payment Brick:', JSON.stringify(body, null, 2));

            // Preparar dados do pagamento baseado no tipo
            let paymentData: any = {
                transaction_amount: body.transaction_amount,
                description: body.description || 'Pagamento via Payment Brick',
                external_reference: body.external_reference,
                payer: {
                    email: body.payer?.email || body.formData?.payer?.email || 'test@example.com'
                }
            };

            // Extrair payment_method_id do formData se disponível
            const paymentMethodId = body.payment_method_id || body.formData?.payment_method_id;

            if (paymentMethodId) {
                paymentData.payment_method_id = paymentMethodId;

                // Para PIX
                if (paymentMethodId === 'pix') {
                    paymentData.payment_method_id = 'pix';
                    console.log('📱 Pagamento PIX detectado!');
                }

                // Para cartão de crédito/débito
                if (body.token || body.formData?.token) {
                    paymentData.token = body.token || body.formData.token;
                }

                // Informações do pagador para cartão
                if (body.payer || body.formData?.payer) {
                    const payerData = body.payer || body.formData.payer;
                    paymentData.payer = {
                        ...paymentData.payer,
                        identification: payerData.identification,
                        first_name: payerData.first_name,
                        last_name: payerData.last_name
                    };
                }

                // Parcelamento
                if (body.installments || body.formData?.installments) {
                    paymentData.installments = body.installments || body.formData.installments;
                }

                // Informações do emissor
                if (body.issuer_id || body.formData?.issuer_id) {
                    paymentData.issuer_id = body.issuer_id || body.formData.issuer_id;
                }
            } else {
                throw new Error('payment_method_id é obrigatório');
            }

            console.log('📤 Enviando dados para Mercado Pago:', JSON.stringify(paymentData, null, 2));

            // Criar pagamento
            const result = await payment.create({ body: paymentData });

            console.log('📨 Resposta do Mercado Pago:', JSON.stringify(result, null, 2));

            // Log específico por status
            switch (result.status) {
                case 'approved':
                    console.log('✅ Pagamento aprovado imediatamente!');
                    break;
                case 'pending':
                    if (result.payment_method_id === 'pix') {
                        console.log('📱 PIX gerado com sucesso!');
                    } else {
                        console.log('⏳ Pagamento pendente de confirmação');
                    }
                    break;
                case 'rejected':
                    console.log('❌ Pagamento rejeitado:', result.status_detail);
                    break;
            }

            // Retornar resultado para o frontend
            return ctx.response.json({
                success: true,
                id: result.id,
                status: result.status,
                status_detail: result.status_detail,
                payment_method_id: result.payment_method_id,
                transaction_amount: result.transaction_amount,
                external_reference: result.external_reference,
                point_of_interaction: result.point_of_interaction, // Para QR Code PIX
                date_created: result.date_created,
                date_approved: result.date_approved
            });

        } catch (error: any) {
            console.error('❌ Erro ao processar pagamento:', error);

            // Log detalhado do erro
            if (error.apiResponse) {
                console.error('Resposta da API:', JSON.stringify(error.apiResponse, null, 2));
            }

            ctx.response.status(error.status || 500);
            return ctx.response.json({
                success: false,
                error: error.message || 'Erro ao processar pagamento',
                details: error.cause || [],
                status_code: error.status || 500
            });
        }
    }

    /**
     * Webhook para receber notificações do Mercado Pago
     * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
     */
    public async handleWebhook(ctx: HttpContext) {
        try {
            const body = ctx.request.body();
            const headers = ctx.request.headers();

            console.log('🔔 === WEBHOOK MERCADO PAGO RECEBIDO ===');
            console.log('Headers:', JSON.stringify(headers, null, 2));
            console.log('Body:', JSON.stringify(body, null, 2));
            console.log('Query params:', ctx.request.qs());

            // Validar se é uma notificação válida do Mercado Pago
            if (!this.isValidMercadoPagoWebhook(body, headers)) {
                console.warn('⚠️ Webhook inválido ou não é do Mercado Pago');
                return ctx.response.status(400).json({ error: 'Invalid webhook' });
            }

            // Processar diferentes tipos de notificação
            switch (body.type || body.topic) {
                case 'payment':
                    await this.handlePaymentNotification(body, ctx);
                    break;
                case 'rejected':
                    console.log('🔴 Notificação de pagamento rejeitado recebida:', body);
                    await this.handlePaymentNotification(body, ctx);
                    break;
                case 'pending':
                    console.log('⏳ Notificação de pagamento pendente recebida:', body);
                    await this.handlePaymentNotification(body, ctx);
                default:
                    console.log(`📨 Tipo de notificação não tratada: ${body.type || body.topic}`);
                    break;
            }

            // Sempre responder 200 OK rapidamente para confirmar recebimento
            return ctx.response.status(200).json({
                status: 'received',
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error('🔥 === WEBHOOK ERROR ===');
            console.error('Error:', error);

            // Mesmo com erro, responder 200 para evitar reenvios desnecessários
            return ctx.response.status(200).json({
                status: 'error',
                message: 'Webhook received but processed with error'
            });
        }
    }

    /**
     * Valida se o webhook é válido do Mercado Pago
     */
    private isValidMercadoPagoWebhook(body: any, _headers: any): boolean {
        // Verificar se tem os campos básicos esperados
        if (!body || (!body.type && !body.topic)) {
            return false;
        }

        // Verificar se tem dados válidos
        if (!body.data && !body['data.id']) {
            return false;
        }

        // TODO: Adicionar validação de assinatura se necessário
        // const signature = headers['x-signature'];
        // const requestId = headers['x-request-id'];

        return true;
    }

    /**
     * Processa notificações de pagamento
     */
    private async handlePaymentNotification(body: any, _ctx: HttpContext) {
        try {
            const paymentId = body.data?.id || body['data.id'];

            if (!paymentId) {
                console.warn('⚠️ Payment ID não encontrado no webhook');
                return;
            }

            console.log(`💰 Processando notificação de pagamento: ${paymentId}`);

            // Buscar detalhes completos do pagamento
            const paymentDetails = await this.getPaymentDetails(paymentId);

            if (!paymentDetails) {
                console.error('❌ Não foi possível buscar detalhes do pagamento');
                return;
            }

            console.log('📊 Detalhes do pagamento:', {
                id: (paymentDetails as any).id,
                status: (paymentDetails as any).status,
                status_detail: (paymentDetails as any).status_detail,
                external_reference: (paymentDetails as any).external_reference,
                transaction_amount: (paymentDetails as any).transaction_amount,
                currency_id: (paymentDetails as any).currency_id,
                payment_method_id: (paymentDetails as any).payment_method_id,
                date_created: (paymentDetails as any).date_created,
                date_approved: (paymentDetails as any).date_approved
            });

            // Aqui você pode adicionar sua lógica de negócio
            await this.processPaymentStatus(paymentDetails);

        } catch (error: any) {
            console.error('🔥 Erro ao processar notificação de pagamento:', error);
        }
    }

    /**
     * Busca detalhes completos do pagamento na API do Mercado Pago
     */
    private async getPaymentDetails(paymentId: string) {
        try {
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${env.get('MP_ACCESS_TOKEN')?.toString()!}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`❌ Erro na API: ${response.status} ${response.statusText}`);
                return null;
            }

            return await response.json();
        } catch (error: any) {
            console.error('🔥 Erro ao buscar detalhes do pagamento:', error);
            return null;
        }
    }

    /**
     * Processa o status do pagamento conforme sua lógica de negócio
     */
    private async processPaymentStatus(paymentDetails: any) {
        const { status } = paymentDetails;

        switch (status) {
            case 'approved':
                console.log('✅ Pagamento aprovado!');
                // TODO: Implementar lógica para pagamento aprovado
                // Ex: atualizar pedido, enviar email, liberar produto
                await this.handleApprovedPayment(paymentDetails);
                break;

            case 'pending':
                console.log('⏳ Pagamento pendente');
                // TODO: Implementar lógica para pagamento pendente
                await this.handlePendingPayment(paymentDetails);
                break;

            case 'rejected':
                console.log('❌ Pagamento rejeitado');
                // TODO: Implementar lógica para pagamento rejeitado
                await this.handleRejectedPayment(paymentDetails);
                break;

            case 'cancelled':
                console.log('🚫 Pagamento cancelado');
                // TODO: Implementar lógica para pagamento cancelado
                await this.handleCancelledPayment(paymentDetails);
                break;

            default:
                console.log(`❓ Status desconhecido: ${status}`);
                break;
        }
    }

    /**
     * Lógica para pagamento aprovado
     */
    private async handleApprovedPayment(paymentDetails: any) {
        console.log('🎉 Processando pagamento aprovado:', paymentDetails.external_reference);

        // TODO: Implementar sua lógica aqui
        // Exemplos:
        // - Atualizar status do pedido no banco de dados
        // - Enviar email de confirmação
        // - Disparar processo de entrega
        // - Atualizar estoque

        // Exemplo: Salvar no banco que o pagamento foi aprovado
        await this.updateOrderStatus(paymentDetails.external_reference, 'paid', paymentDetails);

        // Exemplo: Enviar notificação em tempo real (WebSocket, SSE, etc.)
        await this.notifyFrontend(paymentDetails.external_reference, 'payment_approved', paymentDetails);
    }

    /**
     * Lógica para pagamento pendente
     */
    private async handlePendingPayment(paymentDetails: any) {
        console.log('⏳ Processando pagamento pendente:', paymentDetails.external_reference);

        await this.updateOrderStatus(paymentDetails.external_reference, 'pending', paymentDetails);
        await this.notifyFrontend(paymentDetails.external_reference, 'payment_pending', paymentDetails);
    }

    /**
     * Lógica para pagamento rejeitado
     */
    private async handleRejectedPayment(paymentDetails: any) {
        console.log('❌ Processando pagamento rejeitado:', paymentDetails.external_reference);

        await this.updateOrderStatus(paymentDetails.external_reference, 'rejected', paymentDetails);
        await this.notifyFrontend(paymentDetails.external_reference, 'payment_rejected', paymentDetails);
    }

    /**
     * Lógica para pagamento cancelado
     */
    private async handleCancelledPayment(paymentDetails: any) {
        console.log('🚫 Processando pagamento cancelado:', paymentDetails.external_reference);

        await this.updateOrderStatus(paymentDetails.external_reference, 'cancelled', paymentDetails);
        await this.notifyFrontend(paymentDetails.external_reference, 'payment_cancelled', paymentDetails);
    }

    /**
     * Atualiza o status do pedido (implementar conforme seu banco de dados)
     */
    private async updateOrderStatus(externalReference: string, status: string, paymentDetails: any) {
        try {
            console.log(`📝 Atualizando pedido ${externalReference} para status: ${status}`);

            // TODO: Implementar update no banco de dados
            // Exemplo com banco de dados:
            // await Database.from('orders')
            //   .where('external_reference', externalReference)
            //   .update({
            //     payment_status: status,
            //     payment_id: paymentDetails.id,
            //     updated_at: new Date()
            //   });

            console.log(`✅ Pedido ${externalReference} atualizado com sucesso`);
        } catch (error) {
            console.error(`❌ Erro ao atualizar pedido ${externalReference}:`, error);
        }
    }

    /**
     * Notifica o front-end sobre mudanças no pagamento
     */
    private async notifyFrontend(externalReference: string, event: string, paymentDetails: any) {
        try {
            console.log(`📱 Notificando front-end sobre ${event} para pedido ${externalReference}`);

            // TODO: Implementar notificação em tempo real
            // Opções:
            // 1. WebSocket
            // 2. Server-Sent Events (SSE)
            // 3. Push Notification
            // 4. Email/SMS
            // 5. Salvar em cache/banco para polling

            // Exemplo: Salvar notificação para polling
            const notification = {
                external_reference: externalReference,
                event: event,
                payment_id: paymentDetails.id,
                status: paymentDetails.status,
                amount: paymentDetails.transaction_amount,
                currency: paymentDetails.currency_id,
                timestamp: new Date().toISOString()
            };

            // TODO: Salvar notificação no banco/cache
            console.log('📨 Notificação preparada:', notification);

        } catch (error) {
            console.error(`❌ Erro ao notificar front-end:`, error);
        }
    }

    /**
     * Endpoint para o front-end consultar status do pagamento
     */
    public async getPaymentStatus(ctx: HttpContext) {
        try {
            const { external_reference } = ctx.params;

            console.log(`🔍 Consultando status do pedido: ${external_reference}`);

            // TODO: Buscar no banco de dados
            // const order = await Database.from('orders')
            //   .where('external_reference', external_reference)
            //   .first();

            // Simulação de resposta
            const orderStatus = {
                external_reference: external_reference,
                payment_status: 'pending', // pending, paid, rejected, cancelled
                payment_id: null,
                last_updated: new Date().toISOString()
            };

            return ctx.response.json(orderStatus);

        } catch (error: any) {
            console.error('❌ Erro ao consultar status:', error);
            return ctx.response.status(500).json({
                error: 'Erro ao consultar status do pagamento'
            });
        }
    }

    /**
     * Processa notificações de plano (assinaturas)
     */
    private async handlePlanNotification(body: any, _ctx: HttpContext) {
        console.log('📋 Notificação de plano recebida:', body);
        // TODO: Implementar lógica para planos
    }

    /**
     * Processa notificações de assinatura
     */
    private async handleSubscriptionNotification(body: any, _ctx: HttpContext) {
        console.log('🔄 Notificação de assinatura recebida:', body);
        // TODO: Implementar lógica para assinaturas
    }

    /**
     * Processa notificações de fatura
     */
    private async handleInvoiceNotification(body: any, _ctx: HttpContext) {
        console.log('🧾 Notificação de fatura recebida:', body);
        // TODO: Implementar lógica para faturas
    }

    /**
     * Processa notificações de integração de pontos
     */
    private async handlePointIntegrationNotification(body: any, _ctx: HttpContext) {
        console.log('🎯 Notificação de integração de pontos recebida:', body);
        // TODO: Implementar lógica para pontos
    }

    /**
 * Consulta pagamentos do Mercado Pago por external_reference
 * GET /payment/external/:external_reference
 */
    public async getPaymentsByExternalReference(ctx: HttpContext) {
        try {
            const { external_reference } = ctx.params;
            console.log(`🔍 Consultando pagamentos por external_reference: ${external_reference}`);

            const url = `https://api.mercadopago.com/v1/payments/search?external_reference=${external_reference}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${env.get('MP_ACCESS_TOKEN')?.toString()!}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                console.error(`❌ Erro na API: ${response.status} ${response.statusText}`);
                return ctx.response.status(500).json({ error: 'Erro ao consultar pagamentos' });
            }
            const data = await response.json();
            console.log("Payments Result:", data);
            return ctx.response.json({
                external_reference,
                total: data.paging?.total || 0,
                status: data.results.map((payment: any) => ({
                    productName: payment.additional_info?.items?.[0]?.title || 'N/A',
                    id: payment.id,
                    status: payment.status,
                }))
            });
        } catch (error: any) {
            console.error('❌ Erro ao consultar pagamentos por external_reference:', error);
            return ctx.response.status(500).json({ error: 'Erro ao consultar pagamentos' });
        }
    }

    async refreshPaymentStatus(ctx: HttpContext) {
        const { external_reference } = ctx.params;
        console.log(`🔄 Atualizando status do pagamento: ${external_reference}`);

        try {
            const url = `https://api.mercadopago.com/v1/payments/${external_reference}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${env.get('MP_ACCESS_TOKEN')?.toString()!}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.error(`❌ Erro na API: ${response.status} ${response.statusText}`);
                return ctx.response.status(500).json({ error: 'Erro ao atualizar status do pagamento' });
            }

            const data = await response.json();
            console.log("Payment Refresh Result:", data);
            return ctx.response.json(data);
        } catch (error: any) {
            console.error('❌ Erro ao atualizar status do pagamento:', error);
            return ctx.response.status(500).json({ error: 'Erro ao atualizar status do pagamento' });
        }
    }

}