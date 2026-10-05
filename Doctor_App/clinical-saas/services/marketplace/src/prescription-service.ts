/**
 * Doctor Prescription Service
 * Digital prescription management with MFA signing, templates, and compliance
 */

import { v4 as uuidv4 } from 'uuid';
import { Prescription, PrescriptionItem, DoctorVerification } from './types';

export type PrescriptionStatus = 
  | 'draft'
  | 'pending_signature'
  | 'pending_mfa'
  | 'signed'
  | 'fulfilled'
  | 'cancelled'
  | 'expired';

/**
 * Prescription Template Definitions
 */
export const prescriptionTemplates = {
  common_cold: {
    name: 'Common Cold',
    medicines: [
      { generic_name: 'Paracetamol', strength: '500mg', quantity: 10, dosage: '1 tablet 2-3 times daily' },
      { generic_name: 'Cetirizine', strength: '10mg', quantity: 10, dosage: '1 tablet once daily' },
      { generic_name: 'Aspirin', strength: '75mg', quantity: 10, dosage: '1 tablet once daily' },
    ],
  },
  hypertension: {
    name: 'Hypertension Management',
    medicines: [
      { generic_name: 'Amlodipine', strength: '5mg', quantity: 30, dosage: '1 tablet once daily' },
      { generic_name: 'Lisinopril', strength: '10mg', quantity: 30, dosage: '1 tablet once daily' },
      { generic_name: 'Atenolol', strength: '50mg', quantity: 30, dosage: '1 tablet once daily' },
    ],
  },
  diabetes: {
    name: 'Diabetes Management',
    medicines: [
      { generic_name: 'Metformin', strength: '500mg', quantity: 30, dosage: '1 tablet twice daily' },
      { generic_name: 'Glipizide', strength: '5mg', quantity: 30, dosage: '1 tablet once daily' },
    ],
  },
  anxiety: {
    name: 'Anxiety Management',
    medicines: [
      { generic_name: 'Ashwagandha', strength: '500mg', quantity: 30, dosage: '1 capsule twice daily' },
      { generic_name: 'Brahmi', strength: '250mg', quantity: 30, dosage: '1 tablet twice daily' },
    ],
  },
  pain_management: {
    name: 'Pain Management',
    medicines: [
      { generic_name: 'Ibuprofen', strength: '400mg', quantity: 20, dosage: '1 tablet 3 times daily after food' },
      { generic_name: 'Paracetamol', strength: '500mg', quantity: 20, dosage: '1 tablet 3 times daily' },
    ],
  },
  dermatological: {
    name: 'Skin Conditions',
    medicines: [
      { generic_name: 'Fluconazole', strength: '200mg', quantity: 10, dosage: '1 tablet once daily' },
      { generic_name: 'Hydrocortisone Cream', strength: '1%', quantity: 1, dosage: 'Apply 2-3 times daily' },
    ],
  },
};

/**
 * Prescription Service Class
 */
export class PrescriptionService {
  private prescriptions: Map<string, Prescription> = new Map();
  private doctorVerifications: Map<string, DoctorVerification> = new Map();
  private mfaSessions: Map<string, { code: string; timestamp: number; attempts: number }> = new Map();
  private prescriptionCounter: number = 10000;

