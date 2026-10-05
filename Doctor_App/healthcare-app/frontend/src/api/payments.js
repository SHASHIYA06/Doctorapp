import client from './client';

export const paymentsAPI = {
  createCheckoutSession: async (consultationId) => {
    const response = await client.post('/payments/create-checkout-session', {
      consultationId
    });
    return response.data;
  },

  getPaymentStatus: async (consultationId) => {
    const response = await client.get(`/payments/${consultationId}/status`);
    return response.data;
  },

  getPaymentDetails: async (consultationId) => {
    const response = await client.get(`/payments/${consultationId}/details`);
    return response.data;
  },

  getAllPayments: async () => {
    const response = await client.get('/payments/admin/all-payments');
    return response.data;
  },

  getRevenueStats: async (startDate = null, endDate = null) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await client.get(`/payments/admin/revenue-stats?${params.toString()}`);
    return response.data;
  }
};
