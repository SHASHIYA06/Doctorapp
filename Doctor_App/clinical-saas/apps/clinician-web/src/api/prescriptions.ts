import client from './client';

export interface PrescriptionItemData {
  medicineId: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
}

export interface PrescriptionData {
  consultationId: number;
  diagnosisId?: number;
  notes?: string;
  items: PrescriptionItemData[];
}

export interface PrescriptionItem {
  id: number;
  medicineId: number;
  medicineName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
}

export interface Prescription {
  id: number;
  consultationId: number;
  patientId: number;
  doctorId: number;
  prescriptionDate: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  items?: PrescriptionItem[];
}

export const prescriptionsAPI = {
  create: async (data: PrescriptionData) => {
    const response = await client.post<Prescription>('/prescriptions', data);
    return response.data;
  },

  getPatientPrescriptions: async () => {
    const response = await client.get<Prescription[]>('/prescriptions/patient/my-prescriptions');
    return response.data;
  },

  getPrescriptionDetails: async (prescriptionId: number) => {
    const response = await client.get<Prescription>(`/prescriptions/${prescriptionId}`);
    return response.data;
  },

  getByConsultation: async (consultationId: number) => {
    const response = await client.get<Prescription>(`/prescriptions/consultation/${consultationId}`);
    return response.data;
  },

  updateStatus: async (prescriptionId: number, status: string) => {
    const response = await client.put(`/prescriptions/${prescriptionId}/status`, { status });
    return response.data;
  }
};
