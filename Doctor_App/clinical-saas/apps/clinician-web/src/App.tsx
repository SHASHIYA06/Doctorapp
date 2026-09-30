/**
 * Doctor App - Modern Healthcare Management System
 * Trust Blue + Orange, Poppins + Open Sans Typography
 */

import React, { useState } from 'react';
import { DoctorDashboardModern } from './components/DoctorDashboard.modern';
import { PatientDetails } from './components/PatientDetails';
import './index.css';

type AppView = 
  | 'dashboard' 
  | 'patient_details' 
  | 'appointments' 
  | 'medical_records'
  | 'prescriptions'
  | 'diagnostics'
  | 'billing'
  | 'cds_workflow'
  | 'careplan_review';

interface AppState {
  currentView: AppView;
  selectedPatientId?: string;
  selectedPlanId?: string;
}

export default function App() {
  const [state, setState] = useState<AppState>({ currentView: 'dashboard' });

  const navigateTo = (view: AppView, patientId?: string, planId?: string) => {
    setState({ currentView: view, selectedPatientId: patientId, selectedPlanId: planId });
  };

  return (
    <>
      {state.currentView === 'dashboard' && (
        <DoctorDashboardModern onNavigate={navigateTo} />
      )}
      
      {state.currentView === 'patient_details' && state.selectedPatientId && (
        <PatientDetails
          patientId={state.selectedPatientId}
          onBack={() => navigateTo('dashboard')}
          onNavigate={navigateTo}
        />
      )}
    </>
  );
}
