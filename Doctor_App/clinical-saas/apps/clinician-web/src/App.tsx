/**
 * Doctor App - Comprehensive Healthcare Management System
 * Multi-modal clinical decision support with complete patient management
 */

import React, { useState } from 'react';
import { DoctorDashboard } from './components/DoctorDashboard';
import { PatientDetails } from './components/PatientDetails';
import { AppointmentScheduler } from './components/AppointmentScheduler';
import { MedicalRecords } from './components/MedicalRecords';
import { PrescriptionManager } from './components/PrescriptionManager';
import { DiagnosticsViewer } from './components/DiagnosticsViewer';
import { BillingInvoices } from './components/BillingInvoices';
import { CDSWorkflow } from './CDSWorkflow';
import { CareplanReview } from './CareplanReview';
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

  const renderView = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <DoctorDashboard onNavigate={navigateTo} />;
      
      case 'patient_details':
        return (
          <PatientDetails
            patientId={state.selectedPatientId!}
            onBack={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
          />
        );
      
      case 'appointments':
        return (
          <AppointmentScheduler
            onBack={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
          />
        );
      
      case 'medical_records':
        return (
          <MedicalRecords
            patientId={state.selectedPatientId}
            onBack={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
          />
        );
      
      case 'prescriptions':
        return (
          <PrescriptionManager
            patientId={state.selectedPatientId}
            onBack={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
          />
        );
      
      case 'diagnostics':
        return (
          <DiagnosticsViewer
            patientId={state.selectedPatientId}
            onBack={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
          />
        );
      
      case 'billing':
        return (
          <BillingInvoices
            patientId={state.selectedPatientId}
            onBack={() => navigateTo('dashboard')}
          />
        );
      
      case 'cds_workflow':
        return (
          <CDSWorkflow
            patientId={state.selectedPatientId!}
            onBack={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
          />
        );
      
      case 'careplan_review':
        return (
          <CareplanReview
            patientId={state.selectedPatientId!}
            planId={state.selectedPlanId}
            onBack={() => navigateTo('dashboard')}
            onNavigate={navigateTo}
          />
        );
      
      default:
        return <DoctorDashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderView()}
    </div>
  );
}
