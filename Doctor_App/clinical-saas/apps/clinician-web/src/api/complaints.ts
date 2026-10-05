import client from './client';

export interface ComplaintData {
  consultationId: number;
  chiefComplaint: string;
  description: string;
  symptoms: string;
  symptomDuration?: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  medicationTried?: string;
}

export interface Complaint {
  id: number;
  consultationId: number;
  patientId: number;
  chiefComplaint: string;
  description: string;
  symptoms: string;
  symptomDuration?: string;
  severity: string;
  createdAt: string;
}

export const complaintsAPI = {
  create: async (data: ComplaintData) => {
    const response = await client.post<Complaint>('/complaints', data);
    return response.data;
  },

  getMyComplaints: async () => {
    const response = await client.get<Complaint[]>('/complaints/my-complaints');
    return response.data;
  },

  getComplaintDetails: async (complaintId: number) => {
    const response = await client.get<Complaint>(`/complaints/${complaintId}`);
    return response.data;
  },

  getComplaintDocuments: async (complaintId: number) => {
    const response = await client.get(`/complaints/${complaintId}/documents`);
    return response.data;
  },

  uploadDocument: async (complaintId: number, file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const response = await client.post(
      `/complaints/${complaintId}/upload-document`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  getAssignedComplaints: async () => {
    const response = await client.get<Complaint[]>('/complaints/assigned');
    return response.data;
  },

  getByConsultation: async (consultationId: number) => {
    const response = await client.get<Complaint>(`/complaints/consultation/${consultationId}`);
    return response.data;
  }
};
