# Healthcare App - API Testing Guide

## Quick Start

### 1. Set Up Backend

```bash
cd healthcare-app/backend
npm install
cp .env.example .env
# Add your environment variables to .env
npm run dev
```

Server will start on `http://localhost:5000`

### 2. Import Postman Collection

1. Open Postman
2. Click "Import" → Select `POSTMAN_COLLECTION.json`
3. Collection will load with all endpoints

### 3. Set Environment Variables

In Postman, create/set these variables:
- `baseUrl`: `http://localhost:5000`
- Others auto-populate on login

## Complete Testing Workflow

### Phase 1: Authentication (5 minutes)

#### 1.1 Register as Patient

**Request:**
```
POST {{baseUrl}}/api/auth/register
```

**Body:**
```json
{
  "email": "patient@test.com",
  "password": "Test@123",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "patient"
}
```

**Expected Response:** 201
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "patient@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "userType": "patient"
  }
}
```

**Save:** Copy `token` to `{{authToken}}`

#### 1.2 Register as Doctor

**Request:**
```
POST {{baseUrl}}/api/auth/register
```

**Body:**
```json
{
  "email": "doctor@test.com",
  "password": "Test@123",
  "firstName": "Dr. Jane",
  "lastName": "Smith",
  "userType": "doctor",
  "specialization": "Cardiology"
}
```

**Expected Response:** 201

#### 1.3 Login

**Request:**
```
POST {{baseUrl}}/api/auth/login
```

**Body:**
```json
{
  "email": "patient@test.com",
  "password": "Test@123"
}
```

**Expected Response:** 200
- Token auto-saves to `{{authToken}}`

#### 1.4 Get Current User

**Request:**
```
GET {{baseUrl}}/api/auth/me
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (shows user profile)

### Phase 2: Patient Complaint Workflow (10 minutes)

#### 2.1 Submit Complaint

**Request:**
```
POST {{baseUrl}}/api/complaints/submit
Header: Authorization: Bearer {{authToken}}
```

**Body:**
```json
{
  "chiefComplaint": "Chest pain",
  "symptoms": "Sharp pain in chest when breathing, shortness of breath",
  "duration": "2 days",
  "severity": "severe"
}
```

**Expected Response:** 201
```json
{
  "message": "Complaint submitted successfully",
  "complaint": {
    "id": 1,
    "consultationId": 1,
    "chiefComplaint": "Chest pain",
    "symptoms": "Sharp pain in chest when breathing, shortness of breath",
    "duration": "2 days",
    "severity": "severe",
    "status": "open",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Save:**
- `complaintId`: From response
- `consultationId`: From response

#### 2.2 Get Patient Complaints

**Request:**
```
GET {{baseUrl}}/api/complaints/my-complaints
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (list of complaints)

#### 2.3 Get Complaint Details

**Request:**
```
GET {{baseUrl}}/api/complaints/{{complaintId}}
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (full complaint details)

### Phase 3: Doctor Workflow (15 minutes)

#### 3.1 Login as Doctor

**Request:**
```
POST {{baseUrl}}/api/auth/login
Body: {"email": "doctor@test.com", "password": "Test@123"}
```

**Save:** New token to `{{authToken}}`

#### 3.2 Get Assigned Complaints

**Request:**
```
GET {{baseUrl}}/api/complaints/assigned
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (list of complaints)

#### 3.3 Get Patient List

**Request:**
```
GET {{baseUrl}}/api/diagnoses/doctor/patients-list
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (list of assigned patients)

#### 3.4 Add Diagnosis

**Request:**
```
POST {{baseUrl}}/api/diagnoses/add-diagnosis
Header: Authorization: Bearer {{authToken}}
Body:
```
```json
{
  "consultationId": {{consultationId}},
  "diagnosis": "Acute Myocardial Infarction",
  "findings": "ECG shows ST elevation. Troponin elevated.",
  "icdCode": "I21.9",
  "treatmentPlan": "Emergency cardiac catheterization and stent placement."
}
```

**Expected Response:** 201
**Save:** `diagnosisId`

### Phase 4: Medicines & Prescriptions (20 minutes)

#### 4.1 Add Medicine (needs admin or special setup)

**Request:**
```
POST {{baseUrl}}/api/medicines
Header: Authorization: Bearer {{authToken}}
Body:
```
```json
{
  "name": "Aspirin",
  "genericName": "Acetylsalicylic acid",
  "category": "Analgesic",
  "strength": "500mg",
  "dosageForm": "Tablet",
  "price": 50,
  "stock": 100,
  "description": "Pain reliever and blood thinner"
}
```

**Expected Response:** 201
**Save:** `medicineId`

#### 4.2 Get All Medicines

**Request:**
```
GET {{baseUrl}}/api/medicines
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (list of medicines)

#### 4.3 Create Prescription (Doctor)

**Request:**
```
POST {{baseUrl}}/api/prescriptions/create
Header: Authorization: Bearer {{authToken}}
Body:
```
```json
{
  "consultationId": {{consultationId}},
  "medicines": [
    {
      "medicineId": {{medicineId}},
      "dosage": "500mg",
      "frequency": "Twice a day",
      "duration": "7 days",
      "notes": "Take with food"
    }
  ]
}
```

