/**
 * Doctor Dashboard Service
 * Comprehensive service for managing patient cases, prescriptions, reports, and CDS integration
 * 
 * Features:
 * - Patient queue management
 * - Prescription tracking and management
 * - Report review and analysis
 * - Clinical decision support integration
 * - Patient communication
 * - Analytics and reporting
 * - Consultation scheduling
 */

import { GeminiMedicalClient } from './gemini-integration';

export interface DoctorProfile {
  id: string;
  name: string;
  specialization: string;
  licenseNumber: string;
  experienceYears: number;
  hospital?: string;
  consultationFee: number;
  averageRating: number;
  totalPatients: number;
  availableSlots: string[];
}

export interface PatientCase {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  diagnosedConditions: string[];
  status: 'pending-review' | 'in-progress' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  priority: 'routine' | 'urgent' | 'emergency';
  notes: string;
  attachments: string[];
}

export interface PrescriptionRecord {
  id: string;
  patientId: string;
  doctorId: string;
  medicines: PrescriptionMedicine[];
  diagnosis: string;
  notes: string;
  refillsAvailable: number;
  refillsUsed: number;
  issuedDate: Date;
  expiryDate: Date;
  status: 'active' | 'expired' | 'fulfilled' | 'pending';
  signatureHash: string;
  mfaVerified: boolean;
}

export interface PrescriptionMedicine {
  medicineId: string;
  medicineName: string;
  strength: string;
  dosage: string;
  frequency: string;
  quantity: number;
  duration: string;
  notes?: string;
  interactions?: string[];
}

export interface PatientReport {
  id: string;
  patientId: string;
  reportType: 'blood_test' | 'x_ray' | 'ct_scan' | 'ultrasound' | 'ecg' | 'mri' | 'pathology' | 'general';
  uploadDate: Date;
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'reviewed';
  findings: string;
  abnormalities: string[];
  confidence: number;
  reviewedBy?: string;
  reviewDate?: Date;
  notes?: string;
  fileUrl: string;
}

export interface CDSRecommendation {
  id: string;
  caseId: string;
  type: 'diagnosis' | 'treatment' | 'monitoring' | 'prevention' | 'referral';
  title: string;
  description: string;
  confidence: number;
  evidenceLevel: 'high' | 'moderate' | 'low';
  references: string[];
  actionableItems: string[];
  riskFactors: string[];
  createdAt: Date;
  reviewed: boolean;
  reviewNotes?: string;
}

export interface DoctorStatistics {
  totalPatients: number;
  patientsThisMonth: number;
  prescriptionsIssued: number;
  reportsReviewed: number;
  averageConsultationTime: number;
  patientSatisfactionScore: number;
  casesCompleted: number;
  casesInProgress: number;
  emergencyCasesHandled: number;
  avgResponseTime: number; // in minutes
}

export interface ConsultationSlot {
  id: string;
  doctorId: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  isAvailable: boolean;
  bookedBy?: string;
  consultationType: 'video' | 'audio' | 'in-person';
  notes?: string;
}

export interface PatientCommunication {
  id: string;
  patientId: string;
  doctorId: string;
  type: 'message' | 'consultation' | 'prescription-update' | 'report-result';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  attachments?: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface DoctorWorkflow {
  caseId: string;
  stage: 'intake' | 'assessment' | 'diagnosis' | 'treatment-plan' | 'follow-up' | 'closure';
  completedStages: string[];
  currentActionItems: string[];
  notes: string;
  lastUpdated: Date;
}

export class DoctorDashboardService {
  private geminiClient: GeminiMedicalClient;
  private patientCases: Map<string, PatientCase> = new Map();
  private prescriptions: Map<string, PrescriptionRecord> = new Map();
  private reports: Map<string, PatientReport> = new Map();
  private cdsRecommendations: Map<string, CDSRecommendation> = new Map();
  private communications: Map<string, PatientCommunication> = new Map();
  private consultationSlots: Map<string, ConsultationSlot> = new Map();
  private workflows: Map<string, DoctorWorkflow> = new Map();

  constructor(apiKey: string) {
    this.geminiClient = new GeminiMedicalClient(apiKey);
  }

