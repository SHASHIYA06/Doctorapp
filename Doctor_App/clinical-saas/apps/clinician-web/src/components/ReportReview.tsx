/**
 * Report Review Component
 * View, analyze, and review patient medical reports with AI insights
 */

import React, { useState } from 'react';
import '../styles/ReportReview.css';

interface Report {
  id: string;
  patientName: string;
  patientId: string;
  reportType: 'blood_test' | 'x_ray' | 'ct_scan' | 'ultrasound' | 'ecg' | 'mri' | 'pathology' | 'general';
  uploadDate: string;
  status: 'uploaded' | 'analyzing' | 'analyzed' | 'reviewed';
  findings: string;
  abnormalities: string[];
  confidence: number;
  fileUrl: string;
  fileSize: string;
  notes?: string;
}

interface AIAnalysis {
  summary: string;
  keyFindings: string[];
  abnormalities: Abnormality[];
  recommendations: string[];
  followUpRequired: boolean;
  urgency: 'routine' | 'moderate' | 'high';
}

interface Abnormality {
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
  recommendation: string;
}

type ViewMode = 'list' | 'detail' | 'comparison';

const reportTypeIcons: Record<string, string> = {
  blood_test: '🩸',
  x_ray: '🖼️',
  ct_scan: '🧬',
  ultrasound: '🔊',
  ecg: '❤️',
  mri: '🧠',
  pathology: '🔬',
  general: '📋'
};

const reportTypeLabels: Record<string, string> = {
  blood_test: 'Blood Test',
  x_ray: 'X-Ray',
  ct_scan: 'CT Scan',
  ultrasound: 'Ultrasound',
  ecg: 'ECG',
  mri: 'MRI',
  pathology: 'Pathology',
  general: 'General Report'
};

