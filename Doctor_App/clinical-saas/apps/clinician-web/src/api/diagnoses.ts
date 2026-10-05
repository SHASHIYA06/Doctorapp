import client from './client';

export interface DiagnosisData {
  consultationId: number;
  complaintId?: number;
  diagnosisText: string;
  findings?: string;
  icdCode?: string;
  severity?: string;
  treatmentPlan?: string;
  followUpRequired?: boolean;
  followUpDays?: number;
  recommendations?: string;
}

export interface Diagnosis {
  id: number;
  consultationId: number;
  doctorId: number;
  diagnosisText: string;
  findings?: string;
  treatmentPlan?: string;
  createdAt: string;
}

export const diagnosesAPI = {
  create: async (data: DiagnosisData) => {
    const response = await client.post<Diagnosis>('/diagnoses', data);
    return response.data;
  },

  getByConsultation: async (consultationId: number) => {
    const response = await client.get<Diagnosis>(`/diagnoses/consultation/${consultationId}`);
    return response.data;
  },

  update: async (diagnosisId: number, data: Partial<DiagnosisData>) => {
    const response = await client.put<Diagnosis>(`/diagnoses/${diagnosisId}`, data);
    return response.data;
  },

  getById: async (diagnosisId: number) => {
    const response = await client.get<Diagnosis>(`/diagnoses/${diagnosisId}`);
    return response.data;
  },

  getPatientDiagnoses: async (patientId: number) => {
    const response = await client.get<Diagnosis[]>(`/diagnoses/patient/${patientId}`);
    return response.data;
  }
};
