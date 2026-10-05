/**
 * Patient Management Component
 * View and manage patient profiles, medical history, allergies, medications, and contact information
 */

import React, { useState } from 'react';
import '../styles/PatientManagement.css';

interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  bloodType: string;
  height: number;
  weight: number;
  bmi: number;
  address: string;
  registrationDate: string;
  lastVisitDate: string;
  totalVisits: number;
}

interface MedicalHistory {
  id: string;
  condition: string;
  diagnosedDate: string;
  status: 'active' | 'resolved' | 'managed';
  notes?: string;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  dateIdentified: string;
}

interface Medication {
  id: string;
  medicineName: string;
  strength: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  reason: string;
  prescribedBy: string;
}

type ViewMode = 'overview' | 'history' | 'allergies' | 'medications' | 'vitals' | 'documents';

export const PatientManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock patient data
  const [patients] = useState<PatientProfile[]>([
    {
      id: '1',
      name: 'Rajesh Kumar',
      age: 45,
      gender: 'Male',
      email: 'rajesh.kumar@email.com',
      phone: '+91-9876543210',
      dateOfBirth: '1978-05-15',
      bloodType: 'O+',
      height: 175,
      weight: 82,
      bmi: 26.7,
      address: '123 Main Street, Delhi',
      registrationDate: '2023-01-10',
      lastVisitDate: '2024-01-15',
      totalVisits: 8
    },
    {
      id: '2',
      name: 'Priya Sharma',
      age: 32,
      gender: 'Female',
      email: 'priya.sharma@email.com',
      phone: '+91-9876543211',
      dateOfBirth: '1991-08-22',
      bloodType: 'A+',
      height: 162,
      weight: 58,
      bmi: 22.1,
      address: '456 Park Avenue, Mumbai',
      registrationDate: '2023-06-15',
      lastVisitDate: '2024-01-14',
      totalVisits: 12
    },
    {
      id: '3',
      name: 'Amit Patel',
      age: 58,
      gender: 'Male',
      email: 'amit.patel@email.com',
      phone: '+91-9876543212',
      dateOfBirth: '1965-12-03',
      bloodType: 'B+',
      height: 170,
      weight: 88,
      bmi: 30.4,
      address: '789 Riverside Road, Bangalore',
      registrationDate: '2022-11-20',
      lastVisitDate: '2024-01-10',
      totalVisits: 15
    },
    {
      id: '4',
      name: 'Neha Gupta',
      age: 28,
      gender: 'Female',
      email: 'neha.gupta@email.com',
      phone: '+91-9876543213',
      dateOfBirth: '1995-03-17',
      bloodType: 'O-',
      height: 165,
      weight: 55,
      bmi: 20.2,
      address: '321 Garden Lane, Chennai',
      registrationDate: '2023-09-05',
      lastVisitDate: '2024-01-12',
      totalVisits: 5
    }
  ]);

  const [medicalHistory] = useState<MedicalHistory[]>([
    {
      id: '1',
      condition: 'Hypertension',
      diagnosedDate: '2020-03-15',
      status: 'active',
      notes: 'Controlled with medication'
    },
    {
      id: '2',
      condition: 'Type 2 Diabetes',
      diagnosedDate: '2018-06-20',
      status: 'managed',
      notes: 'Requires regular monitoring'
    },
    {
      id: '3',
      condition: 'High Cholesterol',
      diagnosedDate: '2021-01-10',
      status: 'managed',
      notes: 'Diet and medication controlled'
    }
  ]);

  const [allergies] = useState<Allergy[]>([
    {
      id: '1',
      allergen: 'Penicillin',
      severity: 'severe',
      reaction: 'Anaphylaxis',
      dateIdentified: '2010-05-22'
    },
    {
      id: '2',
      allergen: 'Peanuts',
      severity: 'moderate',
      reaction: 'Swelling and hives',
      dateIdentified: '2015-08-10'
    }
  ]);

  const [medications] = useState<Medication[]>([
    {
      id: '1',
      medicineName: 'Lisinopril',
      strength: '10mg',
      frequency: 'Once daily',
      startDate: '2020-03-15',
      reason: 'Hypertension',
      prescribedBy: 'Dr. Verma'
    },
    {
      id: '2',
      medicineName: 'Metformin',
      strength: '500mg',
      frequency: 'Twice daily',
      startDate: '2018-06-20',
      reason: 'Type 2 Diabetes',
      prescribedBy: 'Dr. Patel'
    },
    {
      id: '3',
      medicineName: 'Atorvastatin',
      strength: '20mg',
      frequency: 'Once daily',
      startDate: '2021-01-10',
      reason: 'High Cholesterol',
      prescribedBy: 'Dr. Verma'
    }
  ]);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.email.toLowerCase().includes(searchQuery)
  );

  const currentPatient = selectedPatient || patients[0];

  const renderOverview = () => (
    <div className="patient-overview">
      <div className="overview-header">
        <div className="patient-avatar">
          {currentPatient.name.charAt(0)}
        </div>
        <div className="patient-header-info">
          <h2>{currentPatient.name}</h2>
          <p className="patient-id">Patient ID: {currentPatient.id}</p>
          <p className="patient-registration">
            Registered: {new Date(currentPatient.registrationDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="overview-grid">
        <div className="info-card">
          <h4>Personal Information</h4>
          <div className="info-row">
            <span className="label">Age:</span>
            <span className="value">{currentPatient.age} years</span>
          </div>
          <div className="info-row">
            <span className="label">Gender:</span>
            <span className="value">{currentPatient.gender}</span>
          </div>
          <div className="info-row">
            <span className="label">Date of Birth:</span>
            <span className="value">{new Date(currentPatient.dateOfBirth).toLocaleDateString()}</span>
          </div>
          <div className="info-row">
            <span className="label">Blood Type:</span>
            <span className="value badge">{currentPatient.bloodType}</span>
          </div>
        </div>

        <div className="info-card">
          <h4>Contact Information</h4>
          <div className="info-row">
            <span className="label">Email:</span>
            <span className="value email">{currentPatient.email}</span>
          </div>
          <div className="info-row">
            <span className="label">Phone:</span>
            <span className="value phone">{currentPatient.phone}</span>
          </div>
          <div className="info-row">
            <span className="label">Address:</span>
            <span className="value address">{currentPatient.address}</span>
          </div>
        </div>

        <div className="info-card">
          <h4>Vital Statistics</h4>
          <div className="info-row">
            <span className="label">Height:</span>
            <span className="value">{currentPatient.height} cm</span>
          </div>
          <div className="info-row">
            <span className="label">Weight:</span>
            <span className="value">{currentPatient.weight} kg</span>
          </div>
          <div className="info-row">
            <span className="label">BMI:</span>
            <span className={`value bmi ${currentPatient.bmi > 25 ? 'high' : 'normal'}`}>
              {currentPatient.bmi}
            </span>
          </div>
        </div>

        <div className="info-card">
          <h4>Visit History</h4>
          <div className="info-row">
            <span className="label">Total Visits:</span>
            <span className="value">{currentPatient.totalVisits}</span>
          </div>
          <div className="info-row">
            <span className="label">Last Visit:</span>
            <span className="value">{new Date(currentPatient.lastVisitDate).toLocaleDateString()}</span>
          </div>
          <div className="info-row">
            <span className="label">Days Since Last:</span>
            <span className="value">
              {Math.floor((Date.now() - new Date(currentPatient.lastVisitDate).getTime()) / (1000 * 60 * 60 * 24))}
            </span>
          </div>
        </div>
      </div>

      <div className="overview-actions">
        <button className="btn-primary">Schedule Follow-up</button>
        <button className="btn-primary">Send Message</button>
        <button className="btn-secondary">Update Profile</button>
        <button className="btn-secondary">Export Medical Records</button>
      </div>
    </div>
  );

  const renderMedicalHistory = () => (
    <div className="medical-history-view">
      <h3>Medical History</h3>
      <div className="history-list">
        {medicalHistory.map(item => (
          <div key={item.id} className="history-item">
            <div className="history-header">
              <h4>{item.condition}</h4>
              <span className={`status-badge ${item.status}`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </div>
            <div className="history-details">
              <span className="detail">
                <strong>Diagnosed:</strong> {new Date(item.diagnosedDate).toLocaleDateString()}
              </span>
              {item.notes && (
                <span className="detail">
                  <strong>Notes:</strong> {item.notes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAllergies = () => (
    <div className="allergies-view">
      <h3>Known Allergies</h3>
      <div className="allergies-list">
        {allergies.length > 0 ? (
          allergies.map(allergy => (
            <div key={allergy.id} className={`allergy-item severity-${allergy.severity}`}>
              <div className="allergy-icon">⚠️</div>
              <div className="allergy-content">
                <h4>{allergy.allergen}</h4>
                <div className="allergy-details">
                  <span className={`severity-badge ${allergy.severity}`}>
                    {allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}
                  </span>
                  <span className="reaction">Reaction: {allergy.reaction}</span>
                  <span className="date">Identified: {new Date(allergy.dateIdentified).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No known allergies reported</p>
        )}
      </div>
    </div>
  );

  const renderMedications = () => (
    <div className="medications-view">
      <h3>Current Medications</h3>
      <div className="medications-list">
        {medications.map(med => (
          <div key={med.id} className="medication-item">
            <div className="med-header">
              <h4>{med.medicineName}</h4>
              <span className="strength">{med.strength}</span>
            </div>
            <div className="med-details">
              <div className="detail-row">
                <span className="label">Frequency:</span>
                <span className="value">{med.frequency}</span>
              </div>
              <div className="detail-row">
                <span className="label">Reason:</span>
                <span className="value">{med.reason}</span>
              </div>
              <div className="detail-row">
                <span className="label">Prescribed By:</span>
                <span className="value">{med.prescribedBy}</span>
              </div>
              <div className="detail-row">
                <span className="label">Start Date:</span>
                <span className="value">{new Date(med.startDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVitals = () => (
    <div className="vitals-view">
      <h3>Latest Vitals</h3>
      <div className="vitals-grid">
        <div className="vital-card">
          <div className="vital-label">Blood Pressure</div>
          <div className="vital-value">120/80</div>
          <div className="vital-status">Normal</div>
        </div>
        <div className="vital-card">
          <div className="vital-label">Heart Rate</div>
          <div className="vital-value">72 bpm</div>
          <div className="vital-status">Normal</div>
        </div>
        <div className="vital-card">
          <div className="vital-label">Temperature</div>
          <div className="vital-value">98.6°F</div>
          <div className="vital-status">Normal</div>
        </div>
        <div className="vital-card">
          <div className="vital-label">Oxygen Saturation</div>
          <div className="vital-value">98%</div>
          <div className="vital-status">Normal</div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="documents-view">
      <h3>Medical Documents</h3>
      <div className="documents-list">
        <div className="document-item">
          <div className="doc-icon">📄</div>
          <div className="doc-info">
            <h4>Lab Report - Blood Test</h4>
            <p>Uploaded: Jan 15, 2024</p>
          </div>
          <button className="btn-small">View</button>
        </div>
        <div className="document-item">
          <div className="doc-icon">📄</div>
          <div className="doc-info">
            <h4>X-Ray Report - Chest</h4>
            <p>Uploaded: Jan 10, 2024</p>
          </div>
          <button className="btn-small">View</button>
        </div>
        <div className="document-item">
          <div className="doc-icon">📄</div>
          <div className="doc-info">
            <h4>Prescription History</h4>
            <p>Uploaded: Jan 8, 2024</p>
          </div>
          <button className="btn-small">View</button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'overview':
        return renderOverview();
      case 'history':
        return renderMedicalHistory();
      case 'allergies':
        return renderAllergies();
      case 'medications':
        return renderMedications();
      case 'vitals':
        return renderVitals();
      case 'documents':
        return renderDocuments();
      default:
        return null;
    }
  };

  return (
    <div className="patient-management">
      <div className="pm-sidebar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="patients-list">
          <h3>Patients</h3>
          {filteredPatients.map(patient => (
            <button
              key={patient.id}
              className={`patient-item ${selectedPatient?.id === patient.id ? 'selected' : ''}`}
              onClick={() => setSelectedPatient(patient)}
            >
              <div className="patient-avatar-mini">{patient.name.charAt(0)}</div>
              <div className="patient-info-mini">
                <div className="name">{patient.name}</div>
                <div className="age-gender">{patient.age}y, {patient.gender}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="pm-main">
        <div className="tabs-navigation">
          <button
            className={`tab ${viewMode === 'overview' ? 'active' : ''}`}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${viewMode === 'history' ? 'active' : ''}`}
            onClick={() => setViewMode('history')}
          >
            Medical History
          </button>
          <button
            className={`tab ${viewMode === 'allergies' ? 'active' : ''}`}
            onClick={() => setViewMode('allergies')}
          >
            Allergies
          </button>
          <button
            className={`tab ${viewMode === 'medications' ? 'active' : ''}`}
            onClick={() => setViewMode('medications')}
          >
            Medications
          </button>
          <button
            className={`tab ${viewMode === 'vitals' ? 'active' : ''}`}
            onClick={() => setViewMode('vitals')}
          >
            Vitals
          </button>
          <button
            className={`tab ${viewMode === 'documents' ? 'active' : ''}`}
            onClick={() => setViewMode('documents')}
          >
            Documents
          </button>
        </div>

        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PatientManagement;
