import client from './client';

export interface PaymentData {
  consultationId: number;
  amount: number;
  paymentMethod: 'credit_card' | 'debit_card' | 'upi' | 'wallet' | 'net_banking';
}

export interface Payment {
  id: number;
  consultationId: number;
  patientId: number;
  doctorId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  paymentDate?: string;
  createdAt: string;
}

export const paymentsAPI = {
  create: async (data: PaymentData) => {
    const response = await client.post<Payment>('/payments', data);
    return response.data;
  },

  getPatientPayments: async () => {
    const response = await client.get<Payment[]>('/payments/patient/my-payments');
    return response.data;
  },

  getPaymentDetails: async (paymentId: number) => {
    const response = await client.get<Payment>(`/payments/${paymentId}`);
    return response.data;
  },

  createStripePayment: async (consultationId: number) => {
    const response = await client.post('/payments/stripe/create-payment-intent', {
      consultationId
    });
    return response.data;
  },

  confirmPayment: async (paymentId: number, paymentIntentId: string) => {
    const response = await client.post(`/payments/${paymentId}/confirm`, {
      paymentIntentId
    });
    return response.data;
  }
};
