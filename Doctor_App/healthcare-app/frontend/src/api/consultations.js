import client from './client';

export const consultationsAPI = {
  getPatientConsultations: async () => {
    const response = await client.get('/consultations/patient/my-consultations');
    return response.data;
  },

  getConsultationDetails: async (consultationId) => {
    const response = await client.get(`/consultations/${consultationId}`);
    return response.data;
  },

  updateConsultationStatus: async (consultationId, status) => {
    const response = await client.put(`/consultations/${consultationId}/status`, {
      status
    });
    return response.data;
  },

  getUnassignedConsultations: async () => {
    const response = await client.get('/consultations/doctor/unassigned-consultations');
    return response.data;
  },

  acceptConsultation: async (consultationId) => {
    const response = await client.post(`/consultations/${consultationId}/accept`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await client.get('/consultations/admin/analytics');
    return response.data;
  }
};
