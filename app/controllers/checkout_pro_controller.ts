import { HttpContext } from "@adonisjs/core/http";
import { MercadoPagoConfig, Preference } from "mercadopago";
import env from '#start/env'

const client = new MercadoPagoConfig({
    accessToken: env.get('MP_ACCESS_TOKEN')?.toString()!,
    options: { timeout: 5000 }
});

const preference = new Preference(client);

export default class CheckoutProController {

    /**
     * Cria preferência para Checkout Pro com redirecionamento
     * POST /checkout-pro/create
     */
    public async createPreference(ctx: HttpContext) {
        try {
            const body = await ctx.request.body();
            console.log('🛒 === CRIANDO PREFERÊNCIA CHECKOUT PRO ===');
            console.log('Body recebido:', JSON.stringify(body, null, 2));

            // Validação básica
            if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
                return ctx.response.status(400).json({
                    success: false,
                    error: 'Items são obrigatórios e devem ser um array não vazio'
                });
            }

            if (!body.payer?.email) {
                return ctx.response.status(400).json({
                    success: false,
                    error: 'Email do pagador é obrigatório'
                });
            }

            // URLs padrão para redirecionamento (pode vir do body ou usar padrão)
            const baseUrl = body.base_url || 'http://localhost:3333';
            
            // URLs de redirecionamento (OBRIGATÓRIAS para Checkout Pro com auto_return)
            // Para ambiente de desenvolvimento, vamos usar ngrok ou URLs válidas
            const backUrls = {
                success: body.back_urls?.success || `${baseUrl}/checkout-pro/success`,
                failure: body.back_urls?.failure || `${baseUrl}/checkout-pro/failure`,
                pending: body.back_urls?.pending || `${baseUrl}/checkout-pro/pending`
            };

            console.log('🔗 Back URLs configuradas:', backUrls);

            const preferenceBody = {
                items: body.items,
                payer: {
                    email: body.payer?.email,
                    name: body.payer?.name,
                    surname: body.payer?.surname,
                    phone: body.payer?.phone,
                    identification: body.payer?.identification,
                    address: body.payer?.address
                },
                external_reference: body.external_reference,
                
                // URLs de redirecionamento (OBRIGATÓRIAS para auto_return)
                back_urls: backUrls,
                
                // URL para webhooks
                notification_url: body.notification_url || `${baseUrl}/webhook/mercadopago`,
                
                // Configurações de frete
                shipments: body.shipping_cost ? {
                    cost: parseFloat(body.shipping_cost),
                    mode: 'not_specified'
                } : undefined,
                
                // Configurações de pagamento
                payment_methods: {
                    excluded_payment_methods: body.payment_methods?.excluded_payment_methods || [],
                    excluded_payment_types: body.payment_methods?.excluded_payment_types || [],
                    installments: body.payment_methods?.installments || 12,
                    default_installments: body.payment_methods?.default_installments || 1
                },
                
                // Configurações adicionais
                expires: body.expires || false,
                expiration_date_from: body.expiration_date_from,
                expiration_date_to: body.expiration_date_to,
                
                // Informações adicionais
                additional_info: body.additional_info,
                
                // Configurações de experiência do usuário
                binary_mode: body.binary_mode || false,
                
                // Metadados personalizados
                metadata: {
                    source: 'checkout_pro',
                    created_at: new Date().toISOString(),
                    ...body.metadata
                }
            };

            // Remove campos undefined, mas preserva back_urls e auto_return
            Object.keys(preferenceBody).forEach(key => {
                const typedKey = key as keyof typeof preferenceBody;
                // Nunca remover back_urls ou auto_return, pois são obrigatórios
                if (key !== 'back_urls' && key !== 'auto_return') {
                    if (preferenceBody[typedKey] === undefined || preferenceBody[typedKey] === null) {
                        delete preferenceBody[typedKey];
                    }
                }
            });

            // Garantir que back_urls está sempre presente e válido
            if (!preferenceBody.back_urls || !preferenceBody.back_urls.success) {
                preferenceBody.back_urls = backUrls;
            }

            // Adicionar auto_return apenas se foi solicitado explicitamente e se as URLs são válidas
            const isLocalhost = backUrls.success.includes('localhost') || backUrls.success.includes('127.0.0.1');
            
            if (body.auto_return && preferenceBody.back_urls.success && !isLocalhost) {
                (preferenceBody as any).auto_return = body.auto_return;
                console.log('✅ Auto-return habilitado:', body.auto_return);
            } else {
                if (isLocalhost) {
                    console.log('⚠️ Auto-return desabilitado: URLs localhost não são suportadas pelo MercadoPago');
                } else if (!body.auto_return) {
                    console.log('⚠️ Auto-return não solicitado');
                } else {
                    console.log('⚠️ Auto-return desabilitado: URLs inválidas');
                }
            }

            console.log('🔧 Preferência a ser criada:', JSON.stringify(preferenceBody, null, 2));

            const result = await preference.create({ body: preferenceBody });
            
            console.log('✅ Preferência criada com sucesso!');
            console.log('ID:', result.id);
            console.log('Init Point:', result.init_point);
            console.log('Sandbox Init Point:', result.sandbox_init_point);

            return ctx.response.status(201).json({
                success: true,
                preference_id: result.id,
                init_point: result.init_point,
                sandbox_init_point: result.sandbox_init_point,
                external_reference: result.external_reference,
                back_urls: backUrls,
                checkout_url: env.get('NODE_ENV') === 'development' 
                    ? result.sandbox_init_point 
                    : result.init_point,
                created_at: new Date().toISOString()
            });

        } catch (error: any) {
            console.error('❌ === ERRO AO CRIAR PREFERÊNCIA ===');
            console.error('Error:', error);
            console.error('Status:', error.status);
            console.error('Message:', error.message);
            console.error('Cause:', error.cause);

            return ctx.response.status(error.status || 500).json({
                success: false,
                error: error.message || 'Erro ao criar preferência',
                details: error.cause || [],
                status: error.status || 500
            });
        }
    }

    /**
     * Página de sucesso após pagamento
     * GET /checkout-pro/success
     */
    public async success(ctx: HttpContext) {
        try {
            const queryParams = ctx.request.qs();
            console.log('🎉 === PAGAMENTO REALIZADO COM SUCESSO ===');
            console.log('Query Params:', queryParams);

            const {
                collection_id,
                collection_status,
                payment_id,
                status,
                external_reference,
                payment_type,
                merchant_order_id,
                preference_id
            } = queryParams;

            // Buscar detalhes do pagamento para confirmação
            let paymentDetails = null;
            if (payment_id) {
                paymentDetails = await this.getPaymentDetails(payment_id);
            }

            const successData = {
                success: true,
                message: 'Pagamento realizado com sucesso!',
                payment_info: {
                    payment_id: payment_id || collection_id,
                    status: status || collection_status,
                    external_reference,
                    payment_type,
                    merchant_order_id,
                    preference_id
                },
                payment_details: paymentDetails,
                timestamp: new Date().toISOString()
            };

            console.log('✅ Dados do pagamento aprovado:', successData);

            // Se for uma requisição AJAX, retorna JSON
            if (ctx.request.header('content-type')?.includes('application/json') || 
                ctx.request.header('accept')?.includes('application/json')) {
                return ctx.response.json(successData);
            }

            // Caso contrário, pode retornar uma página HTML ou redirecionar
            return ctx.response.json(successData);

        } catch (error: any) {
            console.error('❌ Erro na página de sucesso:', error);
            return ctx.response.status(500).json({
                success: false,
                error: 'Erro ao processar página de sucesso',
                details: error.message
            });
        }
    }

    /**
     * Página de erro após pagamento
     * GET /checkout-pro/failure
     */
    public async failure(ctx: HttpContext) {
        try {
            const queryParams = ctx.request.qs();
            console.log('❌ === PAGAMENTO COM ERRO ===');
            console.log('Query Params:', queryParams);

            const {
                collection_id,
                collection_status,
                payment_id,
                status,
                external_reference,
                payment_type,
                merchant_order_id,
                preference_id
            } = queryParams;

            const failureData = {
                success: false,
                message: 'Falha no pagamento',
                payment_info: {
                    payment_id: payment_id || collection_id,
                    status: status || collection_status,
                    external_reference,
                    payment_type,
                    merchant_order_id,
                    preference_id
                },
                timestamp: new Date().toISOString()
            };

            console.log('❌ Dados da falha no pagamento:', failureData);

            return ctx.response.json(failureData);

        } catch (error: any) {
            console.error('❌ Erro na página de falha:', error);
            return ctx.response.status(500).json({
                success: false,
                error: 'Erro ao processar página de falha',
                details: error.message
            });
        }
    }

    /**
     * Página de pagamento pendente
     * GET /checkout-pro/pending
     */
    public async pending(ctx: HttpContext) {
        try {
            const queryParams = ctx.request.qs();
            console.log('⏳ === PAGAMENTO PENDENTE ===');
            console.log('Query Params:', queryParams);

            const {
                collection_id,
                collection_status,
                payment_id,
                status,
                external_reference,
                payment_type,
                merchant_order_id,
                preference_id
            } = queryParams;

            const pendingData = {
                success: false,
                message: 'Pagamento pendente de aprovação',
                payment_info: {
                    payment_id: payment_id || collection_id,
                    status: status || collection_status,
                    external_reference,
                    payment_type,
                    merchant_order_id,
                    preference_id
                },
                timestamp: new Date().toISOString()
            };

            console.log('⏳ Dados do pagamento pendente:', pendingData);

            return ctx.response.json(pendingData);

        } catch (error: any) {
            console.error('❌ Erro na página de pendente:', error);
            return ctx.response.status(500).json({
                success: false,
                error: 'Erro ao processar página de pendente',
                details: error.message
            });
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
     * Webhook específico para Checkout Pro (opcional)
     * POST /checkout-pro/webhook
     */
    public async webhook(ctx: HttpContext) {
        try {
            const body = ctx.request.body();
            const headers = ctx.request.headers();
            
            console.log('🔔 === WEBHOOK CHECKOUT PRO ===');
            console.log('Headers:', JSON.stringify(headers, null, 2));
            console.log('Body:', JSON.stringify(body, null, 2));
            console.log('Query params:', ctx.request.qs());

            // Processar webhook específico do Checkout Pro
            if (body.type === 'payment' || body.topic === 'payment') {
                const paymentId = body.data?.id || body['data.id'];
                
                if (paymentId) {
                    console.log(`💰 Processando webhook Checkout Pro - Payment ID: ${paymentId}`);
                    
                    // Buscar detalhes do pagamento
                    const paymentDetails = await this.getPaymentDetails(paymentId);
                    
                    if (paymentDetails) {
                        console.log('📊 Detalhes do pagamento (Checkout Pro):', {
                            id: (paymentDetails as any).id,
                            status: (paymentDetails as any).status,
                            external_reference: (paymentDetails as any).external_reference,
                            transaction_amount: (paymentDetails as any).transaction_amount
                        });
                        
                        // Aqui você pode adicionar lógica específica do Checkout Pro
                        // Ex: notificar sistema interno, atualizar banco de dados, etc.
                    }
                }
            }

            return ctx.response.status(200).json({ 
                status: 'received',
                timestamp: new Date().toISOString()
            });

        } catch (error: any) {
            console.error('🔥 === WEBHOOK CHECKOUT PRO ERROR ===');
            console.error('Error:', error);
            
            return ctx.response.status(200).json({ 
                status: 'error',
                message: 'Webhook received but processed with error'
            });
        }
    }
}
