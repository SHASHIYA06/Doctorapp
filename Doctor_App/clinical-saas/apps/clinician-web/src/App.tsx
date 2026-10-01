/**
 * Unified Healthcare SaaS Application
 * Combines Clinical SaaS + Healthcare App workflows
 * Trust Blue + Orange, Modern Healthcare Design System
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Legacy Clinical SaaS Components
import { DoctorDashboardModern } from './components/DoctorDashboard.modern';
import { PatientDetails } from './components/PatientDetails';

// Healthcare App Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NewComplaint from './pages/NewComplaint';
import PatientProfile from './pages/PatientProfile';
import AddDiagnosis from './pages/AddDiagnosis';
import AddPrescription from './pages/AddPrescription';
import Prescriptions from './pages/Prescriptions';
import Payments from './pages/Payments';
import Chat from './pages/Chat';

import './index.css';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.userType)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const { user, token } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/complaint/new"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <NewComplaint />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/prescriptions"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Prescriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/payments"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <Payments />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patient/:patientId"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/diagnosis/add/:consultationId"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <AddDiagnosis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/prescription/add/:consultationId"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <AddPrescription />
            </ProtectedRoute>
          }
        />

        {/* Shared Routes */}
        <Route
          path="/chat/:consultationId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Legacy Clinical SaaS Routes */}
        <Route
          path="/clinical/dashboard"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboardModern onNavigate={(view) => console.log(view)} />
            </ProtectedRoute>
          }
        />

        {/* Root Redirect */}
        <Route
          path="/"
          element={
            token && user ? (
              user.userType === 'patient' ? (
                <Navigate to="/patient/dashboard" replace />
              ) : user.userType === 'doctor' ? (
                <Navigate to="/doctor/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
