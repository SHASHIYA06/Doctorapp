/**
 * Prescription History Component
 * Display and manage prescription history with filtering, analytics, and refill tracking
 */

import React, { useState } from 'react';
import '../styles/PrescriptionHistory.css';

interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  medicines: PrescriptionMedicine[];
  diagnosis: string;
  issuedDate: string;
  expiryDate: string;
  status: 'active' | 'expired' | 'fulfilled' | 'pending';
  doctorName: string;
  refillsAvailable: number;
  refillsUsed: number;
  mfaVerified: boolean;
  totalAmount?: number;
}

interface PrescriptionMedicine {
  medicineName: string;
  strength: string;
  quantity: number;
  dosage: string;
  duration: string;
}

type FilterType = 'all' | 'active' | 'expired' | 'fulfilled' | 'pending';
type SortType = 'recent' | 'patient' | 'status' | 'expiry';

export const PrescriptionHistory: React.FC = () => {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Mock prescription data
  const [prescriptions] = useState<Prescription[]>([
    {
      id: '1',
      patientName: 'Rajesh Kumar',
      patientId: '1',
      medicines: [
        {
          medicineName: 'Lisinopril',
          strength: '10mg',
          quantity: 30,
          dosage: 'Once daily',
          duration: '30 days'
        },
        {
          medicineName: 'Aspirin',
          strength: '75mg',
          quantity: 30,
          dosage: 'Once daily',
          duration: '30 days'
        }
      ],
      diagnosis: 'Hypertension and Cardiac Health Maintenance',
      issuedDate: '2024-01-10',
      expiryDate: '2024-04-10',
      status: 'active',
      doctorName: 'Dr. Verma',
      refillsAvailable: 2,
      refillsUsed: 0,
      mfaVerified: true,
      totalAmount: 450
    },
    {
      id: '2',
      patientName: 'Priya Sharma',
      patientId: '2',
      medicines: [
        {
          medicineName: 'Metformin',
          strength: '500mg',
          quantity: 60,
          dosage: 'Twice daily',
          duration: '30 days'
        }
      ],
      diagnosis: 'Type 2 Diabetes Management',
      issuedDate: '2024-01-12',
      expiryDate: '2024-04-12',
      status: 'active',
      doctorName: 'Dr. Sharma',
      refillsAvailable: 3,
      refillsUsed: 1,
      mfaVerified: true,
      totalAmount: 320
    },
    {
      id: '3',
      patientName: 'Amit Patel',
      patientId: '3',
      medicines: [
        {
          medicineName: 'Atorvastatin',
          strength: '20mg',
          quantity: 30,
          dosage: 'Once daily',
          duration: '30 days'
        }
      ],
      diagnosis: 'High Cholesterol',
      issuedDate: '2023-10-15',
      expiryDate: '2024-01-15',
      status: 'expired',
      doctorName: 'Dr. Verma',
      refillsAvailable: 0,
      refillsUsed: 2,
      mfaVerified: true,
      totalAmount: 280
    },
    {
      id: '4',
      patientName: 'Neha Gupta',
      patientId: '4',
      medicines: [
        {
          medicineName: 'Omeprazole',
          strength: '20mg',
          quantity: 30,
          dosage: 'Once daily',
          duration: '14 days'
        }
      ],
      diagnosis: 'Acid Reflux',
      issuedDate: '2024-01-14',
      expiryDate: '2024-02-14',
      status: 'fulfilled',
      doctorName: 'Dr. Sharma',
      refillsAvailable: 0,
      refillsUsed: 0,
      mfaVerified: true,
      totalAmount: 180
    },
    {
      id: '5',
      patientName: 'Vikram Singh',
      patientId: '5',
      medicines: [
        {
          medicineName: 'Amoxicillin',
          strength: '500mg',
          quantity: 20,
          dosage: 'Thrice daily',
          duration: '7 days'
        }
      ],
      diagnosis: 'Bacterial Infection',
      issuedDate: '2024-01-13',
      expiryDate: '2024-02-13',
      status: 'pending',
      doctorName: 'Dr. Patel',
      refillsAvailable: 0,
      refillsUsed: 0,
      mfaVerified: false,
      totalAmount: 200
    }
  ]);

  // Filter and sort prescriptions
  const filteredPrescriptions = prescriptions
    .filter(p => {
      if (filterType !== 'all' && p.status !== filterType) return false;
      if (searchQuery && !p.patientName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortType) {
        case 'patient':
          return a.patientName.localeCompare(b.patientName);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'expiry':
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        case 'recent':
        default:
          return new Date(b.issuedDate).getTime() - new Date(a.issuedDate).getTime();
      }
    });

  // Calculate analytics
  const analytics = {
    totalPrescriptions: prescriptions.length,
    activePrescriptions: prescriptions.filter(p => p.status === 'active').length,
    expiredPrescriptions: prescriptions.filter(p => p.status === 'expired').length,
    fulfilledPrescriptions: prescriptions.filter(p => p.status === 'fulfilled').length,
    pendingPrescriptions: prescriptions.filter(p => p.status === 'pending').length,
    totalRevenue: prescriptions.reduce((sum, p) => sum + (p.totalAmount || 0), 0),
    mfaVerifiedPercentage: (prescriptions.filter(p => p.mfaVerified).length / prescriptions.length) * 100
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: { bg: '#d1fae5', color: '#065f46', text: 'Active' },
      expired: { bg: '#fee2e2', color: '#7f1d1d', text: 'Expired' },
      fulfilled: { bg: '#d1d5db', color: '#374151', text: 'Fulfilled' },
      pending: { bg: '#fef3c7', color: '#92400e', text: 'Pending' }
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const renderAnalytics = () => (
    <div className="analytics-section">
      <h3>Prescription Analytics</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-label">Total Prescriptions</div>
          <div className="analytics-value">{analytics.totalPrescriptions}</div>
          <div className="analytics-subtext">All time</div>
        </div>

        <div className="analytics-card active">
          <div className="analytics-label">Active</div>
          <div className="analytics-value">{analytics.activePrescriptions}</div>
          <div className="analytics-subtext">Currently valid</div>
        </div>

        <div className="analytics-card expired">
          <div className="analytics-label">Expired</div>
          <div className="analytics-value">{analytics.expiredPrescriptions}</div>
          <div className="analytics-subtext">Need renewal</div>
        </div>

        <div className="analytics-card fulfilled">
          <div className="analytics-label">Fulfilled</div>
          <div className="analytics-value">{analytics.fulfilledPrescriptions}</div>
          <div className="analytics-subtext">Completed orders</div>
        </div>

        <div className="analytics-card pending">
          <div className="analytics-label">Pending MFA</div>
          <div className="analytics-value">{analytics.pendingPrescriptions}</div>
          <div className="analytics-subtext">Awaiting verification</div>
        </div>

        <div className="analytics-card revenue">
          <div className="analytics-label">Total Revenue</div>
          <div className="analytics-value">₹{analytics.totalRevenue}</div>
          <div className="analytics-subtext">All prescriptions</div>
        </div>

        <div className="analytics-card verification">
          <div className="analytics-label">MFA Verified</div>
          <div className="analytics-value">{analytics.mfaVerifiedPercentage.toFixed(0)}%</div>
          <div className="analytics-subtext">Security compliance</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="prescription-history">
      <div className="ph-header">
        <h2>💊 Prescription History</h2>
        <button
          className={`btn-analytics ${showAnalytics ? 'active' : ''}`}
          onClick={() => setShowAnalytics(!showAnalytics)}
        >
          📊 {showAnalytics ? 'Hide' : 'Show'} Analytics
        </button>
      </div>

      {showAnalytics && renderAnalytics()}

      <div className="ph-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Filter by Status:</label>
            <div className="filter-buttons">
              {(['all', 'active', 'expired', 'fulfilled', 'pending'] as FilterType[]).map(type => (
                <button
                  key={type}
                  className={`filter-btn ${filterType === type ? 'active' : ''}`}
                  onClick={() => setFilterType(type)}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="sort-group">
            <label>Sort by:</label>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="sort-select"
            >
              <option value="recent">Most Recent</option>
              <option value="patient">Patient Name</option>
              <option value="status">Status</option>
              <option value="expiry">Expiry Date</option>
            </select>
          </div>
        </div>
      </div>

      <div className="ph-content">
        {filteredPrescriptions.length > 0 ? (
          <div className="prescriptions-list">
            {filteredPrescriptions.map(prescription => {
              const statusInfo = getStatusColor(prescription.status);
              const isExpiringSoon =
                prescription.status === 'active' &&
                (new Date(prescription.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 7;

              return (
                <div
                  key={prescription.id}
                  className={`prescription-card ${isExpiringSoon ? 'expiring-soon' : ''}`}
                  onClick={() => setSelectedPrescription(prescription)}
                >
                  <div className="prescription-header">
                    <div className="prescription-title">
                      <h4>{prescription.patientName}</h4>
                      <p className="diagnosis">{prescription.diagnosis}</p>
                    </div>

                    <div className="prescription-badges">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                      >
                        {statusInfo.text}
                      </span>
                      {prescription.mfaVerified && (
                        <span className="verified-badge" title="MFA Verified">
                          ✓ Verified
                        </span>
                      )}
                      {isExpiringSoon && (
                        <span className="warning-badge">⚠️ Expiring Soon</span>
                      )}
                    </div>
                  </div>

                  <div className="prescription-medicines">
                    <strong>Medicines:</strong>
                    <div className="medicines-grid">
                      {prescription.medicines.map((med, idx) => (
                        <div key={idx} className="medicine-chip">
                          {med.medicineName} {med.strength}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="prescription-footer">
                    <div className="footer-info">
                      <span className="info-item">
                        <strong>Issued:</strong> {new Date(prescription.issuedDate).toLocaleDateString()}
                      </span>
                      <span className="info-item">
                        <strong>Expires:</strong> {new Date(prescription.expiryDate).toLocaleDateString()}
                      </span>
                      <span className="info-item">
                        <strong>Refills:</strong> {prescription.refillsUsed}/{prescription.refillsAvailable}
                      </span>
                      <span className="info-item">
                        <strong>By:</strong> {prescription.doctorName}
                      </span>
                    </div>

                    {prescription.totalAmount && (
                      <div className="amount">₹{prescription.totalAmount}</div>
                    )}
                  </div>

                  <div className="prescription-actions">
                    <button className="btn-action">View Details</button>
                    {prescription.status === 'active' && prescription.refillsAvailable > prescription.refillsUsed && (
                      <button className="btn-action-refill">Authorize Refill</button>
                    )}
                    {prescription.status === 'active' && prescription.refillsUsed < prescription.refillsAvailable && (
                      <button className="btn-action">Issue Refill</button>
                    )}
                    {prescription.status === 'expired' && (
                      <button className="btn-action-renew">Renew</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No prescriptions found matching your filters</p>
          </div>
        )}
      </div>

      {selectedPrescription && (
        <div className="prescription-detail-modal">
          <div className="modal-content">
            <button className="btn-close" onClick={() => setSelectedPrescription(null)}>
              ✕
            </button>

            <h3>Prescription Details</h3>

            <div className="detail-section">
              <h4>Patient Information</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Patient Name:</span>
                  <span className="value">{selectedPrescription.patientName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Patient ID:</span>
                  <span className="value">{selectedPrescription.patientId}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Diagnosis:</span>
                  <span className="value">{selectedPrescription.diagnosis}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Medicines Prescribed</h4>
              <div className="medicines-table">
                <table>
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Strength</th>
                      <th>Quantity</th>
                      <th>Dosage</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrescription.medicines.map((med, idx) => (
                      <tr key={idx}>
                        <td>{med.medicineName}</td>
                        <td>{med.strength}</td>
                        <td>{med.quantity}</td>
                        <td>{med.dosage}</td>
                        <td>{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="detail-section">
              <h4>Prescription Details</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Issued Date:</span>
                  <span className="value">{new Date(selectedPrescription.issuedDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Expiry Date:</span>
                  <span className="value">{new Date(selectedPrescription.expiryDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value" style={{
                    backgroundColor: getStatusColor(selectedPrescription.status).bg,
                    color: getStatusColor(selectedPrescription.status).color,
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {getStatusColor(selectedPrescription.status).text}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Issued By:</span>
                  <span className="value">{selectedPrescription.doctorName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">MFA Verified:</span>
                  <span className="value">{selectedPrescription.mfaVerified ? '✓ Yes' : '✗ No'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Refills:</span>
                  <span className="value">{selectedPrescription.refillsUsed} / {selectedPrescription.refillsAvailable}</span>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary">Print Prescription</button>
              <button className="btn-primary">Share with Pharmacy</button>
              <button className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrescriptionHistory;
