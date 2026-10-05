/**
 * Marketplace Domain Types
 * Comprehensive medicine database with 3 modalities
 */

/**
 * Medicine Modality
 */
export type MedicineModality = 'allopathy' | 'ayurveda' | 'homeopathy';

/**
 * Dosage Form
 */
export type DosageForm = 'tablet' | 'capsule' | 'liquid' | 'syrup' | 'injection' | 'cream' | 'powder' | 'oil' | 'drops';

/**
 * Evidence Level
 */
export type EvidenceLevel = 'A' | 'B' | 'C'; // A=RCT, B=Observational, C=Expert

/**
 * Complete Medicine Information
 */
export interface Medicine {
  id: string;
  generic_name: string;
  brand_names: string[];
  modality: MedicineModality;
  therapeutic_category: string;
  dosage_forms: DosageForm[];
  strength: string; // e.g., "500mg"
  packaging: string; // e.g., "Strip of 10 tablets"
  
  // Clinical Information
  indications: string[]; // What it's used for
  contraindications: string[]; // When NOT to use
  precautions: string[]; // Special care needed
  side_effects: string[]; // Possible adverse effects
  interactions: string[]; // Drug interactions
  
  // Usage Information
  adult_dosage: string; // e.g., "1-2 tablets twice daily"
  pediatric_dosage: string; // Age-specific dosing
  pregnancy_category: 'A' | 'B' | 'C' | 'D' | 'X' | 'N/A'; // FDA pregnancy category
  instructions: string; // How to use (patient-friendly)
  
  // Supply Information
  manufacturers: string[];
  suppliers: SupplierInfo[];
  
  // Clinical Evidence
  evidence_level: EvidenceLevel;
  clinical_use_since: number; // Year introduced
  
  // Pricing
  price_inr: number;
  price_usd: number;
  
  // Storage & Handling
  storage_temperature: string; // e.g., "2-8°C"
  shelf_life_months: number;
  requires_prescription: boolean;
  
  // Additional
  otc_available: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * Supplier Information
 */
export interface SupplierInfo {
  supplier_id: string;
  name: string;
  contact_email: string;
  contact_phone: string;
  price_inr: number;
  price_usd: number;
  in_stock: boolean;
  delivery_days: number;
  rating: number; // 1-5
  reviews_count: number;
}

/**
 * Doctor Prescription
 */
export interface Prescription {
  id: string;
  doctor_id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_weight_kg: number;
  
  // Prescription Details
  items: PrescriptionItem[];
  diagnosis: string;
  clinical_notes: string;
  
  // Signatures & Compliance
  doctor_name: string;
  doctor_license: string;
  digital_signature: string;
  signature_timestamp: string;
  mfa_verified: boolean;
  
  // Status
  status: 'draft' | 'signed' | 'issued' | 'expired';
  valid_until: string;
  
  // Audit
  created_at: string;
  signed_at?: string;
  audit_event_id: string;
  
  // Marketplace
  can_order_from_marketplace: boolean;
  marketplace_order_id?: string;
}

/**
 * Single Item in Prescription
 */
export interface PrescriptionItem {
  medicine_id: string;
  medicine_name: string;
  dosage: string; // e.g., "500mg"
  frequency: string; // e.g., "twice daily"
  duration: string; // e.g., "7 days"
  quantity: number;
  instructions: string;
  refills_allowed: number;
}

/**
 * Marketplace Order
 */
export interface MarketplaceOrder {
  id: string;
  patient_id: string;
  patient_name: string;
  
  // Order Items
  items: OrderItem[];
  
  // Prescription Link
  prescription_id?: string;
  
  // Pricing
  subtotal_inr: number;
  tax_inr: number;
  shipping_inr: number;
  total_inr: number;
  
  total_usd: number;
  
  // Delivery
  delivery_address: DeliveryAddress;
  estimated_delivery: string;
  
  // Status
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  tracking_number?: string;
  
  // Payment
  payment_method: 'credit_card' | 'upi' | 'netbanking' | 'wallet';
  payment_status: 'pending' | 'completed' | 'failed';
  
  // Audit
  created_at: string;
  updated_at: string;
  audit_event_id: string;
}

/**
 * Item in Marketplace Order
 */
export interface OrderItem {
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  price_per_unit_inr: number;
  supplier_id: string;
  supplier_name: string;
}

/**
 * Delivery Address
 */
export interface DeliveryAddress {
  name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

/**
 * Medical Report (for upload & analysis)
 */
export interface MedicalReport {
  id: string;
  patient_id: string;
  doctor_id?: string;
  
  // File Information
  file_name: string;
  file_url: string;
  file_type: 'pdf' | 'image' | 'document';
  file_size_bytes: number;
  
  // Report Details
  report_type: 'blood_test' | 'xray' | 'ultrasound' | 'ct_scan' | 'mri' | 'general' | 'other';
  report_date: string;
  collected_by_lab?: string;
  
  // Gemini Analysis
  gemini_analysis?: GeminiAnalysis;
  analyzed_at?: string;
  
  // Clinical Use
  used_in_cds?: boolean;
  cds_session_id?: string;
  
  // Audit
  created_at: string;
  updated_at: string;
  audit_event_id: string;
}

/**
 * Gemini Analysis Output
 */
export interface GeminiAnalysis {
  summary: string;
  key_findings: string[];
  abnormalities_detected: string[];
  recommendations: string[];
  follow_up_required: boolean;
  follow_up_suggestions?: string[];
  confidence_score: number; // 0-1
  clinical_notes: string;
}

/**
 * Patient Education Content
 */
export interface PatientEducation {
  id: string;
  
  // Content Type
  content_type: 'medicine_info' | 'symptom_guide' | 'how_to_use' | 'side_effects' | 'lifestyle';
  title: string;
  summary: string;
  full_content: string;
  
  // Metadata
  related_medicines?: string[]; // medicine IDs
  related_conditions?: string[];
  
  // Gemini-Generated
  generated_by_gemini: boolean;
  gemini_prompt?: string;
  
  // Approval
  approved_by_doctor?: string;
  approved_at?: string;
  
  // Usage
  views: number;
  helpful_count: number;
  not_helpful_count: number;
  
  created_at: string;
  updated_at: string;
}

/**
 * Doctor Verification (License & Credentials)
 */
export interface DoctorVerification {
  id: string;
  doctor_id: string;
  
  // License Information
  license_number: string;
  specialty: string[]; // e.g., ['General Medicine', 'Pediatrics']
  medical_council: string; // e.g., "Medical Council of India"
  registration_number: string;
  
  // Credentials
  degrees: string[]; // e.g., ['MBBS', 'MD Medicine']
  years_of_experience: number;
  
  // Verification Status
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verified_at?: string;
  verified_by_admin?: string;
  
  // Documents
  license_document_url?: string;
  degree_documents?: string[];
  
  // Expiry
  valid_until?: string;
  
  created_at: string;
  updated_at: string;
}

/**
 * Marketplace Statistics
 */
export interface MarketplaceStats {
  total_medicines: number;
  medicines_by_modality: {
    allopathy: number;
    ayurveda: number;
    homeopathy: number;
  };
  total_suppliers: number;
  total_orders: number;
  total_revenue_inr: number;
  average_order_value_inr: number;
}
