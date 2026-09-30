/**
 * Doctor Dashboard Main Component
 * Comprehensive dashboard for doctors to manage patients, prescriptions, reports, and consultations
 * 
 * Features:
 * - Patient queue management
 * - Quick statistics
 * - Patient communication
 * - Consultation scheduling
 * - Multi-tab interface
 */

import React, { useState, useEffect } from 'react';
import '../styles/DoctorDashboard.css';

type ActiveTab = 'queue' | 'patients' | 'prescriptions' | 'reports' | 'cds' | 'communications' | 'consultations' | 'analytics';

interface PatientCase {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  status: 'pending-review' | 'in-progress' | 'completed' | 'archived';
  priority: 'routine' | 'urgent' | 'emergency';
  createdAt: string;
  updatedAt: string;
}

interface DoctorStats {
  pendingCases: number;
  activePrescriptions: number;
  reportsToReview: number;
  unreadMessages: number;
  patientsThisMonth: number;
  avgSatisfaction: number;
}

interface NavigationItem {
  id: ActiveTab;
  label: string;
  icon: string;
  badge?: number;
}

export const DoctorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('queue');
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [doctorStats, setDoctorStats] = useState<DoctorStats>({
    pendingCases: 12,
    activePrescriptions: 45,
    reportsToReview: 8,
    unreadMessages: 5,
    patientsThisMonth: 28,
    avgSatisfaction: 4.7
  });

  // Mock patient data
  const [patientQueue] = useState<PatientCase[]>([
    {
      id: '1',
      patientName: 'Rajesh Kumar',
      age: 45,
      gender: 'Male',
      chiefComplaint: 'Persistent cough and fever',
      status: 'pending-review',
      priority: 'urgent',
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-15T10:30:00'
    },
    {
      id: '2',
      patientName: 'Priya Sharma',
      age: 32,
      gender: 'Female',
      chiefComplaint: 'Blood pressure monitoring',
      status: 'in-progress',
      priority: 'routine',
      createdAt: '2024-01-15T09:15:00',
      updatedAt: '2024-01-15T11:45:00'
    },
    {
      id: '3',
      patientName: 'Amit Patel',
      age: 58,
      gender: 'Male',
      chiefComplaint: 'Chest pain and shortness of breath',
      status: 'pending-review',
      priority: 'emergency',
      createdAt: '2024-01-15T12:00:00',
      updatedAt: '2024-01-15T12:00:00'
    },
    {
      id: '4',
      patientName: 'Neha Gupta',
      age: 28,
      gender: 'Female',
      chiefComplaint: 'Digestive issues',
      status: 'in-progress',
      priority: 'routine',
      createdAt: '2024-01-14T14:30:00',
      updatedAt: '2024-01-15T10:00:00'
    },
    {
      id: '5',
      patientName: 'Vikram Singh',
      age: 52,
      gender: 'Male',
      chiefComplaint: 'Diabetes management',
      status: 'completed',
      priority: 'routine',
      createdAt: '2024-01-10T08:00:00',
      updatedAt: '2024-01-15T15:30:00'
    }
  ]);

  const navigationItems: NavigationItem[] = [
    { id: 'queue', label: 'Patient Queue', icon: '👥', badge: doctorStats.pendingCases },
    { id: 'patients', label: 'Patients', icon: '🏥' },
    { id: 'prescriptions', label: 'Prescriptions', icon: '💊', badge: doctorStats.activePrescriptions },
    { id: 'reports', label: 'Reports', icon: '📋', badge: doctorStats.reportsToReview },
    { id: 'cds', label: 'Clinical Support', icon: '🧠' },
    { id: 'communications', label: 'Messages', icon: '💬', badge: doctorStats.unreadMessages },
    { id: 'consultations', label: 'Consultations', icon: '📅' },
    { id: 'analytics', label: 'Analytics', icon: '📊' }
  ];

  const getPriorityBadge = (priority: string) => {
    const colors = {
      emergency: '#ef4444',
      urgent: '#f59e0b',
      routine: '#10b981'
    };
    return colors[priority as keyof typeof colors];
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending-review': { label: 'Pending Review', bg: '#fca5a5', color: '#dc2626' },
      'in-progress': { label: 'In Progress', bg: '#bfdbfe', color: '#1d4ed8' },
      'completed': { label: 'Completed', bg: '#bfef45', color: '#15803d' },
      'archived': { label: 'Archived', bg: '#e5e7eb', color: '#374151' }
    };
    return statusMap[status as keyof typeof statusMap];
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'queue':
        return renderPatientQueue();
      case 'patients':
        return renderPatients();
      case 'prescriptions':
        return renderPrescriptions();
      case 'reports':
        return renderReports();
      case 'cds':
        return renderCDS();
      case 'communications':
        return renderCommunications();
      case 'consultations':
        return renderConsultations();
      case 'analytics':
        return renderAnalytics();
      default:
        return null;
    }
  };

  const renderPatientQueue = () => (
    <div className="queue-view">
      <div className="view-header">
        <h2>👥 Patient Queue</h2>
        <p>{patientQueue.length} patients in system</p>
      </div>

      <div className="queue-stats">
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <div className="stat-label">Emergency</div>
            <div className="stat-value">
              {patientQueue.filter(p => p.priority === 'emergency').length}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟡</div>
          <div className="stat-info">
            <div className="stat-label">Urgent</div>
            <div className="stat-value">
              {patientQueue.filter(p => p.priority === 'urgent').length}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <div className="stat-label">Routine</div>
            <div className="stat-value">
              {patientQueue.filter(p => p.priority === 'routine').length}
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">
              {patientQueue.filter(p => p.status === 'pending-review').length}
            </div>
          </div>
        </div>
      </div>

      <div className="queue-list">
        <h3>Patient Cases</h3>
        {patientQueue.map(patient => (
          <div
            key={patient.id}
            className={`queue-item ${selectedCase?.id === patient.id ? 'selected' : ''} ${patient.priority}`}
            onClick={() => setSelectedCase(patient)}
          >
            <div className="queue-item-header">
              <h4>{patient.patientName}</h4>
              <div className="queue-badges">
                <span
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityBadge(patient.priority) }}
                >
                  {patient.priority.charAt(0).toUpperCase() + patient.priority.slice(1)}
                </span>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor: getStatusBadge(patient.status).bg,
                    color: getStatusBadge(patient.status).color
                  }}
                >
                  {getStatusBadge(patient.status).label}
                </span>
              </div>
            </div>

            <div className="queue-item-details">
              <span className="detail-item">
                <strong>Age:</strong> {patient.age} {patient.gender}
              </span>
              <span className="detail-item">
                <strong>Complaint:</strong> {patient.chiefComplaint}
              </span>
              <span className="detail-item">
                <strong>Updated:</strong> {new Date(patient.updatedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="queue-item-actions">
              <button className="btn-action">Review</button>
              <button className="btn-action">Add Notes</button>
            </div>
          </div>
        ))}
      </div>

      {selectedCase && (
        <div className="case-detail-panel">
          <h3>Case Details - {selectedCase.patientName}</h3>
          <div className="case-details">
            <div className="detail-row">
              <span className="label">Patient Age:</span>
              <span className="value">{selectedCase.age} years, {selectedCase.gender}</span>
            </div>
            <div className="detail-row">
              <span className="label">Chief Complaint:</span>
              <span className="value">{selectedCase.chiefComplaint}</span>
            </div>
            <div className="detail-row">
              <span className="label">Status:</span>
              <span
                className="value"
                style={{
                  backgroundColor: getStatusBadge(selectedCase.status).bg,
                  color: getStatusBadge(selectedCase.status).color,
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                {getStatusBadge(selectedCase.status).label}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Priority:</span>
              <span
                className="value"
                style={{
                  backgroundColor: getPriorityBadge(selectedCase.priority),
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
              >
                {selectedCase.priority.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="case-actions">
            <button className="btn-primary">View Full History</button>
            <button className="btn-primary">Create Prescription</button>
            <button className="btn-primary">Request Report</button>
            <button className="btn-secondary">Update Status</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderPatients = () => (
    <div className="content-section">
      <h2>🏥 Patient Management</h2>
      <p>Manage patient profiles and medical history</p>
      <div className="placeholder">
        <p>Patient Management Component</p>
      </div>
    </div>
  );

  const renderPrescriptions = () => (
    <div className="content-section">
      <h2>💊 Prescriptions</h2>
      <p>Active prescriptions: {doctorStats.activePrescriptions}</p>
      <div className="placeholder">
        <p>Prescription History Component</p>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="content-section">
      <h2>📋 Reports</h2>
      <p>Reports to review: {doctorStats.reportsToReview}</p>
      <div className="placeholder">
        <p>Report Review Component</p>
      </div>
    </div>
  );

  const renderCDS = () => (
    <div className="content-section">
      <h2>🧠 Clinical Decision Support</h2>
      <p>AI-powered clinical recommendations</p>
      <div className="placeholder">
        <p>CDS Integration Component</p>
      </div>
    </div>
  );

  const renderCommunications = () => (
    <div className="content-section">
      <h2>💬 Patient Communications</h2>
      <p>Unread messages: {doctorStats.unreadMessages}</p>
      <div className="placeholder">
        <p>Patient Communication Component</p>
      </div>
    </div>
  );

  const renderConsultations = () => (
    <div className="content-section">
      <h2>📅 Consultation Scheduling</h2>
      <p>Manage consultation slots and bookings</p>
      <div className="placeholder">
        <p>Consultation Scheduling Component</p>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="content-section">
      <h2>📊 Analytics & Reports</h2>
      <p>Performance metrics and statistics</p>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-label">Patients This Month</div>
          <div className="analytics-value">{doctorStats.patientsThisMonth}</div>
          <div className="analytics-trend">↑ 12% from last month</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Avg Patient Satisfaction</div>
          <div className="analytics-value">{doctorStats.avgSatisfaction}</div>
          <div className="analytics-trend">⭐ Excellent</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Cases Completed</div>
          <div className="analytics-value">
            {patientQueue.filter(p => p.status === 'completed').length}
          </div>
          <div className="analytics-trend">This week</div>
        </div>
        <div className="analytics-card">
          <div className="analytics-label">Avg Response Time</div>
          <div className="analytics-value">15 min</div>
          <div className="analytics-trend">Fast responses</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-sidebar">
        <div className="sidebar-header">
          <h1>🏥 Doctor Portal</h1>
          <p>Dr. Arjun Verma</p>
          <p style={{ fontSize: '0.85rem', color: '#718096', marginTop: '4px' }}>
            Cardiology Specialist
          </p>
        </div>

        <nav className="dashboard-nav">
          {navigationItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="quick-stats-mini">
            <div className="mini-stat">
              <div className="mini-stat-value">{doctorStats.pendingCases}</div>
              <div className="mini-stat-label">Pending</div>
            </div>
            <div className="mini-stat">
              <div className="mini-stat-value">{doctorStats.unreadMessages}</div>
              <div className="mini-stat-label">Messages</div>
            </div>
          </div>
          <button className="btn-logout">Logout</button>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-header">
          <div className="header-title">
            <h1>Doctor Dashboard</h1>
            <p>Welcome back! Here's your medical overview.</p>
          </div>

          <div className="header-actions">
            <button className="btn-action-header">🔔 Notifications</button>
            <button className="btn-action-header">⚙️ Settings</button>
          </div>
        </div>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
