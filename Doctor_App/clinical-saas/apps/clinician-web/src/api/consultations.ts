import client from './client';

export interface Consultation {
  id: number;
  patientId: number;
  doctorId: number;
  consultationType: 'online' | 'offline' | 'video' | 'chat';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  consultationFee: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export const consultationsAPI = {
  getPatientConsultations: async () => {
    const response = await client.get<Consultation[]>('/consultations/patient/my-consultations');
    return response.data;
  },

  getDoctorConsultations: async () => {
    const response = await client.get<Consultation[]>('/consultations/doctor/my-consultations');
    return response.data;
  },

  getConsultationDetails: async (consultationId: number) => {
    const response = await client.get<Consultation>(`/consultations/${consultationId}`);
    return response.data;
  },

  updateConsultationStatus: async (consultationId: number, status: string) => {
    const response = await client.put(`/consultations/${consultationId}/status`, {
      status
    });
    return response.data;
  },

  getUnassignedConsultations: async () => {
    const response = await client.get<Consultation[]>('/consultations/doctor/unassigned-consultations');
    return response.data;
  },

  acceptConsultation: async (consultationId: number) => {
    const response = await client.post(`/consultations/${consultationId}/accept`);
    return response.data;
  },

  getAnalytics: async () => {
    const response = await client.get('/consultations/admin/analytics');
    return response.data;
  }
};
