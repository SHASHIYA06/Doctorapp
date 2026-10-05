/**
 * Doctor Dashboard Components Export Index
 * Central export point for all dashboard components, services, and utilities
 * Provides a clean API for importing dashboard functionality throughout the application
 */

// ============================================================================
// COMPONENTS EXPORT
// ============================================================================

// Main Dashboard Component
export { DoctorDashboard } from './DoctorDashboard';
export type { DoctorDashboardProps } from './DoctorDashboard';

// Patient Management Component
export { PatientManagement } from './PatientManagement';
export type { PatientManagementProps, PatientProfile, MedicalHistory, AllergyRecord, VitalSigns, PatientDocument } from './PatientManagement';

// Prescription History Component
export { PrescriptionHistory } from './PrescriptionHistory';
export type { PrescriptionHistoryProps, Prescription, Medicine, AnalyticsMetric } from './PrescriptionHistory';

// Report Review Component
export { ReportReview } from './ReportReview';
export type { ReportReviewProps, PatientReport, AIAnalysis, ReportFinding, ComparisonData } from './ReportReview';

// Clinical Decision Support Component
export { CDSIntegration } from './CDSIntegration';
export type { CDSIntegrationProps, CDSRecommendation, CaseData, CDSRecommendationType } from './CDSIntegration';

// Patient Communication Component
export { PatientCommunication } from './PatientCommunication';
export type { PatientCommunicationProps, Message, Conversation, ConsultationSlot } from './PatientCommunication';

// ============================================================================
// STYLES EXPORT
// ============================================================================

// Import global styles - these are typically imported in the main app file
// but exporting paths here for reference
export const STYLES = {
  GLOBAL: './styles/DashboardGlobal.css',
  ANIMATIONS: './styles/DashboardAnimations.css',
  DASHBOARD: './styles/DoctorDashboard.css',
  PATIENT_MANAGEMENT: './styles/PatientManagement.css',
  PRESCRIPTION_HISTORY: './styles/PrescriptionHistory.css',
  REPORT_REVIEW: './styles/ReportReview.css',
  CDS_INTEGRATION: './styles/CDSIntegration.css',
  PATIENT_COMMUNICATION: './styles/PatientCommunication.css'
};

// ============================================================================
// UTILITY TYPES & INTERFACES
// ============================================================================

/**
 * Dashboard Configuration Options
 */
export interface DashboardConfig {
  theme?: 'light' | 'dark';
  enableAnimations?: boolean;
  enableNotifications?: boolean;
  enableRealTimeSync?: boolean;
  apiBaseUrl?: string;
}

/**
 * Dashboard User Context
 */
export interface DashboardUserContext {
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospital?: string;
  avatar?: string;
  permissions?: string[];
}

/**
 * Dashboard API Response Types
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Filter Options
 */
export interface FilterOptions {
  [key: string]: string | number | boolean | string[];
}

/**
 * Notification Types
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

/**
 * Color Theme Configuration
 */
export const THEME = {
  PRIMARY: '#667eea',
  PRIMARY_DARK: '#764ba2',
  PRIMARY_LIGHT: '#ede9fe',
  SUCCESS: '#10b981',
  SUCCESS_LIGHT: '#d1fae5',
  WARNING: '#f59e0b',
  WARNING_LIGHT: '#fef3c7',
  DANGER: '#ef4444',
  DANGER_LIGHT: '#fee2e2',
  INFO: '#3b82f6',
  INFO_LIGHT: '#dbeafe',
  GRAY_50: '#f9fafb',
  GRAY_100: '#f3f4f6',
  GRAY_200: '#e5e7eb',
  GRAY_300: '#d1d5db',
  GRAY_400: '#9ca3af',
  GRAY_500: '#6b7280',
  GRAY_600: '#4b5563',
  GRAY_700: '#374151',
  GRAY_800: '#1f2937',
  GRAY_900: '#111827'
};

/**
 * Breakpoints Configuration
 */
export const BREAKPOINTS = {
  XS: 320,
  SM: 480,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536
};