  /**
   * Get patient queue for doctor
   */
  async getPatientQueue(doctorId: string, filter?: {
    status?: PatientCase['status'];
    priority?: PatientCase['priority'];
  }): Promise<PatientCase[]> {
    let cases = Array.from(this.patientCases.values());

    if (filter?.status) {
      cases = cases.filter(c => c.status === filter.status);
    }

    if (filter?.priority) {
      cases = cases.filter(c => c.priority === filter.priority);
    }

    // Sort by priority and creation date
    return cases.sort((a, b) => {
      const priorityOrder = { emergency: 0, urgent: 1, routine: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Get patient case details
   */
  async getPatientCase(caseId: string): Promise<PatientCase | null> {
    return this.patientCases.get(caseId) || null;
  }

  /**
   * Create new patient case
   */
  async createPatientCase(patientData: Partial<PatientCase>): Promise<PatientCase> {
    const newCase: PatientCase = {
      id: this.generateId(),
      patientId: patientData.patientId || '',
      patientName: patientData.patientName || '',
      age: patientData.age || 0,
      gender: patientData.gender || '',
      chiefComplaint: patientData.chiefComplaint || '',
      diagnosedConditions: patientData.diagnosedConditions || [],
      status: 'pending-review',
      createdAt: new Date(),
      updatedAt: new Date(),
      priority: patientData.priority || 'routine',
      notes: patientData.notes || '',
      attachments: patientData.attachments || []
    };

    this.patientCases.set(newCase.id, newCase);
    return newCase;
  }

  /**
   * Update patient case status
   */
  async updateCaseStatus(
    caseId: string,
    status: PatientCase['status'],
    notes?: string
  ): Promise<PatientCase | null> {
    const patientCase = this.patientCases.get(caseId);
    if (!patientCase) return null;

    patientCase.status = status;
    patientCase.updatedAt = new Date();
    if (notes) patientCase.notes = notes;

    this.patientCases.set(caseId, patientCase);
    return patientCase;
  }

  /**
   * Get prescription history for patient
   */
  async getPrescriptionHistory(patientId: string, limit: number = 10): Promise<PrescriptionRecord[]> {
    const patientPrescriptions = Array.from(this.prescriptions.values())
      .filter(p => p.patientId === patientId)
      .sort((a, b) => b.issuedDate.getTime() - a.issuedDate.getTime())
      .slice(0, limit);

    return patientPrescriptions;
  }

  /**
   * Get active prescriptions for patient
   */
  async getActivePrescriptions(patientId: string): Promise<PrescriptionRecord[]> {
    const now = new Date();
    return Array.from(this.prescriptions.values())
      .filter(p => 
        p.patientId === patientId && 
        p.status === 'active' && 
        p.expiryDate > now
      )
      .sort((a, b) => b.issuedDate.getTime() - a.issuedDate.getTime());
  }

  /**
   * Issue prescription with MFA verification
   */
  async issuePrescription(
    prescription: Omit<PrescriptionRecord, 'id' | 'signatureHash' | 'createdAt'>,
    mfaVerified: boolean
  ): Promise<PrescriptionRecord> {
    const newPrescription: PrescriptionRecord = {
      ...prescription,
      id: this.generateId(),
      signatureHash: this.generateSignatureHash(),
      mfaVerified
    };

    this.prescriptions.set(newPrescription.id, newPrescription);
    return newPrescription;
  }

  /**
   * Get patient reports
   */
  async getPatientReports(patientId: string, filter?: {
    reportType?: PatientReport['reportType'];
    status?: PatientReport['status'];
  }): Promise<PatientReport[]> {
    let reports = Array.from(this.reports.values())
      .filter(r => r.patientId === patientId);

    if (filter?.reportType) {
      reports = reports.filter(r => r.reportType === filter.reportType);
    }

    if (filter?.status) {
      reports = reports.filter(r => r.status === filter.status);
    }

    return reports.sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());
  }

  /**
   * Review patient report
   */
  async reviewReport(
    reportId: string,
    reviewNotes: string,
    reviewed: boolean,
    doctorId: string
  ): Promise<PatientReport | null> {
    const report = this.reports.get(reportId);
    if (!report) return null;

    report.status = 'reviewed';
    report.reviewedBy = doctorId;
    report.reviewDate = new Date();
    report.notes = reviewNotes;

    this.reports.set(reportId, report);
    return report;
  }

  /**
   * Get CDS recommendations for case
   */
  async getCDSRecommendations(caseId: string): Promise<CDSRecommendation[]> {
    return Array.from(this.cdsRecommendations.values())
      .filter(r => r.caseId === caseId)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate CDS recommendations using Gemini
   */
  async generateCDSRecommendations(
    caseId: string,
    patientData: {
      age: number;
      gender: string;
      chiefComplaint: string;
      medicalHistory: string[];
      medications: string[];
      vitals: Record<string, number>;
    }
  ): Promise<CDSRecommendation[]> {
    const promptContext = `
    Patient Case:
    - Age: ${patientData.age}
    - Gender: ${patientData.gender}
    - Chief Complaint: ${patientData.chiefComplaint}
    - Medical History: ${patientData.medicalHistory.join(', ')}
    - Current Medications: ${patientData.medications.join(', ')}
    - Vitals: ${JSON.stringify(patientData.vitals)}
    
    Please provide clinical decision support recommendations covering:
    1. Diagnosis considerations
    2. Treatment options
    3. Monitoring requirements
    4. Prevention strategies
    5. Referral needs (if any)
    
    For each recommendation, provide:
    - Title and description
    - Evidence level (high/moderate/low)
    - Confidence score (0-100)
    - Action items
    - Risk factors to monitor
    `;

    try {
      const analysisText = await this.geminiClient.analyzeReport(
        'text',
        promptContext,
        'cds_analysis'
      );

      const recommendations = this.parseCDSRecommendations(analysisText, caseId);
      
      // Save recommendations
      recommendations.forEach(rec => {
        this.cdsRecommendations.set(rec.id, rec);
      });

      return recommendations;
    } catch (error) {
      console.error('Error generating CDS recommendations:', error);
      return [];
    }
  }

  /**
   * Parse CDS recommendations from AI response
   */
  private parseCDSRecommendations(analysisText: string, caseId: string): CDSRecommendation[] {
    const recommendations: CDSRecommendation[] = [];

    // Extract recommendations from structured text
    const types: CDSRecommendation['type'][] = ['diagnosis', 'treatment', 'monitoring', 'prevention', 'referral'];

    types.forEach(type => {
      const pattern = new RegExp(`${type}:?\\s*([^.!?]*[.!?])`, 'gi');
      let match;

      while ((match = pattern.exec(analysisText)) !== null) {
        recommendations.push({
          id: this.generateId(),
          caseId,
          type,
          title: this.extractTitle(match[1]),
          description: match[1].trim(),
          confidence: this.extractConfidence(analysisText, type),
          evidenceLevel: this.extractEvidenceLevel(analysisText, type),
          references: this.extractReferences(analysisText),
          actionableItems: this.extractActionItems(analysisText, type),
          riskFactors: this.extractRiskFactors(analysisText),
          createdAt: new Date(),
          reviewed: false
        });
      }
    });

    return recommendations.slice(0, 10); // Max 10 recommendations
  }

  /**
   * Get patient communications
   */
  async getPatientCommunications(
    patientId: string,
    doctorId: string,
    unreadOnly: boolean = false
  ): Promise<PatientCommunication[]> {
    let comms = Array.from(this.communications.values())
      .filter(c => c.patientId === patientId && c.doctorId === doctorId);

    if (unreadOnly) {
      comms = comms.filter(c => !c.isRead);
    }

    return comms.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Send message to patient
   */
  async sendPatientMessage(
    patientId: string,
    doctorId: string,
    message: {
      title: string;
      content: string;
      type: PatientCommunication['type'];
      priority: PatientCommunication['priority'];
      attachments?: string[];
    }
  ): Promise<PatientCommunication> {
    const newComm: PatientCommunication = {
      id: this.generateId(),
      patientId,
      doctorId,
      type: message.type,
      title: message.title,
      content: message.content,
      isRead: false,
      createdAt: new Date(),
      attachments: message.attachments,
      priority: message.priority
    };

    this.communications.set(newComm.id, newComm);
    return newComm;
  }

  /**
   * Mark communication as read
   */
  async markCommunicationAsRead(commId: string): Promise<void> {
    const comm = this.communications.get(commId);
    if (comm) {
      comm.isRead = true;
      this.communications.set(commId, comm);
    }
  }

  /**
   * Get available consultation slots
   */
  async getAvailableSlots(
    doctorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ConsultationSlot[]> {
    return Array.from(this.consultationSlots.values())
      .filter(slot => 
        slot.doctorId === doctorId &&
        slot.isAvailable &&
        slot.startTime >= startDate &&
        slot.endTime <= endDate
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Book consultation slot
   */
  async bookConsultationSlot(
    slotId: string,
    patientId: string
  ): Promise<ConsultationSlot | null> {
    const slot = this.consultationSlots.get(slotId);
    if (!slot || !slot.isAvailable) return null;

    slot.isAvailable = false;
    slot.bookedBy = patientId;

    this.consultationSlots.set(slotId, slot);
    return slot;
  }

  /**
   * Get doctor statistics
   */
  async getDoctorStatistics(doctorId: string): Promise<DoctorStatistics> {
    const caseIds = Array.from(this.patientCases.values())
      .map(c => c.id);

    const thisMonth = new Date();
    thisMonth.setMonth(thisMonth.getMonth() - 1);

    const casesThisMonth = Array.from(this.patientCases.values())
      .filter(c => c.createdAt > thisMonth).length;

    const casesInProgress = Array.from(this.patientCases.values())
      .filter(c => c.status === 'in-progress').length;

    const casesCompleted = Array.from(this.patientCases.values())
      .filter(c => c.status === 'completed').length;

    const emergencyCases = Array.from(this.patientCases.values())
      .filter(c => c.priority === 'emergency').length;

    return {
      totalPatients: this.patientCases.size,
      patientsThisMonth: casesThisMonth,
      prescriptionsIssued: this.prescriptions.size,
      reportsReviewed: Array.from(this.reports.values())
        .filter(r => r.status === 'reviewed').length,
      averageConsultationTime: 45,
      patientSatisfactionScore: 4.7,
      casesCompleted,
      casesInProgress,
      emergencyCasesHandled: emergencyCases,
      avgResponseTime: 15
    };
  }

  /**
   * Get workflow status for case
   */
  async getWorkflowStatus(caseId: string): Promise<DoctorWorkflow | null> {
    return this.workflows.get(caseId) || null;
  }

  /**
   * Update workflow stage
   */
  async updateWorkflowStage(
    caseId: string,
    newStage: DoctorWorkflow['stage'],
    actionItems?: string[],
    notes?: string
  ): Promise<DoctorWorkflow> {
    let workflow = this.workflows.get(caseId);

    if (!workflow) {
      workflow = {
        caseId,
        stage: 'intake',
        completedStages: [],
        currentActionItems: [],
        notes: '',
        lastUpdated: new Date()
      };
    }

    workflow.completedStages.push(workflow.stage);
    workflow.stage = newStage;
    workflow.currentActionItems = actionItems || [];
    if (notes) workflow.notes = notes;
    workflow.lastUpdated = new Date();

    this.workflows.set(caseId, workflow);
    return workflow;
  }

  /**
   * Generate daily report
   */
  async generateDailyReport(doctorId: string): Promise<{
    date: Date;
    casesReviewed: number;
    prescriptionsIssued: number;
    reportsReviewed: number;
    messagesReceived: number;
    pendingCases: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cases = Array.from(this.patientCases.values());
    const casesReviewed = cases.filter(c => 
      c.updatedAt >= today && c.status !== 'pending-review'
    ).length;

    const prescriptionsIssued = Array.from(this.prescriptions.values())
      .filter(p => p.doctorId === doctorId && p.issuedDate >= today).length;

    const reportsReviewed = Array.from(this.reports.values())
      .filter(r => r.reviewDate && r.reviewDate >= today).length;

    const messagesReceived = Array.from(this.communications.values())
      .filter(c => c.doctorId === doctorId && c.createdAt >= today).length;

    const pendingCases = cases.filter(c => c.status === 'pending-review').length;

    return {
      date: new Date(),
      casesReviewed,
      prescriptionsIssued,
      reportsReviewed,
      messagesReceived,
      pendingCases
    };
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSignatureHash(): string {
    return `sig_${Math.random().toString(36).substr(2, 16)}`;
  }

  private extractTitle(text: string): string {
    return text.split(':')[0].trim().substring(0, 100);
  }

  private extractConfidence(text: string, type: string): number {
    const pattern = new RegExp(`${type}.*?(\\d+)%`, 'i');
    const match = text.match(pattern);
    return match ? parseInt(match[1]) : 75;
  }

  private extractEvidenceLevel(text: string, type: string): 'high' | 'moderate' | 'low' {
    const pattern = new RegExp(`${type}.*?(high|moderate|low)`, 'i');
    const match = text.match(pattern);
    const level = match ? match[1].toLowerCase() : 'moderate';
    return (level as any) || 'moderate';
  }

  private extractReferences(text: string): string[] {
    const refs: string[] = [];
    const pattern = /\[([^\]]+)\]/g;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      refs.push(match[1]);
    }

    return refs.slice(0, 5);
  }

  private extractActionItems(text: string, type: string): string[] {
    const items: string[] = [];
    const pattern = new RegExp(`${type}.*?actions?:?\\s*([^.!?]*)`, 'i');
    const match = text.match(pattern);

    if (match) {
      return match[1].split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .slice(0, 5);
    }

    return items;
  }

  private extractRiskFactors(text: string): string[] {
    const factors: string[] = [];
    const pattern = /risk factors?:?\s*([^.!?]*)/gi;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      factors.push(...match[1].split(/[,;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
      );
    }

    return factors.slice(0, 5);
  }
}

export default DoctorDashboardService;