  /**
   * Create new prescription
   */
  createPrescription(
    doctorId: string,
    patientId: string,
    diagnosis: string,
    medicines: PrescriptionItem[],
    notes?: string,
    templateName?: string
  ): Prescription {
    const prescriptionId = `RX-${Date.now()}-${++this.prescriptionCounter}`;

    const prescription: Prescription = {
      id: prescriptionId,
      doctor_id: doctorId,
      patient_id: patientId,
      diagnosis,
      medicines,
      notes: notes || '',
      template_name: templateName,
      status: 'draft',
      digital_signature: '',
      mfa_verified: false,
      signature_timestamp: null,
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
      filled_quantity: 0,
      refills_authorized: 0,
      refills_used: 0,
      pharmacy_notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.prescriptions.set(prescriptionId, prescription);
    return prescription;
  }

  /**
   * Get prescription by ID
   */
  getPrescription(prescriptionId: string): Prescription | null {
    return this.prescriptions.get(prescriptionId) || null;
  }

  /**
   * Get all prescriptions for patient
   */
  getPatientPrescriptions(patientId: string): Prescription[] {
    return Array.from(this.prescriptions.values())
      .filter(p => p.patient_id === patientId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get all prescriptions for doctor
   */
  getDoctorPrescriptions(doctorId: string, status?: PrescriptionStatus): Prescription[] {
    let results = Array.from(this.prescriptions.values())
      .filter(p => p.doctor_id === doctorId);

    if (status) {
      results = results.filter(p => p.status === status);
    }

    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Request MFA code for prescription signing
   */
  requestMFACode(prescriptionId: string, doctorEmail: string): { message: string; mfaSessionId: string } {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.status !== 'draft') {
      throw new Error('Only draft prescriptions can be signed');
    }

    // Generate 6-digit MFA code
    const mfaCode = Math.random().toString().slice(2, 8).padStart(6, '0');
    const mfaSessionId = uuidv4();

    this.mfaSessions.set(mfaSessionId, {
      code: mfaCode,
      timestamp: Date.now(),
      attempts: 0,
    });

    // In production, send via email/SMS
    console.log(`MFA Code for ${doctorEmail}: ${mfaCode}`);

    return {
      message: `MFA code sent to ${doctorEmail}. Code expires in 10 minutes.`,
      mfaSessionId,
    };
  }

  /**
   * Verify MFA and sign prescription
   */
  verifyMFAAndSign(
    prescriptionId: string,
    mfaSessionId: string,
    mfaCode: string,
    doctorSignature: string
  ): Prescription | null {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const mfaSession = this.mfaSessions.get(mfaSessionId);
    if (!mfaSession) {
      throw new Error('Invalid MFA session');
    }

    // Check attempts
    if (mfaSession.attempts >= 3) {
      throw new Error('Too many failed attempts. Request new MFA code.');
    }

    // Check expiry (10 minutes)
    if (Date.now() - mfaSession.timestamp > 10 * 60 * 1000) {
      throw new Error('MFA code expired');
    }

    // Verify code
    if (mfaSession.code !== mfaCode) {
      mfaSession.attempts++;
      throw new Error('Invalid MFA code');
    }

    // Sign prescription
    prescription.status = 'signed';
    prescription.mfa_verified = true;
    prescription.digital_signature = this.generateDigitalSignature(prescriptionId, doctorSignature);
    prescription.signature_timestamp = new Date().toISOString();
    prescription.updated_at = new Date().toISOString();

    // Clean up MFA session
    this.mfaSessions.delete(mfaSessionId);

    return prescription;
  }

  /**
   * Generate digital signature
   */
  private generateDigitalSignature(prescriptionId: string, doctorSignature: string): string {
    // In production, use proper cryptographic signing (RSA, ECDSA)
    const timestamp = Date.now().toString();
    const combined = `${prescriptionId}${doctorSignature}${timestamp}`;
    const hash = Buffer.from(combined).toString('base64');
    return `SIG-${hash.slice(0, 64)}`;
  }

  /**
   * Add doctor verification
   */
  addDoctorVerification(
    prescriptionId: string,
    doctorId: string,
    licenseNumber: string,
    verificationCode: string
  ): DoctorVerification {
    const prescription = this.prescriptions.get(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const verification: DoctorVerification = {
      id: uuidv4(),
      prescription_id: prescriptionId,
      doctor_id: doctorId,
      license_number: licenseNumber,
      verification_code: verificationCode,
      verified_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };

    this.doctorVerifications.set(verification.id, verification);
    return verification;
  }

  /**
   * Get doctor verification for prescription
   */
  getDoctorVerification(prescriptionId: string): DoctorVerification | null {
    return (
      Array.from(this.doctorVerifications.values()).find(v => v.prescription_id === prescriptionId) || null
    );
  }

  /**
   * Create prescription from template
   */
  createFromTemplate(
    templateName: keyof typeof prescriptionTemplates,
    doctorId: string,
    patientId: string,
    notes?: string
  ): Prescription {
    const template = prescriptionTemplates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    const medicines: PrescriptionItem[] = template.medicines.map(m => ({
      id: uuidv4(),
      generic_name: m.generic_name,
      brand_name: '',
      strength: m.strength,
      dosage_form: 'tablet',
      quantity: m.quantity,
      dosage: m.dosage,
      frequency: this.extractFrequency(m.dosage),
      duration_days: 7,
      refills: 0,
      special_instructions: '',
    }));

    return this.createPrescription(doctorId, patientId, template.name, medicines, notes, templateName);
  }

  /**
   * Extract frequency from dosage string
   */
  private extractFrequency(dosage: string): string {\n    if (dosage.includes('once')) return 'Once daily';\n    if (dosage.includes('twice')) return 'Twice daily';\n    if (dosage.includes('3 times')) return 'Thrice daily';\n    if (dosage.includes('4 times')) return 'Four times daily';\n    return 'As directed';\n  }\n\n  /**\n   * Add refill authorization\n   */\n  authorizeRefills(prescriptionId: string, numberOfRefills: number): Prescription | null {\n    const prescription = this.prescriptions.get(prescriptionId);\n    if (!prescription) return null;\n\n    prescription.refills_authorized = numberOfRefills;\n    prescription.updated_at = new Date().toISOString();\n    return prescription;\n  }\n\n  /**\n   * Record refill\n   */\n  recordRefill(prescriptionId: string, quantity: number): Prescription | null {\n    const prescription = this.prescriptions.get(prescriptionId);\n    if (!prescription) return null;\n\n    if (prescription.refills_used >= prescription.refills_authorized) {\n      throw new Error('No refills remaining');\n    }\n\n    prescription.refills_used++;\n    prescription.filled_quantity += quantity;\n    prescription.status = 'fulfilled';\n    prescription.updated_at = new Date().toISOString();\n    return prescription;\n  }\n\n  /**\n   * Cancel prescription\n   */\n  cancelPrescription(prescriptionId: string, reason: string): Prescription | null {\n    const prescription = this.prescriptions.get(prescriptionId);\n    if (!prescription) return null;\n\n    prescription.status = 'cancelled';\n    prescription.pharmacy_notes = reason;\n    prescription.updated_at = new Date().toISOString();\n    console.log(`Prescription ${prescriptionId} cancelled: ${reason}`);\n\n    return prescription;\n  }\n\n  /**\n   * Check if prescription is valid\n   */\n  isPrescriptionValid(prescriptionId: string): boolean {\n    const prescription = this.prescriptions.get(prescriptionId);\n    if (!prescription) return false;\n\n    // Check status\n    if (prescription.status !== 'signed' && prescription.status !== 'fulfilled') return false;\n\n    // Check expiry\n    if (new Date(prescription.valid_until) < new Date()) return false;\n\n    // Check MFA verification\n    if (!prescription.mfa_verified) return false;\n\n    return true;\n  }\n\n  /**\n   * Get prescription analytics\n   */\n  getPrescriptionAnalytics(doctorId?: string): {\n    total_prescriptions: number;\n    active_prescriptions: number;\n    signed_prescriptions: number;\n    fulfilled_prescriptions: number;\n    cancelled_prescriptions: number;\n    prescriptions_by_status: Record<PrescriptionStatus, number>;\n  } {\n    let prescriptions = doctorId\n      ? this.getDoctorPrescriptions(doctorId)\n      : Array.from(this.prescriptions.values());\n\n    const byStatus: Record<PrescriptionStatus, number> = {\n      draft: 0,\n      pending_signature: 0,\n      pending_mfa: 0,\n      signed: 0,\n      fulfilled: 0,\n      cancelled: 0,\n      expired: 0,\n    };\n\n    prescriptions.forEach(p => {\n      byStatus[p.status]++;\n    });\n\n    const activePrescriptions = prescriptions.filter(p => this.isPrescriptionValid(p.id)).length;\n\n    return {\n      total_prescriptions: prescriptions.length,\n      active_prescriptions: activePrescriptions,\n      signed_prescriptions: byStatus.signed + byStatus.fulfilled,\n      fulfilled_prescriptions: byStatus.fulfilled,\n      cancelled_prescriptions: byStatus.cancelled,\n      prescriptions_by_status: byStatus,\n    };\n  }\n\n  /**\n   * Export prescription as PDF-ready data\n   */\n  exportPrescriptionData(prescriptionId: string): string {\n    const prescription = this.prescriptions.get(prescriptionId);\n    if (!prescription) throw new Error('Prescription not found');\n\n    const medicinesText = prescription.medicines\n      .map(\n        (m, idx) =>\n          `${idx + 1}. ${m.generic_name} ${m.strength}\\n   Dosage: ${m.dosage}\\n   Quantity: ${m.quantity}\\n`\n      )\n      .join('\\n');\n\n    return `\n=== DIGITAL PRESCRIPTION ===\nPrescription ID: ${prescription.id}\nDoctor ID: ${prescription.doctor_id}\nPatient ID: ${prescription.patient_id}\nDiagnosis: ${prescription.diagnosis}\nValid Until: ${prescription.valid_until}\nStatus: ${prescription.status}\n\n=== MEDICINES ===\n${medicinesText}\n\n=== NOTES ===\n${prescription.notes}\n\n=== DIGITAL SIGNATURE ===\n${prescription.digital_signature}\nSigned At: ${prescription.signature_timestamp}\nMFA Verified: ${prescription.mfa_verified}\n    `.trim();\n  }\n}\n\nexport default PrescriptionService;\n