**Expected Response:** 201
**Save:** `prescriptionId`

#### 4.4 Get Prescription

**Request:**
```
GET {{baseUrl}}/api/prescriptions/{{prescriptionId}}
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (prescription with medicines)

#### 4.5 Get Patient Prescriptions

**Request (as Patient):**
```
GET {{baseUrl}}/api/prescriptions/patient/my-prescriptions
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (patient's prescriptions)

### Phase 5: Payments (10 minutes)

#### 5.1 Create Stripe Checkout Session

**Request (as Patient):**
```
POST {{baseUrl}}/api/payments/create-checkout-session
Header: Authorization: Bearer {{authToken}}
Body:
```
```json
{
  "consultationId": {{consultationId}}
}
```

**Expected Response:** 200
```json
{
  "message": "Checkout session created",
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/..."
}
```

#### 5.2 Get Payment Status

**Request:**
```
GET {{baseUrl}}/api/payments/{{consultationId}}/status
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (payment status)

#### 5.3 Get Payment Details

**Request:**
```
GET {{baseUrl}}/api/payments/{{consultationId}}/details
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (full payment details)

### Phase 6: Consultations (5 minutes)

#### 6.1 Get Patient Consultations

**Request (as Patient):**
```
GET {{baseUrl}}/api/consultations/patient/my-consultations
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (list of consultations)

#### 6.2 Get Consultation Details

**Request:**
```
GET {{baseUrl}}/api/consultations/{{consultationId}}
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 200 (full consultation details)

#### 6.3 Update Consultation Status

**Request:**
```
PUT {{baseUrl}}/api/consultations/{{consultationId}}/status
Header: Authorization: Bearer {{authToken}}
Body:
```
```json
{
  "status": "completed"
}
```

**Expected Response:** 200

### Phase 7: Real-time Chat Testing (Optional - 10 minutes)

Use a WebSocket client (Postman has built-in support):

#### 7.1 Connect WebSocket

```
ws://localhost:5000/socket.io/?EIO=4&transport=websocket
```

#### 7.2 Join Consultation

```javascript
socket.emit('join-consultation', consultationId, userId);
```

#### 7.3 Send Message

```javascript
socket.emit('send-message', {
  consultationId: consultationId,
  senderId: userId,
  senderName: 'John Doe',
  message: 'Hello doctor, how are my test results?',
  messageType: 'text'
});
```

#### 7.4 Listen for Messages

```javascript
socket.on('receive-message', (data) => {
  console.log('Message received:', data);
});
```

## Error Testing

### Test Invalid Token

```
GET {{baseUrl}}/api/auth/me
Header: Authorization: Bearer invalid_token
```

**Expected Response:** 403 - Invalid or expired token

### Test Missing Required Fields

```
POST {{baseUrl}}/api/complaints/submit
Header: Authorization: Bearer {{authToken}}
Body: {"chiefComplaint": "Chest pain"}
```

**Expected Response:** 400 - Missing required fields

### Test Unauthorized Access

```
POST {{baseUrl}}/api/medicines
Header: Authorization: Bearer {{authToken}} (patient token)
```

**Expected Response:** 403 - Only admins can access

### Test Not Found

```
GET {{baseUrl}}/api/complaints/99999
Header: Authorization: Bearer {{authToken}}
```

**Expected Response:** 404 - Complaint not found

## Performance Testing

### Response Time Expectations

- Auth endpoints: < 200ms
- Get endpoints: < 300ms
- Post endpoints: < 500ms
- File upload: < 2000ms

### Load Testing with Artillery

```bash
npm install -g artillery

# Create artillery.yml
cat > artillery.yml << EOF
config:
  target: "http://localhost:5000"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Get Medicines"
    flow:
      - get:
          url: "/api/medicines"
EOF

artillery run artillery.yml
```

## Database Verification

### Check Users

```sql
SELECT * FROM users;
```

### Check Consultations

```sql
SELECT * FROM consultations;
```

### Check Complaints

```sql
SELECT c.*, con.doctor_id FROM complaints c
JOIN consultations con ON c.consultation_id = con.id;
```

### Check Prescriptions

```sql
SELECT p.*, pi.medicine_id, m.name 
FROM prescriptions p
JOIN prescription_items pi ON p.id = pi.prescription_id
JOIN medicines m ON pi.medicine_id = m.id;
```

## Troubleshooting

### "Database connection failed"
- Ensure DATABASE_URL is correct in .env
- Check Neon connection is active
- Verify SSL certificate settings

### "Invalid or expired token"
- Login again and get fresh token
- Ensure token is in Authorization header as "Bearer {token}"
- Check JWT_SECRET in .env

### "File upload failed"
- Ensure uploads/ directory exists
- Check file size < 50MB
- Verify supported file types (PDF, images, documents)

### "Stripe checkout failed"
- Verify STRIPE_SECRET_KEY is correct
- Check STRIPE_WEBHOOK_SECRET
- Ensure frontend URL is whitelisted in Stripe

## Next Steps

After successful API testing:
1. Document any issues found
2. Proceed to React UI development (Task #10)
3. Test integrations between frontend and backend
4. Set up end-to-end testing

