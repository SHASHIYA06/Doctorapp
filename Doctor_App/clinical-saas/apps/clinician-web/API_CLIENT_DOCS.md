# API Client Documentation

## Overview

TypeScript API client for the Healthcare SaaS application. All API modules are strongly typed and handle authentication automatically.

## Installation

```typescript
import { authAPI, complaintsAPI, consultationsAPI } from './api';
```

## Authentication

### Login

```typescript
import { authAPI, type LoginData } from './api';

const credentials: LoginData = {
  email: 'user@example.com',
  password: 'password123'
};

try {
  const response = await authAPI.login(credentials);
  // response.token - JWT token
  // response.user - User object
} catch (error) {
  console.error('Login failed:', error);
}
```

### Register

```typescript
import { authAPI, type RegisterData } from './api';

const userData: RegisterData = {
  email: 'newuser@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  userType: 'patient', // or 'doctor'
  specialization: 'Cardiology' // Required for doctors
};

const response = await authAPI.register(userData);
```

### Get Current User

```typescript
const user = await authAPI.getCurrentUser();
```

## Complaints

### Create Complaint

```typescript
import { complaintsAPI, type ComplaintData } from './api';

const complaintData: ComplaintData = {
  consultationId: 123,
  chiefComplaint: 'Severe headache',
  description: 'Persistent headache for 3 days',
  symptoms: 'Headache, nausea, sensitivity to light',
  symptomDuration: '3 days',
  severity: 'moderate',
  medicationTried: 'Paracetamol 500mg'
};

const complaint = await complaintsAPI.create(complaintData);
```

### Get My Complaints

```typescript
const complaints = await complaintsAPI.getMyComplaints();
```

### Upload Document

```typescript
const file: File = ...; // From file input
await complaintsAPI.uploadDocument(complaintId, file, 'lab_report');
```

## Consultations

### Get Patient Consultations

```typescript
const consultations = await consultationsAPI.getPatientConsultations();
```

### Get Doctor Consultations

```typescript
const consultations = await consultationsAPI.getDoctorConsultations();
```

### Update Consultation Status

```typescript
await consultationsAPI.updateConsultationStatus(consultationId, 'in_progress');
```

## Diagnoses

### Create Diagnosis

```typescript
import { diagnosesAPI, type DiagnosisData } from './api';

const diagnosisData: DiagnosisData = {
  consultationId: 123,
  complaintId: 456,
  diagnosisText: 'Migraine with aura',
  findings: 'Neurological examination normal',
  icdCode: 'G43.1',
  severity: 'moderate',
  treatmentPlan: 'Pain management and lifestyle modifications',
  followUpRequired: true,
  followUpDays: 14,
  recommendations: 'Avoid triggers, maintain sleep schedule'
};

const diagnosis = await diagnosesAPI.create(diagnosisData);
```

### Get Diagnosis by Consultation

```typescript
const diagnosis = await diagnosesAPI.getByConsultation(consultationId);
```

## Prescriptions

### Create Prescription

```typescript
import { prescriptionsAPI, type PrescriptionData } from './api';

const prescriptionData: PrescriptionData = {
  consultationId: 123,
  diagnosisId: 456,
  notes: 'Take all medications with food',
  items: [
    {
      medicineId: 1,
      dosage: '500mg',
      frequency: 'Twice daily',
      duration: '5 days',
      instructions: 'Take after meals',
      quantity: 10
    },
    {
      medicineId: 2,
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '7 days',
      instructions: 'Take before bedtime',
      quantity: 7
    }
  ]
};

const prescription = await prescriptionsAPI.create(prescriptionData);
```

### Get Patient Prescriptions

```typescript
const prescriptions = await prescriptionsAPI.getPatientPrescriptions();
```

## Medicines

### Search Medicines

```typescript
const medicines = await medicinesAPI.search('paracetamol');
```

### Get All Medicines

```typescript
const medicines = await medicinesAPI.getAll();
```

### Get Medicine by ID

```typescript
const medicine = await medicinesAPI.getById(medicineId);
```

## Payments

### Create Payment

```typescript
import { paymentsAPI, type PaymentData } from './api';

const paymentData: PaymentData = {
  consultationId: 123,
  amount: 1000.00,
  paymentMethod: 'upi'
};

const payment = await paymentsAPI.create(paymentData);
```

### Create Stripe Payment

```typescript
const { clientSecret } = await paymentsAPI.createStripePayment(consultationId);
// Use clientSecret with Stripe Elements
```

### Get Patient Payments

```typescript
const payments = await paymentsAPI.getPatientPayments();
```

## Error Handling

All API calls automatically handle 401 errors by logging out the user and redirecting to login.

```typescript
try {
  const data = await authAPI.login(credentials);
} catch (error) {
  if (error.response?.status === 400) {
    // Bad request - invalid data
  } else if (error.response?.status === 404) {
    // Not found
  } else if (error.response?.status === 500) {
    // Server error
  }
}
```

## TypeScript Types

All API responses are strongly typed. Import types from modules:

```typescript
import type {
  LoginData,
  RegisterData,
  ComplaintData,
  Complaint,
  Consultation,
  DiagnosisData,
  Diagnosis,
  PrescriptionData,
  Prescription,
  Medicine,
  PaymentData,
  Payment
} from './api';
```

## Automatic Token Management

The API client automatically:
- Adds `Authorization: Bearer <token>` header to all requests
- Retrieves token from Zustand auth store
- Redirects to login on 401 responses

No manual token management required!

## Base URL Configuration

Set API URL in `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

The client automatically uses this URL for all API calls.
