import client from './client';

export const diagnosesAPI = {
  addDiagnosis: async (consultationId, diagnosis, findings, icdCode, treatmentPlan) => {
    const response = await client.post('/diagnoses/add-diagnosis', {
      consultationId,
      diagnosis,
      findings,
      icdCode,
      treatmentPlan
    });
    return response.data;
  },

  getDiagnosis: async (consultationId) => {
    const response = await client.get(`/diagnoses/consultation/${consultationId}`);
    return response.data;
  },

  updateDiagnosis: async (diagnosisId, diagnosis, findings, icdCode, treatmentPlan) => {
    const response = await client.put(`/diagnoses/${diagnosisId}`, {
      diagnosis,
      findings,
      icdCode,
      treatmentPlan
    });
    return response.data;
  },

  getDoctorPatients: async () => {
    const response = await client.get('/diagnoses/doctor/patients-list');
    return response.data;
  },

  getDoctorConsultations: async (status = null) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await client.get(`/diagnoses/doctor/consultations?${params.toString()}`);
    return response.data;
  }
};