export const ReportReview: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedReports, setSelectedReports] = useState<Report[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);

  // Mock report data
  const [reports] = useState<Report[]>([
    {
      id: '1',
      patientName: 'Rajesh Kumar',
      patientId: '1',
      reportType: 'blood_test',
      uploadDate: '2024-01-15',
      status: 'analyzed',
      findings: 'Elevated cholesterol levels detected',
      abnormalities: ['High LDL Cholesterol', 'Low HDL Cholesterol'],
      confidence: 95,
      fileUrl: '/reports/blood-test-1.pdf',
      fileSize: '2.4 MB',
      notes: 'Patient should follow dietary recommendations'
    },
    {
      id: '2',
      patientName: 'Priya Sharma',
      patientId: '2',
      reportType: 'x_ray',
      uploadDate: '2024-01-14',
      status: 'reviewed',
      findings: 'Chest X-Ray normal, no acute findings',
      abnormalities: [],
      confidence: 98,
      fileUrl: '/reports/chest-xray-2.pdf',
      fileSize: '3.1 MB'
    },
    {
      id: '3',
      patientName: 'Amit Patel',
      patientId: '3',
      reportType: 'ct_scan',
      uploadDate: '2024-01-13',
      status: 'analyzed',
      findings: 'Mild atherosclerotic changes in coronary arteries',
      abnormalities: ['Arterial Narrowing', 'Plaque Formation'],
      confidence: 92,
      fileUrl: '/reports/ct-scan-3.pdf',
      fileSize: '45.2 MB'
    },
    {
      id: '4',
      patientName: 'Neha Gupta',
      patientId: '4',
      reportType: 'ultrasound',
      uploadDate: '2024-01-12',
      status: 'analyzed',
      findings: 'Uterine fibroid detected, size 3cm x 2cm',
      abnormalities: ['Uterine Fibroid'],
      confidence: 88,
      fileUrl: '/reports/ultrasound-4.pdf',
      fileSize: '5.8 MB'
    },
    {
      id: '5',
      patientName: 'Vikram Singh',
      patientId: '5',
      reportType: 'ecg',
      uploadDate: '2024-01-11',
      status: 'reviewed',
      findings: 'ECG shows normal sinus rhythm',
      abnormalities: [],
      confidence: 99,
      fileUrl: '/reports/ecg-5.pdf',
      fileSize: '1.2 MB'
    }
  ]);

  // Mock AI Analysis
  const mockAIAnalysis: AIAnalysis = {
    summary: 'Report shows notable abnormalities requiring follow-up care and lifestyle modifications.',
    keyFindings: [
      'Elevated cholesterol levels indicate cardiovascular risk',
      'Lipid profile suggests metabolic syndrome possibility',
      'Patient education on diet and exercise needed'
    ],
    abnormalities: [
      {
        name: 'High LDL Cholesterol',
        severity: 'moderate',
        description: 'LDL cholesterol at 180 mg/dL (normal: <100)',
        recommendation: 'Implement low-fat diet, consider statin therapy'
      },
      {
        name: 'Low HDL Cholesterol',
        severity: 'mild',
        description: 'HDL cholesterol at 35 mg/dL (normal: >40)',
        recommendation: 'Increase aerobic exercise, consider niacin supplements'
      }
    ],
    recommendations: [
      'Prescribe statin medication for cholesterol management',
      'Refer to nutritionist for dietary counseling',
      'Schedule follow-up labs in 6-8 weeks',
      'Encourage 150 minutes weekly aerobic exercise'
    ],
    followUpRequired: true,
    urgency: 'moderate'
  };

  const filteredReports = reports.filter(r => {
    if (filterType !== 'all' && r.reportType !== filterType) return false;
    if (searchQuery && !r.patientName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleReportSelection = (report: Report) => {
    const isSelected = selectedReports.find(r => r.id === report.id);
    if (isSelected) {
      setSelectedReports(selectedReports.filter(r => r.id !== report.id));
    } else {
      setSelectedReports([...selectedReports, report]);
    }
  };

  const getStatusBadge = (status: string) => {
    const statuses = {
      uploaded: { bg: '#bfdbfe', color: '#1d4ed8', text: 'Uploaded' },
      analyzing: { bg: '#fef3c7', color: '#92400e', text: 'Analyzing' },
      analyzed: { bg: '#d1fae5', color: '#065f46', text: 'Analyzed' },
      reviewed: { bg: '#e9d5ff', color: '#5b21b6', text: 'Reviewed' }
    };
    return statuses[status as keyof typeof statuses] || statuses.uploaded;
  };

  const getAbnormalitySeverity = (severity: string) => {
    const colors = {
      mild: { bg: '#dbeafe', color: '#0c4a6e' },
      moderate: { bg: '#fef3c7', color: '#92400e' },
      severe: { bg: '#fee2e2', color: '#7f1d1d' }
    };
    return colors[severity as keyof typeof colors] || colors.mild;
  };

  const renderReportList = () => (
    <div className="report-list-view">
      <div className="list-header">
        <h3>Medical Reports</h3>
        <span className="count">
          {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="list-controls">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Report Types</option>
          {Object.entries(reportTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {selectedReports.length > 0 && (
          <button
            className="btn-compare"
            onClick={() => {
              setViewMode('comparison');
            }}
          >
            📊 Compare ({selectedReports.length})
          </button>
        )}
      </div>

      <div className="reports-grid">
        {filteredReports.length > 0 ? (
          filteredReports.map(report => {
            const statusInfo = getStatusBadge(report.status);
            const isSelected = selectedReports.find(r => r.id === report.id);

            return (
              <div
                key={report.id}
                className={`report-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedReport(report);
                  setViewMode('detail');
                }}
              >
                <div className="report-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleReportSelection(report);
                    }}
                    className="checkbox"
                  />
                </div>

                <div className="report-icon">
                  {reportTypeIcons[report.reportType]}
                </div>

                <div className="report-header">
                  <h4>{reportTypeLabels[report.reportType]}</h4>
                  <p className="patient-name">{report.patientName}</p>
                </div>

                <div className="report-meta">
                  <span className="date">
                    📅 {new Date(report.uploadDate).toLocaleDateString()}
                  </span>
                  <span className="size">💾 {report.fileSize}</span>
                </div>

                <div className="report-status">
                  <span
                    className="status-badge"
                    style={{
                      backgroundColor: statusInfo.bg,
                      color: statusInfo.color
                    }}
                  >
                    {statusInfo.text}
                  </span>
                  {report.abnormalities.length > 0 && (
                    <span className="abnormalities-badge">
                      ⚠️ {report.abnormalities.length} finding{report.abnormalities.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {report.abnormalities.length > 0 && (
                  <div className="abnormalities-preview">
                    {report.abnormalities.map((abn, idx) => (
                      <span key={idx} className="abnormality-tag">{abn}</span>
                    ))}
                  </div>
                )}

                <div className="report-confidence">
                  <span className="label">Confidence:</span>
                  <span className="value">{report.confidence}%</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No reports found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderReportDetail = () => (
    <div className="report-detail-view">
      {selectedReport && (
        <>
          <div className="detail-header">
            <button className="btn-back" onClick={() => setViewMode('list')}>
              ← Back to List
            </button>
            <h2>
              {reportTypeIcons[selectedReport.reportType]} {reportTypeLabels[selectedReport.reportType]}
            </h2>
          </div>

          <div className="detail-grid">
            <div className="detail-card">
              <h4>Report Information</h4>
              <div className="detail-row">
                <span className="label">Patient:</span>
                <span className="value">{selectedReport.patientName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Upload Date:</span>
                <span className="value">{new Date(selectedReport.uploadDate).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <span className="label">File Size:</span>
                <span className="value">{selectedReport.fileSize}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span
                  className="value badge"
                  style={{
                    backgroundColor: getStatusBadge(selectedReport.status).bg,
                    color: getStatusBadge(selectedReport.status).color
                  }}
                >
                  {getStatusBadge(selectedReport.status).text}
                </span>
              </div>
            </div>

            <div className="detail-card">
              <h4>Findings</h4>
              <p className="findings-text">{selectedReport.findings}</p>
              <div className="confidence-meter">
                <div className="meter-label">AI Confidence Score</div>
                <div className="meter-bar">
                  <div
                    className="meter-fill"
                    style={{
                      width: `${selectedReport.confidence}%`,
                      backgroundColor: selectedReport.confidence > 90 ? '#10b981' : '#f59e0b'
                    }}
                  ></div>
                </div>
                <span className="meter-value">{selectedReport.confidence}%</span>
              </div>
            </div>

            {selectedReport.abnormalities.length > 0 && (
              <div className="detail-card abnormalities-card">
                <h4>Detected Abnormalities</h4>
                <div className="abnormalities-list">
                  {selectedReport.abnormalities.map((abn, idx) => (
                    <div key={idx} className="abnormality-item">
                      <span className="abnormality-name">⚠️ {abn}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReport.notes && (
              <div className="detail-card">
                <h4>Doctor Notes</h4>
                <p className="notes-text">{selectedReport.notes}</p>
              </div>
            )}
          </div>

          <div className="ai-analysis-section">
            <button
              className={`btn-ai ${showAIAnalysis ? 'active' : ''}`}
              onClick={() => setShowAIAnalysis(!showAIAnalysis)}
            >
              🤖 {showAIAnalysis ? 'Hide' : 'Show'} AI Analysis
            </button>

            {showAIAnalysis && (
              <div className="ai-analysis-content">
                <div className="analysis-section">
                  <h4>Summary</h4>
                  <p>{mockAIAnalysis.summary}</p>
                </div>

                <div className="analysis-section">
                  <h4>Key Findings</h4>
                  <ul className="findings-list">
                    {mockAIAnalysis.keyFindings.map((finding, idx) => (
                      <li key={idx}>{finding}</li>
                    ))}
                  </ul>
                </div>

                {mockAIAnalysis.abnormalities.length > 0 && (
                  <div className="analysis-section">
                    <h4>Abnormality Details</h4>
                    <div className="abnormalities-detailed">
                      {mockAIAnalysis.abnormalities.map((abn, idx) => {
                        const severityColor = getAbnormalitySeverity(abn.severity);
                        return (
                          <div key={idx} className="abnormality-detail">
                            <div className="abnormality-header">
                              <span className="name">{abn.name}</span>
                              <span
                                className="severity"
                                style={{
                                  backgroundColor: severityColor.bg,
                                  color: severityColor.color
                                }}
                              >
                                {abn.severity.charAt(0).toUpperCase() + abn.severity.slice(1)}
                              </span>
                            </div>
                            <p className="description">{abn.description}</p>
                            <p className="recommendation">
                              <strong>Recommendation:</strong> {abn.recommendation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="analysis-section">
                  <h4>Recommendations</h4>
                  <ul className="recommendations-list">
                    {mockAIAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>

                <div className="analysis-footer">
                  <div className={`urgency urgency-${mockAIAnalysis.urgency}`}>
                    <span className="label">Urgency Level:</span>
                    <span className="value">
                      {mockAIAnalysis.urgency.charAt(0).toUpperCase() + mockAIAnalysis.urgency.slice(1)}
                    </span>
                  </div>
                  {mockAIAnalysis.followUpRequired && (
                    <div className="follow-up-required">
                      <span>⏰ Follow-up required</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="detail-actions">
            <button className="btn-primary">Approve Report</button>
            <button className="btn-primary">Add Notes</button>
            <button className="btn-primary">Request Additional Testing</button>
            <button className="btn-secondary">Download Report</button>
          </div>
        </>
      )}
    </div>
  );

  const renderComparison = () => (
    <div className="report-comparison-view">
      <div className="comparison-header">
        <button className="btn-back" onClick={() => setViewMode('list')}>
          ← Back to List
        </button>
        <h2>📊 Compare {selectedReports.length} Reports</h2>
      </div>

      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Report Type</th>
              <th>Upload Date</th>
              <th>Status</th>
              <th>Findings</th>
              <th>Abnormalities</th>
            </tr>
          </thead>
          <tbody>
            {selectedReports.map(report => (
              <tr key={report.id}>
                <td>{report.patientName}</td>
                <td>{reportTypeIcons[report.reportType]} {reportTypeLabels[report.reportType]}</td>
                <td>{new Date(report.uploadDate).toLocaleDateString()}</td>
                <td>
                  <span
                    className="status-badge-inline"
                    style={{
                      backgroundColor: getStatusBadge(report.status).bg,
                      color: getStatusBadge(report.status).color
                    }}
                  >
                    {getStatusBadge(report.status).text}
                  </span>
                </td>
                <td className="findings-cell">{report.findings}</td>
                <td>{report.abnormalities.length > 0 ? `${report.abnormalities.length} found` : 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-actions">
        <button className="btn-primary">Export Comparison</button>
        <button className="btn-primary">Generate Report</button>
        <button className="btn-secondary">Clear Selection</button>
      </div>
    </div>
  );

  return (
    <div className="report-review">
      {viewMode === 'list' && renderReportList()}
      {viewMode === 'detail' && renderReportDetail()}
      {viewMode === 'comparison' && renderComparison()}
    </div>
  );
};

export default ReportReview;
