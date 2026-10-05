-- ============================================
-- SEED DATA for Healthcare SaaS Application
-- Sample data for testing and development
-- ============================================

-- ============================================
-- 1. SAMPLE USERS (passwords are "Test@123" hashed with bcrypt)
-- ============================================
INSERT INTO users (email, password_hash, user_type, first_name, last_name, phone, is_active) VALUES
('patient1@example.com', '$2a$10$YourHashedPasswordHere', 'patient', 'John', 'Doe', '+91-9876543210', true),
('patient2@example.com', '$2a$10$YourHashedPasswordHere', 'patient', 'Jane', 'Smith', '+91-9876543211', true),
('doctor1@example.com', '$2a$10$YourHashedPasswordHere', 'doctor', 'Dr. Sarah', 'Johnson', '+91-9876543220', true),
('doctor2@example.com', '$2a$10$YourHashedPasswordHere', 'doctor', 'Dr. Michael', 'Chen', '+91-9876543221', true),
('doctor3@example.com', '$2a$10$YourHashedPasswordHere', 'doctor', 'Dr. Priya', 'Sharma', '+91-9876543222', true),
('admin@example.com', '$2a$10$YourHashedPasswordHere', 'admin', 'Admin', 'User', '+91-9876543230', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. SAMPLE PATIENTS
-- ============================================
INSERT INTO patients (user_id, date_of_birth, gender, blood_group, height_cm, weight_kg, city, state, emergency_contact, emergency_contact_phone, allergies) VALUES
(1, '1985-05-15', 'Male', 'O+', 175.5, 75.0, 'Mumbai', 'Maharashtra', 'Mary Doe', '+91-9876543212', 'Penicillin'),
(2, '1992-08-20', 'Female', 'A+', 165.0, 60.0, 'Delhi', 'Delhi', 'Robert Smith', '+91-9876543213', 'None')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 3. SAMPLE DOCTORS
-- ============================================
INSERT INTO doctors (user_id, specialization, license_number, experience_years, qualifications, consultation_fee, rating, total_consultations, bio, languages_spoken) VALUES
(3, 'Cardiology', 'MCI-12345-CARD', 15, 'MBBS, MD (Cardiology), FACC', 1000.00, 4.8, 250, 'Experienced cardiologist specializing in heart disease prevention and treatment', 'English, Hindi'),
(4, 'General Medicine', 'MCI-12346-GM', 10, 'MBBS, MD (Internal Medicine)', 800.00, 4.5, 180, 'General physician with focus on preventive care', 'English, Mandarin, Hindi'),
(5, 'Pediatrics', 'MCI-12347-PED', 12, 'MBBS, MD (Pediatrics), DCH', 900.00, 4.9, 320, 'Specialist in child healthcare and development', 'English, Hindi, Marathi')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- 4. SAMPLE MEDICINES
-- ============================================
INSERT INTO medicines (name, generic_name, description, dosage_form, strength, manufacturer, price, stock_quantity, category, requires_prescription) VALUES
('Crocin Advance', 'Paracetamol', 'Pain relief and fever reducer', 'Tablet', '650mg', 'GSK', 25.00, 500, 'Analgesic', false),
('Augmentin', 'Amoxicillin + Clavulanic Acid', 'Antibiotic for bacterial infections', 'Tablet', '625mg', 'GSK', 150.00, 200, 'Antibiotic', true),
('Metformin', 'Metformin HCl', 'Type 2 diabetes management', 'Tablet', '500mg', 'Sun Pharma', 80.00, 300, 'Anti-diabetic', true),
('Atorvastatin', 'Atorvastatin Calcium', 'Cholesterol management', 'Tablet', '10mg', 'Cipla', 120.00, 250, 'Lipid Lowering', true),
('Omez', 'Omeprazole', 'Gastric acid reducer', 'Capsule', '20mg', 'Dr. Reddy\'s', 95.00, 400, 'Antacid', false),
('Cetrizine', 'Cetirizine HCl', 'Antihistamine for allergies', 'Tablet', '10mg', 'Cipla', 40.00, 350, 'Antihistamine', false),
('Azithromycin', 'Azithromycin', 'Antibiotic for respiratory infections', 'Tablet', '500mg', 'Alkem', 180.00, 150, 'Antibiotic', true),
('Ecosprin', 'Aspirin', 'Blood thinner', 'Tablet', '75mg', 'USV', 30.00, 450, 'Antiplatelet', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. SAMPLE CONSULTATIONS
-- ============================================
INSERT INTO consultations (patient_id, doctor_id, consultation_type, status, scheduled_date, consultation_fee, payment_status) VALUES
(1, 1, 'online', 'scheduled', NOW() + INTERVAL '2 days', 1000.00, 'pending'),
(2, 2, 'online', 'completed', NOW() - INTERVAL '5 days', 800.00, 'completed'),
(1, 3, 'offline', 'completed', NOW() - INTERVAL '10 days', 900.00, 'completed')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. SAMPLE COMPLAINTS
-- ============================================
INSERT INTO complaints (consultation_id, patient_id, chief_complaint, description, symptoms, symptom_duration, severity) VALUES
(2, 2, 'Persistent cough', 'I have been experiencing a dry cough for the past week', 'Dry cough, mild fever, fatigue', '7 days', 'moderate'),
(3, 1, 'Chest pain', 'Sharp chest pain when breathing deeply', 'Chest pain, shortness of breath', '3 days', 'severe')
ON CONFLICT DO NOTHING;

-- ============================================
-- 7. SAMPLE DIAGNOSES
-- ============================================
INSERT INTO diagnoses (consultation_id, complaint_id, doctor_id, diagnosis_text, findings, treatment_plan, follow_up_required, follow_up_days) VALUES
(2, 1, 2, 'Upper Respiratory Tract Infection', 'Mild throat inflammation observed, no signs of pneumonia', 'Antibiotics and rest for 5 days', true, 7),
(3, 2, 1, 'Musculoskeletal chest pain', 'No cardiac involvement detected, likely muscular strain', 'Pain management with NSAIDs, rest', true, 14)
ON CONFLICT DO NOTHING;

-- ============================================
-- 8. SAMPLE PRESCRIPTIONS
-- ============================================
INSERT INTO prescriptions (consultation_id, diagnosis_id, patient_id, doctor_id, notes, status, valid_until) VALUES
(2, 1, 2, 2, 'Complete the full course of antibiotics', 'active', CURRENT_DATE + INTERVAL '30 days'),
(3, 2, 1, 1, 'Take medications after meals', 'active', CURRENT_DATE + INTERVAL '30 days')
ON CONFLICT DO NOTHING;

-- ============================================
-- 9. SAMPLE PRESCRIPTION ITEMS
-- ============================================
INSERT INTO prescription_items (prescription_id, medicine_id, dosage, frequency, duration, instructions, quantity) VALUES
(1, 2, '625mg', 'Twice daily', '5 days', 'Take after meals', 10),
(1, 1, '650mg', 'As needed', '5 days', 'Take when fever occurs', 10),
(2, 1, '650mg', 'Thrice daily', '7 days', 'Take after meals', 21),
(2, 5, '20mg', 'Once daily', '14 days', 'Take before breakfast', 14)
ON CONFLICT DO NOTHING;

-- ============================================
-- 10. SAMPLE PAYMENTS
-- ============================================
INSERT INTO payments (consultation_id, patient_id, doctor_id, amount, payment_method, payment_status, transaction_id, payment_date) VALUES
(2, 2, 2, 800.00, 'credit_card', 'completed', 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001', NOW() - INTERVAL '5 days'),
(3, 1, 1, 900.00, 'upi', 'completed', 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002', NOW() - INTERVAL '10 days')
ON CONFLICT (transaction_id) DO NOTHING;

-- ============================================
-- 11. SAMPLE REVIEWS
-- ============================================
INSERT INTO reviews (doctor_id, patient_id, consultation_id, rating, review_text) VALUES
(2, 2, 2, 5, 'Excellent doctor, very patient and thorough in diagnosis'),
(1, 1, 3, 4, 'Good consultation, helped identify the issue quickly')
ON CONFLICT (doctor_id, patient_id, consultation_id) DO NOTHING;

-- ============================================
-- 12. SAMPLE NOTIFICATIONS
-- ============================================
INSERT INTO notifications (user_id, notification_type, title, message, related_id, is_read, priority) VALUES
(1, 'consultation', 'Upcoming Consultation', 'You have a consultation scheduled with Dr. Sarah Johnson in 2 days', 1, false, 'high'),
(2, 'prescription', 'Prescription Ready', 'Your prescription from Dr. Michael Chen is ready', 1, false, 'normal'),
(3, 'review', 'New Review Received', 'You received a new 5-star review from a patient', 1, false, 'normal')
ON CONFLICT DO NOTHING;

-- ============================================
-- UPDATE DOCTOR STATISTICS
-- ============================================
UPDATE doctors SET 
  rating = (SELECT AVG(rating)::DECIMAL(3,2) FROM reviews WHERE doctor_id = doctors.id),
  total_reviews = (SELECT COUNT(*) FROM reviews WHERE doctor_id = doctors.id),
  total_consultations = (SELECT COUNT(*) FROM consultations WHERE doctor_id = doctors.id AND status = 'completed');

-- ============================================
-- SEED DATA COMPLETE
-- ============================================