/**
 * Z-Index Stack
 */
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1020,
  FIXED: 1030,
  MODAL_BACKDROP: 1040,
  MODAL: 1050,
  POPOVER: 1060,
  TOOLTIP: 1070
};

// ============================================================================
// STATUS & PRIORITY ENUMS
// ============================================================================

/**
 * Patient Queue Status
 */
export enum PatientQueueStatus {
  EMERGENCY = 'emergency',
  URGENT = 'urgent',
  ROUTINE = 'routine',
  FOLLOW_UP = 'follow_up'
}

/**
 * Prescription Status
 */
export enum PrescriptionStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  FULFILLED = 'fulfilled',
  EXPIRED = 'expired'
}

/**
 * Report Type
 */
export enum ReportType {
  BLOOD_TEST = 'blood_test',
  X_RAY = 'x_ray',
  CT_SCAN = 'ct_scan',
  ULTRASOUND = 'ultrasound',
  ECG = 'ecg',
  MRI = 'mri',
  PATHOLOGY = 'pathology',
  GENERAL = 'general'
}

/**
 * CDS Recommendation Type
 */
export enum CDSRecommendationType {
  DIAGNOSIS = 'diagnosis',
  TREATMENT = 'treatment',
  MONITORING = 'monitoring',
  PREVENTION = 'prevention',
  REFERRAL = 'referral'
}

/**
 * Evidence Level
 */
export enum EvidenceLevel {
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low'
}

/**
 * Conversation Status
 */
export enum ConversationStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

/**
 * Consultation Type
 */
export enum ConsultationType {
  ONLINE = 'online',
  OFFLINE = 'offline'
}

// ============================================================================
// MOCK DATA & SAMPLE EXPORTS
// ============================================================================

/**
 * Sample Patient Data for Development
 */
export const SAMPLE_PATIENTS = [
  {
    id: 'P001',
    name: 'Rajesh Kumar',
    age: 45,
    gender: 'Male',
    chiefComplaint: 'Persistent cough and fever',
    priority: PatientQueueStatus.URGENT
  },
  {
    id: 'P002',
    name: 'Priya Sharma',
    age: 38,
    gender: 'Female',
    chiefComplaint: 'Hypertension follow-up',
    priority: PatientQueueStatus.ROUTINE
  },
  {
    id: 'P003',
    name: 'Amit Patel',
    age: 52,
    gender: 'Male',
    chiefComplaint: 'Chest pain',
    priority: PatientQueueStatus.EMERGENCY
  },
  {
    id: 'P004',
    name: 'Sneha Desai',
    age: 29,
    gender: 'Female',
    chiefComplaint: 'Lab results review',
    priority: PatientQueueStatus.ROUTINE
  }
];

/**
 * Sample Prescriptions
 */
export const SAMPLE_PRESCRIPTIONS = [
  {
    id: 'RX001',
    patientName: 'Rajesh Kumar',
    medicines: ['Amoxicillin 500mg', 'Cough Syrup 100ml'],
    status: PrescriptionStatus.ACTIVE,
    issuedDate: '2024-01-15'
  },
  {
    id: 'RX002',
    patientName: 'Priya Sharma',
    medicines: ['Lisinopril 10mg'],
    status: PrescriptionStatus.FULFILLED,
    issuedDate: '2024-01-10'
  }
];

/**
 * Sample Reports
 */
export const SAMPLE_REPORTS = [
  {
    id: 'RPT001',
    patientName: 'Rajesh Kumar',
    type: ReportType.BLOOD_TEST,
    date: '2024-01-15',
    status: 'completed'
  },
  {
    id: 'RPT002',
    patientName: 'Amit Patel',
    type: ReportType.ECG,
    date: '2024-01-14',
    status: 'completed'
  }
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color for patient priority
 */
export function getPriorityColor(priority: PatientQueueStatus): string {
  switch (priority) {
    case PatientQueueStatus.EMERGENCY:
      return THEME.DANGER;
    case PatientQueueStatus.URGENT:
      return THEME.WARNING;
    case PatientQueueStatus.ROUTINE:
      return THEME.INFO;
    case PatientQueueStatus.FOLLOW_UP:
      return THEME.GRAY_400;
    default:
      return THEME.GRAY_400;
  }
}

/**
 * Get background color for status
 */
export function getStatusBgColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
      return THEME.SUCCESS_LIGHT;
    case 'pending':
      return THEME.WARNING_LIGHT;
    case 'expired':
    case 'closed':
      return THEME.DANGER_LIGHT;
    default:
      return THEME.GRAY_100;
  }
}

