/**
 * Comprehensive Patient Details View
 */

import React from 'react';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Heart, Activity } from 'lucide-react';

interface PatientDetailsProps {
  patientId: string;
  onBack: () => void;
  onNavigate: (view: any, id?: string) => void;
}

export function PatientDetails({ patientId, onBack, onNavigate }: PatientDetailsProps) {
  const patient = {
    id: patientId,
    name: 'Rajesh Kumar Sharma',
    age: 52,
    gender: 'Male',
    phone: '+91 98765 43210',
    email: 'rajesh.kumar@example.com',
    address: 'Mumbai, Maharashtra',
    bloodGroup: 'B+',
    allergies: ['Penicillin', 'Peanuts'],
    chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
    currentMedications: [
      { name: 'Metformin 500mg', dosage: '2x daily', started: '2023-01-15' },
      { name: 'Lisinopril 10mg', dosage: '1x daily', started: '2023-03-20' },
    ],
    vitalSigns: {
      bp: '142/88 mmHg',
      pulse: '78 bpm',
      temp: '98.4°F',
      weight: '82 kg',
      height: '175 cm',
      bmi: '26.8',
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-5 h-5" /> Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium text-gray-900">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age / Gender</p>
                  <p className="font-medium text-gray-900">{patient.age}y / {patient.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{patient.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{patient.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Current Medications</h2>
              <div className="space-y-3">
                {patient.currentMedications.map((med, i) => (
                  <div key={i} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="font-semibold text-gray-900">{med.name}</p>
                    <p className="text-sm text-gray-600 mt-1">Dosage: {med.dosage}</p>
                    <p className="text-xs text-gray-500 mt-1">Started: {med.started}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Vital Signs</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Blood Pressure</span>
                  <span className="font-medium text-gray-900">{patient.vitalSigns.bp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pulse</span>
                  <span className="font-medium text-gray-900">{patient.vitalSigns.pulse}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Temperature</span>
                  <span className="font-medium text-gray-900">{patient.vitalSigns.temp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">BMI</span>
                  <span className="font-medium text-gray-900">{patient.vitalSigns.bmi}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('prescriptions', patientId)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Prescription
                </button>
                <button
                  onClick={() => onNavigate('diagnostics', patientId)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Order Tests
                </button>
                <button
                  onClick={() => onNavigate('cds_workflow', patientId)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Review Care Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
