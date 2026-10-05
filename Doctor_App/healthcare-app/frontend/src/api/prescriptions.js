import client from './client';

export const prescriptionsAPI = {
  createPrescription: async (consultationId, medicines) => {
    const response = await client.post('/prescriptions/create', {
      consultationId,
      medicines
    });
    return response.data;
  },

  getPrescription: async (prescriptionId) => {
    const response = await client.get(`/prescriptions/${prescriptionId}`);
    return response.data;
  },

  getPrescriptionDetails: async (prescriptionId) => {
    const response = await client.get(`/prescriptions/${prescriptionId}/details`);
    return response.data;
  },

  getPatientPrescriptions: async () => {
    const response = await client.get('/prescriptions/patient/my-prescriptions');
    return response.data;
  },

  updatePrescriptionItem: async (itemId, dosage, frequency, duration, notes) => {
    const response = await client.put(`/prescriptions/item/${itemId}`, {
      dosage,
      frequency,
      duration,
      notes
    });
    return response.data;
  },

  deletePrescriptionItem: async (itemId) => {
    const response = await client.delete(`/prescriptions/item/${itemId}`);
    return response.data;
  }
};
