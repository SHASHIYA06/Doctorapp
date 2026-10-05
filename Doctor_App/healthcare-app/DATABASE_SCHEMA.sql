-- Healthcare Application Database Schema
-- Neon PostgreSQL Database
-- Complete schema for patient-doctor consultation platform

-- ============================================
-- 1. USERS TABLE (Base user information)
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('patient', 'doctor', 'admin')),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  profile_picture_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. PATIENTS TABLE
-- ============================================
CREATE TABLE patients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender VARCHAR(20),
  blood_group VARCHAR(5),
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  emergency_contact VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  medical_history TEXT,
  allergies TEXT,
  current_medications TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. DOCTORS TABLE
-- ============================================
CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  specialization VARCHAR(100) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  experience_years INTEGER,
  qualifications TEXT,
  clinic_name VARCHAR(255),
  clinic_address TEXT,
  consultation_fee DECIMAL(10,2),
  is_available BOOLEAN DEFAULT true,
  available_from TIME,
  available_to TIME,
  rating DECIMAL(3,2) DEFAULT 0,
  total_consultations INTEGER DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. MEDICINES TABLE
-- ============================================
CREATE TABLE medicines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  description TEXT,
  dosage_form VARCHAR(100),
  strength VARCHAR(100),
  manufacturer VARCHAR(255),
  price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  side_effects TEXT,
  contraindications TEXT,
  usage_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. CONSULTATIONS TABLE (Main consultation records)
-- ============================================
CREATE TABLE consultations (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  consultation_type VARCHAR(50) NOT NULL CHECK (consultation_type IN ('online', 'offline')),
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date TIMESTAMP NOT NULL,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  consultation_fee DECIMAL(10,2),
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. COMPLAINTS TABLE (Patient's initial complaints)
-- ============================================
CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  chief_complaint VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  symptom_duration VARCHAR(100),
  severity VARCHAR(50) CHECK (severity IN ('mild', 'moderate', 'severe')),
  medication_tried TEXT,
  medication_effectiveness VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 7. MEDICAL_DOCUMENTS TABLE (Patient uploads)
-- ============================================
CREATE TABLE medical_documents (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
  consultation_id INTEGER REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL CHECK (document_type IN ('lab_report', 'xray', 'scan', 'prescription', 'other')),
  file_url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER,
  description TEXT,
  uploaded_by_type VARCHAR(50) CHECK (uploaded_by_type IN ('patient', 'doctor')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. DIAGNOSES TABLE (Doctor's diagnosis)
-- ============================================
CREATE TABLE diagnoses (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  diagnosis_text TEXT NOT NULL,
  findings TEXT,
  icd_code VARCHAR(50),
  severity VARCHAR(50),
  treatment_plan TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_days INTEGER,
  recommendations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. PRESCRIPTIONS TABLE (Doctor's prescriptions)
-- ============================================
CREATE TABLE prescriptions (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  diagnosis_id INTEGER REFERENCES diagnoses(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  prescription_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 10. PRESCRIPTION_ITEMS TABLE (Individual medicines in prescription)
-- ============================================
CREATE TABLE prescription_items (
  id SERIAL PRIMARY KEY,
  prescription_id INTEGER NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  instructions TEXT,
  quantity INTEGER,
  is_taken BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. PAYMENTS TABLE (Payment records)
-- ============================================
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('credit_card', 'debit_card', 'upi', 'wallet')),
  payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_id VARCHAR(255),
  transaction_id VARCHAR(255) UNIQUE,
  payment_date TIMESTAMP,
  refund_date TIMESTAMP,
  refund_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 12. MESSAGES TABLE (Real-time chat)
-- ============================================
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'prescription')),
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 13. MEDICINE_ORDERS TABLE (Patient orders medicines)
-- ============================================
CREATE TABLE medicine_orders (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  delivery_address TEXT,
  order_status VARCHAR(50) DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'dispatched', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2),
  delivery_date TIMESTAMP,
  tracking_number VARCHAR(100),
  delivery_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 14. MEDICINE_ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE medicine_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES medicine_orders(id) ON DELETE CASCADE,
  medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL(10,2),
  total_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 15. REVIEWS TABLE (Doctor ratings and reviews)
-- ============================================
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id INTEGER REFERENCES consultations(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 16. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100),
  title VARCHAR(255),
  message TEXT,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_complaints_patient_id ON complaints(patient_id);
CREATE INDEX idx_complaints_consultation_id ON complaints(consultation_id);
CREATE INDEX idx_diagnoses_doctor_id ON diagnoses(doctor_id);
CREATE INDEX idx_diagnoses_consultation_id ON diagnoses(consultation_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX idx_messages_consultation_id ON messages(consultation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_payments_consultation_id ON payments(consultation_id);
CREATE INDEX idx_payments_patient_id ON payments(patient_id);
CREATE INDEX idx_medicine_orders_patient_id ON medicine_orders(patient_id);
CREATE INDEX idx_reviews_doctor_id ON reviews(doctor_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
