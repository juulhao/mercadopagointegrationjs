import React, { useState, useEffect } from 'react';

const PaymentForm = () => {
  const [mp, setMp] = useState(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    cardExpirationMonth: '',
    cardExpirationYear: '',
    securityCode: '',
    docNumber: '',
    amount: 100,
    description: 'Pagamento de teste',
    payer_email: 'test@test.com'
  });

  useEffect(() => {
    // Inicializar MercadoPago
    const initMercadoPago = async () => {
      const { loadMercadoPago } = await import('@mercadopago/sdk-js');
      
      await loadMercadoPago();
      const mpInstance = new window.MercadoPago('TEST-8b791b84-1d05-460d-aee5-f89c3053f21b', {
        locale: 'pt-BR'
      });
      setMp(mpInstance);
    };

    initMercadoPago();
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const createCardToken = async () => {
    if (!mp) {
      alert('MercadoPago não foi inicializado');
      return null;
    }

    const cardData = {
      cardNumber: formData.cardNumber.replace(/\s/g, ''),
      cardholderName: formData.cardholderName,
      cardExpirationMonth: formData.cardExpirationMonth,
      cardExpirationYear: formData.cardExpirationYear,
      securityCode: formData.securityCode,
      identificationType: 'CPF',
      identificationNumber: formData.docNumber,
    };

    try {
      const token = await mp.createCardToken(cardData);
      console.log('Token gerado:', token);
      return token.id;
    } catch (error) {
      console.error('Erro ao gerar token:', error);
      alert('Erro ao gerar token: ' + error.message);
      return null;
    }
  };

  const processPayment = async (cardToken) => {
    const paymentData = {
      amount: formData.amount,
      description: formData.description,
      payer_email: formData.payer_email,
      card_token: cardToken,
      installments: 12,
      payment_method_id: "visa"
    };

    try {
      const response = await fetch('http://localhost:3333/payment/credit-card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();
      console.log('Resultado do pagamento:', result);
      
      if (response.ok) {
        alert('Pagamento processado com sucesso!');
      } else {
        alert('Erro no pagamento: ' + result.error);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Erro na comunicação com o servidor');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Gerando token...');
    const cardToken = await createCardToken();
    
    if (cardToken) {
      console.log('Token gerado com sucesso:', cardToken);
      await processPayment(cardToken);
    }
  };

  return (
    <div>
      <h1>Pagamento com Cartão</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Número do Cartão:</label>
          <input
            type="text"
            name="cardNumber"
            placeholder="4509 9535 6623 3704"
            value={formData.cardNumber}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div>
          <label>Nome no Cartão:</label>
          <input
            type="text"
            name="cardholderName"
            placeholder="APRO"
            value={formData.cardholderName}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div>
          <label>Mês de Expiração:</label>
          <input
            type="text"
            name="cardExpirationMonth"
            placeholder="11"
            value={formData.cardExpirationMonth}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div>
          <label>Ano de Expiração:</label>
          <input
            type="text"
            name="cardExpirationYear"
            placeholder="25"
            value={formData.cardExpirationYear}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div>
          <label>Código de Segurança:</label>
          <input
            type="text"
            name="securityCode"
            placeholder="123"
            value={formData.securityCode}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div>
          <label>CPF:</label>
          <input
            type="text"
            name="docNumber"
            placeholder="12345678909"
            value={formData.docNumber}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <button type="submit">Pagar</button>
      </form>
    </div>
  );
};

export default PaymentForm;
