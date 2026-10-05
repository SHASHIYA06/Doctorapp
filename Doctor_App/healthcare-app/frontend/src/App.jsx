import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import NewComplaint from './pages/NewComplaint';
import Prescriptions from './pages/Prescriptions';
import Payments from './pages/Payments';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientProfile from './pages/PatientProfile';
import AddDiagnosis from './pages/AddDiagnosis';
import AddPrescription from './pages/AddPrescription';
import Chat from './pages/Chat';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user?.userType !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient Routes */}
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute requiredRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/new-complaint"
          element={
            <ProtectedRoute requiredRole="patient">
              <NewComplaint />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/prescriptions"
          element={
            <ProtectedRoute requiredRole="patient">
              <Prescriptions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/payments"
          element={
            <ProtectedRoute requiredRole="patient">
              <Payments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/chat"
          element={
            <ProtectedRoute requiredRole="patient">
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor/dashboard"
          element={
            <ProtectedRoute requiredRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/patient/:patientId/consultation/:consultationId"
          element={
            <ProtectedRoute requiredRole="doctor">
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/add-diagnosis/:consultationId"
          element={
            <ProtectedRoute requiredRole="doctor">
              <AddDiagnosis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/add-prescription/:consultationId"
          element={
            <ProtectedRoute requiredRole="doctor">
              <AddPrescription />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/chat"
          element={
            <ProtectedRoute requiredRole="doctor">
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Redirect to dashboard based on role */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={user?.userType === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
