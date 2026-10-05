/**
 * Healthcare SaaS API Client
 * Centralized API exports for all modules
 */

export { authAPI } from './auth';
export type { LoginData, RegisterData, AuthResponse } from './auth';

export { complaintsAPI } from './complaints';
export type { ComplaintData, Complaint } from './complaints';

export { consultationsAPI } from './consultations';
export type { Consultation } from './consultations';

export { diagnosesAPI } from './diagnoses';
export type { DiagnosisData, Diagnosis } from './diagnoses';

export { prescriptionsAPI } from './prescriptions';
export type { PrescriptionData, PrescriptionItemData, Prescription, PrescriptionItem } from './prescriptions';

export { medicinesAPI } from './medicines';
export type { Medicine } from './medicines';

export { paymentsAPI } from './payments';
export type { PaymentData, Payment } from './payments';

export { default as client } from './client';