/**
 * Get text color for status
 */
export function getStatusTextColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
      return THEME.SUCCESS;
    case 'pending':
      return THEME.WARNING;
    case 'expired':
    case 'closed':
      return THEME.DANGER;
    default:
      return THEME.GRAY_600;
  }
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = format === 'short'
    ? { year: 'numeric', month: 'short', day: 'numeric' }
    : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleDateString('en-IN', options);
}

/**
 * Format time to readable string
 */
export function formatTime(time: string | Date): string {
  const d = new Date(time);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Debounce function for search and filter operations
 */
export function debounce<T extends (...args: any[]) => any>(func: T, delay: number = 300): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function debounced(...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Throttle function for scroll and resize events
 */
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number = 300): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Deep clone utility
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Validation utilities
 */
export const Validators = {
  isEmail: (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isPhone: (phone: string): boolean => /^\d{10}$/.test(phone.replace(/\D/g, '')),
  isDate: (date: string): boolean => !isNaN(Date.parse(date)),
  isEmpty: (value: any): boolean => value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0),
  isNumber: (value: any): boolean => typeof value === 'number' && !isNaN(value),
  isPositive: (value: number): boolean => value > 0,
  minLength: (value: string, length: number): boolean => value.length >= length,
  maxLength: (value: string, length: number): boolean => value.length <= length
};

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * API Endpoints (relative)
 */
export const API_ENDPOINTS = {
  PATIENTS: '/api/patients',
  PRESCRIPTIONS: '/api/prescriptions',
  REPORTS: '/api/reports',
  CDS_RECOMMENDATIONS: '/api/cds/recommendations',
  CONSULTATIONS: '/api/consultations',
  MESSAGES: '/api/messages',
  ANALYTICS: '/api/analytics'
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  DOCTOR_PROFILE: 'doctor_profile',
  USER_PREFERENCES: 'user_preferences',
  RECENT_PATIENTS: 'recent_patients',
  SAVED_FILTERS: 'saved_filters',
  THEME: 'theme_preference'
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please contact support.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NOT_FOUND: 'Resource not found.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  TIMEOUT: 'Request timed out. Please try again.'
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  SAVED: 'Changes saved successfully.',
  DELETED: 'Item deleted successfully.',
  UPDATED: 'Item updated successfully.',
  CREATED: 'Item created successfully.',
  SENT: 'Message sent successfully.',
  SCHEDULED: 'Appointment scheduled successfully.'
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * Dashboard Module Export
 * Provides all necessary exports for dashboard functionality
 */
export default {
  // Components
  DoctorDashboard: require('./DoctorDashboard').DoctorDashboard,
  PatientManagement: require('./PatientManagement').PatientManagement,
  PrescriptionHistory: require('./PrescriptionHistory').PrescriptionHistory,
  ReportReview: require('./ReportReview').ReportReview,
  CDSIntegration: require('./CDSIntegration').CDSIntegration,
  PatientCommunication: require('./PatientCommunication').PatientCommunication,
  
  // Constants
  THEME,
  BREAKPOINTS,
  Z_INDEX,
  STYLES,
  
  // Utilities
  formatDate,
  formatTime,
  debounce,
  throttle,
  deepClone,
  Validators,
  getPriorityColor,
  getStatusBgColor,
  getStatusTextColor,
  
  // APIs
  API_ENDPOINTS,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  
  // Enums
  PatientQueueStatus,
  PrescriptionStatus,
  ReportType,
  CDSRecommendationType,
  EvidenceLevel,
  ConversationStatus,
  ConsultationType,
  
  // Sample Data
  SAMPLE_PATIENTS,
  SAMPLE_PRESCRIPTIONS,
  SAMPLE_REPORTS
};
